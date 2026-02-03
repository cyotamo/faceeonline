let loadingInterval = null;
let dadosLinhas = []; // onde vamos guardar a tabela Linhas vinda do Apps Script

function mostrarLoadingDocumentos() {
  const loading = document.getElementById("loadingDocumentos");
  const dots = document.getElementById("dots");

  loading.style.display = "block";
  dots.textContent = "";

  let count = 0;

  loadingInterval = setInterval(() => {
    count = (count + 1) % 4;
    dots.textContent = ".".repeat(count);
  }, 500);
}

function esconderLoadingDocumentos() {
  const loading = document.getElementById("loadingDocumentos");

  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }

  loading.style.display = "none";
}

function validarNumeroEstudante(valor) {
  if (typeof valor !== 'string') return false;
  const digitos = valor.replace(/\D/g, '');
  return digitos.length === 10;
}

function validarContacto(valor) {
  if (typeof valor !== 'string') return false;
  const digitos = valor.replace(/\D/g, '');
  return digitos.length === 9;
}

function normalizarAtribuicaoSupervisor(valor) {
  return String(valor || "").trim().toLowerCase();
}

function supervisorEstaAtribuido(valor) {
  const atrib = normalizarAtribuicaoSupervisor(valor);
  if (!atrib) return false;

  const pendentes = [
    "pendente",
    "-",
    "—",
    "n/a",
    "na",
    "por atribuir",
    "não atribuído",
    "nao atribuido",
  ];

  return !pendentes.includes(atrib);
}

function opcaoSelecionadaValida(valor) {
  if (!valor) return false;
  const normalizado = valor.trim().toLowerCase();
  return normalizado !== 'seleccione...' && normalizado !== 'selecione...';
}

function validarFormulario(form) {
  const camposObrigatorios = form.querySelectorAll('[required]');
  for (const campo of camposObrigatorios) {
    if (!campo.value || campo.value.trim() === '') {
      return false; // campo vazio
    }

    if (campo.tagName === 'SELECT' && !opcaoSelecionadaValida(campo.value)) {
      return false;
    }

    if (campo.id === 'numero' || campo.id === 'numeroEstudante') {
      if (!validarNumeroEstudante(campo.value)) return false;
    }

    if (campo.id === 'contacto1' || campo.id === 'contacto2') {
      if (!validarContacto(campo.value)) return false;
    }
  }

  const ficheiro = form.querySelector('#ficheiro');
  if (ficheiro) {
    const { files } = ficheiro;
    if (!files || files.length === 0) return false;

    const file = files[0];
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return false;
  }

  return true;
}

function actualizarEstadoBotao(form) {
  const botao = form.querySelector('.btn-submeter');
  if (!botao) return;

  if (validarFormulario(form)) {
    botao.disabled = false;
  } else {
    botao.disabled = true;
  }
}

function activarLoading(botao) {
  // só aplica a botões de submissão
  if (!botao.classList.contains('btn-submeter')) return;

  botao.disabled = true;

  let passos = ['A enviar.', 'A enviar..', 'A enviar...'];
  let i = 0;

  botao.dataset.originalText = botao.textContent;
  botao.textContent = passos[i];

  botao._loadingInterval = setInterval(() => {
    i = (i + 1) % passos.length;
    botao.textContent = passos[i];
  }, 400);
}

function desativarLoading(botao) {
  if (!botao.classList.contains('btn-submeter')) return;

  clearInterval(botao._loadingInterval);
  botao.textContent = botao.dataset.originalText;
  botao.disabled = false;
}

async function carregarDadosLinhas() {
  const resposta = await fetch(WEB_URL, {
    method: 'POST',
    body: new URLSearchParams({ action: 'getLinhas' }),
  });

  const dados = await resposta.json();
  dadosLinhas = dados.linhas || [];
}

function preencherDepartamentos() {
  const depSelect = document.getElementById('departamento');
  if (!depSelect) return;

  depSelect.innerHTML = '<option value="">Seleccione...</option>';

  const depsUnicos = [...new Set(dadosLinhas.map((l) => l.departamento))];

  depsUnicos.forEach((dep) => {
    const opt = document.createElement('option');
    opt.value = dep;
    opt.textContent = dep;
    depSelect.appendChild(opt);
  });
}

