import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, Linkedin, Upload, Wand2, Send, AlertCircle, CheckCircle, Loader2, ArrowLeft, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generatePostContent, generateImageDescription, generateImageUrl, CONTENT_CATEGORIES } from '../api/gemini';
import { publishToFacebook } from '../api/facebook';
import { publishToInstagram } from '../api/instagram';
import { publishToLinkedIn } from '../api/linkedin';
import { createAutomaticFacebookAd } from '../api/facebookAds';
import { saveGeneratedContent } from '../firebase/content';
import { useAuth } from '../Contexts/AuthContext';
import { getCredential, getCredentials } from '../firebase/firestore';

interface FacebookContentProps {
  platform: 'facebook' | 'instagram' | 'linkedin';
}

interface Credentials {
  facebook?: {
    pageAccessToken: string;
    pageId: string;
  };
  instagram?: {
    userAccessToken: string;
    businessAccountId: string;
  };
  linkedin?: {
    accessToken: string;
    userId: string;
  };
  facebookAds?: {
    accessToken: string;
    adAccountId: string;
    campaignId: string;
  };
}

interface PlatformOption {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  enabled: boolean;
}

export default function FacebookContent({ platform }: FacebookContentProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [storedCredentials, setStoredCredentials] = useState<any>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishResults, setPublishResults] = useState<{[key: string]: {success: boolean, message: string, postId?: string}}>({});

  // Available platforms with their configurations
  const availablePlatforms: PlatformOption[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      enabled: !!storedCredentials.facebook
    },
    {
      id: 'facebook_ads',
      name: 'Facebook Ads',
      icon: Target,
      color: 'text-red-600',
      enabled: !!storedCredentials.facebook && !!storedCredentials.facebook_ads
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-purple-600',
      enabled: !!storedCredentials.instagram
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      enabled: !!storedCredentials.linkedin
    }
  ];

  // Platform-specific configurations
  const platformConfig = {
    facebook: {
      icon: Facebook,
      name: 'Facebook',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      buttonText: 'Publish to Facebook',
      credentialType: 'Facebook Page'
    },
    instagram: {
      icon: Instagram,
      name: 'Instagram',
      color: 'from-purple-500 via-pink-500 to-orange-400',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      textColor: 'text-purple-600',
      buttonText: 'Publish to Instagram',
      credentialType: 'Instagram Business Account'
    },
    linkedin: {
      icon: Linkedin,
      name: 'LinkedIn',
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      buttonText: 'Publish to LinkedIn',
      credentialType: 'LinkedIn Profile'
    }
  };

  const config = platformConfig[platform];
  const IconComponent = config.icon;

  // Check if credentials exist for the current platform
  const hasCredentials = !!storedCredentials[platform];

  useEffect(() => {
    loadAllCredentials();
  }, [currentUser, platform]);

  const loadAllCredentials = async () => {
    if (!currentUser) return;

    try {
      const { success, data } = await getCredentials(currentUser.uid);
      if (success && data) {
        const credentialsMap: any = {};
        data.forEach((cred: any) => {
          credentialsMap[cred.type] = cred;
        });
        setStoredCredentials(credentialsMap);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setPublishStatus('idle');
    setPublishResults({});
    
    try {
      // Generate post content
      const content = await generatePostContent(prompt, selectedCategory);
      setGeneratedContent(content);
      
      // Generate image description and then image URL
      const imageDescription = await generateImageDescription(prompt, selectedCategory);
      const imageUrl = await generateImageUrl(imageDescription);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error('Error generating content:', error);
      setStatusMessage('Failed to generate content. Please try again.');
      setPublishStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMultiPlatformPublish = async () => {
    if (!generatedContent || selectedPlatforms.length === 0) return;

    setIsPublishing(true);
    setPublishStatus('idle');
    const results: {[key: string]: {success: boolean, message: string, postId?: string}} = {};

    try {
      // Publish to each selected platform
      for (const platformId of selectedPlatforms) {
        try {
          let result;
          
          switch (platformId) {
            case 'facebook':
              const facebookCreds = storedCredentials.facebook;
              if (!facebookCreds) {
                results[platformId] = { success: false, message: 'Facebook credentials not found' };
                continue;
              }
              result = await publishToFacebook(
                generatedContent,
                generatedImage,
                facebookCreds.pageId,
                facebookCreds.accessToken
              );
              
              if (result.success) {
                results[platformId] = { 
                  success: true, 
                  message: 'Published successfully', 
                  postId: result.postId 
                };
              } else {
                results[platformId] = { success: false, message: result.error || 'Publishing failed' };
              }
              break;

            case 'facebook_ads':
              // Facebook Ads requires a Facebook post first
              const fbCreds = storedCredentials.facebook;
              const fbAdsCreds = storedCredentials.facebook_ads;
              
              if (!fbCreds || !fbAdsCreds) {
                results[platformId] = { success: false, message: 'Facebook or Facebook Ads credentials not found' };
                continue;
              }
              
              // First publish to Facebook
              const fbResult = await publishToFacebook(
                generatedContent,
                generatedImage,
                fbCreds.pageId,
                fbCreds.accessToken
              );
              
              if (fbResult.success && fbResult.postId) {
                try {
                  await createAutomaticFacebookAd(
                    fbResult.postId,
                    generatedImage,
                    generatedContent
                  );
                  results[platformId] = { 
                    success: true, 
                    message: 'Facebook post published and ad created successfully',
                    postId: fbResult.postId
                  };
                } catch (adError) {
                  results[platformId] = { 
                    success: false, 
                    message: 'Facebook post published but ad creation failed' 
                  };
                }
              } else {
                results[platformId] = { success: false, message: 'Failed to publish Facebook post for ad creation' };
              }
              break;

            case 'instagram':
              const instagramCreds = storedCredentials.instagram;
              if (!instagramCreds) {
                results[platformId] = { success: false, message: 'Instagram credentials not found' };
                continue;
              }
              result = await publishToInstagram(
                generatedContent,
                generatedImage,
                instagramCreds.instagramUserId,
                instagramCreds.accessToken
              );
              
              if (result.success) {
                results[platformId] = { 
                  success: true, 
                  message: 'Published successfully', 
                  postId: result.postId 
                };
              } else {
                results[platformId] = { success: false, message: result.error || 'Publishing failed' };
              }
              break;

            case 'linkedin':
              const linkedInCreds = storedCredentials.linkedin;
              if (!linkedInCreds) {
                results[platformId] = { success: false, message: 'LinkedIn credentials not found' };
                continue;
              }
              result = await publishToLinkedIn(
                generatedContent, 
                linkedInCreds.linkedInUserId, 
                linkedInCreds.accessToken
              );
              
              if (result.success) {
                results[platformId] = { 
                  success: true, 
                  message: 'Published successfully', 
                  postId: result.postId 
                };
              } else {
                results[platformId] = { success: false, message: result.error || 'Publishing failed' };
              }
              break;

            default:
              results[platformId] = { success: false, message: 'Unsupported platform' };
          }
        } catch (error: any) {
          results[platformId] = { 
            success: false, 
            message: error.message || `Failed to publish to ${platformId}` 
          };
        }
      }

      setPublishResults(results);
      
      // Determine overall status
      const successCount = Object.values(results).filter(r => r.success).length;
      const totalCount = Object.keys(results).length;
      
      if (successCount === totalCount) {
        setPublishStatus('success');
        setStatusMessage(`Successfully published to all ${totalCount} selected platform(s)!`);
      } else if (successCount > 0) {
        setPublishStatus('success');
        setStatusMessage(`Published to ${successCount} out of ${totalCount} platforms. Check details below.`);
      } else {
        setPublishStatus('error');
        setStatusMessage('Failed to publish to any selected platforms. Check details below.');
      }

      // Save to Firestore for successful publications
      if (currentUser) {
        for (const [platformId, result] of Object.entries(results)) {
          if (result.success) {
            try {
              await saveGeneratedContent(currentUser.uid, {
                generatedContent,
                generatedImageUrl: generatedImage,
                imageDescription: '',
                category: selectedCategory,
                prompt,
                status: 'published',
                postId: result.postId,
                platform: platformId
              });
            } catch (saveError) {
              console.error(`Failed to save content for ${platformId}:`, saveError);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Publishing error:', error);
      setStatusMessage('An unexpected error occurred during publishing.');
      setPublishStatus('error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header */}
        <div className={`${config.bgColor} rounded-lg p-6 mb-8`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-3 bg-gradient-to-r ${config.color} rounded-lg`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {config.name} Content Creator
              </h1>
              <p className="text-gray-600">
                Generate and publish content to your {config.credentialType}
              </p>
            </div>
          </div>

          {!hasCredentials && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">
                  Please add your {config.name} credentials in the Credential Vault to publish content.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content Generation */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Generate Content
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CONTENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe the content you want to create for ${config.name}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`w-full bg-gradient-to-r ${config.color} text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Generate Content</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Content Preview */}
        {generatedContent && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Publishing Platforms
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {availablePlatforms.map((platformOption) => {
                const IconComponent = platformOption.icon;
                const isSelected = selectedPlatforms.includes(platformOption.id);
                const isEnabled = platformOption.enabled;
                
                return (
                  <div
                    key={platformOption.id}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isEnabled
                        ? isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                    onClick={() => isEnabled && handlePlatformToggle(platformOption.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        disabled={!isEnabled}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <IconComponent className={`w-6 h-6 ${isEnabled ? platformOption.color : 'text-gray-400'}`} />
                      <span className={`font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
                        {platformOption.name}
                      </span>
                    </div>
                    {!isEnabled && (
                      <div className="absolute top-2 right-2">
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedPlatforms.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-800 text-sm">
                  <strong>Selected platforms:</strong> {selectedPlatforms.map(id => availablePlatforms.find(p => p.id === id)?.name).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {generatedContent && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Generated Content Preview
            </h2>
            
            <div className="space-y-4">
              {generatedImage && (
                <div className="relative">
                  <img
                    src={generatedImage}
                    alt="Generated content"
                    className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                  />
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {generatedContent}
                </p>
              </div>

              {selectedPlatforms.length > 0 && (
                <button
                  onClick={handleMultiPlatformPublish}
                  disabled={isPublishing}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Publishing to {selectedPlatforms.length} platform(s)...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Publish to Selected Platform(s)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Publishing Results */}
        {Object.keys(publishResults).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Publishing Results
            </h2>
            
            <div className="space-y-3">
              {Object.entries(publishResults).map(([platformId, result]) => {
                const platformOption = availablePlatforms.find(p => p.id === platformId);
                const IconComponent = platformOption?.icon || Facebook;
                
                return (
                  <div key={platformId} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${platformOption?.color || 'text-gray-600'}`} />
                    <div className="flex-1">
                      <span className="font-medium">{platformOption?.name || platformId}</span>
                      <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {result.message}
                        {result.postId && <span className="ml-2 text-xs opacity-75">ID: {result.postId}</span>}
                      </p>
                    </div>
                    {result.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {publishStatus !== 'idle' && (
          <div className={`rounded-lg p-4 mb-6 ${
            publishStatus === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {publishStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={publishStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
                {statusMessage}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}