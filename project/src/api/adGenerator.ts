import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCtS5cmAdBb1MDSSL6GsOGVWnZr5e89msQ';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface AdFormData {
  product: string;
  audience: string;
  offer: string;
  goal: string;
}

interface AdResult {
  caption: string;
  hashtags: string[];
  keywords: string[];
  targetingTips: string[];
}

export async function generateFacebookAd(formData: AdFormData): Promise<AdResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert Facebook Ads specialist. Create a high-converting Facebook ad based on these details:

Product/Service: ${formData.product}
Target Audience: ${formData.audience}
Special Offer: ${formData.offer || 'No specific offer mentioned'}
Campaign Goal: ${formData.goal}

Generate a JSON response with exactly this structure:
{
  "caption": "Write a compelling Facebook ad caption (150-200 words) that includes a strong hook, benefits, social proof elements, and a clear call-to-action. Make it scroll-stopping and conversion-focused. Use emojis strategically.",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "targetingTips": ["tip1", "tip2", "tip3", "tip4", "tip5"]
}

Requirements for the caption:
- Start with a strong hook or question
- Highlight key benefits and value proposition
- Include social proof or urgency if relevant
- End with a clear, action-oriented CTA
- Use emojis to increase engagement
- Keep it mobile-friendly and scannable
- Match the tone to the target audience

Requirements for hashtags:
- Mix of popular and niche hashtags
- Relevant to the product and audience
- Include branded hashtags if applicable
- Focus on hashtags that drive engagement

Requirements for keywords:
- SEO and interest-based targeting keywords
- Mix of broad and specific terms
- Include demographic and psychographic keywords
- Focus on high-intent keywords for the campaign goal

Requirements for targeting tips:
- Specific, actionable Facebook Ads optimization advice
- Include audience targeting suggestions
- Mention ad placement recommendations
- Include budget and bidding tips
- Suggest A/B testing strategies

Return ONLY the JSON object, no additional text or formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Clean the response to extract JSON
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const adData = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (!adData.caption || !adData.hashtags || !adData.keywords || !adData.targetingTips) {
      throw new Error('Incomplete ad data generated');
    }

    return {
      caption: adData.caption,
      hashtags: Array.isArray(adData.hashtags) ? adData.hashtags : [],
      keywords: Array.isArray(adData.keywords) ? adData.keywords : [],
      targetingTips: Array.isArray(adData.targetingTips) ? adData.targetingTips : []
    };

  } catch (error: any) {
    console.error('Facebook Ad Generation Error:', error);
    
    // Check if it's a 429 quota exceeded error
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('exceeded')) {
      throw new Error('Daily API quota exceeded. Please wait 24 hours for quota reset or upgrade your Google Cloud billing plan.');
    }
    
    throw new Error(`Failed to generate Facebook ad: ${error.message || 'Unknown error'}`);
  }
}