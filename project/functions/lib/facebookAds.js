"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdSetAndAd = void 0;
const functions = require("firebase-functions");
const node_fetch_1 = require("node-fetch");
// Your Facebook credentials
const FACEBOOK_CONFIG = {
    ACCESS_TOKEN: 'EAAenecQDIdQBPMEytMSvUXZBUKDlYhOcTsEd42DBmwGQGF6vfxvVWEjEBgoBJcHnaTayZCsd2eRgMSantxDSA6QMPAygA1gYZBA0PMgOUyoi0rZA0EC7TEhwjqFmlo8FObZAQAspDuvJjQk0rSoJMIdFUGtA3MYpFIDrzNWG76VdXwKpy6ordgG5984ZBMHNCK',
    CAMPAIGN_ID: '120228492076590606',
    AD_ACCOUNT_ID: '1384851732634193',
    PAGE_ID: '680559155145043',
    INSTAGRAM_USER_ID: '17841470027857259' // Add your Instagram Business Account ID here
};
// Default configuration
const DEFAULT_CONFIG = {
    daily_budget_cents: 20000, // ₹200 in paise (smallest currency unit)
    targeting: {
        countries: ['IN'], // India
        age_min: 18,
        age_max: 35,
        platforms: ['facebook']
    },
    adset_name: 'MarketMate Auto AdSet',
    ad_name: 'MarketMate Auto Ad'
};
exports.createAdSetAndAd = functions.https.onCall(async (data, context) => {
    console.log('🚀 createAdSetAndAd function triggered');
    console.log('📦 Data received:', JSON.stringify(data, null, 2));
    try {
        // Verify user is authenticated
        if (!context.auth) {
            console.error('❌ User not authenticated');
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to create ads');
        }
        // Validate required parameters
        if (!data.post_id) {
            console.error('❌ Missing post_id');
            throw new functions.https.HttpsError('invalid-argument', 'post_id is required');
        }
        console.log('✅ Validation passed, proceeding with ad creation');
        // Load user's Facebook Ads credentials from Firestore
        console.log('📋 Loading user credentials from Firestore...');
        const userId = context.auth.uid;
        const db = admin.firestore();
        // Load Facebook Page credentials
        const facebookCredDoc = await db.collection('credentials').doc(`${userId}_facebook`).get();
        if (!facebookCredDoc.exists) {
            throw new functions.https.HttpsError('failed-precondition', 'Facebook Page credentials not found. Please add them in Credential Vault.');
        }
        const facebookCreds = facebookCredDoc.data();
        // Load Facebook Ads credentials
        const adsCredDoc = await db.collection('credentials').doc(`${userId}_facebook_ads`).get();
        if (!adsCredDoc.exists) {
            throw new functions.https.HttpsError('failed-precondition', 'Facebook Ads credentials not found. Please add them in Credential Vault.');
        }
        const adsCreds = adsCredDoc.data();
        // Load Instagram credentials (optional)
        const instagramCredDoc = await db.collection('credentials').doc(`${userId}_instagram`).get();
        const instagramCreds = instagramCredDoc.exists ? instagramCredDoc.data() : null;
        console.log('✅ Credentials loaded successfully');
        // Build Facebook config from stored credentials
        const FACEBOOK_CONFIG = {
            ACCESS_TOKEN: (adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.accessToken) || '',
            CAMPAIGN_ID: (adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.campaignId) || '',
            AD_ACCOUNT_ID: (adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.adAccountId) || '',
            PAGE_ID: (facebookCreds === null || facebookCreds === void 0 ? void 0 : facebookCreds.pageId) || '',
            INSTAGRAM_USER_ID: (instagramCreds === null || instagramCreds === void 0 ? void 0 : instagramCreds.instagramUserId) || undefined
        };
        console.log('📊 Using credentials:', {
            adAccountId: FACEBOOK_CONFIG.AD_ACCOUNT_ID,
            campaignId: FACEBOOK_CONFIG.CAMPAIGN_ID,
            pageId: FACEBOOK_CONFIG.PAGE_ID,
            hasInstagram: !!FACEBOOK_CONFIG.INSTAGRAM_USER_ID
        });
        // Step 1: Post to Instagram if image_url and caption are provided
        let instagramPostId;
        if (data.image_url && data.caption && FACEBOOK_CONFIG.INSTAGRAM_USER_ID) {
            console.log('📸 Attempting Instagram post...');
            const instagramResult = await postToInstagram(accessToken, FACEBOOK_CONFIG.INSTAGRAM_USER_ID, data.image_url, data.caption);
            if (instagramResult.success) {
                instagramPostId = instagramResult.instagram_post_id;
                console.log('✅ Instagram post created:', instagramPostId);
            }
            else {
                console.warn('⚠️ Instagram posting failed, continuing with Facebook ad creation:', instagramResult.error);
            }
        }
        const accessToken = FACEBOOK_CONFIG.ACCESS_TOKEN;
        const adAccountId = FACEBOOK_CONFIG.AD_ACCOUNT_ID;
        const pageId = FACEBOOK_CONFIG.PAGE_ID;
        const campaignId = FACEBOOK_CONFIG.CAMPAIGN_ID;
        // Merge with default configuration
        const dailyBudget = data.daily_budget_cents || DEFAULT_CONFIG.daily_budget_cents;
        const targeting = Object.assign(Object.assign({}, DEFAULT_CONFIG.targeting), data.targeting);
        console.log('📊 Configuration:', {
            campaignId,
            dailyBudget,
            targeting,
            postId: data.post_id
        });
        // Step 1: Create Ad Set
        console.log('🎯 Creating Ad Set...');
        const adSetId = await createAdSet(accessToken, adAccountId, campaignId, dailyBudget, targeting);
        console.log('✅ Ad Set created:', adSetId);
        // Step 2: Create Ad using the post as creative
        console.log('🎨 Creating Ad...');
        const adId = await createAd(accessToken, adAccountId, adSetId, data.post_id, pageId);
        console.log('✅ Ad created:', adId);
        const result = {
            success: true,
            campaign_id: campaignId,
            adset_id: adSetId,
            ad_id: adId,
            instagram_post_id: instagramPostId
        };
        console.log('🎉 Ad creation completed successfully:', result);
        return result;
    }
    catch (error) {
        console.error('🔥 Error in createAdSetAndAd:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        const errorResult = {
            success: false,
            error: error.message || 'Failed to create Facebook ad'
        };
        console.error('❌ Returning error result:', errorResult);
        return errorResult;
    }
});
async function postToInstagram(accessToken, igUserId, imageUrl, caption) {
    var _a, _b;
    try {
        console.log('📸 Creating Instagram media container...');
        // Step 1: Create media container
        const mediaResponse = await (0, node_fetch_1.default)(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_url: imageUrl,
                caption: caption,
                access_token: accessToken
            })
        });
        const mediaResult = await mediaResponse.json();
        console.log('📥 Instagram media creation response:', JSON.stringify(mediaResult, null, 2));
        if (!mediaResponse.ok) {
            console.error('❌ Instagram media creation failed:', mediaResult);
            return {
                success: false,
                error: `Failed to create Instagram media: ${((_a = mediaResult.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'}`
            };
        }
        const creationId = mediaResult.id;
        console.log('✅ Instagram media container created:', creationId);
        // Step 2: Publish the media
        console.log('📤 Publishing Instagram media...');
        const publishResponse = await (0, node_fetch_1.default)(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                creation_id: creationId,
                access_token: accessToken
            })
        });
        const publishResult = await publishResponse.json();
        console.log('📥 Instagram publish response:', JSON.stringify(publishResult, null, 2));
        if (!publishResponse.ok) {
            console.error('❌ Instagram publishing failed:', publishResult);
            return {
                success: false,
                error: `Failed to publish Instagram media: ${((_b = publishResult.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error'}`
            };
        }
        const instagramPostId = publishResult.id;
        console.log('✅ Instagram post published successfully:', instagramPostId);
        return {
            success: true,
            instagram_post_id: instagramPostId
        };
    }
    catch (error) {
        console.error('🔥 Error in Instagram posting:', error);
        return {
            success: false,
            error: error.message || 'Failed to post to Instagram'
        };
    }
}
async function createAdSet(accessToken, adAccountId, campaignId, dailyBudget, targeting) {
    var _a;
    console.log('🎯 Creating Ad Set with params:', {
        adAccountId,
        campaignId,
        dailyBudget,
        targeting
    });
    // Calculate start and end times
    const startTime = new Date(Date.now() + 60000); // 1 minute from now
    const endTime = new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)); // 2 days from now
    console.log('⏰ Ad Set schedule:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
    });
    const adSetData = {
        name: `${DEFAULT_CONFIG.adset_name} ${Date.now()}`,
        campaign_id: campaignId,
        daily_budget: dailyBudget.toString(),
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'POST_ENGAGEMENT',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        status: 'ACTIVE',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        targeting: {
            geo_locations: {
                countries: targeting.countries
            },
            age_min: targeting.age_min,
            age_max: targeting.age_max,
            publisher_platforms: targeting.platforms,
            facebook_positions: ['feed', 'story'],
            device_platforms: ['mobile', 'desktop']
        },
        access_token: accessToken
    };
    console.log('📤 Sending Ad Set creation request:', JSON.stringify(adSetData, null, 2));
    const response = await (0, node_fetch_1.default)(`https://graph.facebook.com/v19.0/act_${adAccountId}/adsets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(adSetData)
    });
    const result = await response.json();
    console.log('📥 Ad Set creation response:', JSON.stringify(result, null, 2));
    if (!response.ok) {
        console.error('❌ Ad Set creation failed:', result);
        throw new Error(`Failed to create ad set: ${((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'}`);
    }
    console.log('✅ Ad Set created successfully with ID:', result.id);
    return result.id;
}
async function createAd(accessToken, adAccountId, adSetId, postId, pageId) {
    var _a;
    console.log('🎨 Creating Ad with params:', {
        adAccountId,
        adSetId,
        postId,
        pageId
    });
    // Create object_story_id from page and post
    const objectStoryId = `${pageId}_${postId}`;
    console.log('🔗 Object Story ID:', objectStoryId);
    const adData = {
        name: `${DEFAULT_CONFIG.ad_name} ${Date.now()}`,
        adset_id: adSetId,
        creative: {
            object_story_id: objectStoryId
        },
        status: 'ACTIVE',
        access_token: accessToken
    };
    console.log('📤 Sending Ad creation request:', JSON.stringify(adData, null, 2));
    const response = await (0, node_fetch_1.default)(`https://graph.facebook.com/v19.0/act_${adAccountId}/ads`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData)
    });
    const result = await response.json();
    console.log('📥 Ad creation response:', JSON.stringify(result, null, 2));
    if (!response.ok) {
        console.error('❌ Ad creation failed:', result);
        throw new Error(`Failed to create ad: ${((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'}`);
    }
    console.log('✅ Ad created successfully with ID:', result.id);
    return result.id;
}
//# sourceMappingURL=facebookAds.js.map