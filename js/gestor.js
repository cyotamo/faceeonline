const mapaAbas = {
    tema_total: { aba: "Temas", filtro: "todos" },
    tema_homologados: { aba: "Temas", filtro: "homologados" },
    tema_nao_homologados: { aba: "Temas", filtro: "naoHomologados" },
    monografia_total: { aba: "MonografiaFinal", filtro: "todos" },
    monografia_aprovadas: { aba: "MonografiaFinal", filtro: "aprovados" },
    cred_total: { aba: "Credencial", filtro: "todos" },
    cred_aprovados: { aba: "Credencial", filtro: "aprovados" }
};

let estadoCamposBloqueados = [];
let modoTabelaGestao = "geral";
// valores possíveis:
// "geral"
// "atribuirSupervisor"
// "homologarSupervisor"

async function carregarDadosBloqueio() {
    try {
     const resposta = await fetch(WEB_URL, {
    method: "POST",
    body: new URLSearchParams({ action: "carregarEstadoCampos" })
});

        const dados = await resposta.json();

        estadoCamposBloqueados = Array.isArray(dados) ? dados : [];
        aplicarDadosBloqueio();
    } catch (err) {
        console.error("Erro ao carregar estado dos campos:", err);
    }
}

function aplicarDadosBloqueio() {
    if (!estadoCamposBloqueados || estadoCamposBloqueados.length === 0) {
        return;
    }

    estadoCamposBloqueados.forEach(item => {
        const idTema = (item.idTema || "").toString().trim();
        const idEstudante = (item.idEstudante || item.numeroEstudante || "").toString().trim();
        const seletorId = idTema ? `[data-id="${idTema}"]` : idEstudante ? `[data-id="${idEstudante}"]` : null;
        const seletorRow = item.row ? `[data-row="${item.row}"]` : null;
        const seletorBase = seletorId || seletorRow;

        if (!seletorBase) {
            return;
        }

        if (item.parecer) {
            document.querySelectorAll(`select.parecer${seletorBase}`).forEach(select => {
                select.disabled = true;
            });
        }

        if (item.supervisor) {
            document.querySelectorAll(`select.supervisorProposto${seletorBase}`).forEach(select => {
                select.disabled = true;
            });
        }

        if (item.homologacao) {
            document.querySelectorAll(`select.homologacao${seletorBase}`).forEach(select => {
                select.disabled = true;
            });
        }

        if (item.observacoes) {
            document.querySelectorAll(`textarea.observacoesTema${seletorBase}`).forEach(textarea => {
                textarea.disabled = true;
            });
        }
    });
}

function activarLoadingGuardar(botao, textoLoading = "A guardar...") {
  if (!botao) return;
  if (botao.disabled) return; // já está em loading, não sobrescreve
  botao.dataset.textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = textoLoading;
}

function desactivarLoadingGuardar(botao) {
    if (!botao) return;
    botao.disabled = false;
    botao.textContent = botao.dataset.textoOriginal || "Guardar";
}

let paginaAtual = 1;
const linhasPorPagina = 10;
let totalPaginas = 1;
let dadosGestaoGeral = [];

function mostrarCarregamentoAtribuirSupervisor() {
    const loading = document.getElementById("loadingAtribuirSupervisor");
    if (loading) {
        loading.hidden = false;
    }
}

function mostrarLoadingPainelGestor(msg = "A carregar…") {
    const box = document.getElementById("tabelaGestaoGeral");
    if (!box) return;
    // IMPORTANTÍSSIMO: o loading tem de ser inserido DEPOIS de limpar
    box.innerHTML = `<div class="loading" id="loadingPainelGestor">${msg}</div>`;
}

function esconderCarregamentoAtribuirSupervisor() {
    const loading = document.getElementById("loadingAtribuirSupervisor");
    if (loading) {
        loading.hidden = true;
    }
}

function mostrarCarregamento() {
    mostrarCarregamentoAtribuirSupervisor();
}

function esconderCarregamento() {
    esconderCarregamentoAtribuirSupervisor();
}

function pararCarregamento() {
    esconderCarregamento();
}

function formatarDataCurta(valor) {
    if (!valor) return valor;

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return valor;
    }

    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const anoCurto = String(data.getFullYear()).slice(-2);

    return `${dia}-${mes}-${anoCurto}`;
}

function formatarDataCompleta(valor) {
    if (!valor) return "";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return String(valor);
    }

    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();

    return `${dia}-${mes}-${ano}`;
}

