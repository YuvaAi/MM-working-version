// Instagram Graph API Integration
export interface InstagramPermissionCheck {
  success: boolean;
  permissions?: string[];
  missingPermissions?: string[];
  error?: string;
}

export interface InstagramPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

// Check Instagram permissions
export async function checkInstagramPermissions(
  accessToken: string
): Promise<InstagramPermissionCheck> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`
    );
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || 'Failed to check permissions'
      };
    }

    const grantedPermissions = data.data
      .filter((perm: any) => perm.status === 'granted')
      .map((perm: any) => perm.permission);

    const requiredPermissions = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list'
    ];

    const missingPermissions = requiredPermissions.filter(
      perm => !grantedPermissions.includes(perm)
    );

    return {
      success: missingPermissions.length === 0,
      permissions: grantedPermissions,
      missingPermissions: missingPermissions.length > 0 ? missingPermissions : undefined
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error while checking permissions'
    };
  }
}

// Publish content to Instagram using Graph API
export async function publishToInstagram(
  content: string,
  imageUrl: string,
  instagramUserId: string,
  accessToken: string
): Promise<InstagramPostResult> {
  try {
    console.log('📸 Starting Instagram posting process...');
    console.log('Instagram User ID:', instagramUserId);
    console.log('Image URL:', imageUrl);

    // Step 1: Create media container
    console.log('📤 Creating Instagram media container...');
    const mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${instagramUserId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content,
        access_token: accessToken
      })
    });

    const mediaResult = await mediaResponse.json();
    console.log('📥 Instagram media creation response:', mediaResult);

    if (!mediaResponse.ok) {
      console.error('❌ Instagram media creation failed:', mediaResult);
      return {
        success: false,
        error: mediaResult.error?.message || 'Failed to create Instagram media container'
      };
    }

    const creationId = mediaResult.id;
    console.log('✅ Instagram media container created:', creationId);

    // Step 2: Publish the media
    console.log('📤 Publishing Instagram media...');
    const publishResponse = await fetch(`https://graph.facebook.com/v21.0/${instagramUserId}/media_publish`, {
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
    console.log('📥 Instagram publish response:', publishResult);

    if (!publishResponse.ok) {
      console.error('❌ Instagram publishing failed:', publishResult);
      return {
        success: false,
        error: publishResult.error?.message || 'Failed to publish Instagram media'
      };
    }

    const instagramPostId = publishResult.id;
    console.log('✅ Instagram post published successfully:', instagramPostId);

    return {
      success: true,
      postId: instagramPostId
    };

  } catch (error: any) {
    console.error('🔥 Error in Instagram posting:', error);
    return {
      success: false,
      error: error.message || 'Network error while posting to Instagram'
    };
  }
}

// Validate Instagram credentials
export async function validateInstagramCredentials(
  accessToken: string,
  instagramUserId: string
): Promise<{ success: boolean; username?: string; error?: string; missingPermissions?: string[] }> {
  try {
    // First check permissions
    const permissionCheck = await checkInstagramPermissions(accessToken);
    if (!permissionCheck.success) {
      return {
        success: false,
        error: permissionCheck.error || 'Permission check failed',
        missingPermissions: permissionCheck.missingPermissions
      };
    }

    if (permissionCheck.missingPermissions && permissionCheck.missingPermissions.length > 0) {
      return {
        success: false,
        error: `Missing required permissions: ${permissionCheck.missingPermissions.join(', ')}`,
        missingPermissions: permissionCheck.missingPermissions
      };
    }

    // Then validate Instagram account access
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${instagramUserId}?fields=id,username&access_token=${accessToken}`
    );
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || 'Failed to validate Instagram credentials'
      };
    }

    return {
      success: true,
      username: data.username
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error while validating Instagram credentials',
      missingPermissions: undefined
    };
  }
}