function preencherCursos(departamento) {
  const cursoSelect = document.getElementById('curso');
  cursoSelect.innerHTML = '<option value="">Seleccione...</option>';

  const cursos = dadosLinhas.filter((l) => l.departamento === departamento).map((l) => l.curso);

  const unicos = [...new Set(cursos)];

  unicos.forEach((curso) => {
    const opt = document.createElement('option');
    opt.value = curso;
    opt.textContent = curso;
    cursoSelect.appendChild(opt);
  });
}

function preencherLinhas(curso) {
  const linhaSelect = document.getElementById('linha');
  linhaSelect.innerHTML = '<option value="">Seleccione...</option>';

  const linhas = dadosLinhas.filter((l) => l.curso === curso).map((l) => l.linha);

  const unicos = [...new Set(linhas)];

  unicos.forEach((l) => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l;
    linhaSelect.appendChild(opt);
  });
}

function preencherSupervisores(linha) {
  const supervisorSelect = document.getElementById('supervisor');
  supervisorSelect.innerHTML = '<option value="">Seleccione...</option>';

  const supervisores = dadosLinhas.filter((l) => l.linha === linha).map((l) => l.docente);

  const unicos = [...new Set(supervisores)];

  unicos.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    supervisorSelect.appendChild(opt);
  });
}

function activarFiltrosFormulario() {
  const dep = document.getElementById('departamento');
  const curso = document.getElementById('curso');
  const linha = document.getElementById('linha');

  if (!dep) return; // formulário ainda não existe

  preencherDepartamentos();

  dep.addEventListener('change', () => {
    preencherCursos(dep.value);
    document.getElementById('linha').innerHTML = '<option value="">Seleccione...</option>';
  });

  curso.addEventListener('change', () => {
    preencherLinhas(curso.value);
  });

  linha.addEventListener('change', () => {
    preencherSupervisores(linha.value);
  });

  actualizarEstadoBotao(document.querySelector('#form-container form'));
}

function enviarTema() {
  const dados = new FormData();
  dados.append('action', 'submeterTema');

  const campos = [
    'nome',
    'numero',
    'contacto1',
    'contacto2',
    'departamento',
    'curso',
    'linha',
    'supervisor',
    'tema',
    'descricao'
  ];

  campos.forEach((campo) => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      dados.append(campo, elemento.value);
    }
  });

  const botao = document.activeElement;
  activarLoading(botao);

  fetch(WEB_URL, {
    method: 'POST',
    body: dados,
  })
  .then((r) => r.json())
  .then((res) => {
    desativarLoading(botao);

    if (res.sucesso === true || res.sucesso === "true") {
      document.getElementById("form-container").innerHTML = "";
      mostrarModal(
        "Os seus dados foram enviados com sucesso. Acompanhe o andamento do processo na aba Consulta."
      );
    } else {
      // Mensagem vinda do back-end (ex.: duplicidade)
      mostrarModal(res.mensagem || "❌ Submissão recusada.");
    }
  })
  .catch((err) => {
    desativarLoading(botao);
    mostrarModal("Ocorreu um erro ao enviar os dados. Por favor, tente novamente.");
  });
} // 👈 FECHO CORRECTO DA FUNÇÃO

// Tornar a função acessível no HTML
window.enviarTema = enviarTema;


async function enviarMonografiaFinal() {
  const dados = new FormData();
  dados.append('action', 'submeterMonografiaFinal');

  const campos = [
    'nome',
    'numero',
    'contacto1',
    'contacto2',
    'departamento',
    'curso',
    'titulo',
    'keywords',
    'supervisor',
    'nota',
    'dataDefesa', // 👈 NOVO
  ];

  campos.forEach((campo) => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      dados.append(campo, elemento.value);
    }
  });

  // Verificação obrigatória do ficheiro
  const ficheiroInput = document.getElementById('ficheiro');
  if (!ficheiroInput || ficheiroInput.files.length === 0) {
    alert('Seleccione um ficheiro PDF antes de enviar.');
    return;
  }

  const ficheiro = ficheiroInput.files[0];
  const botao = document.activeElement;

  try {
    activarLoading(botao);

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const conteudoBase64 = result.split(',')[1] || '';
          resolve(conteudoBase64);
        } else {
          reject(new Error('Falha ao ler o ficheiro.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o ficheiro.'));
      reader.readAsDataURL(ficheiro);
    });

    dados.append('ficheiroBase64', base64);
    dados.append('ficheiroNome', ficheiro.name);
    dados.append('ficheiroTipo', ficheiro.type || 'application/pdf');

    const response = await fetch(
      WEB_URL,
      {
        method: 'POST',
        body: dados,
      },
    );

    const res = await response.json();
    desativarLoading(botao);

    if (!res.sucesso) {
      mostrarModal(res.mensagem || "❌ Submissão recusada.");
      return;
    }
    desativarLoading(botao);
    document.getElementById("form-container").innerHTML = "";
    mostrarModal("Os seus dados foram enviados com sucesso. Acompanhe o andamento do processo na aba Consulta.");
  } catch (err) {
    desativarLoading(botao);
    mostrarModal("Ocorreu um erro ao enviar os dados. Por favor, tente novamente.");
  }
}

