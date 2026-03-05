 // ===============================
// Submissão do Plano de Disciplina
// Portal do Docente
// ===============================

const btnPlano = document.getElementById('btnPlano');
const btnHorarios = document.getElementById('btnHorarios');
const formPlanoContainer = document.getElementById('formPlanoContainer');
const horariosContainer = document.getElementById('horariosContainer');
const botoesNavegacao = document.querySelectorAll('.btn-navegacao');

const limparSecoesDocente = () => {
  if (formPlanoContainer) formPlanoContainer.innerHTML = '';
  if (horariosContainer) horariosContainer.innerHTML = '';
};

// ===============================
// FUNÇÃO ÚNICA DE COMUNICAÇÃO COM GS
// ===============================
async function chamarGS(action, dados = {}) {
  const payload = {
    action,
    ...dados,
  };

  const res = await fetch(WEB_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return res.json();
}

// ===============================
// UTILITÁRIOS
// ===============================
const criarElemento = (tag, className, textContent) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
};

const lerFicheiroComoBase64 = (ficheiro) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const resultado = reader.result;
      if (typeof resultado !== 'string') {
        reject(new Error('Não foi possível ler o ficheiro.'));
        return;
      }

      const base64 = resultado.split(',')[1];
      resolve(base64);
    };

    reader.onerror = () => reject(new Error('Falha ao ler o ficheiro.'));

    reader.readAsDataURL(ficheiro);
  });
};

const enviarPlanoAnaliticoBase64 = async ({ ficheiro, linha, docente, disciplina }) => {
  const base64 = await lerFicheiroComoBase64(ficheiro);

  return chamarGS('enviarPlanoAnalitico', {
    linha,
    docente,
    disciplina,
    fileName: ficheiro.name,
    mimeType: ficheiro.type || 'application/pdf',
    base64,
  });
};

const normalizarDocentes = (dados) => {
  if (!Array.isArray(dados)) return [];
  return [...new Set(dados.map(String).filter(Boolean))];
};

const DIA_MAPA = {
  SEG: '2ª Feira',
  TER: '3ª Feira',
  QUA: '4ª Feira',
  QUI: '5ª Feira',
  SEX: '6ª Feira',
};

const DIAS_UTEIS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];

const normalizarDia = (dia) => {
  if (!dia) return null;

  const base = String(dia)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  if (base.includes('seg') || base.includes('2a') || base.includes('2f') || base.includes('2feira')) return 'SEG';
  if (base.includes('ter') || base.includes('3a') || base.includes('3f') || base.includes('3feira')) return 'TER';
  if (base.includes('qua') || base.includes('4a') || base.includes('4f') || base.includes('4feira')) return 'QUA';
  if (base.includes('qui') || base.includes('5a') || base.includes('5f') || base.includes('5feira')) return 'QUI';
  if (base.includes('sex') || base.includes('6a') || base.includes('6f') || base.includes('6feira')) return 'SEX';

  return null;
};

const normalizarHoras = (horas) => {
  if (!horas) return null;

  return String(horas)
    .replace(/[–—]/g, '-')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
};

const extrairInicioHora = (periodo) => {
  if (!periodo) return Number.MAX_SAFE_INTEGER;
  const inicio = String(periodo).split('-')[0]?.trim() || '';
  const [h = '99', m = '99'] = inicio.split(':');
  const hora = Number.parseInt(h, 10);
  const min = Number.parseInt(m, 10);
  if (Number.isNaN(hora) || Number.isNaN(min)) return Number.MAX_SAFE_INTEGER;
  return hora * 60 + min;
};

const montarDescricaoAula = (item) => {
  const bloco = criarElemento('div', 'aula-item');
  bloco.appendChild(criarElemento('div', 'aula-disciplina', item.disciplina || 'Disciplina'));

  if (item.sala) {
    bloco.appendChild(criarElemento('div', 'aula-meta aula-sala', `Sala: ${item.sala}`));
  }

  const detalhes = [item.curso, item.ano].filter(Boolean).join(' — ');
  if (detalhes) {
    bloco.appendChild(criarElemento('div', 'aula-meta', detalhes));
  }

  return bloco;
};

