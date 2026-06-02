let deferredPrompt;
let botaoInstalacao = null;
let aplicacaoInstalada = false;

const ID_BOTAO_INSTALACAO = "btnInstalarAplicacao";
const TEXTO_BOTAO_INSTALACAO = "Instalar aplicação";

function esconderBotaoInstalacao() {
  if (botaoInstalacao) {
    botaoInstalacao.style.display = "none";
  }
}

function mostrarBotaoInstalacao() {
  if (!botaoInstalacao || aplicacaoInstalada || !deferredPrompt) return;
  botaoInstalacao.style.display = "";
}

function criarBotaoInstalacao() {
  if (botaoInstalacao) return botaoInstalacao;

  const containerAcoes = document.querySelector(".actions");
  if (!containerAcoes) return null;

  botaoInstalacao = document.getElementById(ID_BOTAO_INSTALACAO);
  if (botaoInstalacao) return botaoInstalacao;

  const botaoModelo = containerAcoes.querySelector("button, a");
  botaoInstalacao = document.createElement("button");
  botaoInstalacao.id = ID_BOTAO_INSTALACAO;
  botaoInstalacao.type = "button";
  botaoInstalacao.textContent = TEXTO_BOTAO_INSTALACAO;

  if (botaoModelo) {
    botaoInstalacao.className = botaoModelo.className;
  } else {
    botaoInstalacao.className = "button";
  }

  botaoInstalacao.style.display = "none";

  botaoInstalacao.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    esconderBotaoInstalacao();
  });

  containerAcoes.appendChild(botaoInstalacao);
  return botaoInstalacao;
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  mostrarBotaoInstalacao();
  console.log("App pode ser instalada");
});

window.addEventListener("appinstalled", () => {
  aplicacaoInstalada = true;
  deferredPrompt = null;

  if (botaoInstalacao) {
    botaoInstalacao.remove();
    botaoInstalacao = null;
  }
});

const WEB_URL = "https://script.google.com/macros/s/AKfycbx8QeIvxVQpB6XKg5WLd_eZb-RnLk7uUF0D4yG55EJA8mzuuCLRDCd1uaRHyQ0ItJENZw/exec";

// Funções gerais e utilitárias usadas em várias páginas
// Ainda sem lógica funcional completa; serve apenas como base e placeholders.

const FaceEOnline = (() => {
  const prefix = '[FaceEOnline]';

  const formatMessage = (label, message) => `${prefix} ${label}: ${message}`;

  const logInfo = (message) => console.log(formatMessage('INFO', message));
  const logWarn = (message) => console.warn(formatMessage('WARN', message));
  const logError = (message) => console.error(formatMessage('ERRO', message));

  /**
   * Placeholder para futura inicialização global.
   */
  const initializeApp = () => {
    logInfo('Inicialização padrão concluída (placeholder).');
  };

  /**
   * Placeholder para futuros hooks ou extensões.
   */
  const registerPlaceholder = (name) => {
    logWarn(`Placeholder registrado para "${name}".`);
  };

  return {
    logInfo,
    logWarn,
    logError,
    initializeApp,
    registerPlaceholder,
  };
})();

// Registra a carga do script base
FaceEOnline.logInfo('Script principal carregado (base).');



/* ================================================================
      MÁSCARA GLOBAL PARA NÚMERO DE ESTUDANTE
   ================================================================ */

function aplicarMascaraNumeroEstudante(input) {
  const mascaraPlaceholder = "XX.XXXX.XXXX";
  input.placeholder = mascaraPlaceholder;

  input.addEventListener("input", function () {
    // 1. Mantém só os dígitos e limita a 10 números
    let valor = input.value.replace(/\D/g, "").slice(0, 10);

    // 2. Formata: XX.XXXX.XXXX
    let formatado = "";

    if (valor.length <= 2) {
      formatado = valor;
    } else if (valor.length <= 6) {
      formatado = valor.slice(0, 2) + "." + valor.slice(2);
    } else {
      formatado =
        valor.slice(0, 2) +
        "." +
        valor.slice(2, 6) +
        "." +
        valor.slice(6);
    }

    input.value = formatado;
  });
}

