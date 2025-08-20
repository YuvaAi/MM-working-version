"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFacebookAd = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const facebookAds_1 = require("./facebookAds");
// Initialize Firebase Admin
admin.initializeApp();
// Export the Facebook Ads function
exports.createFacebookAd = functions.https.onCall(facebookAds_1.createAdSetAndAd);
//# sourceMappingURL=index.js.map