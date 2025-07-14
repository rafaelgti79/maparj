// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCPtajFtAdIfq89SAPS4YSd8TAMIvFk6CI",
  authDomain: "mapa-rj-33c27.firebaseapp.com",
  projectId: "mapa-rj-33c27",
  storageBucket: "mapa-rj-33c27.firebasestorage.app",
  messagingSenderId: "1028890927219",
  appId: "1:1028890927219:web:35c9ac6c26cd4119724a06",
  measurementId: "G-FEY2XEFS9W"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore e Analytics
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Exporte o Firestore para uso em outros arquivos
export { db };