function formatarDataDiaMesAno(valor) {
    if (!valor) return "";

    const valorTexto = String(valor).trim();
    const data = new Date(valorTexto);

    if (!Number.isNaN(data.getTime())) {
        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    const correspondencia = valorTexto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (correspondencia) {
        const [, ano, mes, dia] = correspondencia;
        return `${dia}/${mes}/${ano}`;
    }

    return valorTexto;
}

function normalizarCampo(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obterOpcoesSupervisores(item) {
    const opcoes = [];

    if (item.colI) opcoes.push(item.colI);
    if (item.colP && !opcoes.includes(item.colP)) opcoes.push(item.colP);
    if (item.colQ && !opcoes.includes(item.colQ)) opcoes.push(item.colQ);
    if (item.colR && !opcoes.includes(item.colR)) opcoes.push(item.colR);
    if (item.colS && !opcoes.includes(item.colS)) opcoes.push(item.colS);
    if (item.colT && !opcoes.includes(item.colT)) opcoes.push(item.colT);
    if (item.colU && !opcoes.includes(item.colU)) opcoes.push(item.colU);
    if (item.colV && !opcoes.includes(item.colV)) opcoes.push(item.colV);
    if (item.colW && !opcoes.includes(item.colW)) opcoes.push(item.colW);
    if (item.colX && !opcoes.includes(item.colX)) opcoes.push(item.colX);
    if (item.colY && !opcoes.includes(item.colY)) opcoes.push(item.colY);
    if (item.colZ && !opcoes.includes(item.colZ)) opcoes.push(item.colZ);

    return opcoes;
}

function opcoesSupervisoresHTML(valorSelecionado, opcoes) {
    if (!Array.isArray(opcoes) || opcoes.length === 0) {
        return `<option value="">Seleccione…</option>`;
    }

    return opcoes
        .map(opcao => {
            const valor = String(opcao);
            const selecionado = valorSelecionado && valorSelecionado === valor ? " selected" : "";
            return `<option${selecionado}>${valor}</option>`;
        })
        .join("");
}

const estatisticasContainer = document.getElementById("estatisticasContainer");
const secaoDefesas = document.getElementById("secaoDefesas");
const modalEdicaoDefesa = document.getElementById("modalEdicaoDefesa");
const selectSituacaoDefesa = document.getElementById("defesaSituacao");
const selectPresidenteDefesa = document.getElementById("defesaPresidente");
const selectArguenteDefesa = document.getElementById("defesaArguente");
const btnGuardarSituacaoDefesa = document.getElementById("btnGuardarSituacaoDefesa");

const SITUACOES_DEFESA = [
    "Em avaliação no RA",
    "Em avaliação pela banca",
    "Defendida"
];

const MAPA_CAMPOS_SITUACAO_DEFESA = {
    "Em avaliação no RA": ["enviadoRA", "enviadoAoRA", "avaliacaoRA"],
    "Em avaliação pela banca": ["banca", "avaliacaoBanca"],
    Defendida: ["defendido"]
};

const DOCENTES_DEFESA_TESTE = [
    "Prof. Alberto Manuel",
    "Prof. Carla João",
    "Prof. Ernesto Paulo",
    "Prof. Lúcia Armando"
];

let registoDefesaEmEdicao = null;
let indiceDefesaEmEdicao = null;
let defesasCache = [];
let paginaAtualDefesas = 1;
const REGISTOS_POR_PAGINA_DEFESAS = 12;

function actualizarPaginacaoDefesas(totalRegistos = 0) {
    const infoPaginacao = document.getElementById("infoPaginacaoDefesas");
    const btnAnterior = document.getElementById("btnDefesasPaginaAnterior");
    const btnSeguinte = document.getElementById("btnDefesasPaginaSeguinte");
    const totalPaginasDefesas = Math.max(1, Math.ceil(totalRegistos / REGISTOS_POR_PAGINA_DEFESAS));

    if (paginaAtualDefesas > totalPaginasDefesas) {
        paginaAtualDefesas = totalPaginasDefesas;
    }

    if (paginaAtualDefesas < 1) {
        paginaAtualDefesas = 1;
    }

    if (infoPaginacao) {
        infoPaginacao.textContent = `${paginaAtualDefesas} de ${totalPaginasDefesas}`;
    }

    if (btnAnterior) {
        btnAnterior.disabled = paginaAtualDefesas <= 1 || totalRegistos === 0;
    }

    if (btnSeguinte) {
        btnSeguinte.disabled = paginaAtualDefesas >= totalPaginasDefesas || totalRegistos === 0;
    }
}

function mostrarMensagemTabelaDefesa(mensagem) {
    const tbody = document.getElementById("listaDefesas");
    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="10">${escaparHTML(mensagem)}</td>
        </tr>
    `;
    paginaAtualDefesas = 1;
    actualizarPaginacaoDefesas(0);
}

function defesaEstaAgendada(registo = {}) {
    const dataAgendada = String(registo.dataAgendada || registo.data_agendada || "").trim();
    if (dataAgendada) {
        return true;
    }

    const presidente = String(registo.presidente || "").trim();
    const arguente = String(registo.arguente || "").trim();
    const hora = String(registo.hora || registo.Hora || "").trim();
    const sala = String(registo.sala || registo.Sala || "").trim();

    return Boolean(presidente && arguente && hora && sala);
}

function actualizarEstadoBotaoSituacaoDefesa() {
    if (!btnGuardarSituacaoDefesa || !selectSituacaoDefesa) {
        return;
    }

    const temSituacaoSelecionada = String(selectSituacaoDefesa.value || "").trim() !== "";
    btnGuardarSituacaoDefesa.disabled = !temSituacaoSelecionada;
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function preencherSelectComOpcoes(select, opcoes, valorSelecionado = "") {
    if (!select) {
        return;
    }

    const opcoesNormalizadas = Array.isArray(opcoes) ? opcoes : [];
    const valorAtual = String(valorSelecionado ?? "").trim();

    select.innerHTML = opcoesNormalizadas
        .map((opcao) => {
            const valor = String(opcao ?? "").trim();
            const selected = valorAtual && valorAtual === valor ? " selected" : "";
            return `<option value="${escaparHTML(valor)}"${selected}>${escaparHTML(valor)}</option>`;
        })
        .join("");

    if (!valorAtual && opcoesNormalizadas.length) {
        select.selectedIndex = 0;
    }
}

function preencherSelectSituacaoDefesa(registo = {}, valorSelecionado = "") {
    if (!selectSituacaoDefesa) {
        return;
    }

    const temValor = (valor) => String(valor ?? "").trim() !== "";
    const situacaoEstaBloqueada = (situacao) => {
        const campos = MAPA_CAMPOS_SITUACAO_DEFESA[situacao] || [];
        return campos.some((campo) => temValor(registo[campo]));
    };

    const valorActual = String(valorSelecionado ?? "").trim();
    const valorValido = !valorActual || !situacaoEstaBloqueada(valorActual);

    const opcoes = [
        `<option value=""${valorValido ? "" : " selected"}>Seleccione uma nova situação…</option>`
    ];

    SITUACOES_DEFESA.forEach((situacao) => {
        const selected = valorValido && valorActual === situacao ? " selected" : "";
        const disabled = situacaoEstaBloqueada(situacao) ? " disabled" : "";
        opcoes.push(
            `<option value="${escaparHTML(situacao)}"${selected}${disabled}>${escaparHTML(situacao)}</option>`
        );
    });

    selectSituacaoDefesa.innerHTML = opcoes.join("");

    if (!valorActual && SITUACOES_DEFESA.length) {
        selectSituacaoDefesa.selectedIndex = 0;
    }

    actualizarEstadoBotaoSituacaoDefesa();
}

function renderTabelaDefesa(lista = []) {
    const tbody = document.getElementById("listaDefesas");
    if (!tbody) {
        return;
    }

    const listaSegura = Array.isArray(lista) ? lista : [];
    const totalPaginasDefesas = Math.max(1, Math.ceil(listaSegura.length / REGISTOS_POR_PAGINA_DEFESAS));
    paginaAtualDefesas = Math.min(Math.max(paginaAtualDefesas, 1), totalPaginasDefesas);

    if (!listaSegura.length) {
        mostrarMensagemTabelaDefesa("Nenhum registo de defesa encontrado.");
        return;
    }

    const inicio = (paginaAtualDefesas - 1) * REGISTOS_POR_PAGINA_DEFESAS;
    const fim = inicio + REGISTOS_POR_PAGINA_DEFESAS;
    const paginaDados = listaSegura.slice(inicio, fim);

    tbody.innerHTML = paginaDados.map((item, index) => {
        const itemSeguro = {
            data: item.data || "",
            nome: item.nome || "",
            numero: item.numero || "",
            contacto1: item.contacto1 || "",
            contacto2: item.contacto2 || "",
            curso: item.curso || "",
            supervisor: item.supervisor || "",
            situacao: item.situacao || ""
        };
        const linkPdf = item.link || "";
        const dataAgendada = item.dataAgendada || "";
        const linkPdfFinal = linkPdf || item.linkPDF || item.linkPdf || item.pdf || item.PDF || "";
        const dataAgendadaFinal = dataAgendada || item.data_agendada || "";
        const situacaoTabela = String(itemSeguro.situacao || "").trim() || "Aguardando actualização";
        const situacaoHtml = dataAgendadaFinal
            ? `Agendado para o dia: ${escaparHTML(formatarDataDiaMesAno(dataAgendadaFinal))}`
            : escaparHTML(situacaoTabela);
        const linkPdfHtml = linkPdfFinal
            ? `<a class="pdf-icon" href="${escaparHTML(linkPdfFinal)}" target="_blank" rel="noopener noreferrer" aria-label="Ver PDF">📄</a>`
            : "—";

        return `
            <tr>
                <td>${escaparHTML(formatarDataCurta(itemSeguro.data))}</td>
                <td class="col-nome">${escaparHTML(itemSeguro.nome)}</td>
                <td>${escaparHTML(itemSeguro.numero)}</td>
                <td>${escaparHTML(itemSeguro.contacto1)}</td>
                <td>${escaparHTML(itemSeguro.contacto2)}</td>
                <td class="col-curso">${escaparHTML(itemSeguro.curso)}</td>
                <td class="col-supervisor">${escaparHTML(itemSeguro.supervisor)}</td>
                <td>${situacaoHtml}</td>
                <td class="col-pdf">${linkPdfHtml}</td>
                <td class="col-acao">
                    <button
                        type="button"
                        class="btn-editar-defesa"
                        data-index="${inicio + index}"
                    >Actualizar</button>
                </td>
            </tr>
        `;
    }).join("");

    actualizarPaginacaoDefesas(listaSegura.length);
}

function abrirModalEdicaoDefesa(registo = {}, indice = null) {
    if (!modalEdicaoDefesa) {
        return;
    }

    indiceDefesaEmEdicao = Number.isInteger(indice) ? indice : null;

    const dataAgendadaRegisto = registo.dataAgendada || registo.data_agendada || "";

    registoDefesaEmEdicao = {
        ...registo,
        nome: registo.nome || "",
        supervisor: registo.supervisor || "",
        situacao: registo.situacao || "",
        presidente: registo.presidente || DOCENTES_DEFESA_TESTE[0],
        arguente: registo.arguente || DOCENTES_DEFESA_TESTE[1] || DOCENTES_DEFESA_TESTE[0],
        dataAgendada: dataAgendadaRegisto,
        sala: registo.sala || registo.Sala || "",
        hora: registo.hora || registo.Hora || ""
    };

    const inputNome = document.getElementById("defesaNome");
    const inputSupervisor = document.getElementById("defesaSupervisor");
    const inputDataAgendada = document.getElementById("defesaDataAgendada");
    const inputSala = document.getElementById("defesaSala");
    const inputHora = document.getElementById("defesaHora");
    const btnAgendar = document.getElementById("btnGuardarEdicaoDefesa");

    const defesaJaAgendada = defesaEstaAgendada(registoDefesaEmEdicao);

    if (inputNome) inputNome.value = registoDefesaEmEdicao.nome;
    if (inputSupervisor) inputSupervisor.value = registoDefesaEmEdicao.supervisor;
    if (inputDataAgendada) inputDataAgendada.value = registoDefesaEmEdicao.dataAgendada;
    if (inputSala) inputSala.value = registoDefesaEmEdicao.sala;
    if (inputHora) inputHora.value = registoDefesaEmEdicao.hora;

    if (inputDataAgendada) inputDataAgendada.disabled = defesaJaAgendada;
    if (inputSala) inputSala.disabled = defesaJaAgendada;
    if (inputHora) inputHora.disabled = defesaJaAgendada;
    if (selectPresidenteDefesa) selectPresidenteDefesa.disabled = defesaJaAgendada;
    if (selectArguenteDefesa) selectArguenteDefesa.disabled = defesaJaAgendada;
    if (btnAgendar) {
        btnAgendar.disabled = defesaJaAgendada;
        btnAgendar.textContent = defesaJaAgendada ? "Já agendada" : "Agendar";
    }

    preencherSelectSituacaoDefesa(registoDefesaEmEdicao, registoDefesaEmEdicao.situacao);
    preencherSelectComOpcoes(selectPresidenteDefesa, DOCENTES_DEFESA_TESTE, registoDefesaEmEdicao.presidente);
    preencherSelectComOpcoes(selectArguenteDefesa, DOCENTES_DEFESA_TESTE, registoDefesaEmEdicao.arguente);

    modalEdicaoDefesa.style.display = "flex";
    modalEdicaoDefesa.setAttribute("aria-hidden", "false");
}

function fecharModalEdicaoDefesa() {
    if (!modalEdicaoDefesa) {
        return;
    }

    modalEdicaoDefesa.style.display = "none";
    modalEdicaoDefesa.setAttribute("aria-hidden", "true");
    registoDefesaEmEdicao = null;
    indiceDefesaEmEdicao = null;
}

function actualizarSituacaoNaTabela(situacao) {
    if (!Number.isInteger(indiceDefesaEmEdicao) || !defesasCache[indiceDefesaEmEdicao]) {
        return;
    }

    defesasCache[indiceDefesaEmEdicao].situacao = situacao;
    renderTabelaDefesa(defesasCache);
}

async function guardarSituacaoDefesa() {
    if (!registoDefesaEmEdicao) {
        return;
    }

    const situacao = selectSituacaoDefesa?.value || "";
    if (!situacao) {
        actualizarEstadoBotaoSituacaoDefesa();
        return;
    }

    const camposSituacao = MAPA_CAMPOS_SITUACAO_DEFESA[situacao] || [];
    const situacaoJaGuardada = camposSituacao.some((campo) => String(registoDefesaEmEdicao?.[campo] ?? "").trim() !== "");
    if (situacaoJaGuardada) {
        alert("Esta situação já foi guardada para este estudante. Escolha outra situação disponível.");
        preencherSelectSituacaoDefesa(registoDefesaEmEdicao, "");
        actualizarEstadoBotaoSituacaoDefesa();
        return;
    }

    const payload = new URLSearchParams({
        action: "guardarSituacaoDefesa",
        situacao,
        id: registoDefesaEmEdicao.id || registoDefesaEmEdicao.idDefesa || "",
        row: registoDefesaEmEdicao.row || "",
        numero: registoDefesaEmEdicao.numero || "",
        nome: registoDefesaEmEdicao.nome || ""
    });

    activarLoadingGuardar(btnGuardarSituacaoDefesa, "A actualizar");

    try {
        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: payload
        });

        const resultado = await resposta.json();
        if (!resultado || !(resultado.sucesso === true || resultado.sucesso === "true")) {
            throw new Error(resultado?.mensagem || "Não foi possível guardar a situação.");
        }

        registoDefesaEmEdicao.situacao = situacao;
        const marcador = new Date().toISOString();
        camposSituacao.forEach((campo) => {
            registoDefesaEmEdicao[campo] = marcador;
            if (Number.isInteger(indiceDefesaEmEdicao) && defesasCache[indiceDefesaEmEdicao]) {
                defesasCache[indiceDefesaEmEdicao][campo] = marcador;
            }
        });

        actualizarSituacaoNaTabela(situacao);
        preencherSelectSituacaoDefesa(registoDefesaEmEdicao, "");
        actualizarEstadoBotaoSituacaoDefesa();
    } catch (erro) {
        console.error("Erro ao guardar situação da defesa:", erro);
        alert(erro.message || "Erro ao guardar situação da defesa.");
    } finally {
        desactivarLoadingGuardar(btnGuardarSituacaoDefesa);
    }
}

async function guardarEdicaoDefesa() {
    if (!registoDefesaEmEdicao) {
        return;
    }

    const inputDataAgendada = document.getElementById("defesaDataAgendada");
    const inputSala = document.getElementById("defesaSala");
    const inputHora = document.getElementById("defesaHora");

    const dadosEditados = {
        action: "guardarSituacaoDefesa",
        id: registoDefesaEmEdicao.id || registoDefesaEmEdicao.idDefesa || "",
        row: registoDefesaEmEdicao.row || "",
        numero: registoDefesaEmEdicao.numero || "",
        nome: registoDefesaEmEdicao.nome,
        supervisor: registoDefesaEmEdicao.supervisor,
        situacao: selectSituacaoDefesa?.value || registoDefesaEmEdicao.situacao || "",
        presidente: selectPresidenteDefesa?.value || "",
        arguente: selectArguenteDefesa?.value || "",
        dataAgendada: inputDataAgendada?.value || "",
        sala: inputSala?.value || "",
        hora: inputHora?.value || ""
    };

    const camposObrigatorios = [
        { campo: "presidente", etiqueta: "Presidente" },
        { campo: "arguente", etiqueta: "Arguente" },
        { campo: "dataAgendada", etiqueta: "Data agendada" },
        { campo: "hora", etiqueta: "Hora" },
        { campo: "sala", etiqueta: "Sala" }
    ];

    const campoEmFalta = camposObrigatorios.find(({ campo }) => String(dadosEditados[campo] ?? "").trim() === "");
    if (campoEmFalta) {
        alert(`O campo \"${campoEmFalta.etiqueta}\" é obrigatório.`);
        return;
    }

    const payload = new URLSearchParams(dadosEditados);

    console.log("[Defesa] Payload preparado:", Object.fromEntries(payload.entries()));
    console.log("[Defesa] Edição preparada:", dadosEditados);

    const btnGuardar = document.getElementById("btnGuardarEdicaoDefesa");
    activarLoadingGuardar(btnGuardar, "A agendar");

    try {
        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: payload
        });

        const resultado = await resposta.json();
        console.log("[Defesa] Resposta do back:", resultado);

        if (!resultado.sucesso) {
            alert(resultado.mensagem || "Erro ao guardar dados da defesa.");
            return;
        }

        registoDefesaEmEdicao = {
            ...registoDefesaEmEdicao,
            ...dadosEditados
        };
        if (Number.isInteger(indiceDefesaEmEdicao) && defesasCache[indiceDefesaEmEdicao]) {
            defesasCache[indiceDefesaEmEdicao] = {
                ...defesasCache[indiceDefesaEmEdicao],
                ...dadosEditados
            };
        }
        renderTabelaDefesa(defesasCache);
        fecharModalEdicaoDefesa();
    } catch (erro) {
        console.error("[Defesa] Erro ao guardar edição:", erro);
        alert("Erro de comunicação com o servidor ao guardar a defesa.");
    } finally {
        desactivarLoadingGuardar(btnGuardar);
    }
}

