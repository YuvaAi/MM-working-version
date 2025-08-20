// LinkedIn API Integration
export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

// Publish content to LinkedIn using LinkedIn API
export async function publishToLinkedIn(
  content: string,
  linkedInUserId: string,
  accessToken: string
): Promise<LinkedInPostResult> {
  try {
    console.log('💼 Starting LinkedIn posting process...');
    console.log('LinkedIn User ID:', linkedInUserId);
    console.log('Content length:', content.length);

    // LinkedIn API endpoint for creating posts
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: `urn:li:person:${linkedInUserId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    });

    const result = await response.json();
    console.log('📥 LinkedIn publish response:', result);

    if (!response.ok) {
      console.error('❌ LinkedIn publishing failed:', result);
      return {
        success: false,
        error: result.message || result.error_description || 'Failed to publish to LinkedIn'
      };
    }

    // Extract post ID from LinkedIn response
    const postId = result.id || 'unknown';
    console.log('✅ LinkedIn post published successfully:', postId);

    return {
      success: true,
      postId: postId
    };

  } catch (error: any) {
    console.error('🔥 Error in LinkedIn posting:', error);
    return {
      success: false,
      error: error.message || 'Network error while posting to LinkedIn'
    };
  }
}

// Validate LinkedIn credentials
export async function validateLinkedInCredentials(
  accessToken: string,
  linkedInUserId: string
): Promise<{ success: boolean; profile?: any; error?: string }> {
  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/people/(id:${linkedInUserId})?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error_description || 'Failed to validate LinkedIn credentials'
      };
    }

    return {
      success: true,
      profile: data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error while validating LinkedIn credentials'
    };
  }
}