import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Zap, TrendingUp, Copy, CheckCircle, AlertCircle, Send, Image as ImageIcon } from 'lucide-react';
import { generateFacebookAd } from '../api/adGenerator';
import { generateImageDescription, generateImageUrl, publishToFacebookWithImage } from '../api/gemini';
import { useAuth } from '../Contexts/AuthContext';
import { getCredential } from '../firebase/firestore';

interface AdResult {
  caption: string;
  hashtags: string[];
  keywords: string[];
  targetingTips: string[];
  imageUrl?: string;
  imageDescription?: string;
}

const FacebookAdGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    product: '',
    audience: '',
    offer: '',
    goal: 'Conversions'
  });
  const [adResult, setAdResult] = useState<AdResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [storedPageId, setStoredPageId] = useState('');
  const [storedAccessToken, setStoredAccessToken] = useState('');
  const [publishedPostId, setPublishedPostId] = useState('');

  const adGoals = [
    'Brand Awareness',
    'Traffic/Clicks', 
    'Conversions/Sales',
    'Lead Generation',
    'App Downloads',
    'Engagement',
    'Video Views'
  ];

  React.useEffect(() => {
    loadCredentials();
  }, [currentUser]);

  const loadCredentials = async () => {
    if (!currentUser) return;
    
    try {
      const { success, data } = await getCredential(currentUser.uid, 'facebook');
      if (success && data) {
        setStoredPageId(data.pageId || '');
        setStoredAccessToken(data.accessToken || '');
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleGenerate = async () => {
    if (!formData.product.trim() || !formData.audience.trim()) {
      setError('Please fill in at least the product/service and target audience fields');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccessMessage('');
    setAdResult(null);
    setPublishedPostId('');

    try {
      // Generate ad content
      const result = await generateFacebookAd(formData);
      
      // Generate image description and URL
      const imageDescription = await generateImageDescription(formData.product, 'Business & Marketing');
      const imageUrl = await generateImageUrl(imageDescription);
      
      setAdResult({
        ...result,
        imageUrl,
        imageDescription
      });
      setSuccessMessage('Facebook ad generated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to generate Facebook ad');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handlePublishAd = async () => {
    if (!adResult?.caption || !adResult?.imageUrl) {
      setError('No ad content to publish. Please generate an ad first.');
      return;
    }

    if (!storedPageId || !storedAccessToken) {
      setError('No Facebook credentials found. Please add them in the Credential Vault first.');
      return;
    }

    setIsPublishing(true);
    setError('');
    setSuccessMessage('');

    try {
      // Combine caption with hashtags for posting
      const fullCaption = `${adResult.caption}\n\n${adResult.hashtags.join(' ')}`;
      
      const result = await publishToFacebookWithImage(
        fullCaption,
        adResult.imageUrl,
        storedPageId,
        storedAccessToken
      );
      
      if (result.success) {
        setPublishedPostId(result.postId || '');
        setSuccessMessage(`Ad published successfully to Facebook! Post ID: ${result.postId}`);
      } else {
        setError(result.error || 'Failed to publish ad to Facebook');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish ad');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Facebook Ad Generator</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create High-Converting Facebook Ads</h2>
          <p className="text-gray-600">Generate optimized ad copy, hashtags, and targeting keywords for maximum ROI.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border bg-red-50 border-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-lg border bg-green-50 border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Ad Campaign Details</h3>
                <p className="text-gray-600 text-sm">Provide details about your product and campaign</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-2">
                  Product/Service *
                </label>
                <textarea
                  id="product"
                  value={formData.product}
                  onChange={(e) => handleInputChange('product', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Describe your product or service (e.g., 'Premium organic skincare cream for sensitive skin')"
                />
              </div>

              <div>
                <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience *
                </label>
                <textarea
                  id="audience"
                  value={formData.audience}
                  onChange={(e) => handleInputChange('audience', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Describe your target audience (e.g., 'Women aged 25-45 interested in natural beauty products')"
                />
              </div>

              <div>
                <label htmlFor="offer" className="block text-sm font-medium text-gray-700 mb-2">
                  Special Offer/CTA
                </label>
                <input
                  id="offer"
                  type="text"
                  value={formData.offer}
                  onChange={(e) => handleInputChange('offer', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., '20% off first order', 'Free shipping', 'Limited time offer'"
                />
              </div>

              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Goal
                </label>
                <select
                  id="goal"
                  value={formData.goal}
                  onChange={(e) => handleInputChange('goal', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {adGoals.map((goal) => (
                    <option key={goal} value={goal}>{goal}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating Ad...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    <span>Generate Facebook Ad</span>
                  </>
                )}
              </button>
            </div>

            {/* Facebook Connection Status */}
            {storedPageId ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Facebook Page Connected</span>
                </div>
                <p className="text-green-700 text-sm mt-1">Ready to publish ads directly to Facebook</p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-800 font-medium">Facebook Not Connected</span>
                </div>
                <p className="text-amber-700 text-sm mt-1">Add credentials in Credential Vault to publish ads</p>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-6">
            {adResult && (
              <>
                {/* Ad Caption */}
                {adResult.imageUrl && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Generated Ad Image</h3>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <img 
                        src={adResult.imageUrl} 
                        alt="Generated Ad Image" 
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600';
                        }}
                      />
                    </div>
                    {adResult.imageDescription && (
                      <p className="text-xs text-gray-500 mt-2">Image: {adResult.imageDescription}</p>
                    )}
                  </div>
                )}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Ad Caption</h3>
                    <button
                      onClick={() => copyToClipboard(adResult.caption, 'caption')}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copiedField === 'caption' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedField === 'caption' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{adResult.caption}</p>
                  </div>
                </div>

                {/* Hashtags */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Hashtags</h3>
                    <button
                      onClick={() => copyToClipboard(adResult.hashtags.join(' '), 'hashtags')}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copiedField === 'hashtags' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedField === 'hashtags' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {adResult.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {hashtag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Targeting Keywords</h3>
                    <button
                      onClick={() => copyToClipboard(adResult.keywords.join(', '), 'keywords')}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copiedField === 'keywords' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedField === 'keywords' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {adResult.keywords.map((keyword, index) => (
                      <div
                        key={index}
                        className="bg-green-50 border border-green-200 rounded-lg p-3"
                      >
                        <span className="text-green-800 font-medium">{keyword}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Targeting Tips */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">Optimization Tips</h3>
                  </div>
                  <ul className="space-y-2">
                    {adResult.targetingTips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-purple-800 text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Publish Button */}
                {publishedPostId ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Ad Published Successfully!</span>
                    </div>
                    <p className="text-green-700 text-sm">Facebook Post ID: {publishedPostId}</p>
                  </div>
                ) : storedPageId && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <button
                      onClick={handlePublishAd}
                      disabled={isPublishing}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isPublishing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Publishing Ad...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Publish Ad to Facebook</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {!adResult && !isGenerating && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="flex justify-center space-x-4 mb-4">
                  <Target className="w-12 h-12 text-gray-400" />
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Your Ad</h3>
                <p className="text-gray-600">Fill in the campaign details and click generate to create your optimized Facebook ad with image.</p>
              </div>
            )}
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
          <div className="flex items-start space-x-3">
            <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-blue-900 font-semibold mb-2">Facebook Ad Best Practices:</h4>
              <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
                <li>Keep your headline under 25 characters for mobile optimization</li>
                <li>Use high-quality, eye-catching visuals that stop the scroll</li>
                <li>Include a clear, compelling call-to-action (CTA)</li>
                <li>Test multiple ad variations to find what works best</li>
                <li>Use Facebook Pixel for better conversion tracking</li>
                <li>Target lookalike audiences based on your best customers</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FacebookAdGenerator;