window.enviarMonografiaFinal = enviarMonografiaFinal;

function actualizarAnoOrdinal(input) {
  if (!input) return;

  const valor = input.value.trim();

  if (valor === '') {
    return;
  }

  const digitos = valor.replace(/\D/g, '');
  if (!digitos) {
    input.value = '';
    return;
  }

  const numero = digitos[0];
  if (!['1', '2', '3', '4'].includes(numero)) {
    input.value = '';
    return;
  }

  input.value = `${numero}º`;
}

window.actualizarAnoOrdinal = actualizarAnoOrdinal;

function enviarPedidoCredencial() {
  const dados = new FormData();
  dados.append('action', 'submeterCredencial');

  const campos = ['nome', 'numeroEstudante', 'curso', 'titulo', 'ano', 'organizacao', 'supervisor'];

  campos.forEach((campo) => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      dados.append(campo, elemento.value);
    }
  });

  const botao = document.activeElement;
  activarLoading(botao);

  fetch(WEB_URL, {
    method: 'POST',
    body: dados,
  })
    .then((r) => r.json())
    .then((res) => {
      desativarLoading(botao);
      document.getElementById("form-container").innerHTML = "";
      mostrarModal("Os seus dados foram enviados com sucesso. Acompanhe o andamento do processo na aba Consulta.");
      // Qualquer link de PDF retornado pelo servidor é intencionalmente ignorado.
    })
    .catch((err) => {
      desativarLoading(botao);
      mostrarModal("Ocorreu um erro ao enviar os dados. Por favor, tente novamente.");
    });
}

window.enviarPedidoCredencial = enviarPedidoCredencial;

async function enviarPedidoCredencialEstagio() {
  const dados = new FormData();
  dados.append('action', 'credencial_estagio');

  const campos = ['nome', 'numeroEstudante', 'curso', 'titulo', 'ano', 'organizacao', 'supervisor'];

  campos.forEach((campo) => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      dados.append(campo, elemento.value);
    }
  });

  const botao = document.activeElement;
  const url = WEB_URL;
  console.log("URL:", url);
  console.log("action:", dados.get("action"));
  for (const [k, v] of dados.entries()) {
    console.log("FD", k, v);
  }
  activarLoading(botao);

  try {
    const res = await fetch(url, { method: "POST", body: dados });
    console.log("HTTP status:", res.status);
    const txt = await res.text();
    console.log("Resposta bruta:", txt);

    let resposta;
    try {
      resposta = JSON.parse(txt);
    } catch (parseError) {
      resposta = null;
    }

    desativarLoading(botao);
    if (resposta?.sucesso === true) {
      document.getElementById("form-container").innerHTML = "";
      mostrarModal("Os seus dados foram enviados com sucesso. Acompanhe o andamento do processo na aba Consulta.");
      return;
    }

    const mensagem = resposta?.mensagem || "Ocorreu um erro ao enviar os dados. Por favor, tente novamente.";
    mostrarModal(mensagem);
  } catch (err) {
    desativarLoading(botao);
    mostrarModal("Ocorreu um erro ao enviar os dados. Por favor, tente novamente.");
  }
}

window.enviarPedidoCredencialEstagio = enviarPedidoCredencialEstagio;

const btnConsultaEstado = document.getElementById('btnConsultaEstado');
const formContainer = document.getElementById('form-container');
const containerDocumentos = document.getElementById('containerDocumentos');
const listaDocumentos = document.getElementById('listaDocumentos');
const btnBaixarFormulario = document.getElementById('btnBaixarFormulario');

function mostrarContainerFormularios() {
  if (formContainer) {
    formContainer.style.display = '';
  }
  if (containerDocumentos) {
    containerDocumentos.style.display = 'none';
  }
}

