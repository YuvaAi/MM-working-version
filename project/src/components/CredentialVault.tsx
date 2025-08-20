import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { validateFacebookCredentials, getFacebookPages } from '../api/facebook';
import { saveCredential, getCredentials } from '../firebase/firestore';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Calendar, ArrowLeft } from 'lucide-react';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

const CredentialVault: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [savedCredentials, setSavedCredentials] = useState<any[]>([]);
  
  // Instagram state
  const [instagramAccessToken, setInstagramAccessToken] = useState('');
  const [instagramUserId, setInstagramUserId] = useState('');
  const [isValidatingInstagram, setIsValidatingInstagram] = useState(false);
  const [isSavingInstagram, setIsSavingInstagram] = useState(false);
  const [instagramValidationStatus, setInstagramValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [instagramValidationMessage, setInstagramValidationMessage] = useState('');

  // LinkedIn state
  const [linkedInAccessToken, setLinkedInAccessToken] = useState('');
  const [linkedInUserId, setLinkedInUserId] = useState('');
  const [isValidatingLinkedIn, setIsValidatingLinkedIn] = useState(false);
  const [isSavingLinkedIn, setIsSavingLinkedIn] = useState(false);
  const [linkedInValidationStatus, setLinkedInValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [linkedInValidationMessage, setLinkedInValidationMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadSavedCredentials();
    }
  }, [currentUser]);

  const loadSavedCredentials = async () => {
    if (!currentUser) return;
    
    try {
      const result = await getCredentials(currentUser.uid);
      const credentials = result.data || [];
      setSavedCredentials(credentials);
      
      // Auto-load Facebook credentials if they exist
      const facebookCred = credentials.find(cred => cred.type === 'facebook');
      if (facebookCred) {
        setAccessToken(facebookCred.accessToken || '');
        setPageId(facebookCred.pageId || '');
        setExpiryDate(facebookCred.expiryDate || '');
      }
      
      // Auto-load Instagram credentials if they exist
      const instagramCred = credentials.find(cred => cred.type === 'instagram');
      if (instagramCred) {
        setInstagramAccessToken(instagramCred.accessToken || '');
        setInstagramUserId(instagramCred.instagramUserId || '');
      }
      
      // Auto-load LinkedIn credentials if they exist
      const linkedInCred = credentials.find(cred => cred.type === 'linkedin');
      if (linkedInCred) {
        setLinkedInAccessToken(linkedInCred.accessToken || '');
        setLinkedInUserId(linkedInCred.linkedInUserId || '');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const validateCredentials = async () => {
    if (!accessToken.trim()) {
      setValidationStatus('invalid');
      setValidationMessage('Please enter a Facebook Access Token');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    setValidationMessage('');

    try {
      const validation = await validateFacebookCredentials(accessToken);
      
      if (validation.isValid) {
        setValidationStatus('valid');
        setValidationMessage('✅ Valid credentials! All required permissions found.');
        
        // Load available pages
        const pages = await getFacebookPages(accessToken);
        setAvailablePages(pages);
        
        if (pages.length > 0 && !pageId) {
          setPageId(pages[0].id);
        }
      } else {
        setValidationStatus('invalid');
        setValidationMessage(`❌ ${validation.error}`);
        setAvailablePages([]);
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationMessage(`❌ Error validating credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailablePages([]);
    } finally {
      setIsValidating(false);
    }
  };

  const saveCredentials = async () => {
    if (!currentUser) return;
    
    if (!accessToken.trim() || !pageId.trim()) {
      setValidationMessage('❌ Please enter both Access Token and Page ID');
      return;
    }

    setIsSaving(true);

    try {
      const credentialData = {
        type: 'facebook',
        accessToken: accessToken.trim(),
        pageId: pageId.trim(),
        expiryDate: expiryDate || '',
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      };

      await saveCredential(currentUser.uid, credentialData);
      setValidationMessage('✅ Credentials saved successfully!');
      await loadSavedCredentials();
    } catch (error) {
      setValidationMessage(`❌ Error saving credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const validateInstagramCredentials = async () => {
    if (!instagramAccessToken.trim()) {
      setInstagramValidationStatus('invalid');
      setInstagramValidationMessage('Please enter an Instagram Access Token');
      return;
    }

    if (!instagramUserId.trim()) {
      setInstagramValidationStatus('invalid');
      setInstagramValidationMessage('Please enter an Instagram Business Account ID');
      return;
    }

    setIsValidatingInstagram(true);
    setInstagramValidationStatus('idle');
    setInstagramValidationMessage('');

    try {
      const { validateInstagramCredentials } = await import('../api/instagram');
      const validation = await validateInstagramCredentials(instagramAccessToken, instagramUserId);
      
      if (validation.success) {
        setInstagramValidationStatus('valid');
        setInstagramValidationMessage(`✅ Valid Instagram credentials! Account: @${validation.username || 'Unknown'}`);
      } else {
        setInstagramValidationStatus('invalid');
        if (validation.missingPermissions && validation.missingPermissions.length > 0) {
          setInstagramValidationMessage(
            `❌ Missing required permissions: ${validation.missingPermissions.join(', ')}. Please re-authorize your Facebook App with these permissions.`
          );
        } else {
          setInstagramValidationMessage(`❌ ${validation.error || 'Invalid Instagram credentials'}`);
        }
      }
    } catch (error) {
      setInstagramValidationStatus('invalid');
      setInstagramValidationMessage(`❌ Error validating Instagram credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidatingInstagram(false);
    }
  };

  const saveInstagramCredentials = async () => {
    if (!currentUser) return;
    
    if (!instagramAccessToken.trim() || !instagramUserId.trim()) {
      setInstagramValidationMessage('❌ Please enter both Instagram Access Token and Business Account ID');
      return;
    }

    setIsSavingInstagram(true);

    try {
      const credentialData = {
        type: 'instagram',
        accessToken: instagramAccessToken.trim(),
        instagramUserId: instagramUserId.trim(),
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      };

      await saveCredential(currentUser.uid, credentialData);
      setInstagramValidationMessage('✅ Instagram credentials saved successfully!');
      await loadSavedCredentials();
    } catch (error) {
      setInstagramValidationMessage(`❌ Error saving Instagram credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingInstagram(false);
    }
  };

  const validateLinkedInCredentials = async () => {
    if (!linkedInAccessToken.trim()) {
      setLinkedInValidationStatus('invalid');
      setLinkedInValidationMessage('Please enter a LinkedIn Access Token');
      return;
    }

    if (!linkedInUserId.trim()) {
      setLinkedInValidationStatus('invalid');
      setLinkedInValidationMessage('Please enter a LinkedIn User ID');
      return;
    }

    setIsValidatingLinkedIn(true);
    setLinkedInValidationStatus('idle');
    setLinkedInValidationMessage('');

    try {
      // Test LinkedIn API access
      const response = await fetch(`https://api.linkedin.com/v2/people/(id:${linkedInUserId})?projection=(id,firstName,lastName)`, {
        headers: {
          'Authorization': `Bearer ${linkedInAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data.id) {
        setLinkedInValidationStatus('valid');
        setLinkedInValidationMessage(`✅ Valid LinkedIn credentials! User: ${data.firstName?.localized?.en_US || 'Unknown'} ${data.lastName?.localized?.en_US || ''}`);
      } else {
        setLinkedInValidationStatus('invalid');
        setLinkedInValidationMessage(`❌ ${data.message || data.error_description || 'Invalid LinkedIn credentials'}`);
      }
    } catch (error) {
      setLinkedInValidationStatus('invalid');
      setLinkedInValidationMessage(`❌ Error validating LinkedIn credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidatingLinkedIn(false);
    }
  };

  const saveLinkedInCredentials = async () => {
    if (!currentUser) return;
    
    if (!linkedInAccessToken.trim() || !linkedInUserId.trim()) {
      setLinkedInValidationMessage('❌ Please enter both LinkedIn Access Token and User ID');
      return;
    }

    setIsSavingLinkedIn(true);

    try {
      const credentialData = {
        type: 'linkedin',
        accessToken: linkedInAccessToken.trim(),
        linkedInUserId: linkedInUserId.trim(),
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      };

      await saveCredential(currentUser.uid, credentialData);
      setLinkedInValidationMessage('✅ LinkedIn credentials saved successfully!');
      await loadSavedCredentials();
    } catch (error) {
      setLinkedInValidationMessage(`❌ Error saving LinkedIn credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingLinkedIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <div className="flex items-center mb-8">
            <Key className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Credential Vault</h1>
          </div>

          {/* All Credentials in Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Facebook Credentials */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="w-6 h-6 bg-blue-600 rounded mr-3"></div>
                Facebook Page
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Enter Facebook Access Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page ID *
                  </label>
                  {availablePages.length > 0 ? (
                    <select
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {availablePages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.name} ({page.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      placeholder="Enter Facebook Page ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  )}
                </div>

                {/* Validation Status */}
                {validationMessage && (
                  <div className={`p-3 rounded-lg flex items-center text-sm ${
                    validationStatus === 'valid' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {validationStatus === 'valid' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    <span>{validationMessage}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={validateCredentials}
                    disabled={isValidating || !accessToken.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isValidating ? 'Validating...' : 'Validate'}
                  </button>
                  
                  <button
                    onClick={saveCredentials}
                    disabled={isSaving || !accessToken.trim() || !pageId.trim()}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* Instagram Credentials */}
            <div className="bg-purple-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded mr-3"></div>
                Instagram Business
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={instagramAccessToken}
                      onChange={(e) => setInstagramAccessToken(e.target.value)}
                      placeholder="Enter Instagram Access Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Account ID *
                  </label>
                  <input
                    type="text"
                    value={instagramUserId}
                    onChange={(e) => setInstagramUserId(e.target.value)}
                    placeholder="Enter Instagram Business Account ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Instagram Validation Status */}
                {instagramValidationMessage && (
                  <div className={`p-3 rounded-lg flex items-center text-sm ${
                    instagramValidationStatus === 'valid' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {instagramValidationStatus === 'valid' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    <span>{instagramValidationMessage}</span>
                  </div>
                )}

                {/* Instagram Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={validateInstagramCredentials}
                    disabled={isValidatingInstagram || !instagramAccessToken.trim()}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isValidatingInstagram ? 'Validating...' : 'Validate'}
                  </button>
                  
                  <button
                    onClick={saveInstagramCredentials}
                    disabled={isSavingInstagram || !instagramAccessToken.trim() || !instagramUserId.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isSavingInstagram ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn Credentials */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded mr-3"></div>
              LinkedIn Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={linkedInAccessToken}
                      onChange={(e) => setLinkedInAccessToken(e.target.value)}
                      placeholder="Enter LinkedIn Access Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID *
                  </label>
                  <input
                    type="text"
                    value={linkedInUserId}
                    onChange={(e) => setLinkedInUserId(e.target.value)}
                    placeholder="Enter LinkedIn User ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* LinkedIn Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={validateLinkedInCredentials}
                    disabled={isValidatingLinkedIn || !linkedInAccessToken.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isValidatingLinkedIn ? 'Validating...' : 'Validate'}
                  </button>
                  
                  <button
                    onClick={saveLinkedInCredentials}
                    disabled={isSavingLinkedIn || !linkedInAccessToken.trim() || !linkedInUserId.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isSavingLinkedIn ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* LinkedIn Validation Status */}
                {linkedInValidationMessage && (
                  <div className={`p-3 rounded-lg flex items-center text-sm ${
                    linkedInValidationStatus === 'valid' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {linkedInValidationStatus === 'valid' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    <span>{linkedInValidationMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Required Permissions - Organized by Platform */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Facebook Permissions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Facebook Permissions</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">pages_manage_posts</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">pages_read_engagement</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">pages_show_list</code>
                </li>
              </ul>
              <p className="text-xs text-blue-600 mt-3">
                💡 <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">Graph API Explorer</a>
              </p>
            </div>

            {/* Instagram Permissions */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Instagram Permissions</h3>
              <ul className="space-y-2 text-sm text-purple-700">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <code className="bg-purple-100 px-2 py-1 rounded text-xs">instagram_basic</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <code className="bg-purple-100 px-2 py-1 rounded text-xs">instagram_content_publish</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <code className="bg-purple-100 px-2 py-1 rounded text-xs">pages_show_list</code>
                </li>
              </ul>
              <p className="text-xs text-purple-600 mt-3">
                💡 <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-800">Graph API Explorer</a>
              </p>
            </div>

            {/* LinkedIn Permissions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">LinkedIn Permissions</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">r_liteprofile</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">w_member_social</code>
                </li>
              </ul>
              <p className="text-xs text-blue-600 mt-3">
                💡 <a href="https://www.linkedin.com/developers/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">LinkedIn Developer Portal</a>
              </p>
            </div>
          </div>

          {/* Facebook Ads Permissions */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Facebook Ads Permissions</h3>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <code className="bg-red-100 px-2 py-1 rounded">ads_management</code> - To create and manage ads
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <code className="bg-red-100 px-2 py-1 rounded">ads_read</code> - To read ad performance data
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <code className="bg-red-100 px-2 py-1 rounded">pages_show_list</code> - To access connected pages
              </li>
            </ul>
            <p className="text-sm text-red-600 mt-4">
              💡 Get your Ad Account ID from <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-800">Facebook Business Manager</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialVault;