import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserCredentials } from './types';

// Firestore functions
export const saveCredential = async (userId: string, credentialData: any) => {
  try {
    const credentialRef = doc(db, 'credentials', `${userId}_${credentialData.type}`);
    await setDoc(credentialRef, {
      ...credentialData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCredential = async (userId: string, platform: string) => {
  try {
    const credentialRef = doc(db, 'credentials', `${userId}_${platform}`);
    const credentialSnap = await getDoc(credentialRef);
    
    if (credentialSnap.exists()) {
      return { success: true, data: credentialSnap.data(), error: null };
    } else {
      return { success: false, data: null, error: 'No credentials found' };
    }
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
};

export const getCredentials = async (userId: string) => {
  try {
    const credentialsRef = collection(db, 'credentials');
    const q = query(credentialsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const credentials: UserCredentials[] = [];
    querySnapshot.forEach((doc) => {
      credentials.push({ id: doc.id, ...doc.data() } as UserCredentials);
    });
    
    return { success: true, data: credentials, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
};