function configurarMonitorizacaoFormulario() {
  const form = formContainer?.querySelector('form');
  if (!form || form.dataset.validationAttached) return;

  form.dataset.validationAttached = 'true';

  const botao = form.querySelector('.btn-submeter');
  if (botao) {
    botao.disabled = true;
  }

  const camposObrigatorios = form.querySelectorAll('[required]');

  camposObrigatorios.forEach((campo) => {
    campo.addEventListener('input', () => actualizarEstadoBotao(form));
    campo.addEventListener('change', () => actualizarEstadoBotao(form));
  });

  actualizarEstadoBotao(form);
}

if (formContainer) {
  const observer = new MutationObserver(() => configurarMonitorizacaoFormulario());
  observer.observe(formContainer, { childList: true });

  configurarMonitorizacaoFormulario();
}

function mostrarConsultaEstado() {
  if (!formContainer) return;

  formContainer.innerHTML = `
    <div class="form-card">
      <div class="form-header">
        <h2>Consulta de Estado</h2>
        <p>Selecione o tipo de consulta:</p>
      </div>

      <div class="form-grid">
        <div class="form-field full-row">
          <label for="tipoConsulta">Tipo de consulta</label>
          <select id="tipoConsulta">
            <option value="">Selecione...</option>
            <option value="monografia">Tema de Monografia</option>
            <option value="versaoFinal">Versão Final Monografia</option>
            <option value="credencial">Credencial Pesquisa</option>
            <option value="credencial_estagio">Credencial de Estágio</option>
          </select>
        </div>

        <div class="form-field full-row">
          <label for="numeroEstudanteConsulta">Número de estudante</label>
          <input type="text" id="numeroEstudanteConsulta" placeholder="Introduza o seu número" />
        </div>

        <div class="form-actions">
          <button type="button" class="btn-guardar" id="btnBuscarEstado">Buscar</button>
        </div>
      </div>
    </div>
  `;

  const tipoConsulta = document.getElementById('tipoConsulta');
  const numeroEstudanteConsulta = document.getElementById('numeroEstudanteConsulta');

  // manter desativado até escolher o tipo de consulta
  numeroEstudanteConsulta.disabled = true;

  // activar/desactivar conforme a seleção
  tipoConsulta.addEventListener('change', () => {
    if (tipoConsulta.value) {
      numeroEstudanteConsulta.disabled = false;
      numeroEstudanteConsulta.focus();
    } else {
      numeroEstudanteConsulta.value = '';
      numeroEstudanteConsulta.disabled = true;
    }
  });
}

btnConsultaEstado?.addEventListener('click', mostrarConsultaEstado);

async function enviarConsulta(payload) {
  console.log('Consulta pronta para envio:', payload);

  try {
    const btn = document.getElementById("btnBuscarEstado");
    btn.textContent = "A buscar...";
    btn.disabled = true;

    const response = await fetch(
      WEB_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: new URLSearchParams(payload)
      }
    );

    const dados = await response.json();
    btn.textContent = "Buscar";
    btn.disabled = false;
    console.log('Resposta recebida:', dados);
    mostrarResultadoConsulta(dados);
  } catch (error) {
    const btn = document.getElementById("btnBuscarEstado");
    btn.textContent = "Buscar";
    btn.disabled = false;
    console.error('Erro ao enviar consulta:', error);
  }
}

function aplicarEstiloSituacao(el, situacaoRaw) {
  if (!el) return;

  const situacao = (situacaoRaw || "").toString().trim().toLowerCase();

  el.classList.remove(
    "status-aprovado",
    "status-homologado",
    "status-atribuido",
    "status-pendente",
    "status-reprovado",
    "status-recusado"
  );
  el.classList.remove("status");

  if (!situacao) {
    return;
  }

  el.classList.add("status");

  if (
    situacao === "aprovado" ||
    situacao === "homologado" ||
    situacao === "atribuido" ||
    situacao === "atribuído" ||
    situacao === "ok"
  ) {
    el.classList.add("status-aprovado");
  } else if (situacao === "pendente") {
    el.classList.add("status-pendente");
  } else if (situacao === "reprovado" || situacao === "recusado") {
    el.classList.add("status-reprovado");
  }
}

function normalizarLink(url) {
  const link = (url || "").toString().trim();
  if (!link) return "";

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(link) || link.startsWith("//")) {
    return link;
  }

  if (link.startsWith("www.")) {
    return `https://${link}`;
  }

  if (link.includes(".") && !link.includes(" ")) {
    return `https://${link}`;
  }

  return link;
}

