import { getFirestore, collection, addDoc, updateDoc, doc, query, where, orderBy, limit as qLimit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { ContentPost } from './types';

// Save generated content to Firestore
export async function saveGeneratedContent(userId: string, post: ContentPost): Promise<{ success: boolean; contentId?: string }> {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'posts'), {
      ...post,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { success: true, contentId: docRef.id };
  } catch (error) {
    console.error('Error saving content:', error);
    return { success: false };
  }
}

// Update content status in Firestore
export async function updateContentStatus(userId: string, contentId: string, status: string, postId?: string): Promise<void> {
  try {
    const contentDocRef = doc(db, 'users', userId, 'posts', contentId);
    await updateDoc(contentDocRef, {
      status,
      ...(postId && { postId }),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating content status:', error);
  }
}

// Get user content history from Firestore
export async function getUserContentHistory(userId: string, limit: number = 10): Promise<{ success: boolean; content: ContentPost[] }> {
  try {
    // Check if user is authenticated
    if (!userId) {
      console.error('No user ID provided for content history');
      return { success: false, content: [] };
    }

    const postsRef = collection(db, 'users', userId, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), qLimit(limit));
    const snapshot = await getDocs(q);

    const content: ContentPost[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as ContentPost[];

    return { success: true, content };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      console.warn('Firestore permissions not configured. Content history will be empty until Firebase security rules are updated.');
      console.warn('Required Firestore rule: allow read: if request.auth != null && request.auth.uid == userId; for users/{userId}/posts/{postId}');
    } else {
      console.error('Error fetching content history:', error);
    }
    // Return empty array instead of throwing error to prevent UI crashes
    return { success: false, content: [] };
  }
}