import {
  initializeApp,
  getApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAnalytics,
  isSupported,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVvzO7pmEpwY6GPUuWchXVTPl5WReAjgY",
  authDomain: "seconlinefacee.firebaseapp.com",
  projectId: "seconlinefacee",
  storageBucket: "seconlinefacee.firebasestorage.app",
  messagingSenderId: "1034408809833",
  appId: "1:1034408809833:web:b8f0fa590a18f27c7859f8",
  measurementId: "G-H5VB7HD3WK",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let analytics = null;

try {
  if (await isSupported()) {
    analytics = getAnalytics(app);
  }
} catch (erro) {
  console.warn("Firebase Analytics indisponível:", erro);
}

export { app, analytics, firebaseConfig };
