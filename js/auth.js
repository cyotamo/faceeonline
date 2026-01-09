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

const MAPA_BOTOES = {
  btnGestaoGeral: "ALL",
  btnMonografiaFinal: "ALL",
  btnCredencialPesquisa: "CREDENCIAL",
  btnEstatisticas: "ESTATISTICAS",
  btnParecerTec: "PARECER",
  btnAtribuirSuperv: "ATRIBUIR_SUPERVISOR",
  btnHomologarSuperv: "ALL",
};

function obterPermissoes(email) {
  if (!email) return null;
  return PERFIS[email.toLowerCase()] || null;
}

function aplicarRestricoesUI(email) {
  const permissoes = obterPermissoes(email);

  if (!permissoes) {
    return;
  }

  Object.entries(MAPA_BOTOES).forEach(([btnId, permissao]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    if (permissoes.includes("ALL") || permissoes.includes(permissao)) {
      btn.style.display = "";
    } else {
      btn.style.display = "none";
    }
  });
}

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
    if (!user || !obterPermissoes(user.email)) {
      window.location.href = "index.html";
      return;
    }
    aplicarRestricoesUI(user.email);
  });
};