function renderLinkDownload(containerEl, url, label) {
  if (!containerEl) return;

  const link = normalizarLink(url);

  if (link) {
    containerEl.innerHTML = `
      <a class="link-download" href="${link}" target="_blank" rel="noopener noreferrer">
        <span class="pdf-icon" aria-hidden="true">PDF</span>
        <span class="link-download-text">${label || "Baixar ficheiro"}</span>
      </a>
    `;
  } else {
    containerEl.textContent = "—";
  }
}

function obterPrimeiroLinkPdf(...fontes) {
  const chavesPdf = [
    "pdfComprovativo",
    "pdfHomologacao",
    "linkPDF",
    "pdfURL",
    "urlPDF",
    "link",
    "url"
  ];

  for (const fonte of fontes) {
    if (!fonte || typeof fonte !== "object") continue;

    for (const chave of chavesPdf) {
      const valor = fonte[chave];
      if (typeof valor === "string" && valor.trim()) {
        return valor.trim();
      }
    }
  }

  return "";
}

function mostrarResultadoConsulta(resposta) {
  const resultadoDiv = document.getElementById("resultadoConsultaEstado");
  const pdfBox = document.getElementById("pdfReprovadoContainer");
  const pdfLink = document.getElementById("pdfReprovadoLink");
  const mensagemEl = document.getElementById("resMensagemConsulta");

  const linhaNome = document.getElementById("resNome")?.parentElement;
  const linhaNumero = document.getElementById("resNumero")?.parentElement;
  const linhaSubmissao = document.getElementById("resSubmissao")?.parentElement;
  const linhaParecer = document.getElementById("resParecer")?.parentElement;
  const linhaObservacoes = document.getElementById("linhaObservacoes");
  const linhaAtribuicao = document.getElementById("resAtribuicao")?.parentElement;
  const linhaHomologacao = document.getElementById("resHomologacao")?.parentElement;
  const linhaComprovativo = document.getElementById("resPdfHomologacao")?.parentElement;

  const alternarLinha = (linha, mostrar) => {
    if (!linha) return;
    linha.style.display = mostrar ? "" : "none";
  };

  if (!resposta.sucesso) {
    resultadoDiv.style.display = "block";
    if (mensagemEl) {
      mensagemEl.textContent = "Nenhuma submissão encontrada para este número.";
      mensagemEl.style.display = "block";
    }

    alternarLinha(linhaNome, false);
    alternarLinha(linhaNumero, false);
    alternarLinha(linhaSubmissao, false);
    alternarLinha(linhaParecer, false);
    alternarLinha(linhaObservacoes, false);
    alternarLinha(linhaAtribuicao, false);
    alternarLinha(linhaHomologacao, false);
    alternarLinha(linhaComprovativo, false);
    if (pdfBox) {
      pdfBox.style.display = "none";
    }
    return;
  }

  resultadoDiv.style.display = "block";
  if (mensagemEl) {
    mensagemEl.textContent = "";
    mensagemEl.style.display = "none";
  }

  const dados = resposta.dados || {};
  const situacaoEl = document.getElementById("resParecer");
  const comprovativoEl = document.getElementById("resPdfHomologacao");
  const tipoConsulta = document.getElementById("tipoConsulta")?.value;
  const supervisorAtribuido = supervisorEstaAtribuido(dados.atribuicaoSupervisor);
  const textoAtribuicaoBase = supervisorAtribuido ? "Atribuído" : "Pendente";

  const isCredencial =
    !dados.dataDefesa &&
    !("atribuicaoSupervisor" in dados) &&
    !("homologacao" in dados) &&
    !("homologado" in dados);

  // Esconder antes de avaliar
  pdfBox.style.display = "none";

  document.getElementById("resNome").textContent = dados.nome || "";
  document.getElementById("resNumero").textContent = dados.numero || "";
  if (dados.dataSubmissao) {
    const d = new Date(dados.dataSubmissao);

    const dataFormatada =
      String(d.getDate()).padStart(2, '0') + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      d.getFullYear() + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');

    document.getElementById("resSubmissao").textContent = dataFormatada;
  } else {
    document.getElementById("resSubmissao").textContent = "";
  }
  const homologacaoValor = dados.homologacao || dados.homologado || "";
  document.getElementById("resAtribuicao").textContent = textoAtribuicaoBase;
  document.getElementById("resHomologacao").textContent = homologacaoValor;
  aplicarEstiloSituacao(document.getElementById("resAtribuicao"), textoAtribuicaoBase);
  aplicarEstiloSituacao(document.getElementById("resHomologacao"), homologacaoValor);

  const isVersaoFinal = !!dados.dataDefesa;
  const isAprovado =
    dados.parecer && dados.parecer.toLowerCase() === "aprovado";

  if (tipoConsulta === "monografia") {
    const parecerNormalizado = (dados.parecer || "").toString().trim().toLowerCase();
    const parecerRecusado = ["recusado", "reprovado"].includes(parecerNormalizado);
    const parecerAprovado = parecerNormalizado === "aprovado";
    const textoParecer = parecerNormalizado
      ? (parecerRecusado ? "Recusado" : dados.parecer)
      : "Pendente";

    situacaoEl.textContent = textoParecer;
    aplicarEstiloSituacao(situacaoEl, textoParecer);

    alternarLinha(linhaNome, true);
    alternarLinha(linhaNumero, true);
    alternarLinha(linhaSubmissao, true);
    alternarLinha(linhaParecer, true);

    if (parecerRecusado) {
      document.getElementById("resObservacoes").textContent =
        dados.observacoes && dados.observacoes.trim() !== ""
          ? dados.observacoes
          : "Sem observações adicionais.";
      alternarLinha(linhaObservacoes, true);
    } else {
      alternarLinha(linhaObservacoes, false);
    }

    if (!parecerAprovado) {
      alternarLinha(linhaAtribuicao, false);
      alternarLinha(linhaHomologacao, false);
      comprovativoEl.innerHTML = "";
      alternarLinha(linhaComprovativo, false);
      if (pdfBox) {
        pdfBox.style.display = "none";
      }
      return;
    }

    const homologacaoRaw = (homologacaoValor || "").toString().trim();
    const homologacaoNormalizada = homologacaoRaw.toLowerCase();
    const atribuicaoOk = supervisorAtribuido;
    const homologacaoOk =
      atribuicaoOk &&
      ["homologado", "aprovado", "ok"].includes(homologacaoNormalizada);

    const textoAtribuicao = atribuicaoOk ? "Atribuído" : "Pendente";
    const textoHomologacao = homologacaoOk ? "Homologado" : "Pendente";

    document.getElementById("resAtribuicao").textContent = textoAtribuicao;
    document.getElementById("resHomologacao").textContent = textoHomologacao;
    aplicarEstiloSituacao(document.getElementById("resAtribuicao"), textoAtribuicao);
    aplicarEstiloSituacao(document.getElementById("resHomologacao"), textoHomologacao);

    alternarLinha(linhaAtribuicao, true);
    alternarLinha(linhaHomologacao, true);

    if (homologacaoOk) {
      const linkComprovativo = obterPrimeiroLinkPdf(resposta.dados, dados);
      if (linkComprovativo) {
        renderLinkDownload(comprovativoEl, linkComprovativo, "Baixar comprovativo");
      } else {
        comprovativoEl.textContent = "—";
      }
      alternarLinha(linhaComprovativo, true);
    } else {
      comprovativoEl.innerHTML = "";
      alternarLinha(linhaComprovativo, false);
    }

    if (pdfBox) {
      pdfBox.style.display = "none";
    }
    return;
  }

  if (isCredencial) {
    const estado = (dados.parecer || "").toLowerCase();
    const isReprovadoCredencial = ["reprovado", "recusado"].includes(estado);

    if (estado === "aprovado") {
      situacaoEl.textContent =
        "Aprovado – Disponível para levantamento";
    } else if (estado === "reprovado") {
      situacaoEl.textContent =
        "Reprovado – Contacte a secretaria";
    } else {
      situacaoEl.textContent =
        dados.parecer || "Pendente";
    }
    aplicarEstiloSituacao(situacaoEl, dados.parecer);

    document.querySelector('#resParecer')
      .closest('p')
      .querySelector('strong')
      .textContent = "Situação:";

    document.getElementById("resAtribuicao").parentElement.style.display = "none";
    document.getElementById("resHomologacao").parentElement.style.display = "none";
    document.getElementById("resPdfHomologacao").innerHTML = "";
    // ❌ Esconder completamente a linha "Comprovativo" na Credencial
    document.getElementById("resPdfHomologacao").parentElement.style.display = "none";

    if (isReprovadoCredencial) {
      document.getElementById("resObservacoes").textContent =
        dados.observacoes && dados.observacoes.trim() !== ""
          ? dados.observacoes
          : "Sem observações adicionais.";
      document.getElementById("linhaObservacoes").style.display = "block";
    } else {
      document.getElementById("linhaObservacoes").style.display = "none";
    }

    return;
  }

  // Limpar link anterior
  comprovativoEl.innerHTML = "";

  document.querySelector('#resParecer')
    .closest('p')
    .querySelector('strong')
    .textContent = "Parecer:";
  const parecerBase = dados.parecer || "Pendente";
  situacaoEl.textContent = parecerBase;
  aplicarEstiloSituacao(situacaoEl, parecerBase);

  if (isVersaoFinal) {
    document.getElementById("resAtribuicao").parentElement.style.display = "none";
    document.getElementById("resHomologacao").parentElement.style.display = "none";

    const parecerNormalizado = (dados.parecer || "").toString().trim().toLowerCase();
    const parecerPendente = parecerNormalizado === "";
    const parecerRecusado = ["recusado", "reprovado"].includes(parecerNormalizado);

    if (parecerPendente) {
      alternarLinha(linhaObservacoes, false);
      comprovativoEl.innerHTML = "";
      alternarLinha(linhaComprovativo, false);
      if (pdfBox) {
        pdfBox.style.display = "none";
      }
      return;
    }

    if (parecerRecusado) {
      document.getElementById("resObservacoes").textContent =
        dados.observacoes && dados.observacoes.trim() !== ""
          ? dados.observacoes
          : "Sem observações adicionais.";
      alternarLinha(linhaObservacoes, true);
      comprovativoEl.innerHTML = "";
      alternarLinha(linhaComprovativo, false);
      if (pdfBox) {
        pdfBox.style.display = "none";
      }
      return;
    }

    alternarLinha(linhaObservacoes, false);
    if (isAprovado) {
      const linkMonografia = obterPrimeiroLinkPdf(dados, resposta.dados);
      if (linkMonografia) {
        renderLinkDownload(comprovativoEl, linkMonografia, "Baixe aqui");
        alternarLinha(linhaComprovativo, true);
      } else {
        comprovativoEl.innerHTML = "";
        alternarLinha(linhaComprovativo, false);
      }
    } else {
      comprovativoEl.innerHTML = "";
      alternarLinha(linhaComprovativo, false);
    }
    if (pdfBox) {
      pdfBox.style.display = "none";
    }
    return;
  } else {
    document.getElementById("resAtribuicao").parentElement.style.display = "";
    document.getElementById("resHomologacao").parentElement.style.display = "";

    const estadoTema = (homologacaoValor || dados.parecer || "").toString().trim().toLowerCase();
    const temaAprovado = ["aprovado", "homologado"].includes(estadoTema);
    const linkComprovativo = obterPrimeiroLinkPdf(resposta.dados, dados);
    if (temaAprovado && linkComprovativo) {
      renderLinkDownload(comprovativoEl, linkComprovativo, "Baixar comprovativo");
    }
  }

  // 🔵 OBSERVAÇÕES — mostrar sempre que for REPROVADO (Tema ou Versão Final)
  const parecerNormalizado = (dados.parecer || "").toString().trim().toLowerCase();
  const isReprovado = ["reprovado", "recusado"].includes(parecerNormalizado);

  if (isReprovado) {
    document.getElementById("resObservacoes").textContent =
      dados.observacoes && dados.observacoes.trim() !== ""
        ? dados.observacoes
        : "Sem observações adicionais.";

    document.getElementById("linhaObservacoes").style.display = "block";
  } else {
    document.getElementById("linhaObservacoes").style.display = "none";
  }

  // Mostrar link de PDF se o parecer for reprovado
  const parecerReprovado =
    (resposta.dados.parecer || "").toString().trim().toLowerCase() === "reprovado";
  const pdfReprovado = normalizarLink(resposta.dados.pdfReprovado);

  if (parecerReprovado && pdfReprovado) {
    pdfLink.href = pdfReprovado;
    pdfBox.style.display = "block";
  }
}

