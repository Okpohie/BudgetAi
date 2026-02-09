import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Use environment variables if available, otherwise fallback to demo config
// Note: In local development, create a .env file with your credentials
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { 
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-key", 
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com", 
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo" 
    };

// Singleton pattern: Check if app exists before initializing
// This prevents the "Firebase App named '[DEFAULT]' already exists" error during hot reloads
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'pro-budgeter-pro';