const renderizarGradeHorarios = (resultadoEl, itens, docente) => {
  const itensNormalizados = itens
    .map((item) => {
      const diaNormalizado = normalizarDia(item.dia);
      const horaNormalizada = normalizarHoras(item.horas);

      if (!diaNormalizado || !horaNormalizada) return null;

      return {
        ...item,
        diaNormalizado,
        horaNormalizada,
      };
    })
    .filter(Boolean);

  const horasUnicas = [...new Set(itensNormalizados.map((item) => item.horaNormalizada).filter(Boolean))]
    .sort((a, b) => extrairInicioHora(a) - extrairInicioHora(b));

  const diasComAula = DIAS_UTEIS.filter((diaKey) =>
    itensNormalizados.some((item) => item.diaNormalizado === diaKey)
  );

  const cabecalhoTopo = criarElemento('div', 'horario-cabecalho');
  const titulo = criarElemento('h4', 'horario-titulo', 'Horario Semanal: ');
  const nomeDocente = criarElemento('span', 'horario-docente-nome', docente);
  titulo.appendChild(nomeDocente);

  const btnPDF = criarElemento('button', 'btn-simples horario-pdf-btn', '⬇ Baixar');
  btnPDF.type = 'button';

  btnPDF.addEventListener('click', () => {
    const docente = (document.getElementById('horariosSelect')?.value || '').trim();
    if (!docente) return alert('Seleccione um docente.');

    const url = `${WEB_URL}?action=gerarPDFHorarioDocente&docente=${encodeURIComponent(docente)}`;
    window.open(url, '_blank');
  });

  cabecalhoTopo.appendChild(titulo);
  cabecalhoTopo.appendChild(btnPDF);
  resultadoEl.appendChild(cabecalhoTopo);

  const tabela = criarElemento('table', 'horario-tabela');
  const thead = document.createElement('thead');
  const cabecalho = document.createElement('tr');
  cabecalho.appendChild(criarElemento('th', '', 'Horário'));

  diasComAula.forEach((diaKey) => {
    cabecalho.appendChild(criarElemento('th', '', DIA_MAPA[diaKey]));
  });

  thead.appendChild(cabecalho);
  tabela.appendChild(thead);

  const tbody = document.createElement('tbody');

  horasUnicas.forEach((hora) => {
    const row = document.createElement('tr');
    row.appendChild(criarElemento('td', 'horario-hora', hora));

    diasComAula.forEach((diaKey) => {
      const cell = criarElemento('td', 'horario-celula');
      const aulas = itensNormalizados.filter(
        (item) => item.diaNormalizado === diaKey && item.horaNormalizada === hora
      );

      if (aulas.length) {
        aulas.forEach((aula) => cell.appendChild(montarDescricaoAula(aula)));
      } else {
        cell.appendChild(criarElemento('span', 'horario-vazio', '—'));
      }

      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  tabela.appendChild(tbody);
  resultadoEl.appendChild(tabela);
};

// ===============================
// FORMULÁRIO INICIAL
// ===============================
const mostrarFormularioInicial = async () => {
  if (!formPlanoContainer) return;
  if (horariosContainer) horariosContainer.innerHTML = '';
  formPlanoContainer.innerHTML = '';

  const card = criarElemento('div', 'card');
  const titulo = criarElemento('h3', 'card-title', 'Submeter Plano de Disciplina');
  const subtitulo = criarElemento(
    'p',
    'card-text',
    'Selecione o seu nome para consultar as disciplinas e enviar o plano correspondente.'
  );

  const formRow = criarElemento('div', 'form-row');
  const label = criarElemento('label', '', 'Docente');
  label.setAttribute('for', 'docenteSelect');

  const select = criarElemento('select', 'input');
  select.id = 'docenteSelect';
  select.disabled = true;
  select.innerHTML = '<option value="">Selecione o docente</option>';

  // Botão Buscar (SEM formatação)
  const btnBuscar = document.createElement('button');
  btnBuscar.textContent = 'Buscar';
  btnBuscar.id = 'btnBuscarDisciplinas';
  btnBuscar.type = 'button';

  const infoCarregamento = criarElemento(
    'p',
    'loading-docentes-info',
    'Aguarde, carregando a lista.'
  );

  const resultado = criarElemento('div', 'card-grid');
  resultado.id = 'resultadoDisciplinas';

  formRow.appendChild(label);
  formRow.appendChild(select);
  formRow.appendChild(btnBuscar);

  card.appendChild(titulo);
  card.appendChild(subtitulo);
  card.appendChild(formRow);
  card.appendChild(infoCarregamento);
  card.appendChild(resultado);

  formPlanoContainer.appendChild(card);

  // Carregar docentes
  try {
    const docentes = await chamarGS('docentes');
    normalizarDocentes(docentes).forEach((docente) => {
      const option = document.createElement('option');
      option.value = docente;
      option.textContent = docente;
      select.appendChild(option);
    });

    select.disabled = false;
  } catch (e) {
    console.error('Erro ao carregar docentes', e);
  } finally {
    infoCarregamento.style.display = 'none';
  }

  // Buscar disciplinas
  btnBuscar.addEventListener('click', async () => {
    const nomeDocente = select.value;
    if (!nomeDocente) {
      alert('Selecione um docente para continuar.');
      return;
    }

    resultado.innerHTML = '<p>A carregar disciplinas...</p>';

    try {
      const resposta = await chamarGS('buscarPlanoDocente', {
        nomeDocente: nomeDocente,
      });

      renderizarDisciplinas(nomeDocente, resposta?.dados || []);
    } catch (e) {
      console.error(e);
      resultado.innerHTML = '<p>Erro ao carregar disciplinas.</p>';
    }
  });
};

const mostrarSecaoHorarios = async () => {
  if (!horariosContainer) return;
  if (formPlanoContainer) formPlanoContainer.innerHTML = '';

  horariosContainer.innerHTML = '';

  const card = criarElemento('div', 'card');
  const titulo = criarElemento('h3', 'card-title', 'Horários');
  const subtitulo = criarElemento(
    'p',
    'card-text',
    'Selecione o docente e clique em buscar para visualizar o horário semanal.'
  );

  const formRow = criarElemento('div', 'form-row');
  const label = criarElemento('label', '', 'Selecione o seu nome:');
  label.setAttribute('for', 'horariosSelect');

  const select = criarElemento('select', 'input');
  select.id = 'horariosSelect';
  select.disabled = true;
  select.innerHTML = '<option value="">A carregar docentes...</option>';

  const btnBuscar = criarElemento('button', 'btn-simples', 'Buscar');
  btnBuscar.type = 'button';
  btnBuscar.id = 'btnBuscarHorarioDocente';

  const resultado = criarElemento('div', 'horarios-resultado');
  resultado.id = 'horariosResultado';

  formRow.appendChild(label);
  formRow.appendChild(select);
  formRow.appendChild(btnBuscar);

  card.appendChild(titulo);
  card.appendChild(subtitulo);
  card.appendChild(formRow);
  card.appendChild(resultado);

  horariosContainer.appendChild(card);

  btnBuscar.addEventListener('click', async () => {
    const docente = document.getElementById('horariosSelect')?.value.trim() || '';
    if (!docente) {
      resultado.innerHTML = '<p>Seleccione um docente.</p>';
      return;
    }

    resultado.innerHTML = '<p>A carregar horário...</p>';

    try {
      const resposta = await chamarGS('buscarHorarioDocente', { docente });
      if (!resposta?.sucesso) {
        resultado.innerHTML = `<p>${resposta?.erro || 'Erro ao buscar horário do docente.'}</p>`;
        return;
      }

      const itens = Array.isArray(resposta.itens) ? resposta.itens : [];
      resultado.innerHTML = '';

      if (!itens.length) {
        resultado.innerHTML = '<p>Nenhum horário encontrado para o docente seleccionado.</p>';
        return;
      }

      renderizarGradeHorarios(resultado, itens, docente);
    } catch (erro) {
      console.error('Erro ao buscar horário do docente', erro);
      resultado.innerHTML = '<p>Não foi possível buscar o horário neste momento.</p>';
    }
  });

  try {
    const data = await chamarGS('listarDocentesHorarios');
    if (!data?.sucesso) {
      throw new Error(data?.erro || 'Falha ao carregar docentes');
    }

    const docentes = normalizarDocentes(data.docentes);
    select.innerHTML = '<option value="">Seleccione o docente</option>';
    docentes.forEach((docente) => {
      const option = document.createElement('option');
      option.value = docente;
      option.textContent = docente;
      select.appendChild(option);
    });
    select.disabled = false;
  } catch (erro) {
    console.error('Erro ao carregar docentes para horários', erro);
    select.innerHTML = '<option value="">Não foi possível carregar docentes</option>';
    resultado.innerHTML = '<p>Não foi possível carregar a lista de docentes.</p>';
  }
};

// ===============================
// RENDERIZAR DISCIPLINAS
// ===============================
const renderizarDisciplinas = (docente, disciplinas) => {
  const resultado = document.getElementById('resultadoDisciplinas');
  resultado.innerHTML = '';

  if (!Array.isArray(disciplinas) || !disciplinas.length) {
    resultado.innerHTML =
      '<p>Não foram encontradas disciplinas para este docente.</p>';
    return;
  }

  disciplinas.forEach((item) => {
    const card = criarElemento('div', 'card');

    const info = document.createElement('div');
    info.className = 'disciplina-info';

    info.appendChild(
      criarElemento('h3', 'card-title disciplina-nome', item.disciplina || 'Disciplina')
    );
    info.appendChild(
      criarElemento('p', 'card-text curso-nome', `Curso: ${item.curso || '-'}`)
    );
    info.appendChild(
      criarElemento('p', 'card-text regime-nome', `Regime: ${item.regime || '-'}`)
    );

    card.appendChild(info);

    const estado = criarElemento('div');

    if (item.linkPlano) {
      estado.appendChild(criarElemento('p', 'plano-enviado-status', 'Plano enviado'));
      const link = document.createElement('a');
      link.href = item.linkPlano;
      link.target = '_blank';
      link.textContent = 'Ver';
      estado.appendChild(link);
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';

      const btnFile = document.createElement('button');
      btnFile.type = 'button';
      btnFile.className = 'button btn-file';
      btnFile.textContent = 'Escolher ficheiro';
      btnFile.addEventListener('click', () => input.click());

      const fileStatus = document.createElement('span');
      fileStatus.className = 'file-status';
      fileStatus.textContent = 'Nenhum ficheiro anexado';

      const btnEnviar = criarElemento('button', 'button', 'Enviar Plano');

      input.addEventListener('change', () => {
        if (input.files.length > 0) {
          fileStatus.textContent = input.files[0].name;
          fileStatus.classList.add('is-selected');
        } else {
          fileStatus.textContent = 'Nenhum ficheiro anexado';
          fileStatus.classList.remove('is-selected');
        }
      });

      btnEnviar.onclick = async () => {
        if (!input.files[0]) {
          alert('Selecione um PDF.');
          return;
        }

        const linhaPlanilha = item.linha;
        const linhaInvalida =
          linhaPlanilha === undefined ||
          linhaPlanilha === null ||
          linhaPlanilha === 0 ||
          Number.isNaN(Number(linhaPlanilha));

        if (linhaInvalida) {
          alert('Linha da planilha inválida. Contacte a administração.');
          return;
        }

        btnEnviar.disabled = true;
        btnEnviar.textContent = 'A enviar...';

        try {
          const resposta = await enviarPlanoAnaliticoBase64({
            linha: linhaPlanilha,
            docente: docente,
            disciplina: item.disciplina,
            ficheiro: input.files[0],
          });

          if (resposta?.sucesso === true) {
            estado.innerHTML = '<p class="plano-enviado-status">Plano enviado</p>';

            if (resposta.linkPlano) {
              const link = document.createElement('a');
              link.href = resposta.linkPlano;
              link.target = '_blank';
              link.textContent = 'Ver ficheiro';
              estado.appendChild(link);
            }
          } else {
            throw new Error(resposta?.mensagem || 'Falha ao enviar o plano.');
          }
        } catch (e) {
          alert(e?.message || 'Erro ao enviar o plano.');
          btnEnviar.disabled = false;
          btnEnviar.textContent = 'Enviar Plano';
        }
      };

      estado.appendChild(btnFile);
      estado.appendChild(fileStatus);
      estado.appendChild(btnEnviar);
      estado.appendChild(input);
    }

    card.appendChild(estado);
    resultado.appendChild(card);
  });
};

// ===============================
// EVENTO PRINCIPAL
// ===============================
if (btnPlano) {
  btnPlano.addEventListener('click', mostrarFormularioInicial);
}

if (btnHorarios) {
  btnHorarios.addEventListener('click', mostrarSecaoHorarios);
}

botoesNavegacao.forEach((botao) => {
  if (botao.id === 'btnPlano' || botao.id === 'btnHorarios') return;
  botao.addEventListener('click', limparSecoesDocente);
});
