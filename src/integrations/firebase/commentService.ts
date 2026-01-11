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
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { incrementCommentsCount } from './ideaService';

// Types
export interface Comment {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

// Convert Firestore timestamp to ISO string
const toISOString = (timestamp: Timestamp | null): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

// Convert Firestore doc to Comment
const docToComment = (doc: any): Comment => {
  const data = doc.data();
  return {
    id: doc.id,
    idea_id: data.idea_id || '',
    user_id: data.user_id || '',
    content: data.content || '',
    likes_count: data.likes_count || 0,
    created_at: toISOString(data.created_at),
    updated_at: toISOString(data.updated_at),
  };
};

// Get comments by idea
export const getCommentsByIdea = async (ideaId: string): Promise<Comment[]> => {
  console.log('Fetching comments for idea:', ideaId);

  const commentsRef = collection(db, 'comments');

  try {
    // First try with orderBy (requires composite index)
    const q = query(
      commentsRef,
      where('idea_id', '==', ideaId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    console.log('Comments found:', snapshot.docs.length);
    return snapshot.docs.map(docToComment);
  } catch (error: any) {
    console.error('Error fetching comments:', error);

    // If index error, fallback to simple query without orderBy
    if (error.code === 'failed-precondition') {
      console.log('Index missing, using fallback query');
      const fallbackQuery = query(
        commentsRef,
        where('idea_id', '==', ideaId)
      );
      const snapshot = await getDocs(fallbackQuery);
      const comments = snapshot.docs.map(docToComment);
      // Sort manually
      return comments.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    throw error;
  }
};

// Create comment
export const createComment = async (
  ideaId: string,
  userId: string,
  content: string
): Promise<Comment> => {
  const commentsRef = collection(db, 'comments');

  const newComment = {
    idea_id: ideaId,
    user_id: userId,
    content,
    likes_count: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  const docRef = await addDoc(commentsRef, newComment);

  // Increment idea's comment count
  await incrementCommentsCount(ideaId, 1);

  const createdDoc = await getDoc(docRef);
  return docToComment(createdDoc);
};

// Delete comment
export const deleteComment = async (commentId: string, ideaId: string): Promise<void> => {
  const docRef = doc(db, 'comments', commentId);
  await deleteDoc(docRef);

  // Decrement idea's comment count
  await incrementCommentsCount(ideaId, -1);
};

// Check if user liked a comment
export const hasUserLikedComment = async (
  commentId: string,
  userId: string
): Promise<boolean> => {
  const likesRef = collection(db, 'comment_likes');
  const q = query(
    likesRef,
    where('comment_id', '==', commentId),
    where('user_id', '==', userId)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Toggle comment like
export const toggleCommentLike = async (
  commentId: string,
  userId: string
): Promise<boolean> => {
  const likesRef = collection(db, 'comment_likes');
  const q = query(
    likesRef,
    where('comment_id', '==', commentId),
    where('user_id', '==', userId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Add like
    await addDoc(likesRef, {
      comment_id: commentId,
      user_id: userId,
      created_at: serverTimestamp(),
    });

    // Increment likes count
    const commentRef = doc(db, 'comments', commentId);
    await updateDoc(commentRef, {
      likes_count: increment(1),
    });

    return true; // liked
  } else {
    // Remove like
    await deleteDoc(snapshot.docs[0].ref);

    // Decrement likes count
    const commentRef = doc(db, 'comments', commentId);
    await updateDoc(commentRef, {
      likes_count: increment(-1),
    });

    return false; // unliked
  }
};

// Get user's liked comment IDs for an idea
export const getUserLikedCommentIds = async (
  ideaId: string,
  userId: string
): Promise<string[]> => {
  // First get all comments for this idea
  const commentsRef = collection(db, 'comments');
  const commentsQuery = query(commentsRef, where('idea_id', '==', ideaId));
  const commentsSnapshot = await getDocs(commentsQuery);
  const commentIds = commentsSnapshot.docs.map((d) => d.id);

  if (commentIds.length === 0) return [];

  // Then get user's likes for these comments
  const likesRef = collection(db, 'comment_likes');
  const likesQuery = query(
    likesRef,
    where('user_id', '==', userId),
    where('comment_id', 'in', commentIds.slice(0, 10)) // Firestore 'in' limit is 10
  );

  const likesSnapshot = await getDocs(likesQuery);
  return likesSnapshot.docs.map((d) => d.data().comment_id);
};
