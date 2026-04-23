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
  "administrativo@faceeunirovuma.ac.mz": ["CREDENCIAL", "ESTATISTICAS"],
  "parecertecnico@faceeonline.ac.mz": ["PARECER", "ESTATISTICAS"],
  "supervisor@faceeonline.ac.mz": [
    "ATRIBUIR_SUPERVISOR",
    "ESTATISTICAS",
    "DEFESAS",
    "PLANOS_ANALITICOS",
  ],
};

function obterElementoErroLogin() {
  return document.getElementById("loginErro");
}

window.mostrarErroLogin = function () {
  const erro = obterElementoErroLogin();
  if (erro) {
    erro.style.display = "block";
  }
};

window.esconderErroLogin = function () {
  const erro = obterElementoErroLogin();
  if (erro) {
    erro.style.display = "none";
  }
};

function obterPermissoes(email) {
  if (!email) return null;
  return PERFIS[email.toLowerCase()] || null;
}

window.aplicarRestricoesUI = function (email) {
  const permissoes = obterPermissoes(email) || [];
  const isGestor = permissoes.includes("ALL");
  const botoes = document.querySelectorAll("[data-permissao]");

  if (!botoes.length) return;

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
  const container =
    document.querySelector(".actions, .actions-gestor") || document.body;
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
      window.esconderErroLogin?.();
      window.location.href = "gestor.html";
    })
    .catch(() => {
      window.mostrarErroLogin?.();
    });
};

// Verifica se o usuário está logado e tem permissões válidas
window.verificarAutenticacaoGestor = function () {
  return new Promise((resolve) => {
    // Verifica o usuário atual imediatamente (síncrono)
    const user = auth.currentUser;
    
    if (user) {
      // Verifica se tem permissões válidas
      const permissoes = obterPermissoes(user.email);
      if (permissoes && permissoes.length > 0) {
        resolve(true);
        return;
      }
    }
    
    // Se currentUser for null, pode ser que ainda não tenha carregado
    // Espera um pouco e verifica novamente, ou usa onAuthStateChanged
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Remove o listener após a primeira verificação
      if (user) {
        const permissoes = obterPermissoes(user.email);
        resolve(permissoes && permissoes.length > 0);
      } else {
        resolve(false);
      }
    });
  });
};

window.protegerGestor = function () {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    
    // Verifica se o usuário tem permissões válidas
    const permissoes = obterPermissoes(user.email);
    if (!permissoes || permissoes.length === 0) {
      signOut(auth).then(() => {
        alert("Acesso não autorizado");
        window.location.href = "index.html";
      });
      return;
    }
    
    window.userEmail = user.email;

    if (window.iniciarObservadorPermissoes) {
      iniciarObservadorPermissoes(user.email);
    }
  });
};

// Função para fazer logout
window.logoutGestor = function () {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, redireciona para a página inicial
      window.location.href = "index.html";
    });
};