function configurarEventosModalDefesa() {
    const btnFechar = document.getElementById("btnFecharModalDefesa");
    const btnGuardar = document.getElementById("btnGuardarEdicaoDefesa");
    const tbodyDefesas = document.getElementById("listaDefesas");

    btnFechar?.addEventListener("click", fecharModalEdicaoDefesa);
    btnGuardar?.addEventListener("click", guardarEdicaoDefesa);
    btnGuardarSituacaoDefesa?.addEventListener("click", guardarSituacaoDefesa);
    selectSituacaoDefesa?.addEventListener("change", actualizarEstadoBotaoSituacaoDefesa);
    actualizarEstadoBotaoSituacaoDefesa();

    modalEdicaoDefesa?.addEventListener("click", (event) => {
        if (event.target === modalEdicaoDefesa) {
            fecharModalEdicaoDefesa();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalEdicaoDefesa?.style.display === "flex") {
            fecharModalEdicaoDefesa();
        }
    });

    tbodyDefesas?.addEventListener("click", (event) => {
        const botaoEditar = event.target.closest(".btn-editar-defesa");
        if (!botaoEditar) {
            return;
        }

        const index = Number.parseInt(botaoEditar.dataset.index, 10);
        if (Number.isNaN(index) || !defesasCache[index]) {
            return;
        }

        abrirModalEdicaoDefesa(defesasCache[index], index);
    });

    document.getElementById("btnDefesasPaginaAnterior")?.addEventListener("click", () => {
        if (paginaAtualDefesas <= 1) {
            return;
        }
        paginaAtualDefesas -= 1;
        renderTabelaDefesa(defesasCache);
    });

    document.getElementById("btnDefesasPaginaSeguinte")?.addEventListener("click", () => {
        const totalPaginasDefesas = Math.max(1, Math.ceil(defesasCache.length / REGISTOS_POR_PAGINA_DEFESAS));
        if (paginaAtualDefesas >= totalPaginasDefesas) {
            return;
        }
        paginaAtualDefesas += 1;
        renderTabelaDefesa(defesasCache);
    });
}

window.abrirModalEdicaoDefesa = abrirModalEdicaoDefesa;
window.fecharModalEdicaoDefesa = fecharModalEdicaoDefesa;
window.guardarSituacaoDefesa = guardarSituacaoDefesa;
window.guardarEdicaoDefesa = guardarEdicaoDefesa;
window.renderTabelaDefesa = renderTabelaDefesa;
configurarEventosModalDefesa();

function esconderEstatisticas() {
    estatisticasContainer.style.display = "none";
}

function esconderSecaoDefesas() {
    if (secaoDefesas) {
        secaoDefesas.style.display = "none";
    }
}

function mostrarSecaoDefesas() {
    if (secaoDefesas) {
        secaoDefesas.style.display = "block";
    }
}

function mostrarTabelaGestaoGeral() {
    const tabelaGestaoGeral = document.getElementById("tabelaGestaoGeral");
    if (tabelaGestaoGeral) {
        tabelaGestaoGeral.style.display = "block";
    }
}

function esconderTabelaGestaoGeral() {
    const tabelaGestaoGeral = document.getElementById("tabelaGestaoGeral");
    if (tabelaGestaoGeral) {
        tabelaGestaoGeral.style.display = "none";
    }
}

function reaplicarRestricoesUI() {
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
}

