(function () {
  const IDS = {
    container: 'containerHorarios',
    curso: 'cursoHorario',
    ano: 'anoHorario',
    regime: 'regimeHorario',
    buscar: 'btnBuscarHorario',
    resultado: 'resultadoHorario',
    abrirHorarios: 'btnHorarios',
  };

  const TEXTO_BOTAO_CARREGAR = 'A gerar PDF...';
  const TEXTO_BOTAO_BUSCAR = 'Buscar';
  let filtrosCarregados = false;
  let filtrosCarregando = false;

  function obterElemento(id) {
    return document.getElementById(id);
  }

  function obterEstadoVisibilidade(container) {
    if (!container) return false;
    if (container.dataset.horariosAberto === 'true') return true;
    const displayInline = container.style.display;
    if (displayInline) return displayInline !== 'none';
    return window.getComputedStyle(container).display !== 'none';
  }

  function definirVisibilidadeContainer(container, aberto) {
    if (!container) return;
    container.dataset.horariosAberto = aberto ? 'true' : 'false';
    container.style.display = aberto ? 'block' : 'none';
    console.log(`[HORARIOS] Secção de horários ${aberto ? 'aberta' : 'fechada'}`);
  }

  function limparEPreencherSelect(select, opcoes) {
    if (!select) return;

    select.innerHTML = '';
    const opcaoInicial = document.createElement('option');
    opcaoInicial.value = '';
    opcaoInicial.textContent = 'Seleccione...';
    select.appendChild(opcaoInicial);

    const itensUnicos = [...new Set((opcoes || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean))];

    itensUnicos.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      select.appendChild(option);
    });
  }

  function normalizarNomeFicheiro(nomeOriginal = '') {
    const nome = String(nomeOriginal || '').trim();
    if (!nome) return 'Horario.pdf';

    const nomeSemTimestamp = nome.replace(/_(?:\d{8}_\d{6})(?=\.pdf$)/i, '');
    if (/\.pdf$/i.test(nomeSemTimestamp)) return nomeSemTimestamp;
    return `${nomeSemTimestamp}.pdf`;
  }

  function renderizarResultadoHorario({ tipo = 'info', mensagem = '', dadosPdf = null }) {
    const resultado = obterElemento(IDS.resultado);
    if (!resultado) return;

    resultado.className = `horarios-resultado-consulta ${tipo}`;
    resultado.innerHTML = '';

    if (mensagem) {
      const pMensagem = document.createElement('p');
      pMensagem.className = 'horario-resultado-mensagem';
      pMensagem.textContent = mensagem;
      resultado.appendChild(pMensagem);
    }

    if (dadosPdf?.url) {
      const detalhes = document.createElement('div');
      detalhes.className = 'horario-resultado-detalhes';

      const nomeDownload = normalizarNomeFicheiro(dadosPdf.nome || 'Horario.pdf');

      const nomeFicheiro = document.createElement('p');
      nomeFicheiro.innerHTML = `<strong>Ficheiro:</strong> ${nomeDownload}`;
      detalhes.appendChild(nomeFicheiro);

      const acoes = document.createElement('div');
      acoes.className = 'horario-resultado-acoes';

      const linkBaixar = document.createElement('a');
      linkBaixar.href = dadosPdf.url;
      linkBaixar.target = '_blank';
      linkBaixar.rel = 'noopener noreferrer';
      linkBaixar.download = nomeDownload;
      linkBaixar.textContent = 'Baixar Horário';

      acoes.append(linkBaixar);
      detalhes.appendChild(acoes);
      resultado.appendChild(detalhes);
    }
  }

  function alternarEstadoFiltros(disabled, textoOpcao = 'Seleccione...') {
    [IDS.curso, IDS.ano, IDS.regime].forEach((id) => {
      const select = obterElemento(id);
      if (!select) return;
      select.disabled = disabled;
      if (disabled) {
        select.innerHTML = `<option value="">${textoOpcao}</option>`;
      }
    });
  }

  // Nota técnica: para o front ler JSON, o endpoint precisa responder com CORS compatível e conteúdo legível (ex.: doPost/doGet + ContentService no Apps Script).
  async function postHorarios(action, dados = {}) {
    const payload = new URLSearchParams({ action, ...dados });
    console.log('[HORARIOS][API] POST', { action, dados });

    let resposta;
    try {
      resposta = await fetch(WEB_URL, {
        method: 'POST',
        body: payload,
      });
    } catch (erroRede) {
      console.error('[HORARIOS][ERRO] Falha de rede/CORS na API de horários', erroRede);
      throw new Error('Não foi possível comunicar com o servidor de horários. Verifique a publicação da Web App e tente novamente.');
    }

    if (!resposta.ok) {
      console.error('[HORARIOS][ERRO] Resposta HTTP inválida', { action, status: resposta.status });
      throw new Error(`Falha ao comunicar com o servidor de horários (HTTP ${resposta.status}).`);
    }

    try {
      const json = await resposta.json();
      console.log('[HORARIOS][API] Resposta recebida', { action, json });
      return json;
    } catch (erroJson) {
      console.error('[HORARIOS][ERRO] Falha ao converter resposta para JSON', { action, erro: erroJson });
      throw new Error('Resposta inválida do servidor de horários.');
    }
  }

  async function carregarFiltrosHorarios() {
    const cursoSelect = obterElemento(IDS.curso);
    const anoSelect = obterElemento(IDS.ano);
    const regimeSelect = obterElemento(IDS.regime);

    if (filtrosCarregando) {
      console.log('[HORARIOS][FILTROS] Carregamento já em curso, ignorado.');
      return;
    }

    filtrosCarregando = true;
    console.log('[HORARIOS][FILTROS] A carregar filtros...');
    alternarEstadoFiltros(true, 'A carregar...');
    try {
      const dados = await postHorarios('listarFiltrosHorarios');
      console.log('[HORARIOS][FILTROS] Resposta dos filtros', dados);
      limparEPreencherSelect(cursoSelect, dados.cursos);
      limparEPreencherSelect(anoSelect, dados.anos);
      limparEPreencherSelect(regimeSelect, dados.regimes);
      console.log('[HORARIOS][FILTROS] Selects preenchidos', {
        cursos: dados?.cursos?.length || 0,
        anos: dados?.anos?.length || 0,
        regimes: dados?.regimes?.length || 0,
      });

      filtrosCarregados = true;
      renderizarResultadoHorario({ tipo: 'info', mensagem: '' });
    } catch (erro) {
      filtrosCarregados = false;
      console.error('[HORARIOS][ERRO] Falha ao carregar filtros', erro);
      renderizarResultadoHorario({
        tipo: 'erro',
        mensagem: erro?.message || 'Não foi possível comunicar com o servidor de horários. Verifique a publicação da Web App e tente novamente.',
      });
    } finally {
      filtrosCarregando = false;
      alternarEstadoFiltros(false);
    }
  }

  async function consultarHorarioTurma(curso, ano, regime) {
    console.log('[HORARIOS][API] Consulta sem PDF solicitada', { curso, ano, regime });
    return postHorarios('consultarHorarioTurma', { curso, ano, regime });
  }

  async function buscarHorarioPdf() {
    console.log('[HORARIOS][BUSCAR] Botão Buscar clicado');
    const botaoBuscar = obterElemento(IDS.buscar);
    const curso = obterElemento(IDS.curso)?.value?.trim() || '';
    const ano = obterElemento(IDS.ano)?.value?.trim() || '';
    const regime = obterElemento(IDS.regime)?.value?.trim() || '';
    console.log('[HORARIOS][BUSCAR] Valores seleccionados', { curso, ano, regime });

    if (!curso || !ano || !regime) {
      console.warn('[HORARIOS][BUSCAR] Validação falhou: campos obrigatórios em falta');
      renderizarResultadoHorario({
        tipo: 'erro',
        mensagem: 'Seleccione curso, ano e regime antes de buscar.',
      });
      return;
    }

    const textoOriginal = botaoBuscar?.textContent || TEXTO_BOTAO_BUSCAR;
    if (botaoBuscar) {
      botaoBuscar.disabled = true;
      botaoBuscar.textContent = TEXTO_BOTAO_CARREGAR;
    }

    renderizarResultadoHorario({
      tipo: 'info',
      mensagem: 'A gerar PDF do horário, por favor aguarde...',
    });

    try {
      const dados = await postHorarios('gerarPdfHorarioTurma', { curso, ano, regime });
      console.log('[HORARIOS][BUSCAR] Resposta recebida para gerarPdfHorarioTurma', dados);
      if (!dados?.url) {
        console.error('[HORARIOS][ERRO] Resposta inesperada sem URL de PDF', dados);
        throw new Error(dados?.mensagem || 'Nenhum PDF foi retornado para os filtros seleccionados.');
      }
      console.log('[HORARIOS][BUSCAR] URL do PDF retornada', dados.url);

      renderizarResultadoHorario({
        tipo: 'sucesso',
        mensagem: dados.mensagem || 'Horário gerado com sucesso.',
        dadosPdf: {
          nome: dados.nome,
          url: dados.url,
          fileId: dados.fileId,
        },
      });
    } catch (erro) {
      console.error('[HORARIOS][ERRO] Erro ao buscar/generar PDF', erro);
      renderizarResultadoHorario({
        tipo: 'erro',
        mensagem: erro?.message || 'Não foi possível comunicar com o servidor de horários. Verifique a publicação da Web App e tente novamente.',
      });
    } finally {
      if (botaoBuscar) {
        botaoBuscar.disabled = false;
        botaoBuscar.textContent = textoOriginal || TEXTO_BOTAO_BUSCAR;
      }
    }
  }

  function toggleHorariosSection() {
    console.log('[HORARIOS] Botão Horários clicado');
    const container = obterElemento(IDS.container);
    if (!container) return;

    const aberto = obterEstadoVisibilidade(container);
    definirVisibilidadeContainer(container, !aberto);

    if (!aberto && !filtrosCarregados) {
      carregarFiltrosHorarios();
    }
  }

  function inicializarHorariosAluno() {
    const btnBuscar = obterElemento(IDS.buscar);
    const btnHorarios = obterElemento(IDS.abrirHorarios);
    const container = obterElemento(IDS.container);

    if (!btnBuscar || !btnHorarios || !container) return;

    btnBuscar.addEventListener('click', buscarHorarioPdf);
    btnHorarios.addEventListener('click', toggleHorariosSection);

    const estaAbertoAoIniciar = obterEstadoVisibilidade(container);
    definirVisibilidadeContainer(container, estaAbertoAoIniciar);
    if (estaAbertoAoIniciar && !filtrosCarregados) {
      carregarFiltrosHorarios();
    }
  }

  window.consultarHorarioTurma = consultarHorarioTurma;
  document.addEventListener('DOMContentLoaded', inicializarHorariosAluno);
})();
