# MarketMate - Facebook Ad Automation

MarketMate is an AI-powered social media automation platform that generates content and automatically creates Facebook ads.

## 🚀 Features

- **AI Content Generation**: Uses Google Gemini AI to create engaging Facebook posts
- **Automatic Image Generation**: Creates contextually relevant images for posts
- **Facebook Publishing**: Directly publishes content to Facebook Pages
- **Automatic Ad Creation**: Automatically creates Facebook ads from published posts
- **Secure Credential Management**: Encrypted storage of social media credentials

## 🔧 Setup Instructions

### 1. Firebase Configuration

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase: `firebase init`
4. Deploy functions: `firebase deploy --only functions`

### 2. Facebook Marketing API Setup

Set up Facebook configuration using Firebase Functions config:

```bash
firebase functions:config:set facebook.access_token="YOUR_FACEBOOK_ACCESS_TOKEN"
firebase functions:config:set facebook.ad_account_id="YOUR_AD_ACCOUNT_ID"
firebase functions:config:set facebook.page_id="YOUR_PAGE_ID"
```

### 3. Required Facebook Permissions

Your Facebook App needs these permissions:
- `pages_manage_posts` - To publish posts
- `pages_read_engagement` - To read engagement metrics
- `pages_show_list` - To access page list
- `ads_management` - To create and manage ads
- `ads_read` - To read ad performance data

### 4. Facebook Ad Account Setup

1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Create or select an Ad Account
3. Note your Ad Account ID (format: `act_XXXXXXXXXX`)
4. Ensure your Facebook App has access to the Ad Account

## 🎯 How It Works

1. **Content Creation**: User enters a prompt and selects a category
2. **AI Generation**: Gemini AI generates engaging post content and image descriptions
3. **Image Selection**: System selects appropriate high-quality images from Pexels
4. **Facebook Publishing**: Content is published to the connected Facebook Page
5. **Automatic Ad Creation**: Firebase Function automatically creates a Facebook ad using the published post
6. **Ad Configuration**: 
   - Budget: ₹200/day
   - Target: India, Age 18-35
   - Duration: 2 days
   - Starts: 1 minute after creation

## 📁 Project Structure

```
src/
├── api/
│   ├── gemini.ts          # AI content generation
│   ├── facebook.ts        # Facebook Graph API
│   └── facebookAds.ts     # Firebase Functions client
├── components/
│   ├── FacebookContent.tsx # Main content creation interface
│   └── CredentialVault.tsx # Credential management
└── firebase/
    └── auth.ts            # Firebase authentication

functions/
└── src/
    ├── index.ts           # Firebase Functions entry point
    └── facebookAds.ts     # Facebook Marketing API integration
```

## 🔒 Security Features

- All Facebook API calls are made from secure Firebase Cloud Functions
- Access tokens and sensitive data are never exposed to the frontend
- User authentication required for all operations
- Encrypted credential storage in Firebase

## 🚀 Deployment

1. **Frontend**: Deployed to Netlify
2. **Backend**: Firebase Cloud Functions
3. **Database**: Firebase Firestore
4. **Authentication**: Firebase Auth

## 📊 Default Ad Settings

- **Campaign Objective**: Engagement
- **Daily Budget**: ₹200 (20,000 paise)
- **Target Country**: India
- **Age Range**: 18-35 years
- **Platforms**: Facebook (Feed & Stories)
- **Duration**: 2 days
- **Start Time**: 1 minute after creation

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy Firebase Functions
cd functions && npm run deploy
```

## 📝 Environment Variables

Create a `.env` file with:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.