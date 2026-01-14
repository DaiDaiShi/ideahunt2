import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import OpenAI from "openai";

admin.initializeApp();

// Get environment variables
const getApifyKey = (): string => {
  const key = process.env.APIFY_API_KEY || functions.config().apify?.api_key;
  if (!key) {
    throw new Error("Apify API key not configured");
  }
  return key;
};

const getOpenAIKey = (): string => {
  const key = process.env.OPENAI_API_KEY || functions.config().openai?.api_key;
  if (!key) {
    throw new Error("OpenAI API key not configured");
  }
  return key;
};

interface Review {
  text: string;
  rating: number;
  reviewer: string;
  date: string;
}

interface PlaceReviews {
  url: string;
  placeName: string;
  reviews: Review[];
}

// Fetch reviews from Google Maps via Apify
export const fetchReviews = functions
  .runWith({ timeoutSeconds: 300, memory: "512MB" })
  .https.onCall(async (data: { urls: string[] }, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { urls } = data;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "URLs array is required"
      );
    }

    if (urls.length > 10) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Maximum 10 URLs allowed"
      );
    }

    try {
      const apifyApiKey = getApifyKey();
      const allPlaceReviews: PlaceReviews[] = [];

      // Use Apify Google Maps Reviews Scraper
      for (const url of urls) {
        if (!url.trim()) continue;

        const runInput = {
          startUrls: [{ url }],
          maxReviews: 50,
          language: "en",
          reviewsSort: "newest",
          scrapeReviewerName: true,
          scrapeReviewerUrl: false,
          scrapeResponseFromOwner: false,
        };

        // Start the actor run
        const response = await axios.post(
          `https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/runs?token=${apifyApiKey}`,
          runInput,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        const runId = response.data.data.id;

        // Wait for the run to complete (poll with timeout)
        let dataset = null;
        const maxAttempts = 30;
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const statusResponse = await axios.get(
            `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyApiKey}`
          );

          if (statusResponse.data.data.status === "SUCCEEDED") {
            const datasetId = statusResponse.data.data.defaultDatasetId;
            const datasetResponse = await axios.get(
              `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyApiKey}`
            );
            dataset = datasetResponse.data;
            break;
          } else if (
            statusResponse.data.data.status === "FAILED" ||
            statusResponse.data.data.status === "ABORTED"
          ) {
            console.error(`Apify run failed for URL: ${url}`);
            break;
          }
        }

        if (dataset && dataset.length > 0) {
          let placeName = "Unknown Place";
          const reviews: Review[] = [];

          for (const item of dataset) {
            // Check if this is place info (has title but no review text)
            if (item.title && !item.text && !item.reviewText) {
              placeName = item.title;
            }

            // Check if this is a review WITH text content (skip rating-only reviews)
            const reviewText = item.text || item.reviewText || item.textTranslated || "";
            if (reviewText && reviewText.trim().length > 0) {
              reviews.push({
                text: reviewText.trim(),
                rating: item.stars || item.rating || item.reviewRating || 0,
                reviewer: item.name || item.author || item.reviewerName || item.userName || "Anonymous",
                date: item.publishedAtDate || item.time || item.reviewDate || item.date || "Unknown",
              });
            }
          }

          console.log(`Found place: ${placeName}, reviews with text: ${reviews.length}`);

          allPlaceReviews.push({
            url,
            placeName,
            reviews,
          });
        } else {
          console.log("No dataset returned for URL:", url);
        }
      }

      console.log(`Total places: ${allPlaceReviews.length}, Total reviews: ${allPlaceReviews.reduce((sum, p) => sum + p.reviews.length, 0)}`);

      return { reviews: allPlaceReviews };
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to fetch reviews: ${error.message}`
      );
    }
  });

// Chip represents a feature or red flag tag
interface Chip {
  label: string;
  type: "positive" | "negative";
  reviewIndices: number[]; // indices of reviews that match this chip
}

// Monthly review counts for past 12 months
interface MonthlyReviewCount {
  month: string; // "Jan", "Feb", etc.
  positiveCount: number; // 4-5 star reviews
  negativeCount: number; // 1-2 star reviews
}

// Analysis result for a single location
interface LocationAnalysis {
  url: string;
  placeName: string;
  matchScore: number; // 0-100 score for ranking
  summary: string;
  chips: Chip[];
  reviews: Array<Review & { relevanceReason?: string }>;
  monthlyReviews: MonthlyReviewCount[];
}

// Helper to compute monthly positive/negative review counts for past 12 months
function computeMonthlyReviews(reviews: Review[]): MonthlyReviewCount[] {
  const now = new Date();
  const result: MonthlyReviewCount[] = [];

  // Generate past 12 months (most recent first)
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    const monthName = d.toLocaleDateString("en-US", { month: "short" });

    let positiveCount = 0;
    let negativeCount = 0;

    for (const review of reviews) {
      const reviewDate = new Date(review.date);
      if (!isNaN(reviewDate.getTime())) {
        const reviewMonthKey = `${reviewDate.getFullYear()}-${reviewDate.getMonth()}`;
        if (reviewMonthKey === monthKey) {
          if (review.rating >= 4) {
            positiveCount++;
          } else if (review.rating <= 2) {
            negativeCount++;
          }
        }
      }
    }

    result.push({
      month: monthName,
      positiveCount,
      negativeCount,
    });
  }

  return result;
}

// Analyze reviews using OpenAI - now returns per-location analysis
export const analyzeReviews = functions
  .runWith({ timeoutSeconds: 180, memory: "512MB" })
  .https.onCall(
    async (
      data: { reviews: PlaceReviews[]; criteria: string; redFlags?: string },
      context
    ) => {
      // Check authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be authenticated"
        );
      }

      const { reviews, criteria, redFlags } = data;

      if (!reviews || reviews.length === 0) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Reviews are required"
        );
      }

      if (!criteria) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Criteria is required"
        );
      }

      try {
        const openai = new OpenAI({ apiKey: getOpenAIKey() });
        const locationAnalyses: LocationAnalysis[] = [];

        // Analyze each location separately
        for (const place of reviews) {
          if (place.reviews.length === 0) {
            // No reviews with text, add with low score
            locationAnalyses.push({
              url: place.url,
              placeName: place.placeName,
              matchScore: 0,
              summary: "No reviews with text available for this location.",
              chips: [],
              reviews: [],
              monthlyReviews: computeMonthlyReviews([]),
            });
            continue;
          }

          // Build the prompt for this location
          const reviewsText = place.reviews
            .map(
              (r, i) =>
                `[Review ${i + 1}] Rating: ${r.rating}/5 | By: ${r.reviewer} | Date: ${r.date}\n"${r.text}"`
            )
            .join("\n\n");

          const systemPrompt = `You are an assistant that analyzes customer reviews for a specific location. Analyze how well this place matches the user's preferences and identify any red flags.

Be concise and specific. Extract short 1-3 word tags that summarize key themes from the reviews.`;

          const userPrompt = `Location: ${place.placeName}

User's preferences (what they care about): ${criteria}
${redFlags ? `Red flags to avoid: ${redFlags}` : ""}

Reviews:
${reviewsText}

Analyze these reviews and respond with JSON:
{
  "matchScore": <0-100 number indicating how well this place matches the user's preferences, considering both positive matches and red flags>,
  "summary": "<2-3 sentences summarizing how this location matches the user's needs, mentioning specific pros and cons>",
  "chips": [
    {
      "label": "<1-3 word tag like 'great food', 'noisy', 'friendly staff', 'slow service'>",
      "type": "<'positive' if matches user preferences, 'negative' if matches red flags or is a concern>",
      "reviewIndices": [<array of 0-based review indices that support this tag>]
    }
  ],
  "relevantReviews": [
    {
      "index": <0-based index of the review>,
      "relevanceReason": "<brief reason why this review is relevant>"
    }
  ]
}

Generate 3-8 chips that capture the main themes. Only include reviews that are actually relevant.`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          });

          const content = completion.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No response from OpenAI");
          }

          const result = JSON.parse(content);

          // Map relevant reviews with their reasons
          const relevantReviewsMap = new Map<number, string>();
          if (result.relevantReviews) {
            for (const rr of result.relevantReviews) {
              relevantReviewsMap.set(rr.index, rr.relevanceReason);
            }
          }

          // Build the reviews array with relevance reasons
          const reviewsWithReasons = place.reviews.map((r, i) => ({
            ...r,
            relevanceReason: relevantReviewsMap.get(i),
          }));

          locationAnalyses.push({
            url: place.url,
            placeName: place.placeName,
            matchScore: result.matchScore || 0,
            summary: result.summary || "",
            chips: result.chips || [],
            reviews: reviewsWithReasons,
            monthlyReviews: computeMonthlyReviews(place.reviews),
          });
        }

        // Sort by matchScore descending (best matches first)
        locationAnalyses.sort((a, b) => b.matchScore - a.matchScore);

        console.log(`Analyzed ${locationAnalyses.length} locations`);
        console.log("Scores:", locationAnalyses.map(l => `${l.placeName}: ${l.matchScore}`));

        return { locations: locationAnalyses };
      } catch (error: any) {
        console.error("Error analyzing reviews:", error);
        throw new functions.https.HttpsError(
          "internal",
          `Failed to analyze reviews: ${error.message}`
        );
      }
    }
  );
