import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

export interface StoredResult {
  id: string;
  userId: string;
  criteria: string;
  redFlags: string;
  locations: Array<{
    url: string;
    placeName: string;
    matchScore: number;
    summary: string;
    chips: Array<{
      label: string;
      type: "positive" | "negative";
      reviewIndices: number[];
    }>;
    reviews: Array<{
      text: string;
      rating: number;
      reviewer: string;
      date: string;
      relevanceReason?: string;
    }>;
  }>;
  createdAt: string;
}

export interface UserResultRef {
  resultId: string;
  criteria: string;
  locationCount: number;
  createdAt: string;
}

// Generate a short unique ID
const generateResultId = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Save a new result
export const saveResult = async (
  userId: string,
  criteria: string,
  redFlags: string,
  locations: StoredResult["locations"]
): Promise<string> => {
  const resultId = generateResultId();
  const now = new Date().toISOString();

  const resultData = {
    userId,
    criteria,
    redFlags,
    locations,
    createdAt: now,
  };

  // Save to results collection
  await setDoc(doc(db, "results", resultId), resultData);

  // Save reference to user's results subcollection
  const userResultRef: UserResultRef = {
    resultId,
    criteria,
    locationCount: locations.length,
    createdAt: now,
  };
  await setDoc(doc(db, "users", userId, "results", resultId), userResultRef);

  return resultId;
};

// Get a result by ID
export const getResult = async (resultId: string): Promise<StoredResult | null> => {
  const docRef = doc(db, "results", resultId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      criteria: data.criteria,
      redFlags: data.redFlags || "",
      locations: data.locations,
      createdAt: data.createdAt,
    };
  }
  return null;
};

// Get user's result history
export const getUserResults = async (userId: string): Promise<UserResultRef[]> => {
  const q = query(
    collection(db, "users", userId, "results"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      resultId: data.resultId,
      criteria: data.criteria,
      locationCount: data.locationCount,
      createdAt: data.createdAt,
    };
  });
};
