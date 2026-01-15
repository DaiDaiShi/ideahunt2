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
  totalScore: number; // Overall Google Maps rating (e.g., 4.5)
  reviewsCount: number; // Total number of reviews on Google Maps
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
          let totalScore = 0;
          let reviewsCount = 0;
          const reviews: Review[] = [];

          for (const item of dataset) {
            // Check if this is place info (has title but no review text)
            if (item.title && !item.text && !item.reviewText) {
              placeName = item.title;
              // Extract overall rating and total review count from place info
              totalScore = item.totalScore || item.rating || item.averageRating || 0;
              reviewsCount = item.reviewsCount || item.totalReviews || item.reviewCount || 0;
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

          console.log(`Found place: ${placeName}, rating: ${totalScore}, total reviews: ${reviewsCount}, analyzed: ${reviews.length}`);

          allPlaceReviews.push({
            url,
            placeName,
            totalScore,
            reviewsCount,
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
  positiveCount: number; // reviews matching positive chips
  negativeCount: number; // reviews matching negative chips
}

// Analysis result for a single location
interface LocationAnalysis {
  url: string;
  placeName: string;
  totalScore: number; // Overall Google Maps rating
  reviewsCount: number; // Total reviews on Google Maps
  matchScore: number; // 0-100 score for ranking
  summary: string;
  chips: Chip[];
  reviews: Review[];
  monthlyReviews: MonthlyReviewCount[];
}

// Helper to compute monthly review counts based on chip associations
function computeMonthlyReviewsFromChips(
  reviews: Review[],
  chips: Chip[]
): MonthlyReviewCount[] {
  const now = new Date();

  // Collect unique review indices for positive and negative chips
  const positiveReviewIndices = new Set<number>();
  const negativeReviewIndices = new Set<number>();

  for (const chip of chips) {
    if (chip.type === "positive") {
      chip.reviewIndices.forEach((i) => positiveReviewIndices.add(i));
    } else {
      chip.reviewIndices.forEach((i) => negativeReviewIndices.add(i));
    }
  }

  // Initialize month counts map
  const monthCounts = new Map<string, { positive: number; negative: number }>();
  const monthKeys: string[] = [];
  const monthNames: string[] = [];

  // Generate past 12 months (oldest first)
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthKeys.push(key);
    monthNames.push(d.toLocaleDateString("en-US", { month: "short" }));
    monthCounts.set(key, { positive: 0, negative: 0 });
  }

  // Count unique positive reviews by month
  for (const idx of positiveReviewIndices) {
    const review = reviews[idx];
    if (review) {
      const reviewDate = new Date(review.date);
      if (!isNaN(reviewDate.getTime())) {
        const key = `${reviewDate.getFullYear()}-${reviewDate.getMonth()}`;
        const counts = monthCounts.get(key);
        if (counts) {
          counts.positive++;
        }
      }
    }
  }

  // Count unique negative reviews by month
  for (const idx of negativeReviewIndices) {
    const review = reviews[idx];
    if (review) {
      const reviewDate = new Date(review.date);
      if (!isNaN(reviewDate.getTime())) {
        const key = `${reviewDate.getFullYear()}-${reviewDate.getMonth()}`;
        const counts = monthCounts.get(key);
        if (counts) {
          counts.negative++;
        }
      }
    }
  }

  // Build result array
  const result: MonthlyReviewCount[] = [];
  for (let i = 0; i < monthKeys.length; i++) {
    const counts = monthCounts.get(monthKeys[i])!;
    result.push({
      month: monthNames[i],
      positiveCount: counts.positive,
      negativeCount: counts.negative,
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
              totalScore: place.totalScore,
              reviewsCount: place.reviewsCount,
              matchScore: 0,
              summary: "No reviews with text available for this location.",
              chips: [],
              reviews: [],
              monthlyReviews: computeMonthlyReviewsFromChips([], []),
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

          const systemPrompt = `You are an expert at Aspect-Based Sentiment Analysis (ABSA). Your job is to:
1. Extract specific aspects mentioned in each review along with their sentiment
2. Match those aspects against user criteria to determine fit

ABSA RULES:
- An aspect is a specific feature/attribute explicitly discussed (e.g., "food quality", "wait time", "staff attitude")
- Sentiment is positive, negative, or neutral for that specific aspect
- Example: "The pizza was amazing but the waiter was rude"
  → Aspect: Food, Sentiment: Positive
  → Aspect: Service, Sentiment: Negative
- Generic statements like "great place" or "bad experience" have NO extractable aspects - skip them
- Each aspect must be explicitly mentioned, not inferred`;

          const userPrompt = `Location: ${place.placeName}

USER'S PREFERRED ASPECTS: ${criteria}
${redFlags ? `USER'S DEAL-BREAKERS: ${redFlags}` : ""}

REVIEWS:
${reviewsText}

TASK: Perform Aspect-Based Sentiment Analysis, then match against user criteria.

PHASE 1 - ABSA (do this internally, don't output):
For each review, extract:
- What specific aspects are mentioned? (food, service, price, cleanliness, atmosphere, wait time, etc.)
- What is the sentiment for each aspect? (positive/negative)
- If a review has no specific aspects (just generic praise/complaint), mark it as "no aspects"

PHASE 2 - MATCHING:
Compare extracted aspects against user's preferred aspects and deal-breakers:
- Does any extracted aspect match a user criterion? Record the review index.
- Does any extracted aspect match a user deal-breaker? Record the review index.

SCORING:
- Start at 50 (neutral)
- For each user criterion with matching positive-sentiment aspects: +10 to +15
- For each user criterion with matching negative-sentiment aspects: -10 to -15
- For each deal-breaker found with negative sentiment: -15 to -20
- No matching aspects found: no change
- Cap between 0-100

OUTPUT FORMAT (JSON only):
{
  "matchScore": <number 0-100>,
  "scoringBreakdown": "Started at 50. [adjustments based on matched aspects]. Final: X",
  "summary": "<2-3 sentences about fit based on extracted aspects>",
  "chips": [
    {
      "label": "<aspect name matching user criteria>",
      "type": "positive" | "negative",
      "reviewIndices": [<indices where this EXACT aspect was explicitly discussed>]
    }
  ]
}`;

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

          // Filter chips to ensure they have valid review indices
          const validChips = (result.chips || []).filter(
            (chip: Chip) => chip.reviewIndices && chip.reviewIndices.length > 0
          );

          // Build summary with scoring breakdown if available
          const fullSummary = result.scoringBreakdown
            ? `${result.summary}`
            : result.summary || "";

          locationAnalyses.push({
            url: place.url,
            placeName: place.placeName,
            totalScore: place.totalScore,
            reviewsCount: place.reviewsCount,
            matchScore: Math.max(0, Math.min(100, result.matchScore || 50)),
            summary: fullSummary,
            chips: validChips,
            reviews: place.reviews,
            monthlyReviews: computeMonthlyReviewsFromChips(place.reviews, validChips),
          });

          console.log(`${place.placeName}: Score ${result.matchScore}, Breakdown: ${result.scoringBreakdown}`);
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

// Generate common aspects for a location type
export const generateAspects = functions
  .runWith({ timeoutSeconds: 30, memory: "256MB" })
  .https.onCall(async (data: { locationType: string }, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { locationType } = data;

    if (!locationType || locationType.trim().length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Location type is required"
      );
    }

    try {
      const openai = new OpenAI({ apiKey: getOpenAIKey() });

      const prompt = `For "${locationType}", generate two lists:
1. 10 common positive aspects that customers typically look for and appreciate
2. 10 common negative aspects (red flags) that customers typically complain about or want to avoid

Be specific and practical. Use short phrases (2-4 words each).

Respond with JSON:
{
  "positiveAspects": ["aspect1", "aspect2", ...],
  "negativeAspects": ["aspect1", "aspect2", ...]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates common review aspects for different types of businesses. Keep phrases short and practical.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const result = JSON.parse(content);

      return {
        positiveAspects: result.positiveAspects || [],
        negativeAspects: result.negativeAspects || [],
      };
    } catch (error: any) {
      console.error("Error generating aspects:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to generate aspects: ${error.message}`
      );
    }
  });
