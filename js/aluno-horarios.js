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

  function obterElemento(id) {
    return document.getElementById(id);
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

  async function carregarFiltrosHorarios() {
    const cursoSelect = obterElemento(IDS.curso);
    const anoSelect = obterElemento(IDS.ano);
    const regimeSelect = obterElemento(IDS.regime);

    try {
      const resposta = await fetch(WEB_URL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'listarFiltrosHorarios' }),
      });

      if (!resposta.ok) {
        throw new Error('Falha ao carregar filtros de horários.');
      }

      const dados = await resposta.json();
      limparEPreencherSelect(cursoSelect, dados.cursos);
      limparEPreencherSelect(anoSelect, dados.anos);
      limparEPreencherSelect(regimeSelect, dados.regimes);

      filtrosCarregados = true;
      renderizarResultadoHorario({ tipo: 'info', mensagem: '' });
    } catch (erro) {
      filtrosCarregados = false;
      renderizarResultadoHorario({
        tipo: 'erro',
        mensagem: erro?.message || 'Não foi possível carregar os filtros de horários.',
      });
    }
  }

  async function buscarHorarioPdf() {
    const botaoBuscar = obterElemento(IDS.buscar);
    const curso = obterElemento(IDS.curso)?.value?.trim() || '';
    const ano = obterElemento(IDS.ano)?.value?.trim() || '';
    const regime = obterElemento(IDS.regime)?.value?.trim() || '';

    if (!curso || !ano || !regime) {
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
      const resposta = await fetch(WEB_URL, {
        method: 'POST',
        body: new URLSearchParams({
          action: 'gerarPdfHorarioTurma',
          curso,
          ano,
          regime,
        }),
      });

      const dados = await resposta.json();
      if (!resposta.ok || !dados?.url) {
        throw new Error(dados?.mensagem || 'Não foi possível gerar o horário.');
      }

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
      renderizarResultadoHorario({
        tipo: 'erro',
        mensagem: erro?.message || 'Não foi possível gerar o horário.',
      });
    } finally {
      if (botaoBuscar) {
        botaoBuscar.disabled = false;
        botaoBuscar.textContent = textoOriginal || TEXTO_BOTAO_BUSCAR;
      }
    }
  }

  function inicializarHorariosAluno() {
    const btnBuscar = obterElemento(IDS.buscar);
    const btnHorarios = obterElemento(IDS.abrirHorarios);
    const container = obterElemento(IDS.container);

    if (!btnBuscar || !btnHorarios || !container) return;

    btnBuscar.addEventListener('click', buscarHorarioPdf);

    btnHorarios.addEventListener('click', () => {
      const seraAberto = container.style.display === 'none';
      if (seraAberto && !filtrosCarregados) {
        carregarFiltrosHorarios();
      }
    });

    if (container.style.display !== 'none' && !filtrosCarregados) {
      carregarFiltrosHorarios();
    }
  }

  document.addEventListener('DOMContentLoaded', inicializarHorariosAluno);
})();
