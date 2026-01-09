import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVvzO7pmEpwY6GPUuWchXVTPl5WReAjgY",
  authDomain: "seconlinefacee.firebaseapp.com",
  projectId: "seconlinefacee",
  storageBucket: "seconlinefacee.firebasestorage.app",
  messagingSenderId: "1034408809833",
  appId: "1:1034408809833:web:a5a76c08807925fa7859f8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.loginGestor = function (email, senha) {
  signInWithEmailAndPassword(auth, email, senha)
    .then((cred) => {
      if (cred.user.email !== "gestor@faceeonline.ac.mz") {
        signOut(auth);
        alert("Acesso não autorizado");
        return;
      }
      window.location.href = "gestor.html";
    })
    .catch(() => {
      alert("Email ou senha inválidos");
    });
};

window.protegerGestor = function () {
  onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== "gestor@faceeonline.ac.mz") {
      window.location.href = "index.html";
    }
  });
};
