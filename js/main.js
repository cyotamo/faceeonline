const WEB_URL = "https://script.google.com/macros/s/AKfycbylE3js2BLKlqIbTQE_VekBfZhAedYRiJcIdHv2uZQ5g_k6X4vw9A0O18GD85nosccg/exec";

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
  const camposNumero = document.querySelectorAll("#numero, #numeroEstudante, #numeroEstudanteConsulta");
  camposNumero.forEach(campo => aplicarMascaraNumeroEstudante(campo));

  // Máscaras para contactos
  const camposContacto = document.querySelectorAll("#contacto1, #contacto2");
  camposContacto.forEach(campo => aplicarMascaraContacto(campo));
}





// Observa DOM dinâmico (formulários adicionados via JS)
const observer = new MutationObserver(() => iniciarMascaras());
observer.observe(document.body, { childList: true, subtree: true });


// Ativa máscaras ao carregar página
document.addEventListener("DOMContentLoaded", iniciarMascaras);

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

