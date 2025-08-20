import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createAdSetAndAd } from './facebookAds';

// Initialize Firebase Admin
admin.initializeApp();

// Export the Facebook Ads function
export const createFacebookAd = functions.https.onCall(createAdSetAndAd);