"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  type User,
} from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function firebaseApp() {
  return getApps().length ? getApp() : initializeApp(config);
}

export function getFirebaseAuth() {
  return getAuth(firebaseApp());
}

let initialized = false;
export async function initializeFirebaseClient() {
  if (initialized) return;
  initialized = true;
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (siteKey) {
    initializeAppCheck(firebaseApp(), {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

export async function waitForFirebaseAuth() {
  await initializeFirebaseClient();
  const auth = getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser;
  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function firebaseRequestHeaders(json = false) {
  const user = await waitForFirebaseAuth();
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return headers;
}
