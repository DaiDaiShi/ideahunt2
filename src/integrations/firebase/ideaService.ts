import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// Types
export interface Idea {
  id: string;
  title: string;
  tagline: string;
  problem: string;
  solution: string;
  target_audience: string;
  key_features: string[];
  images: string[] | null;
  status: string;
  user_id: string;
  views_count: number;
  comments_count: number;
  want_to_use_count: number;
  willing_to_pay_count: number;
  waitlist_count: number;
  created_at: string;
  updated_at: string;
}

export interface IdeaInput {
  title: string;
  tagline: string;
  problem: string;
  solution: string;
  target_audience: string;
  key_features: string[];
  images?: string[] | null;
  user_id: string;
}

// Convert Firestore timestamp to ISO string
const toISOString = (timestamp: Timestamp | null): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

// Convert Firestore doc to Idea
const docToIdea = (doc: any): Idea => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || '',
    tagline: data.tagline || '',
    problem: data.problem || '',
    solution: data.solution || '',
    target_audience: data.target_audience || '',
    key_features: data.key_features || [],
    images: data.images || null,
    status: data.status || 'draft',
    user_id: data.user_id || '',
    views_count: data.views_count || 0,
    comments_count: data.comments_count || 0,
    want_to_use_count: data.want_to_use_count || 0,
    willing_to_pay_count: data.willing_to_pay_count || 0,
    waitlist_count: data.waitlist_count || 0,
    created_at: toISOString(data.created_at),
    updated_at: toISOString(data.updated_at),
  };
};

// Get all ideas
export const getIdeas = async (limitCount?: number): Promise<Idea[]> => {
  const ideasRef = collection(db, 'ideas');
  const q = limitCount
    ? query(ideasRef, orderBy('created_at', 'desc'), limit(limitCount))
    : query(ideasRef, orderBy('created_at', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToIdea);
};

// Get idea by ID
export const getIdeaById = async (id: string): Promise<Idea | null> => {
  const docRef = doc(db, 'ideas', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return docToIdea(docSnap);
};

// Get ideas by user
export const getIdeasByUser = async (userId: string): Promise<Idea[]> => {
  const ideasRef = collection(db, 'ideas');
  const q = query(ideasRef, where('user_id', '==', userId), orderBy('created_at', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToIdea);
};

// Create idea
export const createIdea = async (idea: IdeaInput): Promise<Idea> => {
  console.log('Creating idea with data:', idea);

  const ideasRef = collection(db, 'ideas');

  const newIdea = {
    ...idea,
    status: 'published',
    views_count: 0,
    comments_count: 0,
    want_to_use_count: 0,
    willing_to_pay_count: 0,
    waitlist_count: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(ideasRef, newIdea);
    console.log('Idea created with ID:', docRef.id);
    const createdDoc = await getDoc(docRef);
    return docToIdea(createdDoc);
  } catch (error) {
    console.error('Firestore createIdea error:', error);
    throw error;
  }
};

// Update idea
export const updateIdea = async (id: string, updates: Partial<IdeaInput>): Promise<void> => {
  const docRef = doc(db, 'ideas', id);
  await updateDoc(docRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });
};

// Delete idea
export const deleteIdea = async (id: string): Promise<void> => {
  const docRef = doc(db, 'ideas', id);
  await deleteDoc(docRef);
};

// Increment view count
export const incrementViewCount = async (id: string): Promise<void> => {
  const docRef = doc(db, 'ideas', id);
  await updateDoc(docRef, {
    views_count: increment(1),
  });
};

// Increment comments count
export const incrementCommentsCount = async (id: string, delta: number = 1): Promise<void> => {
  const docRef = doc(db, 'ideas', id);
  await updateDoc(docRef, {
    comments_count: increment(delta),
  });
};

// Update validation counts
export const updateValidationCount = async (
  id: string,
  signalType: 'want_to_use' | 'willing_to_pay' | 'waitlist',
  delta: number
): Promise<void> => {
  const docRef = doc(db, 'ideas', id);
  const field = `${signalType}_count`;
  await updateDoc(docRef, {
    [field]: increment(delta),
  });
};
