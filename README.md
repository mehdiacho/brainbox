
# BrainBox

BrainBox is a comprehensive idea management application designed to capture and organize your thoughts in multiple formats - text, voice notes, images, and videos.

## 🧠 Overview

BrainBox serves as your digital second brain, allowing you to:
- Capture ideas in multiple formats (text, voice, images, videos)
- Organize and categorize your thoughts
- Search through your collection of ideas
- Generate content summaries and insights using AI

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript, built using Vite
- **Styling**: React Bootstrap for responsive UI components
- **Backend**: Firebase services
  - Firestore for database
  - Firebase Authentication for user management
  - Firebase Storage for media files
  - Firebase Cloud Functions for serverless operations
- **AI Features**: Firebase GenKit for content generation and analysis

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Firebase CLI

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd brainbox
 ```
```

2. Install dependencies
```bash
npm install
 ```

3. Set up Firebase
```bash
npm install -g firebase-tools
firebase login
 ```

4. Start the development server
```bash
npm run dev
 ```

5. For Firebase emulators (local development)
```bash
firebase emulators:start
 ```

## 📋 Features
- Multi-format Notes : Create and store notes in text, voice, image, and video formats
- Organization : Tag, categorize, and organize your ideas
- Search : Quickly find ideas using powerful search capabilities
- AI-powered : Generate summaries, extract key points, and get content suggestions
- Cross-device Sync : Access your ideas from any device
- Offline Support : Work without an internet connection
## 🧩 Project Structure
- `/src` - React application source code
- `/functions` - Firebase Cloud Functions
- `/public` - Static assets
## 🔧 Development
### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
### Firebase Functions
Navigate to the functions directory to work with Firebase Cloud Functions:

```bash
cd functions
npm run build:watch  # Compile TypeScript in watch mode
npm run serve        # Start emulators for local testing
 ```


## 🤖 AI Features
BrainBox leverages Firebase GenKit to provide AI-powered features:

- **Content Generation** : Create summaries or expand on your ideas
- **Smart Tagging** : Automatically suggest tags for your content
- **Insight Extraction** : Identify key points from your notes
- **Content Organization** : Get suggestions for organizing related ideas
## 📱 Deployment
Deploy to Firebase hosting:

```bash
npm run build
firebase deploy
 ```

## 📄 License
[Your chosen license]

## 🙏 Acknowledgements
- React team for the amazing framework
- Firebase for the powerful backend services
- All contributors to this project