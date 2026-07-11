import { app } from "./firebase.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth(app);

const PERFIS = {
  "gestor@faceeonline.ac.mz": ["ALL"],
  "administrativo@faceeonline.ac.mz": [
    "DOCUMENTOS_EMITIDOS",
    "EMITIR_DOCUMENTOS",
    "ESTATISTICAS",
  ],
  "administrativo@faceeunirovuma.ac.mz": ["CREDENCIAL", "ESTATISTICAS"],
  "parecertecnico@faceeonline.ac.mz": ["PARECER", "ESTATISTICAS"],
  "supervisor@faceeonline.ac.mz": [
    "ATRIBUIR_SUPERVISOR",
    "ESTATISTICAS",
    "DEFESAS",
    "PLANOS_ANALITICOS",
  ],
  "vcumpe@unirovuma.ac.mz": ["DEFESAS", "ESTATISTICAS", "PLANOS_ANALITICOS"],
  "lpulveira@unirovuma.ac.mz": ["DEFESAS", "ESTATISTICAS", "PLANOS_ANALITICOS"],
  "ajanuario@unirovuma.ac.mz": ["DEFESAS", "ESTATISTICAS", "PLANOS_ANALITICOS"],
  "asadate@unirovuma.ac.mz": [
    "DEFESAS",
    "ATRIBUIR_SUPERVISOR",
    "ESTATISTICAS",
    "PLANOS_ANALITICOS",
  ],
  "ineuana@unirovuma.ac.mz": [
    "DEFESAS",
    "ATRIBUIR_SUPERVISOR",
    "ESTATISTICAS",
    "PLANOS_ANALITICOS",
  ],
  "atomas@unirovuma.ac.mz": [
    "DEFESAS",
    "ATRIBUIR_SUPERVISOR",
    "ESTATISTICAS",
    "PLANOS_ANALITICOS",
  ],
};

const CURSOS_POR_PERFIL = {
  "vcumpe@unirovuma.ac.mz": {
    DEFESAS: ["Gestão de Recursos Humanos"],
  },
  "lpulveira@unirovuma.ac.mz": {
    DEFESAS: ["Contabilidade e Fiscalidade"],
  },
  "ajanuario@unirovuma.ac.mz": {
    DEFESAS: ["Economia"],
  },
  "asadate@unirovuma.ac.mz": {
    DEFESAS: ["Contabilidade e Fiscalidade"],
    ATRIBUIR_SUPERVISOR: ["Contabilidade e Fiscalidade"],
  },
  "ineuana@unirovuma.ac.mz": {
    DEFESAS: [
      "Gestão de Recursos Humanos",
      "Economia",
      "Gestão de Empresas",
    ],
    ATRIBUIR_SUPERVISOR: [
      "Gestão de Recursos Humanos",
      "Economia",
      "Gestão de Empresas",
    ],
  },
  "atomas@unirovuma.ac.mz": {
    DEFESAS: ["*"],
    ATRIBUIR_SUPERVISOR: ["*"],
  },
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

const PERMISSOES_HERDADAS = {
  DOCUMENTOS_EMITIDOS: ["CREDENCIAL"],
  EMITIR_DOCUMENTOS: ["CREDENCIAL"],
};

function obterPermissoes(email) {
  if (!email) return null;
  return PERFIS[email.toLowerCase()] || null;
}

function normalizarEmailPerfil(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizarNomeCurso(curso) {
  return String(curso || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, " ")
    .replace(/\u00A0/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function obterCursosAutorizadosPorPerfil(email, modulo) {
  const emailNormalizado = normalizarEmailPerfil(email);
  const permissoes = obterPermissoes(emailNormalizado) || [];

  if (permissoes.includes("ALL")) return ["*"];

  const restricoesPerfil = CURSOS_POR_PERFIL[emailNormalizado];
  const cursosModulo = restricoesPerfil?.[modulo];

  if (!Array.isArray(cursosModulo) || cursosModulo.length === 0) {
    return ["*"];
  }

  return cursosModulo;
}

function cursoAutorizadoParaPerfil(email, modulo, curso) {
  const cursosAutorizados = obterCursosAutorizadosPorPerfil(email, modulo);

  if (cursosAutorizados.includes("*")) return true;

  const cursoNormalizado = normalizarNomeCurso(curso);
  if (!cursoNormalizado) return false;

  return cursosAutorizados.some(
    (cursoAutorizado) => normalizarNomeCurso(cursoAutorizado) === cursoNormalizado
  );
}

function filtrarListaPorCursoPerfil(lista, email, modulo, campoCurso = "curso") {
  if (!Array.isArray(lista)) return [];

  const cursosAutorizados = obterCursosAutorizadosPorPerfil(email, modulo);
  if (cursosAutorizados.includes("*")) return lista;

  return lista.filter((item) =>
    cursoAutorizadoParaPerfil(email, modulo, item?.[campoCurso])
  );
}

window.CURSOS_POR_PERFIL = CURSOS_POR_PERFIL;
window.normalizarNomeCursoPerfil = normalizarNomeCurso;
window.obterCursosAutorizadosPorPerfil = obterCursosAutorizadosPorPerfil;
window.cursoAutorizadoParaPerfil = cursoAutorizadoParaPerfil;
window.filtrarListaPorCursoPerfil = filtrarListaPorCursoPerfil;

function temPermissao(email, permissao) {
  const permissoes = obterPermissoes(email) || [];

  if (!permissao) return true;
  if (permissoes.includes("ALL")) return true;
  if (permissoes.includes(permissao)) return true;

  const permissoesMae = PERMISSOES_HERDADAS[permissao] || [];
  return permissoesMae.some((permissaoMae) => permissoes.includes(permissaoMae));
}

window.temPermissaoGestor = function (permissao) {
  return temPermissao(window.userEmail, permissao);
};

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
      btn.disabled = false;
      btn.removeAttribute("aria-disabled");
      return;
    }

    // Não-gestor: só vê se a permissão estiver explicitamente no perfil
    // ou herdada por uma permissão-mãe (ex.: CREDENCIAL).
    if (temPermissao(email, permissao)) {
      btn.style.display = "";
      btn.disabled = false;
      btn.removeAttribute("aria-disabled");
    } else {
      btn.style.display = "none";
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
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

    window.dispatchEvent(new CustomEvent("gestor:perfil-permissoes-carregados", {
      detail: { email: user.email, permissoes }
    }));
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