// Tema Monografia
document.getElementById("btnGestaoGeral").addEventListener("click", () => {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    modoTabelaGestao = "geral";
    const tabelaGestaoGeral = document.getElementById("tabelaGestaoGeral");
    if (tabelaGestaoGeral) {
        tabelaGestaoGeral.innerHTML = '<div id="loadingAtribuirSupervisor" class="loading-local" hidden>A carregar…</div>';
    }
    mostrarCarregamentoAtribuirSupervisor();
    carregarGestaoGeral();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Monografia Final
document.getElementById("btnMonografiaFinal")?.addEventListener("click", () => {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    mostrarLoadingPainelGestor("A carregar…");
    carregarMonografiaFinal();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Defesa
document.getElementById("btnDefesa").addEventListener("click", () => {
    esconderEstatisticas();
    esconderTabelaGestaoGeral();
    carregarDefesas();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// --- COPY-PASTE FUNCIONALIDADE PARA OS NOVOS BOTÕES ---

// Botão Parecer
document.getElementById("btnParecerTec").addEventListener("click", () => {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    mostrarLoadingPainelGestor("A carregar…");
    carregarParecer();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});


// Botão Atribuir Supervisor
document.getElementById("btnAtribuirSuperv").addEventListener("click", function () {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    modoTabelaGestao = "atribuirSupervisor";
    mostrarLoadingPainelGestor("A carregar…");
    carregarGestaoGeral();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Botão Homologar Supervisor
document.getElementById("btnHomologarSuperv").addEventListener("click", function () {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    modoTabelaGestao = "homologarSupervisor";
    mostrarLoadingPainelGestor("A carregar…");
    carregarGestaoGeral();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Botão Planos Analíticos
document.getElementById("btnPlanosAnaliticos").addEventListener("click", () => {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    mostrarLoadingPainelGestor("A carregar…");
    carregarPlanosAnaliticos();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});



// Credencial Pesquisa
document.getElementById("btnCredencialPesquisa").addEventListener("click", () => {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    mostrarLoadingPainelGestor("A carregar…");
    carregarCredencialPesquisa();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Estágios
document.getElementById("btnCredencialEstagio").addEventListener("click", () => {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    mostrarLoadingPainelGestor("A carregar…");
    carregarCredenciaisEstagioGestor();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Listas e Estatísticas (MOSTRA o container)
document.getElementById("btnEstatisticas").addEventListener("click", () => {
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    mostrarCarregamentoAtribuirSupervisor();
    const tabelaGestaoGeral = document.getElementById("tabelaGestaoGeral");
    if (tabelaGestaoGeral) tabelaGestaoGeral.innerHTML = "";
    carregarEstatisticas();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

const tabelaGestaoGeral = document.getElementById("tabelaGestaoGeral");
if (tabelaGestaoGeral) {
    tabelaGestaoGeral.addEventListener("click", async (e) => {
        const btn = e.target.closest(".btn-atribuir-supervisor");
        if (!btn) return;

        if (modoTabelaGestao !== "atribuirSupervisor") return;

        const tr = btn.closest("tr");
        const select = tr?.querySelector("select.supervisorProposto");

        const supervisor = (select?.value || "").trim();
        const idEstudante = (btn.dataset.estudanteId || "").trim();
        const row = (btn.dataset.row || "").trim();

        if (!supervisor) {
            alert("Seleccione um supervisor.");
            return;
        }

        if (!idEstudante && !row) {
            alert("Não foi possível identificar o estudante (sem ID/row).");
            return;
        }

        btn.disabled = true;
        const textoOriginal = btn.textContent;
        btn.textContent = "A guardar...";

        try {
            const dados = new URLSearchParams();
            dados.append("action", "atribuirSupervisorLinha");
            dados.append("supervisor", supervisor);

            if (idEstudante) dados.append("idEstudante", idEstudante);
            if (row) dados.append("row", row);

            const resp = await fetch(WEB_URL, { method: "POST", body: dados });
            const json = await resp.json();

            if (!json.sucesso) throw new Error(json.mensagem || "Erro.");

            select.disabled = true;
            btn.textContent = "Atribuído";
            btn.classList.add("ok");
        } catch (err) {
            console.error(err);
            alert(err.message || "Erro ao atribuir supervisor.");
            btn.disabled = false;
            btn.textContent = textoOriginal;
        }
    });
}

document.addEventListener("DOMContentLoaded", esconderCarregamento);

// Função para mostrar o container das Estatísticas
function carregarEstatisticas() {

  // 1. Esconder outros conteúdos (se existirem)
  const tabelaGestaoGeral = document.getElementById("tabelaGestaoGeral");
  if (tabelaGestaoGeral) tabelaGestaoGeral.innerHTML = "";  // limpa o conteúdo

  // 2. Oculta outros containers (caso existam no seu script)
  const estatisticasContainer = document.getElementById("estatisticasContainer");

  // Opcional: esconder containers de outros módulos, se existirem no código
  // Exemplo:
  // document.getElementById("containerMonografiaFinal").style.display = "none";

  // 3. Mostrar o container das estatísticas
  estatisticasContainer.style.display = "block";
  esconderCarregamento();
  reaplicarRestricoesUI();
}

document.getElementById("btnBuscarEstatisticas").addEventListener("click", async () => {
    const parametros = obterParametrosRelatorio();

    const erroValidacao = validarParametrosRelatorio(parametros);
    if (erroValidacao) {
        alert(erroValidacao);
        if (window.aplicarRestricoesUI && window.userEmail) {
            aplicarRestricoesUI(window.userEmail);
        }
        return;
    }

    actualizarEstadoRelatorio("A gerar relatório…");

    try {
        const resposta = await solicitarDadosRelatorio(parametros);
        const url = extrairUrlRelatorio(resposta);

        if (resposta?.sucesso === false) {
            throw new Error(resposta?.mensagem || resposta?.erro || "A geração do relatório falhou.");
        }

        if (!url) {
            throw new Error("Nenhum link do PDF foi retornado pelo servidor.");
        }

        mostrarLinkRelatorio(url);
    } catch (erro) {
        console.error("Erro ao gerar relatório:", erro);
        actualizarEstadoRelatorio("Ocorreu um erro ao gerar o relatório. Tente novamente.", true);
    } finally {
        if (window.aplicarRestricoesUI && window.userEmail) {
            aplicarRestricoesUI(window.userEmail);
        }
    }
});

function obterParametrosRelatorio() {
    const tipoSelect = document.getElementById("tipoRelatorio");
    const inicioInput = document.getElementById("periodoInicio");
    const fimInput = document.getElementById("periodoFim");

    return {
        tipo: tipoSelect ? tipoSelect.value : "",
        inicio: inicioInput ? inicioInput.value : "",
        fim: fimInput ? fimInput.value : ""
    };
}

function validarParametrosRelatorio({ tipo, inicio, fim }) {
    if (!tipo || !inicio || !fim) {
        return "Selecione o tipo de relatório e o período completo.";
    }

    if (!mapaAbas[tipo]) {
        return "O tipo de relatório seleccionado não é válido.";
    }

    return "";
}

function construirPayloadRelatorio({ tipo, inicio, fim }) {
    const parametros = new URLSearchParams();
    parametros.append("action", "gerarRelatorio");
    parametros.append("tipo", tipo);
    parametros.append("inicio", inicio);
    parametros.append("fim", fim);
    return parametros;
}

async function solicitarDadosRelatorio(parametros) {
    const resposta = await fetch(WEB_URL, {
        method: "POST",
        body: construirPayloadRelatorio(parametros)
    });

    const raw = await resposta.text();
    console.log("HTTP", resposta.status, raw);

    let data = null;
    try {
        data = JSON.parse(raw);
    } catch (erro) {
        data = null;
    }

    if (!resposta.ok || data?.sucesso === false) {
        throw new Error(data?.mensagem || raw || `HTTP ${resposta.status}`);
    }

    return data;
}

function extrairUrlRelatorio(resposta) {
    if (!resposta || typeof resposta !== "object") {
        return "";
    }

    const chavesUrl = ["url", "link", "urlPDF", "linkPDF"];
    for (const chave of chavesUrl) {
        if (resposta[chave]) {
            return resposta[chave];
        }
    }

    return "";
}

function actualizarEstadoRelatorio(mensagem, isErro = false) {
    const areaLink = document.getElementById("resultadoRelatorio");
    if (!areaLink) return;

    const cor = isErro ? "red" : "inherit";
    areaLink.innerHTML = `<p style="color:${cor};">${mensagem}</p>`;
    reaplicarRestricoesUI();
}

function mostrarLinkRelatorio(url) {
    const areaLink = document.getElementById("resultadoRelatorio");
    if (!areaLink) return;

    areaLink.innerHTML = `
        <p>✔ Relatório gerado com sucesso!</p>
        <a href="${url}" target="_blank" style="color:blue;font-weight:bold;">
            👉 Baixar PDF do Relatório
        </a>
    `;
    reaplicarRestricoesUI();
}

function normalizarTipoRelatorioAnaliticos(tipo) {
    if (!tipo) return "";
    return tipo.replace(/-/g, "_");
}

function atualizarEstadoRelatorioAnaliticos(container, mensagem, isErro = false) {
    if (!container) return;
    const estado = container.querySelector("[data-relatorio-estado]");
    if (!estado) return;
    estado.textContent = mensagem;
    estado.style.color = isErro ? "red" : "inherit";
}

function definirLoadingRelatorioAnaliticos(container, botaoAtivo, emLoading) {
    if (!container) return;
    const botoes = container.querySelectorAll(".btn-relatorio-analiticos");

    botoes.forEach(botao => {
        const isBotaoAtivo = botao === botaoAtivo;

        if (emLoading) {
            if (isBotaoAtivo && !botao.disabled) {
                botao.dataset.textoOriginal = botao.textContent;
            }
            botao.disabled = true;

            if (isBotaoAtivo) {
                botao.textContent = "A gerar...";
            }
        } else {
            botao.disabled = false;

            if (isBotaoAtivo) {
                botao.textContent = botao.dataset.textoOriginal || botao.textContent;
            }
        }
    });
}

async function gerarRelatorioPlanosAnaliticos(botao) {
    const container = botao.closest(".relatorio-analiticos");
    if (!container) return;

    const tipo = botao.dataset.relatorio || "";
    const tipoNormalizado = normalizarTipoRelatorioAnaliticos(tipo);
    if (!tipoNormalizado) return;

    const link = container.querySelector("[data-relatorio-link]");

    definirLoadingRelatorioAnaliticos(container, botao, true);
    if (link) {
        link.hidden = true;
    }
    atualizarEstadoRelatorioAnaliticos(container, "A gerar relatório...");

    try {
        const parametros = new URLSearchParams();
        parametros.append("action", "gerarRelatoriosPlanoAnalitico");
        parametros.append("tipo", tipoNormalizado);

        const resposta = await fetch(WEB_URL, { method: "POST", body: parametros });
        const raw = await resposta.text();
        let data = null;

        try {
            data = JSON.parse(raw);
        } catch (erro) {
            data = null;
        }

        if (!resposta.ok || data?.sucesso === false) {
            throw new Error(data?.mensagem || raw || "Erro ao gerar relatório.");
        }

        const url =
            extrairUrlRelatorio(data) ||
            data?.url ||
            data?.link ||
            data?.urlPDF ||
            data?.linkPDF ||
            "";

        if (!url) {
            throw new Error("Nenhum link do relatório foi retornado.");
        }

        if (link) {
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = "Baixe aqui o relatório";
            link.hidden = false;
        }

        atualizarEstadoRelatorioAnaliticos(container, "Relatório gerado com sucesso!");
    } catch (erro) {
        console.error("Erro ao gerar relatório de planos analíticos:", erro);
        atualizarEstadoRelatorioAnaliticos(
            container,
            erro?.message || "Ocorreu um erro ao gerar o relatório.",
            true
        );
        if (link) {
            link.hidden = true;
        }
    } finally {
        definirLoadingRelatorioAnaliticos(container, botao, false);
        reaplicarRestricoesUI();
    }
}

document.addEventListener("click", event => {
    const botao = event.target.closest(".btn-relatorio-analiticos");
    if (!botao) return;
    gerarRelatorioPlanosAnaliticos(botao);
});

function ordenarDadosPorDataAscendente(lista) {
    return [...lista].sort((a, b) => {
        const dataA = new Date(a.data);
        const dataB = new Date(b.data);

        if (Number.isNaN(dataA.getTime()) || Number.isNaN(dataB.getTime())) {
            return 0;
        }

        return dataA - dataB;
    });
}

function mostrarBotaoGuardar(tipo) {
    // Remover botões existentes
    const area = document.getElementById("tabelaGestaoGeral");
    const botaoExistente = document.getElementById("btnGuardar");
    if (botaoExistente) botaoExistente.remove();

    // Criar botão
    const btn = document.createElement("button");
    btn.id = "btnGuardar";
    btn.textContent = "Guardar";
    btn.className = "btn-guardar"; // usar classe já existente para estilo cinzento

    // Alinhar à esquerda
    btn.style.display = "block";
    btn.style.marginTop = "15px";

    // Associar funcionalidade correta
    if (tipo === "tema") {
        btn.onclick = (event) => {
            if (!event.isTrusted) {
                return;
            }
            event.stopPropagation();
            document.getElementById("btnGuardar").dispatchEvent(new Event("click"));
        };
    }
    if (tipo === "monografia") {
        btn.dataset.modulo = "monografia";
        btn.onclick = guardarMonografiaFinal;
    }
    if (tipo === "credencial") {
        btn.dataset.modulo = "credencial";
        btn.onclick = guardarCredencialPesquisa;
    }
    if (tipo === "estagio") {
        btn.dataset.modulo = "estagio";
        btn.onclick = guardarCredencialEstagio;
    }

    // Inserir após a tabela
    area.appendChild(btn);
}

function carregarGestaoGeral() {
    mostrarCarregamentoAtribuirSupervisor();

    fetch(WEB_URL,
    {
        method: "POST",
        body: new URLSearchParams({ action: "getGestaoGeral" })
    })
    .then(r => r.json())
    .then(resposta => {
        console.log("[TEMA][LOAD] raw json=", resposta);
        const primeiro = (resposta?.dados && resposta.dados[0]) ? resposta.dados[0] : null;
        console.log("[TEMA][LOAD] primeiro item=", primeiro);
        console.log("[TEMA][LOAD] keys=", primeiro ? Object.keys(primeiro) : null);
        console.log("[TEMA][LOAD] primeiro.idTema=", primeiro?.idTema);
        if (!primeiro?.idTema) {
            console.warn("[TEMA][LOAD] idTema não veio do servidor (ou veio com outro nome).");
        }
        // Aqui corrigimos: o array está em resposta.dados
        const dados = resposta.dados;
        let dadosFiltrados = dados;

        if (modoTabelaGestao === "atribuirSupervisor") {
            dadosFiltrados = dados.filter(item =>
                normalizarCampo(item.colL) === "aprovado" &&
                (!item.supervisorFinal || item.supervisorFinal.toString().trim() === "")
            );
        }

        if (modoTabelaGestao === "homologarSupervisor") {
            console.log(
                "getGestaoGeral homologar (1 item):",
                dados.slice(0, 1).map(item => ({
                    supervisorFinal: item.supervisorFinal,
                    homologado: item.homologado
                }))
            );
            dadosFiltrados = dados.filter(item =>
                item.supervisorFinal &&
                item.supervisorFinal.toString().trim() !== "" &&
                (!item.homologado || item.homologado.toString().trim() === "")
            );
        }

        if (!dadosFiltrados || dadosFiltrados.length === 0) {
         document.getElementById("tabelaGestaoGeral").innerHTML =
         '<p class="sem-dados">Não existe nenhum dado para ser apresentado.</p>';
          esconderCarregamento();
          reaplicarRestricoesUI();
          return;
         }


        const dadosOrdenados = ordenarDadosPorDataAscendente(dadosFiltrados).map((item, index) => {
            const linhaPlanilha = item.row;
            const opcoes = obterOpcoesSupervisores(item);
            const supervisorAtual = item.supervisor ? item.supervisor.toString().trim() : "";
            const supervisorAtualOuVazio = supervisorAtual || "";

            return {
                ...item,
                row: linhaPlanilha,
                opcoesSupervisores: opcoes,
                supervisorAtualOuVazio
            };
        });

        dadosGestaoGeral = dadosOrdenados;
        paginaAtual = 1;
        totalPaginas = Math.max(1, Math.ceil(dadosGestaoGeral.length / linhasPorPagina));
        renderTabelaGestaoGeral();
        esconderCarregamento();
    })
    .catch(err => {
        console.error("Erro ao carregar dados:", err);
        esconderCarregamento();
        document.getElementById("tabelaGestaoGeral").innerHTML =
            "<p>Erro ao carregar os dados da gestão geral.</p>";
        reaplicarRestricoesUI();
    });
}

function renderizarControlesGestaoGeral() {
    const area = document.getElementById("tabelaGestaoGeral");
    const controlesExistentes = document.getElementById("controlesGestaoGeral");

    if (!area) return;

    if (controlesExistentes) {
        controlesExistentes.remove();
    }

    const container = document.createElement("div");
    container.id = "controlesGestaoGeral";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "10px";
    container.style.marginTop = "15px";
    container.style.flexWrap = "wrap";

    if (modoTabelaGestao !== "atribuirSupervisor") {
        const btnGuardar = document.createElement("button");
        btnGuardar.id = "btnGuardar";
        btnGuardar.textContent = "Guardar";
        btnGuardar.className = "btn-guardar";
        container.appendChild(btnGuardar);
    }

    const barraPaginacao = document.createElement("div");
    barraPaginacao.style.display = "flex";
    barraPaginacao.style.alignItems = "center";
    barraPaginacao.style.gap = "10px";
    barraPaginacao.style.flexGrow = "1";
    barraPaginacao.style.justifyContent = "center";

    const btnAnterior = document.createElement("button");
    btnAnterior.className = "btn-guardar";
    btnAnterior.textContent = "<";
    btnAnterior.onclick = () => mudarPagina(-1);
    btnAnterior.disabled = paginaAtual === 1;

    const infoPagina = document.createElement("span");
    infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    infoPagina.style.textAlign = "center";

    const btnSeguinte = document.createElement("button");
    btnSeguinte.className = "btn-guardar";
    btnSeguinte.textContent = ">";
    btnSeguinte.onclick = () => mudarPagina(1);
    btnSeguinte.disabled = paginaAtual === totalPaginas;

    barraPaginacao.appendChild(btnAnterior);
    barraPaginacao.appendChild(infoPagina);
    barraPaginacao.appendChild(btnSeguinte);

    container.appendChild(barraPaginacao);

    area.appendChild(container);
}

function renderTabelaGestaoGeral() {
    const container = document.getElementById("tabelaGestaoGeral");

    if (!container) return;

    const inicio = (paginaAtual - 1) * linhasPorPagina;
    const fim = inicio + linhasPorPagina;
    const paginaDados = dadosGestaoGeral.slice(inicio, fim);
    const isGeral = modoTabelaGestao === "geral";
    const isHomologar = modoTabelaGestao === "homologarSupervisor";
    const isAtribuir = modoTabelaGestao === "atribuirSupervisor";

    let html = `
            <div class="tabela-scroll">
            <table class="tabela-gestao">
                <thead>
                    <tr>
                        <th class="col-ord">Ord</th>
                        <th class="col-data">Data</th>
                        <th class="col-nome">Nome</th>
                        <th class="col-curso">Curso</th>
                        ${!isHomologar ? `<th class="col-linha">Linha de Pesquisa</th>` : ""}
                        ${!isHomologar ? `<th class="col-tema">Tema</th>` : ""}
                        ${!isHomologar ? `<th class="col-supervisor">Proposta de Supervisor</th>` : ""}
                        ${isHomologar ? `<th class="col-supervisor">Supervisor Final</th>` : ""}
                        ${isGeral ? `<th class="col-parecer">Parecer</th>` : ""}
                        ${isGeral ? `<th class="col-observacoes">Observações</th>` : ""}
                        ${(isGeral || isHomologar) ? `<th class="col-homologacao">Homologação</th>` : ""}
                        ${isAtribuir ? `<th class="col-acao">Ação</th>` : ""}
                    </tr>
                </thead>
                <tbody>
        `;

    paginaDados.forEach((item, index) => {
        const indiceGlobal = inicio + index;
        const idTema = String(item.idTema || "").trim();
        const parecerAtual = String(item.parecer ?? item.Parecer ?? item.colL ?? "").trim();
        const homologacaoAtual = String(item.homologado ?? item.homologacao ?? "").trim();
        const rowHtml = `
                <tr data-id="${idTema}">
                    <td class="col-ord">${indiceGlobal + 1}</td>
                    <td class="col-data">${formatarDataCurta(item.data)}</td>
                    <td class="col-nome">${item.nome}</td>
                    <td class="col-curso">${item.curso}</td>
                    ${!isHomologar ? `<td class="col-linha">${item.linhaPesquisa ?? item.linha ?? ""}</td>` : ""}
                    ${!isHomologar ? `<td class="col-tema">${item.tema ?? ""}</td>` : ""}
                    ${!isHomologar ? `
                    <td class="col-supervisor">
                        <select class="supervisorProposto" data-row="${item.row || ""}" data-id="${idTema}" data-original="${item.supervisorAtualOuVazio}">
                            ${opcoesSupervisoresHTML(item.supervisorAtualOuVazio, item.opcoesSupervisores)}
                        </select>
                    </td>` : ""}
                    ${isHomologar ? `
                    <td class="col-supervisor">${item.supervisorFinal}</td>
                    <td class="col-homologacao">
                        <select class="homologacao" data-row="${item.row}" data-id="${idTema}" data-original="${homologacaoAtual}">
                            <option value=""${homologacaoAtual === "" ? " selected" : ""}>Seleccione…</option>
                            <option${homologacaoAtual === "Homologado" ? " selected" : ""}>Homologado</option>
                        </select>
                    </td>` : ""}
                    ${isGeral ? `
                    <td class="col-parecer">
                        <select class="parecer" data-row="${item.row}" data-id="${idTema}" data-original="${parecerAtual}">
                            <option value=""${parecerAtual === "" ? " selected" : ""}>Seleccione…</option>
                            <option${parecerAtual === "Aprovado" ? " selected" : ""}>Aprovado</option>
                            <option${parecerAtual === "Reprovado" ? " selected" : ""}>Reprovado</option>
                        </select>
                    </td>

                    <td class="col-observacoes">
                        <textarea class="observacoesTema" data-row="${item.row}" data-id="${idTema}" rows="4"></textarea>
                    </td>

                    <td class="col-homologacao">
                        <select class="homologacao" data-row="${item.row}" data-id="${idTema}" data-original="${homologacaoAtual}">
                            <option value=""${homologacaoAtual === "" ? " selected" : ""}>Seleccione…</option>
                            <option${homologacaoAtual === "Homologado" ? " selected" : ""}>Homologado</option>
                        </select>
                    </td>` : ""}
                    ${isAtribuir ? `
                    <td class="col-acao">
                        <button
                            type="button"
                            class="btn-atribuir-supervisor"
                            data-estudante-id="${item.idEstudante || ""}"
                            data-row="${item.row || ""}"
                        >Guardar</button>
                    </td>
                    ` : ""}
                </tr>
            `;
        if (index === 0) {
            console.log("[TEMA][LOAD] row html=", rowHtml.trim());
        }
        html += rowHtml;
    });

    html += `
                </tbody>
            </table>
            </div>
        `;

    container.innerHTML = html;
    renderizarControlesGestaoGeral();
    aplicarDadosBloqueio();
    reaplicarRestricoesUI();
}

function mudarPagina(delta) {
    const novaPagina = paginaAtual + delta;

    if (novaPagina < 1 || novaPagina > totalPaginas) {
        return;
    }

    paginaAtual = novaPagina;
    renderTabelaGestaoGeral();
}

function carregarMonografiaFinal() {
    mostrarCarregamentoAtribuirSupervisor();

    fetch(WEB_URL,
    {
        method: "POST",
        body: new URLSearchParams({ action: "getMonografiaFinal" })
    })
    .then(r => r.json())
    .then(resposta => {
        const dados = resposta.dados;
        const dadosFiltrados = dados.filter(item => {
            const parecer = item.parecer ?? item.Parecer ?? "";
            return parecer.toString().trim() === "";
        });

        if (!dadosFiltrados || dadosFiltrados.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Não existe nenhum dado para ser apresentado.</p>';
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }

        let html = `
            <div class="tabela-scroll">
            <table class="tabela-gestao table-monografia-final">
                <thead>
                    <tr>
                        <th class="col-ord">Ord</th>
                        <th class="col-data">Data</th>
                        <th class="col-nome">Nome</th>
                        <th class="col-curso">Curso</th>
                        <th class="col-pdf">Ver (PDF)</th>
                        <th class="col-parecer">Parecer</th>
                        <th class="col-observacoes">Observações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        dadosFiltrados.forEach((item, index) => {
            const idSubmissao = (item.idSubmissao || "").toString().trim();
            html += `
                <tr data-id="${idSubmissao}">
                    <td class="col-ord">${index + 1}</td>
                    <td class="col-data">${formatarDataCurta(item.timestamp)}</td>
                    <td class="col-nome">${item.nome}</td>
                    <td class="col-curso">${item.curso}</td>
                    <td class="col-pdf"><a class="pdf-icon" href="${item.linkPDF}" target="_blank" rel="noopener noreferrer">📄</a></td>
                    <td class="col-parecer">
                        <select class="parecer">
                            <option value="">Seleccione…</option>
                            <option>Aprovado</option>
                            <option>Recusado</option>
                        </select>
                    </td>
                    <td class="col-observacoes">
                        <textarea class="observacoes" rows="4" aria-label="Observações"></textarea>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            </div>
        `;

        document.getElementById("tabelaGestaoGeral").innerHTML = html;
        mostrarBotaoGuardar("monografia");
        esconderCarregamento();
        reaplicarRestricoesUI();
    })
    .catch(err => {
        console.error("Erro ao carregar dados:", err);
        esconderCarregamento();
        document.getElementById("tabelaGestaoGeral").innerHTML =
            "<p>Erro ao carregar os dados da monografia final.</p>";
        reaplicarRestricoesUI();
    });
}

async function carregarDefesas() {
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    mostrarLoadingPainelGestor("A carregar…");

    const tbody = document.getElementById("listaDefesas");
    if (!tbody) {
        return;
    }

    try {
        const resposta = await fetch(`${WEB_URL}?action=getDefesas`);
        const res = await resposta.json();

        if (!res || !(res.sucesso === true || res.sucesso === "true")) {
            defesasCache = [];
            mostrarSecaoDefesas();
            esconderTabelaGestaoGeral();
            mostrarMensagemTabelaDefesa("Não foi possível carregar os dados das defesas.");
            return;
        }

        const lista = Array.isArray(res.dados) ? res.dados : [];
        const defesasVisiveis = lista.filter((item) => !item.defendido || String(item.defendido).trim() === "");

        if (!defesasVisiveis.length) {
            defesasCache = [];
            mostrarSecaoDefesas();
            esconderTabelaGestaoGeral();
            mostrarMensagemTabelaDefesa("Nenhum registo de defesa encontrado.");
            return;
        }

        defesasCache = defesasVisiveis.map((item) => ({
            ...item,
            dataAgendada: item.dataAgendada || item.data_agendada || ""
        }));

        mostrarSecaoDefesas();
        esconderTabelaGestaoGeral();
        paginaAtualDefesas = 1;
        renderTabelaDefesa(defesasCache);
    } catch (erro) {
        console.error("Erro ao carregar defesas:", erro);
        defesasCache = [];
        mostrarSecaoDefesas();
        esconderTabelaGestaoGeral();
        mostrarMensagemTabelaDefesa("Ocorreu um erro ao carregar as defesas.");
    }
}

function obterRowNumericoCredencial(valorRow, fallbackRow) {
    const rowNumber = Number.parseInt(valorRow, 10);

    if (!Number.isNaN(rowNumber) && rowNumber >= 2) {
        return rowNumber;
    }

    const fallbackNumber = Number.parseInt(fallbackRow, 10);

    if (!Number.isNaN(fallbackNumber) && fallbackNumber >= 2) {
        console.warn("[CRED] ROW INVÁLIDA SUBSTITUÍDA PELO FALLBACK", {
            rowOriginal: valorRow,
            rowFallback: fallbackNumber
        });
        return fallbackNumber;
    }

    console.warn("[CRED] ROW INVÁLIDA IGNORADA", { rowOriginal: valorRow });
    return null;
}

function carregarCredencialPesquisa() {
    mostrarCarregamentoAtribuirSupervisor();

    fetch(WEB_URL,
    {
        method: "POST",
        body: new URLSearchParams({ action: "getCredencialPesquisa" })
    })
    .then(r => r.json())
    .then(resposta => {
        const dados = resposta.dados;
        const temParecer = Array.isArray(dados)
            && dados.some(item => Object.prototype.hasOwnProperty.call(item, "parecer")
                || Object.prototype.hasOwnProperty.call(item, "Parecer"));
        const dadosFiltrados = temParecer
            ? dados.filter(item => {
                const parecerValor = item.parecer ?? item.Parecer ?? "";
                return String(parecerValor).trim() === "";
            })
            : dados;

        const processarObservacoes = (inputs) => {
            inputs.forEach((textarea) => {
                const idValue = (textarea.dataset.id || "").trim();
                const item = dadosFiltrados.find((entrada) => String(entrada.id || "").trim() === idValue);

                if (item && item.observacoes) {
                    textarea.value = item.observacoes;
                }
            });
        };

        if (!dadosFiltrados || dadosFiltrados.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Não existe nenhum dado para ser apresentado.</p>';
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }

        let html = `
            <div class="tabela-scroll">
            <table class="tabela-gestao table-credencial">
                <thead>
                    <tr>
                        <th class="col-ord">Ord</th>
                        <th class="col-data">Data</th>
                        <th class="col-nome">Nome</th>
                        <th class="col-curso">Curso</th>
                        <th class="col-organizacao">Organização</th>
                        <th class="col-parecer">Parecer</th>
                        <th class="col-pdf">Ver (PDF)</th>
                        <th class="col-observacoes">Observações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        dadosFiltrados.forEach((item, index) => {
            const rowNumber = obterRowNumericoCredencial(item.row, index + 2);
            const idCredencial = String(item.id || "").trim();

            if (rowNumber === null) {
                return;
            }

            html += `
                <tr data-id="${idCredencial}">
                    <td class="col-ord">${index + 1}</td>
                    <td class="col-data">${formatarDataCurta(item.timestamp)}</td>
                    <td class="col-nome">${item.nome}</td>
                    <td class="col-curso">${item.curso}</td>
                    <td class="col-organizacao">${item.organizacao}</td>
                    <td class="col-parecer">
                        <select class="parecerPesquisa" data-id="${idCredencial}">
                            <option value="">Seleccione…</option>
                            <option>Aprovado</option>
                            <option>Recusado</option>
                        </select>
                    </td>
                    <td class="col-pdf"><a class="pdf-icon" href="${item.pdfURL || item.linkPDF}" target="_blank" rel="noopener noreferrer" aria-label="Ver PDF">PDF</a></td>
                    <td class="col-observacoes">
                        <textarea class="observacoes" data-id="${idCredencial}" rows="4" aria-label="Observações"></textarea>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            </div>
        `;

        document.getElementById("tabelaGestaoGeral").innerHTML = html;
        processarObservacoes(document.querySelectorAll(".table-credencial textarea.observacoes"));
        mostrarBotaoGuardar("credencial");
        esconderCarregamento();
        reaplicarRestricoesUI();
    })
    .catch(err => {
        console.error("Erro ao carregar dados:", err);
        esconderCarregamento();
        document.getElementById("tabelaGestaoGeral").innerHTML =
            "<p>Erro ao carregar os dados da credencial de pesquisa.</p>";
        reaplicarRestricoesUI();
    });
}

const PLANOS_ANALITICOS_POR_PAGINA = 10;
let planosAnaliticosPaginaAtual = 1;
let planosAnaliticosDados = [];

function renderTabelaPlanosAnaliticos(dados = [], pagina = 1) {
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;
    const totalPaginas = Math.max(1, Math.ceil(dados.length / PLANOS_ANALITICOS_POR_PAGINA));
    const paginaAtual = Math.min(Math.max(pagina, 1), totalPaginas);
    const inicio = (paginaAtual - 1) * PLANOS_ANALITICOS_POR_PAGINA;
    const fim = inicio + PLANOS_ANALITICOS_POR_PAGINA;
    const dadosPagina = dados.slice(inicio, fim);

    let html = `
        <div class="tabela-scroll">
            <table class="tabela-analiticos">
                <thead>
                    <tr>
                        <th class="col-ord">Ord</th>
                        <th class="col-nome">Nome</th>
                        <th class="col-disciplina">Disciplina</th>
                        <th class="col-curso">Curso</th>
                        <th class="col-regime">Regime</th>
                        <th class="col-situacao">Situação</th>
                        <th class="col-plano">Plano</th>
                        <th class="col-data">Data de Submissão</th>
                    </tr>
                </thead>
                <tbody>
        `;

    dadosPagina.forEach((item, index) => {
        const linkPDF = item.linkPDF ?? item.pdfURL ?? item.urlPDF ?? "";
        const linkPDFHtml = linkPDF
            ? `<a class="pdf-icon" href="${linkPDF}" target="_blank" rel="noopener">📄</a>`
            : "—";
        const situacao = (item.situacao ?? "").toString().trim() || "Não Submetido";
        const situacaoNormalizada = situacao
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        let classeSituacao = "";

        if (situacaoNormalizada === "submetido") {
            classeSituacao = "status-submetido";
        } else if (situacaoNormalizada === "nao submetido") {
            classeSituacao = "status-nao-submetido";
        }
        const situacaoHtml = classeSituacao
            ? `<span class="status ${classeSituacao}">${situacao}</span>`
            : situacao;

        html += `
            <tr>
                <td class="col-ord">${inicio + index + 1}</td>
                <td class="col-nome">${item.nome ?? ""}</td>
                <td class="col-disciplina">${item.disciplina ?? ""}</td>
                <td class="col-curso">${item.curso ?? ""}</td>
                <td class="col-regime">${item.regime ?? ""}</td>
                <td class="col-situacao">${situacaoHtml}</td>
                <td class="col-plano">${linkPDFHtml}</td>
                <td class="col-data">${formatarDataCurta(item.dataSubmissao)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div class="paginacao-analiticos" role="navigation" aria-label="Paginação Planos Analíticos">
            <button class="button btn-paginacao" type="button" data-pagina="anterior" ${paginaAtual === 1 ? "disabled" : ""} aria-label="Página anterior">&lt;</button>
            <span class="paginacao-info">${paginaAtual} de ${totalPaginas}</span>
            <button class="button btn-paginacao" type="button" data-pagina="seguinte" ${paginaAtual === totalPaginas ? "disabled" : ""} aria-label="Página seguinte">&gt;</button>
        </div>
        <div class="relatorio-analiticos">
            <h3>Gerar relatório de planos analíticos:</h3>
            <div class="relatorio-analiticos__acoes">
                <button class="button btn-relatorio-analiticos btn-relatorio-submetidos" type="button" data-relatorio="submetidos">Submetidos</button>
                <button class="button btn-relatorio-analiticos btn-relatorio-nao-submetidos" type="button" data-relatorio="nao-submetidos">Não Submetidos</button>
                <button class="button btn-relatorio-analiticos btn-relatorio-todos" type="button" data-relatorio="todos">Todos</button>
            </div>
            <a class="relatorio-analiticos__link" href="#" data-relatorio-link>Baixe aqui o relatório</a>
            <span class="relatorio-analiticos__estado" data-relatorio-estado></span>
        </div>
    `;

    container.innerHTML = html;
    const linkRelatorio = container.querySelector("[data-relatorio-link]");
    if (linkRelatorio) {
        linkRelatorio.href = "#";
        linkRelatorio.textContent = "Baixe aqui o relatório";
        linkRelatorio.hidden = true;
        linkRelatorio.removeAttribute("target");
        linkRelatorio.removeAttribute("rel");
    }
    const btnAnterior = container.querySelector("[data-pagina='anterior']");
    const btnSeguinte = container.querySelector("[data-pagina='seguinte']");

    if (btnAnterior) {
        btnAnterior.addEventListener("click", () => {
            atualizarTabelaPlanosAnaliticos(planosAnaliticosPaginaAtual - 1);
        });
    }

    if (btnSeguinte) {
        btnSeguinte.addEventListener("click", () => {
            atualizarTabelaPlanosAnaliticos(planosAnaliticosPaginaAtual + 1);
        });
    }
}

function atualizarTabelaPlanosAnaliticos(pagina) {
    planosAnaliticosPaginaAtual = pagina;
    renderTabelaPlanosAnaliticos(planosAnaliticosDados, pagina);
}

function carregarPlanosAnaliticos() {
    mostrarLoadingPainelGestor("A carregar…");

    fetch(WEB_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({ action: "listarPlanosAnaliticos" })
    })
        .then(resposta => resposta.json())
        .then(json => {
            if (json?.sucesso !== true) {
                throw new Error(json?.mensagem || "Erro ao carregar planos analíticos.");
            }

            const lista = Array.isArray(json.dados) ? json.dados : [];
            const dados = lista.map(item => {
                const situacaoRaw = (item?.situacao ?? "").toString().trim();
                const linkPDF = item?.linkPDF ?? item?.pdfURL ?? item?.urlPDF ?? "";

                return {
                    ...item,
                    situacao: situacaoRaw || "Não Submetido",
                    linkPDF
                };
            });

            planosAnaliticosDados = dados;
            planosAnaliticosPaginaAtual = 1;
            renderTabelaPlanosAnaliticos(dados, planosAnaliticosPaginaAtual);
        })
        .catch(err => {
            console.error("Erro ao carregar planos analíticos:", err);
            planosAnaliticosDados = [];
            planosAnaliticosPaginaAtual = 1;
            renderTabelaPlanosAnaliticos([]);
            alert(err?.message || "Erro ao carregar planos analíticos.");
        })
        .finally(() => {
            esconderCarregamento();
            reaplicarRestricoesUI();
        });
}

async function carregarCredenciaisEstagioGestor() {
    mostrarCarregamentoAtribuirSupervisor();

    try {
        const dados = new FormData();
        dados.append("action", "getCredencialEstagio");

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resultado || resultado.sucesso === false) {
            throw new Error(resultado?.mensagem || "Erro ao carregar registos de estágio.");
        }

        const lista = Array.isArray(resultado.dados) ? resultado.dados : [];
        const listaFiltrada = lista.filter((item) => {
            const parecerVazio = String(item?.parecer || "").trim() === "";
            const observacoesVazio = String(item?.observacoes || "").trim() === "";
            return parecerVazio && observacoesVazio;
        });

        if (listaFiltrada.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Sem registos de estágio.</p>';
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }

        let html = `
            <div class="tabela-scroll">
            <table class="tabela-gestao table-credencial table-credencial-estagio">
                <thead>
                    <tr>
                        <th class="col-ord">Ord</th>
                        <th class="col-data">Data</th>
                        <th class="col-nome">Nome</th>
                        <th class="col-curso">Curso</th>
                        <th class="col-organizacao">Organização</th>
                        <th class="col-parecer">Parecer</th>
                        <th class="col-pdf">Ver (PDF)</th>
                        <th class="col-observacoes">Observações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        listaFiltrada.forEach((item, index) => {
            const idCredencial = String(item.id || "").trim();
            const linkPDF = item.linkPDF ?? "";
            const idEmFalta = !idCredencial;
            if (idEmFalta) {
                console.warn("Linha sem ID:", item);
            }
            const linkPDFHtml = linkPDF
                ? `<a class="pdf-icon" href="${linkPDF}" target="_blank" rel="noopener noreferrer">PDF</a>`
                : "—";

            html += `
                <tr data-id="${idCredencial}">
                    <td class="col-ord">${index + 1}</td>
                    <td class="col-data">${formatarDataCurta(item.data)}</td>
                    <td class="col-nome">${item.nome ?? ""}</td>
                    <td class="col-curso">${item.curso ?? ""}</td>
                    <td class="col-organizacao">${item.organizacao ?? ""}</td>
                    <td class="col-parecer">
                        <select class="parecerEstagio" data-id="${idCredencial}" ${idEmFalta ? "disabled" : ""}>
                            <option value="">Seleccione…</option>
                            <option value="Aprovado">Aprovado</option>
                            <option value="Recusado">Recusado</option>
                        </select>
                    </td>
                    <td class="col-pdf">${linkPDFHtml}</td>
                    <td class="col-observacoes">
                        <textarea class="observacoesEstagio" data-id="${idCredencial}" rows="4" aria-label="Observações" ${idEmFalta ? "disabled" : ""}></textarea>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            </div>
        `;

        document.getElementById("tabelaGestaoGeral").innerHTML = html;
        listaFiltrada.forEach(item => {
            const idCredencial = String(item.id || "").trim();
            if (!idCredencial) {
                console.warn("Linha sem ID:", item);
                return;
            }
            const parecerValor = String(item.parecer ?? "").trim();
            const observacoesValor = String(item.observacoes ?? "").trim();
            const select = document.querySelector(`select.parecerEstagio[data-id="${idCredencial}"]`);
            if (select && parecerValor !== "") {
                select.value = parecerValor;
            }
            if (select) {
                select.dataset.original = parecerValor;
            }
            const textarea = document.querySelector(`textarea.observacoesEstagio[data-id="${idCredencial}"]`);
            if (textarea && observacoesValor !== "") {
                textarea.value = observacoesValor;
            }
            if (textarea) {
                textarea.dataset.original = observacoesValor;
            }
        });
        mostrarBotaoGuardar("estagio");
        esconderCarregamento();
        reaplicarRestricoesUI();
    } catch (err) {
        console.error("Erro ao carregar credenciais de estágio:", err);
        esconderCarregamento();
        alert(err.message || "Erro ao carregar registos de estágio.");
        document.getElementById("tabelaGestaoGeral").innerHTML =
            "<p>Erro ao carregar os dados de estágio.</p>";
        reaplicarRestricoesUI();
    }
}

document.addEventListener("click", async (e) => {
    const botao = e.target?.closest("#btnGuardar");
    if (!botao) {
        return;
    }
    if (botao.dataset.modulo === "monografia") {
        return;
    }
    console.log("BOTÃO GUARDAR CLICADO");
    const idBotao = (botao?.dataset?.id || "").trim();
    if (botao?.dataset?.modulo === "credencial") {
        if (window.aplicarRestricoesUI && window.userEmail) {
            aplicarRestricoesUI(window.userEmail);
        }
        return;
    }
    if (botao?.dataset?.modulo === "estagio") {
        if (window.aplicarRestricoesUI && window.userEmail) {
            aplicarRestricoesUI(window.userEmail);
        }
        return;
    }
    activarLoadingGuardar(botao);

    const linhas = new Map();
    let idInvalido = false;

    const obterIdTema = (elemento) => {
        const idTema = (elemento?.dataset?.id || elemento?.closest("tr")?.dataset?.id || "").trim();

        if (!idTema) {
            idInvalido = true;
            return "";
        }

        return idTema;
    };

    if (!idBotao && !document.querySelector("tr[data-id]")) {
        alert("Não foi possível identificar o estudante. Recarregue a página e tente novamente.");
        desactivarLoadingGuardar(botao);
        return;
    }

    const garantirLinha = (idTema) => {
        if (!linhas.has(idTema)) {
            linhas.set(idTema, { idTema });
        }

        return linhas.get(idTema);
    };

    const processarSelects = (selects, chave, { exigirValor = true, compararOriginal = true } = {}) => {
        selects.forEach(select => {
            const idTema = obterIdTema(select);
            const valor = select.value.trim();
            const valorOriginal = (select.dataset.original || "").trim();
            const mudou = compararOriginal ? valor !== valorOriginal : true;

            if (!idTema || !mudou) {
                return;
            }

            if (exigirValor && valor === "") {
                return;
            }

            const linha = garantirLinha(idTema);
            linha[chave] = valor;
        });
    };

    const processarSupervisores = (selects) => {
        processarSelects(selects, "supervisor", { exigirValor: true, compararOriginal: true });
    };

    const processarObservacoes = (inputs) => {
        inputs.forEach(input => {
            const idTema = obterIdTema(input);
            const valor = input.value.trim();

            if (!idTema || valor === "") {
                return;
            }

            const linha = garantirLinha(idTema);
            linha.observacoes = valor;
        });
    };

    processarSupervisores(document.querySelectorAll("select.supervisorProposto"));
    processarSelects(document.querySelectorAll("select.parecer"), "parecer", { exigirValor: true, compararOriginal: true });
    processarSelects(document.querySelectorAll("select.homologacao"), "homologacao", { exigirValor: false, compararOriginal: true });
    processarObservacoes(document.querySelectorAll("textarea.observacoesTema"));

    if (idInvalido) {
        alert("Não foi possível identificar o estudante. Recarregue a página e tente novamente.");
        desactivarLoadingGuardar(botao);
        return;
    }

    const payload = Array.from(linhas.values()).filter(item =>
        Object.keys(item).some(chave => chave !== "idTema")
    );

    try {
        if (payload.length === 0) {
            if (window.aplicarRestricoesUI && window.userEmail) {
                aplicarRestricoesUI(window.userEmail);
            }
            return;
        }

        const dados = new FormData();
        dados.append("action", "atualizarParecerHomologacao");
        dados.append("linhas", JSON.stringify(payload));

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resultado || resultado.sucesso === false) {
            const detalhesFalhas = Array.isArray(resultado?.falhas)
                ? resultado.falhas
                      .map(falha => {
                          const rowInfo = falha?.row ? `row ${falha.row}` : "row desconhecida";
                          const campoInfo = falha?.campo ? `campo ${falha.campo}` : "campo desconhecido";
                          const erroInfo = falha?.erro || falha?.mensagem || "erro desconhecido";
                          return `${rowInfo} (${campoInfo}): ${erroInfo}`;
                      })
                      .join("\n")
                : "";
            const mensagemBase = resultado?.mensagem || "Resposta de erro do servidor";
            const mensagemDetalhada = detalhesFalhas ? `${mensagemBase}\n${detalhesFalhas}` : mensagemBase;
            console.error("Erro ao guardar dados:", resultado);
            alert(mensagemDetalhada);
            throw new Error(mensagemBase);
        }

        payload.forEach(item => {
            document.querySelectorAll(`select.parecer[data-id="${item.idTema}"]`).forEach(select => {
                select.disabled = true;
            });
            document.querySelectorAll(`select.homologacao[data-id="${item.idTema}"]`).forEach(select => {
                select.disabled = true;
            });
            if (item.supervisor) {
                document.querySelectorAll(`select.supervisorProposto[data-id="${item.idTema}"]`).forEach(select => {
                    select.disabled = true;
                });
            }
            if (item.observacoes) {
                document.querySelectorAll(`textarea.observacoesTema[data-id="${item.idTema}"]`).forEach(textarea => {
                    textarea.disabled = true;
                });
            }
        });
    } catch (err) {
        console.error("Erro ao guardar dados:", err);
    } finally {
        desactivarLoadingGuardar(botao);
    }
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

async function guardarCredencialPesquisa() {
    const botao = document.getElementById("btnGuardar") || document.getElementById("btnGuardarCredencialPesquisa");
    console.log("[CRED] ENTROU NA FUNÇÃO guardarCredencialPesquisa", {
        botaoEncontrado: Boolean(botao),
    });
    activarLoadingGuardar(botao);

    const linhas = new Map();
    let idInvalido = false;

    const obterIdCredencial = (elemento) => (elemento?.dataset?.id || elemento?.closest("tr")?.dataset?.id || "").trim();

    const registrarLinha = (id, valores) => {
        if (!linhas.has(id)) {
            linhas.set(id, {
                id,
                parecer: "",
                observacoes: ""
            });
        }

        const linha = linhas.get(id);
        Object.assign(linha, valores);
    };

    const processarPareceres = (selects) => {
        selects.forEach(select => {
            const parecer = select.value.trim();
            const id = obterIdCredencial(select);

            if ((parecer !== "") && !id) {
                idInvalido = true;
                return;
            }

            if (!id || parecer === "") {
                return;
            }

            registrarLinha(id, { parecer });
        });
    };

    const processarObservacoes = (inputs) => {
        inputs.forEach(input => {
            const observacoes = input.value.trim();
            const id = obterIdCredencial(input);

            if ((observacoes !== "") && !id) {
                idInvalido = true;
                return;
            }

            if (!id || observacoes === "") {
                return;
            }

            registrarLinha(id, { observacoes });
        });
    };

    const pareceresEncontrados = document.querySelectorAll("select.parecerPesquisa");
    const observacoesEncontradas = document.querySelectorAll(".table-credencial textarea.observacoes");
    console.log("[CRED] ELEMENTOS COLECTADOS", {
        totalPareceres: pareceresEncontrados.length,
        totalObservacoes: observacoesEncontradas.length,
    });

    processarPareceres(pareceresEncontrados);
    processarObservacoes(observacoesEncontradas);

    const updates = Array.from(linhas.values()).filter(item => item.parecer || item.observacoes);
    console.log("[CRED] PAYLOAD MONTADO", updates);

    if (updates.length === 0) {
        console.log("[CRED] Nenhuma linha com dados preenchidos. Fluxo interrompido.");
        desactivarLoadingGuardar(botao);
        return;
    }

    if (idInvalido) {
        alert("Não foi possível identificar o estudante. Recarregue a página e tente novamente.");
        desactivarLoadingGuardar(botao);
        return;
    }

    try {
        const dados = new URLSearchParams();
        dados.append("action", "atualizarCredencialPesquisa");
        dados.append("linhas", JSON.stringify(updates));

        console.log("[CRED][ENVIAR] updates=", updates);

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: dados
        });

        const raw = await resposta.text();
        console.log("[CRED][RESP] raw=", raw);
        const resultado = raw ? JSON.parse(raw) : null;

        if (!resultado || resultado.sucesso !== true) {
            throw new Error("Resposta de erro do servidor");
        }

        updates.forEach(item => {
            document.querySelectorAll(`select.parecerPesquisa[data-id="${item.id}"]`).forEach(select => {
                select.disabled = true;
            });
            document
                .querySelectorAll(`textarea.observacoes[data-id="${item.id}"]`)
                .forEach(textarea => {
                    textarea.disabled = true;
                });
        });
    } catch (err) {
        console.error("Erro ao guardar dados da credencial de pesquisa:", err);
    } finally {
        desactivarLoadingGuardar(botao);
    }
}

async function guardarCredencialEstagio() {
    const botao = document.getElementById("btnGuardar") || document.getElementById("btnGuardarCredencialEstagio");
    activarLoadingGuardar(botao);

    console.log("tabela:", document.querySelector(".table-credencial-estagio"));
    console.log("nLinhas:", document.querySelectorAll(".table-credencial-estagio tbody tr").length);

    const linhas = new Map();
    let idInvalido = false;

    const registrarLinha = (id, valores) => {
        if (!linhas.has(id)) {
            linhas.set(id, {
                id,
                parecer: "",
                observacoes: ""
            });
        }

        const linha = linhas.get(id);
        Object.assign(linha, valores);
    };

    const tabela = document.querySelector(".table-credencial-estagio");
    const linhasTabela = tabela ? tabela.querySelectorAll("tbody tr") : [];

    linhasTabela.forEach(linha => {
        const id = (linha.dataset.id || "").trim();
        const select = linha.querySelector("select.parecerEstagio");
        const textarea = linha.querySelector("textarea.observacoesEstagio");
        const parecer = (select?.value || "").trim();
        const observacoes = (textarea?.value || "").trim();
        const parecerOriginal = (select?.dataset?.original || "").trim();
        const observacoesOriginal = (textarea?.dataset?.original || "").trim();

        const houveAlteracao = parecer !== parecerOriginal || observacoes !== observacoesOriginal;

        if (!houveAlteracao) {
            return;
        }

        if ((parecer !== "" || observacoes !== "") && !id) {
            idInvalido = true;
            return;
        }

        if (!id) {
            return;
        }

        registrarLinha(id, { parecer, observacoes });
    });

    const updates = Array.from(linhas.values()).filter(item => item.parecer || item.observacoes);

    console.log("updates:", updates);

    if (updates.length === 0) {
        desactivarLoadingGuardar(botao);
        mostrarModal?.("Não há alterações para guardar.") || alert("Não há alterações para guardar.");
        return;
    }

    if (idInvalido) {
        desactivarLoadingGuardar(botao);
        mostrarModal?.("Não foi possível guardar: algumas linhas não têm ID (coluna K). Recarregue a lista ou corrija o backend para devolver o ID.")
            || alert("Não foi possível guardar: algumas linhas não têm ID (coluna K).");
        return;
    }

    try {
        const dados = new FormData();
        dados.append("action", "atualizarCredencialEstagio");
        dados.append("linhas", JSON.stringify(updates));

        console.log("action enviada:", dados.get("action"));
        console.log("linhas enviada:", dados.get("linhas"));

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: dados
        });

        console.log("HTTP status:", resposta.status);
        const txt = await resposta.text();
        console.log("Resposta bruta:", txt);
        const resultado = txt ? JSON.parse(txt) : null;

        if (!resultado || resultado.sucesso !== true) {
            const detalhe = resultado?.detalhe ? `\n${resultado.detalhe}` : "";
            throw new Error(`${resultado?.mensagem || "Erro ao actualizar registos."}${detalhe}`);
        }

        if (typeof mostrarModal === "function") {
            mostrarModal("Actualizado com sucesso.");
        } else {
            alert("Actualizado com sucesso.");
        }

        await carregarCredenciaisEstagioGestor();
    } catch (err) {
        console.error("Erro ao guardar dados da credencial de estágio:", err);
        alert(err.message || "Erro ao actualizar registos.");
    } finally {
        desactivarLoadingGuardar(botao);
    }
}

async function guardarMonografiaFinal() {
    const botao = document.getElementById("btnGuardar");
    activarLoadingGuardar(botao);

    const linhas = new Map();
    let idInvalido = false;

    const obterIdSubmissaoDoElemento = (elemento, valorPreenchido) => {
        const idSubmissao =
            elemento?.dataset?.id ||
            elemento?.closest("tr")?.dataset?.id ||
            "";

        if (!idSubmissao && valorPreenchido) {
            idInvalido = true;
            return "";
        }

        return idSubmissao;
    };

    const processarPareceres = (selects) => {
        selects.forEach(select => {
            const valor = select.value.trim();
            const idSubmissao = obterIdSubmissaoDoElemento(select, valor !== "");

            if (!idSubmissao || valor === "") {
                return;
            }

            if (!linhas.has(idSubmissao)) {
                linhas.set(idSubmissao, {
                    idSubmissao,
                    parecer: "",
                    observacoes: ""
                });
            }

            const linha = linhas.get(idSubmissao);
            linha.parecer = valor;
        });
    };

    const processarObservacoes = (inputs) => {
        inputs.forEach(input => {
            const valor = input.value.trim();
            const idSubmissao = obterIdSubmissaoDoElemento(input, valor !== "");

            if (!idSubmissao) {
                return;
            }

            if (!linhas.has(idSubmissao)) {
                linhas.set(idSubmissao, {
                    idSubmissao,
                    parecer: "",
                    observacoes: ""
                });
            }

            const linha = linhas.get(idSubmissao);
            linha.observacoes = valor;
        });
    };

    const tabela = document.querySelector(".table-monografia-final");
    const pareceres = tabela ? tabela.querySelectorAll("select.parecer") : [];
    const observacoes = tabela ? tabela.querySelectorAll("textarea.observacoes") : [];

    processarPareceres(pareceres);
    processarObservacoes(observacoes);

    if (idInvalido) {
        alert("Não foi possível identificar a submissão. Recarregue a página e tente novamente.");
        desactivarLoadingGuardar(botao);
        return;
    }

    const payload = Array.from(linhas.values()).filter(item => item.parecer || item.observacoes);

    if (payload.length === 0) {
        desactivarLoadingGuardar(botao);
        return;
    }

    try {
        const dados = new FormData();
        dados.append("action", "atualizarMonografiaFinal");
        dados.append("linhas", JSON.stringify(payload));

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();
        console.log("[MONO] resposta servidor:", resultado);

        if (!resultado || resultado.sucesso !== true) {
            throw new Error("Resposta de erro do servidor");
        }

        payload.forEach(item => {
            const linha = document.querySelector(`[data-id="${item.idSubmissao}"]`);
            if (!linha) {
                return;
            }
            linha.querySelectorAll("select.parecer").forEach(select => {
                select.disabled = true;
            });
            linha.querySelectorAll("textarea.observacoes").forEach(textarea => {
                textarea.disabled = true;
            });
        });
    } catch (err) {
        console.error("Erro ao guardar dados da monografia final:", err);
    } finally {
        desactivarLoadingGuardar(botao);
    }
}

carregarDadosBloqueio();

function carregarParecer() {
    esconderEstatisticas();
    mostrarCarregamentoAtribuirSupervisor();
    const url = WEB_URL;
    console.log("[TEMA][LOAD] url=", url);
    fetch(url, {
        method: "POST",
        body: new URLSearchParams({ action: "getGestaoGeral" })
    })
    .then(r => r.json())
    .then(json => {
        console.log("[TEMA][LOAD] keys 1º item=", Object.keys(json.dados?.[0] || {}));
        console.log("[TEMA][LOAD] primeiro.idTema=", json.dados?.[0]?.idTema);
        if (!json.dados?.[0]?.idTema) {
            console.warn("[TEMA][LOAD] idTema não veio do servidor (ou veio com outro nome).");
        }
        const dados = json.dados || [];

        if (dados.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Não existe nenhum dado para ser apresentado.</p>';
            const controles = document.getElementById("controlesPaginacao");
            if (controles) {
                controles.innerHTML = "";
            }
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }

        // 🔥 Agora usamos a nova Tabela Parecer (não a Gestão Geral)
        dadosGestaoGeral = dados.filter(item => {
            const parecer = item.parecer ?? item.Parecer ?? "";
            return !parecer || parecer.toString().trim() === "";
        });

        if (dadosGestaoGeral.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Não existe nenhum dado para ser apresentado.</p>';
            const controles = document.getElementById("controlesPaginacao");
            if (controles) {
                controles.innerHTML = "";
            }
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }

        paginaAtual = 1;
        totalPaginas = Math.ceil(dadosGestaoGeral.length / linhasPorPagina);

        // Renderiza a tabela LIMPA do módulo Parecer
        renderTabelaParecer();
        esconderCarregamento();
    })
    .catch(err => {
        esconderCarregamento();
        console.error("Erro ao carregar parecer:", err);
    });
}

function renderTabelaParecer() {
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;

    const inicio = (paginaAtual - 1) * linhasPorPagina;
    const fim = inicio + linhasPorPagina;
    const paginaDados = dadosGestaoGeral.slice(inicio, fim);

    let html = `
        <div class="tabela-scroll">
        <table class="tabela-gestao">
            <thead>
                <tr>
                    <th class="col-ord">Ord</th>
                    <th class="col-data">Data</th>
                    <th class="col-nome">Nome</th>
                    <th class="col-curso">Curso</th>
                    <th class="col-linha">Linha</th>
                    <th class="col-tema">Tema</th>
                    <th class="col-parecer">Parecer</th>
                    <th class="col-observacoes">Observações</th>
                </tr>
            </thead>
            <tbody>
    `;

    paginaDados.forEach((item, index) => {
        const indiceGlobal = inicio + index;
        const idTema = String(item.idTema || "").trim();

        if (idTema) {
            console.log("[TEMA][RENDER] idTema preenchido:", idTema);
        } else {
            console.warn(
                "[TEMA][RENDER] idTema vazio - verificar campo do item. Keys:",
                Object.keys(item)
            );
        }

        html += `
            <tr data-id="${idTema}">
                <td class="col-ord">${indiceGlobal + 1}</td>
                <td class="col-data">${formatarDataCurta(item.data)}</td>
                <td class="col-nome">${item.nome}</td>
                <td class="col-curso">${item.curso}</td>
                <td class="col-linha">${item.linha}</td>
                <td class="col-tema">${item.tema}</td>

                <td class="col-parecer">
                    <select class="parecerSelect" data-id="${idTema}">
                        <option value="">Seleccione…</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Reprovado">Reprovado</option>
                    </select>
                </td>

                <td class="col-observacoes">
                    <textarea class="observacoesInput" data-id="${idTema}" rows="3"></textarea>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        </div>

        <div style="margin-top: 15px; text-align: left;">
            <button id="btnGuardarParecerGlobal" class="btn-guardar-geral">
                Guardar
            </button>
        </div>
    `;

    container.innerHTML = html;

    // Ativar botão global
    document.getElementById("btnGuardarParecerGlobal")
        .addEventListener("click", guardarTodosPareceres);

    renderizarControlesParecer();
    reaplicarRestricoesUI();
}

function renderizarControlesParecer() {
    const controles = document.getElementById("controlesPaginacao");
    if (!controles) return;

    controles.innerHTML = `
        <button onclick="mudarPaginaParecer(-1)">&lt;</button>
        <span>Página ${paginaAtual} de ${totalPaginas}</span>
        <button onclick="mudarPaginaParecer(1)">&gt;</button>
    `;
    reaplicarRestricoesUI();
}
function mudarPaginaParecer(delta) {
    const novaPagina = paginaAtual + delta;

    if (novaPagina < 1 || novaPagina > totalPaginas) return;

    paginaAtual = novaPagina;
    renderTabelaParecer();
}


function guardarTodosPareceres() {
    const botao = document.getElementById("btnGuardarParecerGlobal");
    activarLoadingGuardar(botao);

    const container = document.getElementById("tabelaGestaoGeral");

    const selects = container ? container.querySelectorAll("select.parecerSelect") : [];

    const selectSnapshots = Array.from(selects)
        .slice(0, 3)
        .map(select => ({
            datasetId: select.dataset.id || "",
            value: select.value,
            selectedText: select.options[select.selectedIndex]?.text || ""
        }));

    console.log("[TEMA][GUARDAR] container encontrado?", Boolean(container));
    console.log("[TEMA][GUARDAR] Selects encontrados:", selects.length);
    console.log("[TEMA][GUARDAR] Snapshot selects (3):", selectSnapshots);
    // Debug rápido: ver se está a achar alguma coisa
    // alert("Selects encontrados: " + selects.length);

    const pareceres = [];

    let houveInteracaoSemId = false;

    selects.forEach(select => {
        const idTemaDataset = select.dataset.id || "";
        const idTemaTr = select.closest("tr")?.dataset?.id || "";
        const idTema = (idTemaDataset || idTemaTr || "").trim();
        const parecer = (select.value || "").trim();
        const obsElement = select.closest("tr")?.querySelector("textarea.observacoesInput");
        const observacoes = obsElement ? (obsElement.value || "").trim() : "";
        const parecerTexto = select.options[select.selectedIndex]?.text || "";

        if (idTema) {
            console.log("[TEMA][GUARDAR] idTema !=", "", idTema);
        }
        console.log("[TEMA][GUARDAR] Linha:", {
            idTemaDataset,
            idTemaTr,
            idTema,
            parecer,
            parecerTexto,
            observacoesLength: observacoes.length
        });

        if ((parecer !== "" || observacoes !== "") && !idTema) {
            houveInteracaoSemId = true;
            console.warn(
                "[TEMA][GUARDAR] Interação sem idTema - não será guardado.",
                { parecer, observacoesLength: observacoes.length }
            );
            return;
        }

        if (parecer !== "" || observacoes !== "") {
            pareceres.push({
                idTema,
                parecer,
                observacoes
            });
            console.log("[TEMA][GUARDAR] Parecer adicionado:", {
                idTema,
                parecer,
                observacoesLength: observacoes.length
            });
        } else {
            console.log("[TEMA][GUARDAR] Linha descartada (sem interação).", {
                idTema
            });
        }
    });

    console.log("Pareceres prontos para envio:", pareceres);

    if (pareceres.length === 0) {
        if (houveInteracaoSemId) {
            desactivarLoadingGuardar(botao);
            alert("Não foi possível identificar o tema. Recarregue a página e tente novamente.");
            if (window.aplicarRestricoesUI && window.userEmail) {
                aplicarRestricoesUI(window.userEmail);
            }
            return;
        }

        desactivarLoadingGuardar(botao);
        alert("Nenhum parecer preenchido.");
        if (window.aplicarRestricoesUI && window.userEmail) {
            aplicarRestricoesUI(window.userEmail);
        }
        return;
    }

    const url = WEB_URL;
    const params = new URLSearchParams({
        action: "guardarParecer",
        dados: JSON.stringify(pareceres)
    });

    console.log("[TEMA][ENVIAR] url=", url);
    console.log("[TEMA][ENVIAR] pareceres=", pareceres);
    console.log("[TEMA][ENVIAR] pareceres JSON=", JSON.stringify(pareceres));
    console.log("[TEMA][ENVIAR] body=", params.toString());

    fetch(url, {
        method: "POST",
        body: params
    })
        .then(async response => {
            console.log("[TEMA][RESP] status=", response.status, "ok=", response.ok);
            console.log("[TEMA][RESP] content-type=", response.headers.get("content-type"));
            const raw = await response.text();
            console.log("[TEMA][RESP] raw=", raw);

            let res = null;
            try {
                res = JSON.parse(raw);
                console.log("[TEMA][RESP] json=", res);
            } catch (err) {
                console.warn("[TEMA][RESP] JSON parse falhou:", err);
            }

            if (res && res.sucesso) {
                pareceres.forEach(({ idTema }) => {
                    document
                        .querySelectorAll(`select.parecerSelect[data-id="${idTema}"]`)
                        .forEach(select => {
                            select.disabled = true;
                        });
                    document
                        .querySelectorAll(`textarea.observacoesInput[data-id="${idTema}"]`)
                        .forEach(textarea => {
                            textarea.disabled = true;
                        });
                });
            } else {
                const mensagemErro = res?.mensagem || "Erro ao guardar pareceres.";
                alert("Erro ao guardar: " + mensagemErro);
            }
        })
        .catch(err => {
            console.error("Erro ao guardar pareceres:", err);
            alert("Erro ao comunicar com o servidor.");
        })
        .finally(() => {
            desactivarLoadingGuardar(botao);
            if (window.aplicarRestricoesUI && window.userEmail) {
                aplicarRestricoesUI(window.userEmail);
            }
        });
}
