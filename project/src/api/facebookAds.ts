import { getFunctions, httpsCallable } from 'firebase/functions';

interface CreateAdRequest {
  post_id: string;
  instagram_user_id?: string;
  image_url?: string;
  caption?: string;
  daily_budget_cents?: number;
  targeting?: {
    countries?: string[];
    age_min?: number;
    age_max?: number;
    platforms?: string[];
  };
  campaign_id?: string;
}

interface FacebookAdResponse {
  success: boolean;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  instagram_post_id?: string;
  error?: string;
}

// Initialize Firebase Functions
const functions = getFunctions();

// Create callable function reference
const createFacebookAdFunction = httpsCallable<CreateAdRequest, FacebookAdResponse>(
  functions, 
  'createFacebookAd'
);

/**
 * Automatically create a Facebook ad using a published post
 */
export async function createAutomaticFacebookAd(
  postId: string,
  imageUrl?: string,
  caption?: string,
  options?: {
    dailyBudgetCents?: number;
    targeting?: {
      countries?: string[];
      ageMin?: number;
      ageMax?: number;
      platforms?: string[];
    };
  }
): Promise<FacebookAdResponse> {
  try {
    console.log('🚀 Calling createFacebookAd function with postId:', postId);
    
    const request: CreateAdRequest = {
      post_id: postId,
      image_url: imageUrl,
      caption: caption,
      daily_budget_cents: options?.dailyBudgetCents,
      targeting: options?.targeting ? {
        countries: options.targeting.countries,
        age_min: options.targeting.ageMin,
        age_max: options.targeting.ageMax,
        platforms: options.targeting.platforms
      } : undefined,
    };

    console.log('📦 Request payload:', JSON.stringify(request, null, 2));

    const result = await createFacebookAdFunction(request);
    console.log('📥 Function response:', JSON.stringify(result.data, null, 2));
    
    return result.data;
  } catch (error: any) {
    console.error('Error calling createFacebookAd function:', error);
    return {
      success: false,
      error: error.message || 'Failed to create Facebook ad'
    };
  }
}

/**
 * Create Facebook ad with custom targeting
 */
export async function createCustomFacebookAd(
  postId: string,
  dailyBudgetCents: number,
  targeting: {
    countries: string[];
    ageMin: number;
    ageMax: number;
    platforms: string[];
  },
  campaignId?: string
): Promise<FacebookAdResponse> {
  return createAutomaticFacebookAd(postId, {
    dailyBudgetCents,
    targeting: {
      countries: targeting.countries,
      ageMin: targeting.ageMin,
      ageMax: targeting.ageMax,
      platforms: targeting.platforms
    },
    campaignId
  });
}