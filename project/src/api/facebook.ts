// Facebook Graph API Integration
export interface FacebookPermission {
  permission: string;
  status: string;
}

export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

// Check Facebook permissions
export async function checkFacebookPermissions(accessToken: string): Promise<{
  success: boolean;
  permissions: FacebookPermission[];
  error?: string;
}> {
  try {
    const response = await fetch(`https://graph.facebook.com/me/permissions?access_token=${accessToken}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        permissions: [],
        error: data.error?.message || 'Failed to check permissions'
      };
    }

    return {
      success: true,
      permissions: data.data || []
    };
  } catch (error: any) {
    return {
      success: false,
      permissions: [],
      error: error.message || 'Network error while checking permissions'
    };
  }
}

// Get Facebook Pages
export async function getFacebookPages(accessToken: string): Promise<{
  success: boolean;
  pages: FacebookPageInfo[];
  error?: string;
}> {
  try {
    const response = await fetch(`https://graph.facebook.com/me/accounts?fields=id,name,access_token,category&access_token=${accessToken}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('Facebook API Error:', data);
      return {
        success: false,
        pages: [],
        error: data.error?.message || `API Error: ${response.status} ${response.statusText}`
      };
    }

    console.log('Facebook Pages Response:', data);
    
    // Handle case where user has no pages
    if (!data.data || data.data.length === 0) {
      return {
        success: true,
        pages: [],
        error: 'No Facebook pages found. Make sure you have admin access to at least one Facebook page.'
      };
    }
    return {
      success: true,
      pages: data.data || []
    };
  } catch (error: any) {
    console.error('Network error fetching Facebook pages:', error);
    return {
      success: false,
      pages: [],
      error: error.message || 'Network error while fetching pages'
    };
  }
}

// Validate Facebook credentials
export async function validateFacebookCredentials(accessToken: string, pageId: string): Promise<{
  success: boolean;
  pageInfo?: FacebookPageInfo;
  permissions?: FacebookPermission[];
  error?: string;
}> {
  try {
    // Check permissions first
    const permissionCheck = await checkFacebookPermissions(accessToken);
    if (!permissionCheck.success) {
      return {
        success: false,
        error: permissionCheck.error
      };
    }

    // Check required permissions
    const requiredPermissions = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'];
    const grantedPermissions = permissionCheck.permissions
      .filter(p => p.status === 'granted')
      .map(p => p.permission);

    const missingPermissions = requiredPermissions.filter(perm => !grantedPermissions.includes(perm));
    
    if (missingPermissions.length > 0) {
      return {
        success: false,
        permissions: permissionCheck.permissions,
        error: `Missing required permissions: ${missingPermissions.join(', ')}. Please re-authorize your Facebook app with these permissions.`
      };
    }

    // Get pages and validate page ID
    const pagesResult = await getFacebookPages(accessToken);
    if (!pagesResult.success) {
      return {
        success: false,
        error: pagesResult.error
      };
    }

    const targetPage = pagesResult.pages.find(page => page.id === pageId);
    if (!targetPage) {
      const availablePagesList = pagesResult.pages.length > 0 
        ? pagesResult.pages.map(p => `${p.name} (${p.id})`).join(', ')
        : 'No pages available - you may not have admin access to any Facebook pages';
        
      return {
        success: false,
        error: `Page ID ${pageId} not found in your accessible pages. Available pages: ${availablePagesList}. Make sure you have admin access to the page and the correct permissions.`
      };
    }

    return {
      success: true,
      pageInfo: targetPage,
      permissions: permissionCheck.permissions
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to validate Facebook credentials'
    };
  }
}

// Publish content to Facebook with enhanced error handling
export async function publishToFacebook(
  content: string,
  imageUrl: string,
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // First validate credentials
    const validation = await validateFacebookCredentials(accessToken, pageId);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Use the page's access token if available
    const pageAccessToken = validation.pageInfo?.access_token || accessToken;

    // Publish the post with image
    const response = await fetch(`https://graph.facebook.com/${pageId}/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: imageUrl,
        caption: content,
        access_token: pageAccessToken
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error?.message || 'Failed to publish to Facebook'
      };
    }

    return {
      success: true,
      postId: result.id
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error while publishing to Facebook'
    };
  }
}