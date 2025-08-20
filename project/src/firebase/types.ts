export interface ContentPost {
  id?: string;
  generatedContent: string;
  generatedImageUrl?: string;
  imageDescription?: string;
  category?: string;
  prompt?: string;
  status?: 'draft' | 'published' | 'failed';
  postId?: string;
  platform?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserCredentials {
  platform: string;
  accessToken: string;
  pageId?: string;
  expiryDate?: string;
  type: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}