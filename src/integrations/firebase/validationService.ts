import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { updateValidationCount } from './ideaService';

// Types
export type SignalType = 'want_to_use' | 'willing_to_pay' | 'waitlist';

export interface Validation {
  id: string;
  idea_id: string;
  user_id: string;
  signal_type: SignalType;
  created_at: string;
}

// Convert Firestore timestamp to ISO string
const toISOString = (timestamp: Timestamp | null): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

// Convert Firestore doc to Validation
const docToValidation = (doc: any): Validation => {
  const data = doc.data();
  return {
    id: doc.id,
    idea_id: data.idea_id || '',
    user_id: data.user_id || '',
    signal_type: data.signal_type || 'want_to_use',
    created_at: toISOString(data.created_at),
  };
};

// Get user's validations for an idea
export const getUserValidations = async (
  ideaId: string,
  userId: string
): Promise<Validation[]> => {
  const validationsRef = collection(db, 'idea_validations');
  const q = query(
    validationsRef,
    where('idea_id', '==', ideaId),
    where('user_id', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToValidation);
};

// Check if user has a specific validation
export const hasUserValidation = async (
  ideaId: string,
  userId: string,
  signalType: SignalType
): Promise<boolean> => {
  const validationsRef = collection(db, 'idea_validations');
  const q = query(
    validationsRef,
    where('idea_id', '==', ideaId),
    where('user_id', '==', userId),
    where('signal_type', '==', signalType)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Toggle validation signal
export const toggleValidation = async (
  ideaId: string,
  userId: string,
  signalType: SignalType
): Promise<boolean> => {
  const validationsRef = collection(db, 'idea_validations');
  const q = query(
    validationsRef,
    where('idea_id', '==', ideaId),
    where('user_id', '==', userId),
    where('signal_type', '==', signalType)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Add validation
    await addDoc(validationsRef, {
      idea_id: ideaId,
      user_id: userId,
      signal_type: signalType,
      created_at: serverTimestamp(),
    });

    // Increment count on idea
    await updateValidationCount(ideaId, signalType, 1);

    return true; // added
  } else {
    // Remove validation
    await deleteDoc(snapshot.docs[0].ref);

    // Decrement count on idea
    await updateValidationCount(ideaId, signalType, -1);

    return false; // removed
  }
};

// Get all validations for ideas by a user (for dashboard)
export const getValidationsForUserIdeas = async (userId: string): Promise<Validation[]> => {
  // This would need to first get the user's ideas, then get validations for those ideas
  // For now, we'll fetch from the idea_validations collection
  // In a production app, you might want to denormalize this data

  const validationsRef = collection(db, 'idea_validations');
  const snapshot = await getDocs(validationsRef);

  return snapshot.docs.map(docToValidation);
};
