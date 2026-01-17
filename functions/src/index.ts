import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import Groq from "groq-sdk";

admin.initializeApp();

// Get environment variables
const getApifyKey = (): string => {
  const key = process.env.APIFY_API_KEY || functions.config().apify?.api_key;
  if (!key) {
    throw new Error("Apify API key not configured");
  }
  return key;
};

const getGroqKey = (): string => {
  const key = process.env.GROQ_API_KEY || functions.config().groq?.api_key;
  if (!key) {
    throw new Error("Groq API key not configured");
  }
  return key;
};

interface Aspect {
  label: string;
  sentiment: "positive" | "negative";
}

interface Review {
  text: string;
  rating: number;
  reviewer: string;
  date: string;
  aspects?: Aspect[];
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

      try {
        const groq = new Groq({ apiKey: getGroqKey() });
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
2. Rank the extracted aspects by relevance to user's criteria

ABSA RULES:
- An aspect is a specific feature/attribute explicitly discussed (e.g., "food", "service", "price", "cleanliness")
- Sentiment is positive or negative for that specific aspect
- Example: "The pizza was amazing but the waiter was rude"
  → Aspects: [{label: "food", sentiment: "positive"}, {label: "service", sentiment: "negative"}]
- Generic statements like "great place" or "bad experience" have NO extractable aspects - return empty array
- Each aspect must be explicitly mentioned in the text, not inferred
- Keep aspect labels short (1-2 words) and normalized (e.g., "food" not "food quality", "service" not "customer service")`;

          const userPrompt = `Location: ${place.placeName}

USER CARES ABOUT: ${criteria || "not specified"}
USER WANTS TO AVOID: ${redFlags || "not specified"}

REVIEWS:
${reviewsText}

TASK:
1. Extract aspects and sentiments from EACH review using ABSA
2. Aggregate all unique aspects found across reviews
3. Rank the aggregated aspects by relevance to what the user cares about (most relevant first)

For each review, identify:
- What specific aspects are mentioned? (food, service, price, cleanliness, atmosphere, wait time, parking, staff, etc.)
- What is the sentiment for each aspect? (positive/negative)
- If a review has no specific aspects (just generic praise/complaint), return empty array

OUTPUT FORMAT (JSON only):
{
  "reviewAspects": [
    {
      "reviewIndex": 1,
      "aspects": [
        {"label": "food", "sentiment": "positive"},
        {"label": "service", "sentiment": "negative"}
      ]
    }
  ],
  "rankedPositiveAspects": ["most relevant positive aspect", "second most relevant", ...],
  "rankedNegativeAspects": ["most relevant negative aspect", "second most relevant", ...],
  "summary": "<2-3 sentences summarizing how this place matches user's criteria>"
}

RANKING RULES:
- rankedPositiveAspects: List all positive aspects found, ordered by relevance to USER CARES ABOUT (most relevant first)
- rankedNegativeAspects: List all negative aspects found, ordered by relevance to USER WANTS TO AVOID (most relevant first)
- Aspects that directly match user criteria should be ranked higher
- Aspects not mentioned in user criteria should be ranked lower`;

          const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          });

          const content = completion.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No response from Groq");
          }

          const result = JSON.parse(content);

          // Attach aspects to each review
          const reviewsWithAspects: Review[] = place.reviews.map((review, index) => {
            const reviewAspect = (result.reviewAspects || []).find(
              (ra: { reviewIndex: number }) => ra.reviewIndex === index + 1
            );
            return {
              ...review,
              aspects: reviewAspect?.aspects || [],
            };
          });

          // Generate chips by aggregating aspects across reviews
          const aspectMap = new Map<string, { type: "positive" | "negative"; reviewIndices: number[] }>();

          reviewsWithAspects.forEach((review, reviewIndex) => {
            (review.aspects || []).forEach((aspect: Aspect) => {
              const key = `${aspect.label.toLowerCase()}-${aspect.sentiment}`;
              if (!aspectMap.has(key)) {
                aspectMap.set(key, {
                  type: aspect.sentiment,
                  reviewIndices: [],
                });
              }
              aspectMap.get(key)!.reviewIndices.push(reviewIndex);
            });
          });

          // Get ranked aspects from AI response
          const rankedPositive: string[] = result.rankedPositiveAspects || [];
          const rankedNegative: string[] = result.rankedNegativeAspects || [];

          // Build chips in ranked order (positive first, then negative)
          const chips: Chip[] = [];

          // Add positive chips in ranked order
          for (const aspectLabel of rankedPositive) {
            const key = `${aspectLabel.toLowerCase()}-positive`;
            const data = aspectMap.get(key);
            if (data && data.reviewIndices.length > 0) {
              chips.push({
                label: aspectLabel,
                type: "positive",
                reviewIndices: data.reviewIndices,
              });
            }
          }

          // Add negative chips in ranked order
          for (const aspectLabel of rankedNegative) {
            const key = `${aspectLabel.toLowerCase()}-negative`;
            const data = aspectMap.get(key);
            if (data && data.reviewIndices.length > 0) {
              chips.push({
                label: aspectLabel,
                type: "negative",
                reviewIndices: data.reviewIndices,
              });
            }
          }

          // Add any remaining aspects not in ranked lists (fallback)
          for (const [key, value] of aspectMap.entries()) {
            const label = key.split("-")[0];
            const alreadyAdded = chips.some(c => c.label.toLowerCase() === label && c.type === value.type);
            if (!alreadyAdded && value.reviewIndices.length > 0) {
              chips.push({
                label,
                type: value.type,
                reviewIndices: value.reviewIndices,
              });
            }
          }

          // Calculate match score based on positive vs negative aspects
          const positiveCount = chips.filter(c => c.type === "positive").reduce((sum, c) => sum + c.reviewIndices.length, 0);
          const negativeCount = chips.filter(c => c.type === "negative").reduce((sum, c) => sum + c.reviewIndices.length, 0);
          const total = positiveCount + negativeCount;
          const matchScore = total > 0 ? Math.round((positiveCount / total) * 100) : 50;

          locationAnalyses.push({
            url: place.url,
            placeName: place.placeName,
            totalScore: place.totalScore,
            reviewsCount: place.reviewsCount,
            matchScore,
            summary: result.summary || "",
            chips,
            reviews: reviewsWithAspects,
            monthlyReviews: computeMonthlyReviewsFromChips(reviewsWithAspects, chips),
          });

          console.log(`${place.placeName}: Extracted ${chips.length} aspect types, Score: ${matchScore}`);
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

// Resolve user location description to real-world places
interface ResolvedLocation {
  name: string;
  address: string;
  confidence_score: number;
  mapsUrl: string;
}

export const resolveLocations = functions
  .runWith({ timeoutSeconds: 30, memory: "256MB" })
  .https.onCall(async (data: { query: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { query } = data;

    if (!query || query.trim().length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Query is required"
      );
    }

    try {
      const groq = new Groq({ apiKey: getGroqKey() });

      const systemPrompt = `You are a location resolution assistant that maps user descriptions to real-world places.

Task: Given a user's description of a location or places, identify the top relevant real-world locations and return them in a minimal structured format.

Input Interpretation:
The user description may be:
- A specific place or address (e.g., "Grocery Outlet, Sunnyvale, CA")
- A discovery-based query (e.g., "recommended affordable apartments in Sunnyvale, CA")
Infer intent automatically.

Output Rules:
- Return up to 5 locations
- Prefer the most relevant, well-known, and correctly located places
- Use full formatted addresses
- Assign a confidence score between 0.0 and 1.0:
  - 0.90–1.00 → Exact name or address match
  - 0.75–0.89 → Very strong inferred match
  - 0.60–0.74 → Good but weaker relevance
  - < 0.60 → Marginal relevance (include only if needed)
- Do not include ratings, review counts, URLs, explanations, or extra fields
- Output only the structured JSON`;

      const userPrompt = `Find real-world locations for: "${query}"

Output Format (STRICT JSON):
{
  "query": "<original user query>",
  "locations": [
    {
      "name": "",
      "address": "",
      "confidence_score": 0.0
    }
  ]
}`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Groq");
      }

      const result = JSON.parse(content);

      // Generate Google Maps URLs for each location
      const locations: ResolvedLocation[] = (result.locations || []).map(
        (loc: { name: string; address: string; confidence_score: number }) => {
          const searchQuery = `${loc.name}, ${loc.address}`;
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
          return {
            name: loc.name,
            address: loc.address,
            confidence_score: loc.confidence_score,
            mapsUrl,
          };
        }
      );

      console.log(`Resolved ${locations.length} locations for query: "${query}"`);

      return { query: result.query, locations };
    } catch (error: any) {
      console.error("Error resolving locations:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to resolve locations: ${error.message}`
      );
    }
  });

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
      const groq = new Groq({ apiKey: getGroqKey() });

      const prompt = `For "${locationType}", generate two lists:
1. 10 common positive aspects that customers typically look for and appreciate
2. 10 common negative aspects (red flags) that customers typically complain about or want to avoid

Be specific and practical. Use short phrases (2-4 words each).

Respond with JSON:
{
  "positiveAspects": ["aspect1", "aspect2", ...],
  "negativeAspects": ["aspect1", "aspect2", ...]
}`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
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
        throw new Error("No response from Groq");
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