document.addEventListener('click', (event) => {
  if (event.target?.id !== 'btnBuscarEstado') return;

  const tipoConsulta = document.getElementById("tipoConsulta").value;
  const numero = document.getElementById("numeroEstudanteConsulta").value;

  const payload = {
    action: "consultaEstado",
    tipo: tipoConsulta,
    numero: numero,
    tipoConsulta: tipoConsulta,
    numeroEstudante: numero,
  };

  enviarConsulta(payload);
});

function esconderResultadoConsulta() {
  const div = document.getElementById("resultadoConsultaEstado");
  if (div) {
    div.style.display = "none";
  }
}

document.querySelectorAll(".btn-navegacao").forEach(btn => {
  btn.addEventListener("click", () => {
    esconderResultadoConsulta();
  });
});

function mostrarContainerDocumentos() {
  if (containerDocumentos) {
    containerDocumentos.style.display = 'block';
  }
  if (formContainer) {
    formContainer.style.display = 'none';
  }
}

async function carregarDocumentos() {
  if (!listaDocumentos) return;

  listaDocumentos.innerHTML = '';
  mostrarLoadingDocumentos();

  try {
    const gruposDocumentos = [
      {
        titulo: 'Formulários',
        documentos: [
          {
            nome: 'Mudança de Regime',
            link: 'https://drive.google.com/file/d/1vWT6c4smuGL8LClgJt7yjb1H4EZoh-O-/view?usp=drive_link',
          },
        ],
      },
      {
        titulo: 'Planos Curriculares',
        documentos: [
          {
            nome: 'Plano Curricular Contabilidade e Fiscalidade',
            link: 'https://drive.google.com/file/d/1LjFyqn8FUc9AWlNvK0CRjUTxtQ9Lgl2U/view?usp=drive_link',
          },
        ],
      },
      {
        titulo: 'Regulamentos',
        documentos: [
          {
            nome: 'Estrutura TCC',
            link: 'https://drive.google.com/file/d/1vHbgPPDpU3yrNBDUMYGPIcoP3L-eYKGZ/view?usp=drive_link',
          },
        ],
      },
      {
        titulo: 'Outros',
        documentos: [
          {
            nome: 'Linhas de Pesquisa',
            link: 'https://drive.google.com/file/d/17wXc1iY4AjpB445KEMx2S9ygItvxK6uN/view?usp=drive_link',
          },
        ],
      },
    ];

    const criarItemDocumento = (doc) => {
      const item = document.createElement('li');
      const nomeSpan = document.createElement('span');
      const pdfLink = document.createElement('a');

      nomeSpan.textContent = `${doc.nome} – `;

      const pdfIcon = document.createElement('img');
      pdfIcon.src = 'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg';
      pdfIcon.alt = 'PDF';
      pdfIcon.width = 22;

      pdfLink.href = doc.link;
      pdfLink.target = '_blank';
      pdfLink.rel = 'noopener noreferrer';
      pdfLink.appendChild(pdfIcon);

      item.appendChild(nomeSpan);
      item.appendChild(pdfLink);
      return item;
    };

    gruposDocumentos.forEach((grupo, index) => {
      if (!grupo.documentos.length) return;

      const grupoItem = document.createElement('li');
      const titulo = document.createElement('h3');
      const botaoToggle = document.createElement('button');
      const listaGrupo = document.createElement('ul');
      const listaId = `documentos-grupo-${index}`;

      grupoItem.className = 'documentos-grupo';
      botaoToggle.type = 'button';
      botaoToggle.className = 'documentos-toggle';
      botaoToggle.textContent = grupo.titulo;
      botaoToggle.setAttribute('aria-expanded', 'false');
      botaoToggle.setAttribute('aria-controls', listaId);
      titulo.appendChild(botaoToggle);
      listaGrupo.id = listaId;
      listaGrupo.hidden = true;

      grupo.documentos.forEach((doc) => {
        listaGrupo.appendChild(criarItemDocumento(doc));
      });

      grupoItem.appendChild(titulo);
      grupoItem.appendChild(listaGrupo);
      listaDocumentos.appendChild(grupoItem);

      botaoToggle.addEventListener('click', () => {
        const isExpanded = botaoToggle.getAttribute('aria-expanded') === 'true';
        botaoToggle.setAttribute('aria-expanded', String(!isExpanded));
        listaGrupo.hidden = isExpanded;
      });
    });
  } catch (error) {
    listaDocumentos.textContent = 'Nenhum documento disponível';
  } finally {
    esconderLoadingDocumentos();
  }
}

btnBaixarFormulario?.addEventListener('click', () => {
  mostrarContainerDocumentos();
  carregarDocumentos();
});

['btnTema', 'btnMonografia', 'btnPedidoCredencial', 'btnPedidoCredencialEstagio', 'btnConsultaEstado'].forEach((idBotao) => {
  const botao = document.getElementById(idBotao);
  botao?.addEventListener('click', mostrarContainerFormularios);
});


