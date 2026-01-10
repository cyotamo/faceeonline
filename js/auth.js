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

const PERFIS = {
  "gestor@faceeonline.ac.mz": ["ALL"],
  "administrativo@faceeonline.ac.mz": ["CREDENCIAL", "ESTATISTICAS"],
  "parecertecnico@faceeonline.ac.mz": ["PARECER", "ESTATISTICAS"],
  "supervisor@faceeonline.ac.mz": ["ATRIBUIR_SUPERVISOR", "ESTATISTICAS"],
};

function obterPermissoes(email) {
  if (!email) return null;
  return PERFIS[email.toLowerCase()] || null;
}

window.aplicarRestricoesUI = function (email) {
  const permissoes = obterPermissoes(email) || [];
  const isGestor = permissoes.includes("ALL");
  const container = document.querySelector(".actions");

  if (!container) return;

  const botoes = container.querySelectorAll("[data-permissao]");

  botoes.forEach((btn) => {
    const permissao = btn.dataset.permissao;

    // Gestor vê tudo
    if (isGestor) {
      btn.style.display = "";
      return;
    }

    // Não-gestor: só vê se a permissão estiver explicitamente no perfil
    if (permissoes.includes(permissao)) {
      btn.style.display = "";
    } else {
      btn.style.display = "none";
    }
  });
};

window.iniciarObservadorPermissoes = function (email) {
  const container = document.querySelector(".actions");
  if (!container) return;

  const observer = new MutationObserver(() => {
    aplicarRestricoesUI(email);
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
  });

  aplicarRestricoesUI(email);
};

window.loginGestor = function (email, senha) {
  signInWithEmailAndPassword(auth, email, senha)
    .then((cred) => {
      if (!obterPermissoes(cred.user.email)) {
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
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    window.userEmail = user.email;

    if (window.iniciarObservadorPermissoes) {
      iniciarObservadorPermissoes(user.email);
    }
  });
};
