import { GoogleGenerativeAI } from '@google/generative-ai';

// Your Gemini API key
const GEMINI_API_KEY = 'AIzaSyDXwX7gTc5NgqmBjHoK_9UMO-5TETvmsFc';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Content categories for better AI generation
export const CONTENT_CATEGORIES = [
  'Business & Marketing',
  'Technology & Innovation',
  'Health & Wellness',
  'Lifestyle & Travel',
  'Food & Cooking',
  'Education & Learning',
  'Entertainment & Fun',
  'Sports & Fitness',
  'Fashion & Beauty',
  'General'
];

// Enhanced Text Generation using Gemini
export async function generatePostContent(prompt: string, category?: string): Promise<string> {
  const maxRetries = 5;
  const baseDelay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!prompt.trim()) {
        throw new Error('Prompt cannot be empty');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const enhancedPrompt = `You are a professional social media content creator. Generate an engaging Facebook post based on the following:

Category: ${category || 'General'}
Prompt: ${prompt}

Requirements:
- Keep it conversational and engaging
- Make it suitable for Facebook audience
- Include relevant hashtags if appropriate
- Do NOT use asterisks (*) or special formatting characters
- Keep it concise but compelling (150-300 words)
- Make it sound natural and human-like
- Focus on value and engagement

Generate only the post content, nothing else:`;

      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const generatedContent = response.text();

      if (!generatedContent) {
        throw new Error('No content generated from Gemini');
      }

      // Remove any asterisks or special formatting characters
      const cleanContent = generatedContent
        .replace(/\*/g, '')
        .replace(/#{2,}/g, '#')
        .trim();

      return cleanContent;

    } catch (error: any) {
      console.error(`Gemini API Error (attempt ${attempt}/${maxRetries}):`, error);
      
      // Check if it's a 503 overload error - check both status and message
      if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded')) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error('Gemini AI is currently overloaded. Please try again in a few minutes.');
      }
      
      // Check if it's a 429 quota exceeded error
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('exceeded')) {
        throw new Error('Daily API quota exceeded. Please wait 24 hours for quota reset or upgrade your Google Cloud billing plan.');
      }
      
      throw new Error(`Failed to generate content: ${error.message || 'Unknown error'}`);
    }
  }
}

// Image Description Generation for Facebook
export async function generateImageDescription(prompt: string, category?: string): Promise<string> {
  const maxRetries = 5;
  const baseDelay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const imagePrompt = `You are an expert at creating image descriptions. Create a detailed, specific description for an AI image generator based on this social media post idea:

Category: ${category || 'General'}
Post Idea: ${prompt}


CRITICAL REQUIREMENTS:
1. MUST identify and describe the EXACT main subject/object mentioned in the prompt
2. If specific animals are mentioned (camel, horse, dog, etc.) - describe that EXACT animal prominently
3. If specific food items are mentioned (ice cream, pizza, etc.) - describe that EXACT food item
4. If specific products are mentioned - describe those EXACT products
5. Be extremely specific about the main visual element
6. Use clear, descriptive keywords that match the subject
7. Professional, high-quality visual suitable for Facebook
8. 30-80 words focusing on the PRIMARY subject

Examples:
- If prompt mentions "camel": Description should prominently feature "camel in desert setting"
- If prompt mentions "ice cream": Description should prominently feature "ice cream cone or bowl"
- If prompt mentions "business software": Description should feature "business technology or office setting"

Generate ONLY the image description, focusing on the main subject:`;

      const result = await model.generateContent(imagePrompt);
      const response = await result.response;
      const imageDescription = response.text();

      if (!imageDescription) {
        throw new Error('No image description generated');
      }

      const cleanDescription = imageDescription.trim();
      console.log('Generated image description:', cleanDescription);
      return cleanDescription;

    } catch (error: any) {
      console.error(`Gemini Image Description Error (attempt ${attempt}/${maxRetries}):`, error);
      
      // Check if it's a 503 overload error - check both status and message
      if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded')) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying image description in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // Return a fallback description based on the prompt instead of throwing error
        console.log('Gemini AI overloaded, using fallback image description');
        return generateFallbackImageDescription(prompt, category);
      }
      
      // Check if it's a 429 quota exceeded error
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('exceeded')) {
        console.log('Gemini API quota exceeded, using fallback image description');
        return generateFallbackImageDescription(prompt, category);
      }
      
      throw new Error(`Failed to generate image description: ${error.message || 'Unknown error'}`);
    }
  }
}

