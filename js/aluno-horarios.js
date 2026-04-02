(function () {
  const IDS = {
    container: 'containerHorarios',
    curso: 'filtroCurso',
    ano: 'filtroAno',
    regime: 'filtroRegime',
    buscar: 'btnBuscarHorario',
    resultado: 'resultadoHorario',
    abrirHorarios: 'btnHorarios',
  };

  const TEXTO_BOTAO_CARREGAR = 'A gerar PDF...';
  const TEXTO_BOTAO_BUSCAR = 'Buscar';
  let filtrosCarregados = false;
  let filtrosCarregando = false;
  let pedidoFiltrosEmCurso = 0;
  const filtrosIniciais = {
    cursos: [],
    anos: [],
    regimes: [],
  };
  const IDS_LEGADOS = {
    filtroCurso: 'cursoHorario',
    filtroAno: 'anoHorario',
    filtroRegime: 'regimeHorario',
  };

  function obterElemento(id) {
    return document.getElementById(id)
      || document.getElementById(IDS_LEGADOS[id])
      || null;
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

  function preencherSelect(select, opcoes, valorSeleccionado = '') {
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

    const valorValido = valorSeleccionado && itensUnicos.includes(valorSeleccionado);
    select.value = valorValido ? valorSeleccionado : '';
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

      const nomeFicheiro = document.createElement('p');
      nomeFicheiro.innerHTML = `<strong>Ficheiro:</strong> ${dadosPdf.nome || 'Horário.pdf'}`;
      detalhes.appendChild(nomeFicheiro);

      const acoes = document.createElement('div');
      acoes.className = 'horario-resultado-acoes';

      const linkAbrir = document.createElement('a');
      linkAbrir.href = dadosPdf.url;
      linkAbrir.target = '_blank';
      linkAbrir.rel = 'noopener noreferrer';
      linkAbrir.className = 'button btn-navegacao btn-padrao-portal';
      linkAbrir.textContent = 'Abrir PDF';

      const linkBaixar = document.createElement('a');
      linkBaixar.href = dadosPdf.url;
      linkBaixar.target = '_blank';
      linkBaixar.rel = 'noopener noreferrer';
      linkBaixar.download = dadosPdf.nome || 'horario.pdf';
      linkBaixar.className = 'button btn-navegacao btn-padrao-portal';
      linkBaixar.textContent = 'Baixar Horário';

      acoes.append(linkAbrir, linkBaixar);
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

  async function pedirFiltrosHorarios({ curso = '', ano = '' } = {}) {
    const parametros = {};
    if (curso) parametros.curso = curso;
    if (ano) parametros.ano = ano;
    return postHorarios('listarFiltrosHorarios', parametros);
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
      const dados = await pedirFiltrosHorarios();
      console.log('[HORARIOS][FILTROS] Resposta dos filtros', dados);
      filtrosIniciais.cursos = Array.isArray(dados?.cursos) ? dados.cursos : [];
      filtrosIniciais.anos = Array.isArray(dados?.anos) ? dados.anos : [];
      filtrosIniciais.regimes = Array.isArray(dados?.regimes) ? dados.regimes : [];

      preencherSelect(cursoSelect, filtrosIniciais.cursos, cursoSelect?.value || '');
      preencherSelect(anoSelect, filtrosIniciais.anos, '');
      preencherSelect(regimeSelect, filtrosIniciais.regimes, '');
      console.log('[HORARIOS][FILTROS] Selects preenchidos', {
        cursos: filtrosIniciais.cursos.length,
        anos: filtrosIniciais.anos.length,
        regimes: filtrosIniciais.regimes.length,
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

  async function actualizarFiltrosHorarios(origem = 'curso') {
    const cursoSelect = obterElemento(IDS.curso);
    const anoSelect = obterElemento(IDS.ano);
    const regimeSelect = obterElemento(IDS.regime);
    if (!cursoSelect || !anoSelect || !regimeSelect) return;

    const curso = cursoSelect.value?.trim() || '';
    const ano = anoSelect.value?.trim() || '';
    const tokenPedido = ++pedidoFiltrosEmCurso;

    anoSelect.disabled = true;
    regimeSelect.disabled = true;

    try {
      if (!curso) {
        preencherSelect(anoSelect, filtrosIniciais.anos, '');
        preencherSelect(regimeSelect, filtrosIniciais.regimes, '');
        return;
      }

      if (origem === 'curso') {
        const respostaCurso = await pedirFiltrosHorarios({ curso });
        if (tokenPedido !== pedidoFiltrosEmCurso) return;

        const anosDisponiveis = Array.isArray(respostaCurso?.anos) ? respostaCurso.anos : [];
        preencherSelect(anoSelect, anosDisponiveis, anoSelect.value || '');

        // Regime só deve ser preenchido após curso + ano.
        preencherSelect(regimeSelect, [], '');
        return;
      }

      if (!ano) {
        preencherSelect(regimeSelect, [], '');
        return;
      }

      const respostaCompleta = await pedirFiltrosHorarios({ curso, ano });
      if (tokenPedido !== pedidoFiltrosEmCurso) return;
      const regimesDisponiveis = Array.isArray(respostaCompleta?.regimes) ? respostaCompleta.regimes : [];
      preencherSelect(regimeSelect, regimesDisponiveis, regimeSelect.value || '');
    } catch (erro) {
      console.error('[HORARIOS][ERRO] Falha ao actualizar filtros dependentes', erro);
      renderizarResultadoHorario({
        tipo: 'erro',
        mensagem: erro?.message || 'Não foi possível actualizar os filtros de horários.',
      });
    } finally {
      anoSelect.disabled = false;
      regimeSelect.disabled = false;
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
    const cursoSelect = obterElemento(IDS.curso);
    const anoSelect = obterElemento(IDS.ano);

    if (!btnBuscar || !btnHorarios || !container || !cursoSelect || !anoSelect) return;

    btnBuscar.addEventListener('click', buscarHorarioPdf);
    btnHorarios.addEventListener('click', toggleHorariosSection);
    cursoSelect.addEventListener('change', () => {
      actualizarFiltrosHorarios('curso');
    });
    anoSelect.addEventListener('change', () => {
      actualizarFiltrosHorarios('ano');
    });

    const estaAbertoAoIniciar = obterEstadoVisibilidade(container);
    definirVisibilidadeContainer(container, estaAbertoAoIniciar);
    if (estaAbertoAoIniciar && !filtrosCarregados) {
      carregarFiltrosHorarios();
    }
  }

  window.consultarHorarioTurma = consultarHorarioTurma;
  document.addEventListener('DOMContentLoaded', inicializarHorariosAluno);
})();
