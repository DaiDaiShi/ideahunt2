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
          // Log for debugging
          console.log(`Dataset has ${dataset.length} items`);
          console.log("First item keys:", Object.keys(dataset[0]));

          // Log full first item to see structure
          console.log("Full first item:", JSON.stringify(dataset[0], null, 2).substring(0, 3000));

          // If there are more items, log one
          if (dataset.length > 1) {
            console.log("Second item keys:", Object.keys(dataset[1]));
            console.log("Second item sample:", JSON.stringify(dataset[1], null, 2).substring(0, 1000));
          }

          // The Apify actor returns reviews as separate items in the dataset
          // Find the place info (has 'title' or 'placeId') and reviews (have 'text' or 'reviewText')
          let placeName = "Unknown Place";
          const reviews: Review[] = [];

          for (const item of dataset) {
            // Check if this is place info (has title but no review text)
            if (item.title && !item.text && !item.reviewText) {
              placeName = item.title;
              console.log("Found place:", placeName);
            }

            // Check if this is a review (has text content)
            const reviewText = item.text || item.reviewText || item.textTranslated || "";
            if (reviewText) {
              reviews.push({
                text: reviewText,
                rating: item.stars || item.rating || item.reviewRating || 0,
                reviewer: item.name || item.author || item.reviewerName || item.userName || "Anonymous",
                date: item.publishedAtDate || item.time || item.reviewDate || item.date || "Unknown",
              });
            }
          }

          console.log(`Found place: ${placeName}, reviews: ${reviews.length}`);

          allPlaceReviews.push({
            url,
            placeName,
            reviews,
          });
        } else {
          console.log("No dataset returned for URL:", url);
        }
      }

      // Log the fetched data for debugging
      console.log("Fetched reviews:", JSON.stringify(allPlaceReviews, null, 2));
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

// Analyze reviews using OpenAI
export const analyzeReviews = functions
  .runWith({ timeoutSeconds: 120, memory: "256MB" })
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

        // Flatten all reviews with place info
        const allReviews = reviews.flatMap((place) =>
          place.reviews.map((r) => ({
            ...r,
            placeName: place.placeName,
          }))
        );

        // Build the prompt
        const reviewsText = allReviews
          .map(
            (r, i) =>
              `[Review ${i + 1}] Place: ${r.placeName} | Rating: ${r.rating}/5 | By: ${r.reviewer} | Date: ${r.date}\n"${r.text}"`
          )
          .join("\n\n");

        const systemPrompt = `You are a helpful assistant that analyzes customer reviews. Your job is to:
1. Find reviews that are most relevant to what the user cares about
2. Identify any red flags the user wants to avoid
3. Provide a concise summary

Be objective and cite specific reviews when making claims.`;

        const userPrompt = `I'm researching these places and care about: ${criteria}
${redFlags ? `\nI want to avoid: ${redFlags}` : ""}

Here are the reviews:
${reviewsText}

Please:
1. Provide a 2-3 paragraph summary addressing my specific concerns
2. List the most relevant reviews (max 10) that mention what I care about or red flags I should know about
3. For each relevant review, explain why it's relevant to my criteria

Format your response as JSON:
{
  "summary": "Your summary here...",
  "relevantReviews": [
    {
      "text": "The review text",
      "rating": 5,
      "reviewer": "Name",
      "date": "Date",
      "placeName": "Place name",
      "relevanceReason": "Why this review is relevant",
      "sentiment": "positive" | "negative" | "neutral"
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

        // Log the analysis result for debugging
        console.log("Analysis result:", JSON.stringify(result, null, 2));
        console.log(`Summary length: ${result.summary?.length}, Relevant reviews: ${result.relevantReviews?.length}`);

        return result;
      } catch (error: any) {
        console.error("Error analyzing reviews:", error);
        throw new functions.https.HttpsError(
          "internal",
          `Failed to analyze reviews: ${error.message}`
        );
      }
    }
  );