function aplicarMascaraContacto(input) {
  const mascaraPlaceholder = "(XX) XX XX XXX";
  input.placeholder = mascaraPlaceholder;

  input.addEventListener("input", function () {
    // 1. Permite apenas dígitos e limita a 9 números
    let valor = input.value.replace(/\D/g, "").slice(0, 9);

    // 2. Formatação progressiva
    let formatado = "";

    if (valor.length <= 2) {
      // (XX
      formatado = "(" + valor;
    } 
    else if (valor.length <= 4) {
      // (XX) XX
      formatado = "(" + valor.slice(0, 2) + ") " + valor.slice(2);
    } 
    else if (valor.length <= 6) {
      // (XX) XX XX
      formatado = "(" + valor.slice(0, 2) + ") " + valor.slice(2, 4) + " " + valor.slice(4);
    } 
    else {
      // (XX) XX XX XXX
      formatado =
        "(" + valor.slice(0, 2) + ") " +
        valor.slice(2, 4) + " " +
        valor.slice(4, 6) + " " +
        valor.slice(6);
    }

    input.value = formatado;
  });
}


// Função que aplica a máscara em elementos com id numero e numeroEstudante
function iniciarMascaras() {
  // Máscaras para números de estudante
  const camposNumero = document.querySelectorAll(
    "#numero, #numeroEstudante, #numeroEstudanteConsulta, #numeroDefesa, #documentoEmitidoNumero"
  );
  camposNumero.forEach(campo => aplicarMascaraNumeroEstudante(campo));

  // Máscaras para contactos
  const camposContacto = document.querySelectorAll(
    "#contacto, #contacto1, #contacto2, #contacto1Defesa, #contacto2Defesa"
  );
  camposContacto.forEach(campo => aplicarMascaraContacto(campo));
}

function obterCamposNavegaveis(form) {
  if (!form) return [];

  return Array.from(
    form.querySelectorAll("input, select, textarea, button")
  ).filter((campo) => {
    const tag = campo.tagName;
    const tipo = campo.type;

    if (campo.disabled) return false;
    if (campo.hidden) return false;
    if (tipo === "hidden") return false;
    if (tag === "BUTTON") return false;

    return true;
  });
}

function iniciarNavegacaoFormulariosAluno() {
  document.addEventListener("keydown", (event) => {
    const teclaPressionada = event.key === "Enter" || event.key === "ArrowRight";
    if (!teclaPressionada) return;

    const campoAtual = event.target;
    if (!(campoAtual instanceof HTMLElement)) return;

    const formulario = campoAtual.closest("form");
    if (!formulario) return;

    const formulariosAluno = [
      "formTema",
      "formDefesaMonografia",
      "formMonografiaFinal",
      "formPedidoCredencial",
    ];

    if (!formulariosAluno.includes(formulario.id)) return;

    const campos = obterCamposNavegaveis(formulario);
    const indiceAtual = campos.indexOf(campoAtual);
    if (indiceAtual === -1) return;

    const proximoCampo = campos[indiceAtual + 1];
    if (!proximoCampo) return;

    event.preventDefault();
    proximoCampo.focus();
  });
}





// Observa DOM dinâmico (formulários adicionados via JS)
const observer = new MutationObserver(() => iniciarMascaras());
observer.observe(document.body, { childList: true, subtree: true });


// Ativa máscaras ao carregar página
document.addEventListener("DOMContentLoaded", iniciarMascaras);
document.addEventListener("DOMContentLoaded", iniciarNavegacaoFormulariosAluno);
document.addEventListener("DOMContentLoaded", () => {
  const emModoStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  aplicacaoInstalada = emModoStandalone;

  criarBotaoInstalacao();
  if (aplicacaoInstalada) {
    esconderBotaoInstalacao();
    return;
  }

  mostrarBotaoInstalacao();
});

// Modal de sucesso reutilizável
function mostrarModal(mensagem) {
  const modal = document.getElementById("modalSucesso");
  const texto = document.getElementById("modalMensagem");
  const okBtn = document.getElementById("modalOk");

  if (!modal || !texto || !okBtn) return;

  texto.innerText = mensagem;
  modal.style.display = "flex";

  okBtn.onclick = () => {
    modal.style.display = "none";
  };

  // Clicar fora fecha o modal
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
}