// Fallback image description generator when Gemini is overloaded
function generateFallbackImageDescription(prompt: string, category?: string): string {
  const cleanPrompt = prompt.toLowerCase().trim();
  
  // Extract key terms from the prompt for fallback description
  const fallbackDescriptions: { [key: string]: string } = {
    'camel': 'A majestic camel standing in golden desert sand dunes under clear blue sky',
    'horse': 'A beautiful horse running freely in an open green meadow',
    'dog': 'A friendly dog sitting in a sunny park with green grass',
    'cat': 'A cute cat sitting peacefully in a cozy indoor setting',
    'ice cream': 'Colorful ice cream scoops in a waffle cone on a bright background',
    'pizza': 'A delicious pizza with fresh toppings on a wooden table',
    'burger': 'A gourmet burger with fresh ingredients on a rustic plate',
    'cake': 'An elegant cake with beautiful decorations on a white background',
    'coffee': 'A steaming cup of coffee with latte art on a wooden table',
    'business': 'Professional business meeting in a modern office setting',
    'technology': 'Modern technology devices and digital interfaces',
    'fitness': 'People exercising in a bright, modern gym environment',
    'travel': 'Beautiful travel destination with scenic landscape view',
    'food': 'Fresh, appetizing food beautifully presented on a table'
  };
  
  // Find matching description
  for (const [keyword, description] of Object.entries(fallbackDescriptions)) {
    if (cleanPrompt.includes(keyword)) {
      return description;
    }
  }
  
  // Category-based fallback
  const categoryDescriptions: { [key: string]: string } = {
    'Business & Marketing': 'Professional business presentation in a modern office environment',
    'Technology & Innovation': 'Cutting-edge technology and digital innovation concepts',
    'Health & Wellness': 'Healthy lifestyle and wellness activities in natural setting',
    'Lifestyle & Travel': 'Beautiful travel destination with stunning natural scenery',
    'Food & Cooking': 'Delicious, fresh food beautifully arranged and presented',
    'Education & Learning': 'Learning environment with books and educational materials',
    'Entertainment & Fun': 'Fun, colorful entertainment and recreational activities',
    'Sports & Fitness': 'Athletic activities and fitness training in action',
    'Fashion & Beauty': 'Stylish fashion and beauty products in elegant setting'
  };
  
  return categoryDescriptions[category || 'General'] || 'Professional, high-quality image suitable for social media content';
}
// Generate placeholder image URL (using a more sophisticated placeholder service)
export async function generateImageUrl(description: string): Promise<string> {
  try {
    // Extract key visual elements from the description for better image matching
    const cleanDescription = description.toLowerCase().trim();
    
    console.log('Image description received:', description);
    console.log('Clean description:', cleanDescription);
    
    // Enhanced keyword detection with priority scoring
    let imageQuery = 'business'; // default fallback
    let matchScore = 0;
    
    // Define keyword categories with scoring for better matching
    const keywordCategories = {
      // Animals (high specificity)
      'camel': ['camel', 'desert animal', 'dromedary', 'hump'],
      'horse': ['horse', 'equine', 'stallion', 'mare', 'pony'],
      'dog': ['dog', 'canine', 'puppy', 'pet dog', 'domestic dog'],
      'cat': ['cat', 'feline', 'kitten', 'pet cat', 'domestic cat'],
      'elephant': ['elephant', 'safari', 'trunk', 'tusks', 'african elephant'],
      'lion': ['lion', 'big cat', 'wildlife', 'mane', 'king of jungle'],
      
      // Food & Beverages (high specificity)
      'ice-cream': ['ice cream', 'icecream', 'frozen dessert', 'gelato', 'sorbet'],
      'pizza': ['pizza', 'italian food', 'slice', 'pepperoni', 'margherita'],
      'burger': ['burger', 'hamburger', 'fast food', 'cheeseburger', 'sandwich'],
      'cake': ['cake', 'dessert', 'bakery', 'birthday cake', 'wedding cake'],
      'coffee': ['coffee', 'cafe', 'beverage', 'espresso', 'latte', 'cappuccino'],
      'food': ['meal', 'restaurant', 'dining', 'cuisine', 'dish'],
      
      // Business & Technology (medium specificity)
      'business': ['business', 'office', 'corporate', 'professional', 'meeting', 'workplace'],
      'technology': ['technology', 'tech', 'digital', 'software', 'innovation', 'startup'],
      'computer': ['computer', 'laptop', 'pc', 'desktop', 'workstation'],
      'smartphone': ['phone', 'mobile', 'smartphone', 'device', 'iphone', 'android'],
      
      // Nature & Travel (medium specificity)
      'nature': ['nature', 'forest', 'outdoor', 'environment', 'wilderness', 'trees'],
      'beach': ['beach', 'ocean', 'sea', 'coastal', 'waves', 'sand'],
      'mountain': ['mountain', 'hiking', 'peak', 'landscape', 'summit', 'alpine'],
      'travel': ['travel', 'vacation', 'tourism', 'journey', 'adventure', 'destination'],
      'sunset': ['sunset', 'sunrise', 'sky', 'horizon', 'golden hour', 'dusk'],
      
      // Health & Fitness (medium specificity)
      'fitness': ['fitness', 'gym', 'workout', 'exercise', 'training', 'bodybuilding'],
      'yoga': ['yoga', 'meditation', 'wellness', 'mindfulness', 'zen', 'namaste'],
      'health': ['health', 'medical', 'healthcare', 'doctor', 'hospital', 'wellness']
    };
    
    // Score-based matching for better accuracy
    for (const [category, keywords] of Object.entries(keywordCategories)) {
      let categoryScore = 0;
      for (const keyword of keywords) {
        if (cleanDescription.includes(keyword)) {
          // Give higher scores for exact matches and longer keywords
          categoryScore += keyword.length * 2;
          if (cleanDescription.startsWith(keyword) || cleanDescription.includes(` ${keyword} `)) {
            categoryScore += 10; // Bonus for word boundaries
          }
        }
      }
      
      if (categoryScore > matchScore) {
        matchScore = categoryScore;
        imageQuery = category;
      }
    }
    
    // Additional context-based refinements
    if (matchScore === 0) {
      // If no specific match, try to infer from context
      if (cleanDescription.includes('product') || cleanDescription.includes('service') || cleanDescription.includes('company')) {
        imageQuery = 'business';
      } else if (cleanDescription.includes('food') || cleanDescription.includes('eat') || cleanDescription.includes('taste')) {
        imageQuery = 'food';
      } else if (cleanDescription.includes('outdoor') || cleanDescription.includes('natural') || cleanDescription.includes('green')) {
        imageQuery = 'nature';
      } else if (cleanDescription.includes('digital') || cleanDescription.includes('online') || cleanDescription.includes('app')) {
        imageQuery = 'technology';
      }
    }
    
    console.log('Selected image query:', imageQuery, 'with score:', matchScore);
    
    // Enhanced image mappings with higher quality, more diverse images
    const imageMap: { [key: string]: string[] } = {
      // Animals - Multiple options for variety
      'camel': [
        'https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1598073/pexels-photo-1598073.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'horse': [
        'https://images.pexels.com/photos/635499/pexels-photo-635499.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1996333/pexels-photo-1996333.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'dog': [
        'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'cat': [
        'https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'elephant': [
        'https://images.pexels.com/photos/66898/elephant-cub-tsavo-kenya-66898.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'lion': [
        'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      
      // Food - Multiple high-quality options
      'ice-cream': [
        'https://images.pexels.com/photos/1352278/pexels-photo-1352278.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'pizza': [
        'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'burger': [
        'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'cake': [
        'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'coffee': [
        'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'food': [
        'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      
      // Business & Technology - Professional, diverse options
      'business': [
        'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'technology': [
        'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'computer': [
        'https://images.pexels.com/photos/205316/pexels-photo-205316.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'smartphone': [
        'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      
      // Nature & Travel - Stunning, high-quality landscapes
      'nature': [
        'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'beach': [
        'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'mountain': [
        'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'travel': [
        'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'sunset': [
        'https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      
      // Health & Fitness - Motivational, high-quality images
      'fitness': [
        'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'yoga': [
        'https://images.pexels.com/photos/317157/pexels-photo-317157.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'health': [
        'https://images.pexels.com/photos/40751/doctor-medical-medicine-health-40751.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ]
    };
    
    // Select image with variety (rotate through available options)
    const availableImages = imageMap[imageQuery] || imageMap['business'];
    const selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];
    
    console.log('Final selected image URL:', selectedImage);
    return selectedImage;
    
  } catch (error: any) {
    console.error('Image Generation Error:', error);
    // Return a reliable fallback image from Pexels
    return 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600';
  }
}

// Facebook Graph API Publishing with Image
import { publishToFacebook } from './facebook';

export const publishToFacebookWithImage = publishToFacebook;

// Combined function to generate content, image, and publish
export async function generateAndPublishComplete(
  prompt: string, 
  category: string,
  pageId: string, 
  accessToken: string
): Promise<{ 
  success: boolean; 
  content?: string; 
  imageUrl?: string;
  imageDescription?: string;
  postId?: string; 
  error?: string 
}> {
  try {
    // Step 1: Generate post content
    const content = await generatePostContent(prompt, category);
    
    // Step 2: Generate image description
    const imageDescription = await generateImageDescription(prompt, category);
    
    // Step 3: Generate image URL
    const imageUrl = await generateImageUrl(imageDescription);
    
    // Step 4: Publish to Facebook with image
    const publishResult = await publishToFacebook(content, imageUrl, pageId, accessToken);
    
    if (publishResult.success) {
      return {
        success: true,
        content,
        imageUrl,
        imageDescription,
        postId: publishResult.postId
      };
    } else {
      return {
        success: false,
        content,
        imageUrl,
        imageDescription,
        error: publishResult.error
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate and publish content'
    };
  }
}