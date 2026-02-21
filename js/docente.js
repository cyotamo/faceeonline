 // ===============================
// Submissão do Plano de Disciplina
// Portal do Docente
// ===============================

const btnPlano = document.getElementById('btnPlano');
const btnHorarios = document.getElementById('btnHorarios');
const formPlanoContainer = document.getElementById('formPlanoContainer');
const horariosContainer = document.getElementById('horariosContainer');

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

// ===============================
// FORMULÁRIO INICIAL
// ===============================
const mostrarFormularioInicial = async () => {
  if (!formPlanoContainer) return;
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
  select.innerHTML = '<option value="">Selecione o docente</option>';

  // Botão Buscar (SEM formatação)
  const btnBuscar = document.createElement('button');
  btnBuscar.textContent = 'Buscar';
  btnBuscar.id = 'btnBuscarDisciplinas';

  const resultado = criarElemento('div', 'card-grid');
  resultado.id = 'resultadoDisciplinas';

  formRow.appendChild(label);
  formRow.appendChild(select);

  card.appendChild(titulo);
  card.appendChild(subtitulo);
  card.appendChild(formRow);
  card.appendChild(btnBuscar);
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
  } catch (e) {
    console.error('Erro ao carregar docentes', e);
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

const mostrarSecaoHorarios = () => {
  if (!horariosContainer) return;

  horariosContainer.innerHTML = '';

  const card = criarElemento('div', 'card');
  const titulo = criarElemento('h3', 'card-title', 'Horários');
  const subtitulo = criarElemento(
    'p',
    'card-text',
    'Selecione uma opção abaixo para buscar horários (dados serão integrados futuramente).'
  );

  const formRow = criarElemento('div', 'form-row');
  const label = criarElemento('label', '', 'Lista de horários');
  label.setAttribute('for', 'horariosSelect');

  const select = criarElemento('select', 'input');
  select.id = 'horariosSelect';
  select.innerHTML = `
    <option value="">Selecione uma opção</option>
    <option value="placeholder">Horário (placeholder)</option>
  `;

  const btnBuscar = criarElemento('button', 'button', 'Buscar');
  btnBuscar.type = 'button';

  formRow.appendChild(label);
  formRow.appendChild(select);

  card.appendChild(titulo);
  card.appendChild(subtitulo);
  card.appendChild(formRow);
  card.appendChild(btnBuscar);

  horariosContainer.appendChild(card);
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
      criarElemento('h3', 'card-title', item.disciplina || 'Disciplina')
    );
    info.appendChild(
      criarElemento('p', 'card-text', `Curso: ${item.curso || '-'}`)
    );
    info.appendChild(
      criarElemento('p', 'card-text', `Regime: ${item.regime || '-'}`)
    );

    card.appendChild(info);

    const estado = criarElemento('div');

    if (item.linkPlano) {
      estado.appendChild(criarElemento('p', '', 'Plano submetido'));
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
        } else {
          fileStatus.textContent = 'Nenhum ficheiro anexado';
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
            estado.innerHTML = '<p>Plano já submetido</p>';

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
