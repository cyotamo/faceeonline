const mapaAbas = {
    tema_total: { aba: "Temas", filtro: "todos" },
    tema_homologados: { aba: "Temas", filtro: "homologados" },
    tema_nao_homologados: { aba: "Temas", filtro: "naoHomologados" },
    monografia_total: { aba: "MonografiaFinal", filtro: "todos" },
    monografia_aprovadas: { aba: "MonografiaFinal", filtro: "aprovados" },
    cred_total: { aba: "Credencial", filtro: "todos" },
    cred_aprovados: { aba: "Credencial", filtro: "aprovados" }
};
const TIPOS_RELATORIO_PLANOS_ANALITICOS = new Set([
    "planos_analiticos_submetidos",
    "planos_analiticos_nao_submetidos",
    "planos_analiticos_todos"
]);

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
    mostrarLoadingPainelGestor();
}

function criarMarkupLoadingPainel(msg = "A carregar…") {
    return `
        <div class="gestor-loading-state" id="loadingPainelGestor" role="status" aria-live="polite">
            <span class="gestor-loading-spinner" aria-hidden="true"></span>
            <span class="gestor-loading-label">${msg}</span>
        </div>
    `;
}

function mostrarLoadingPainelGestor(msg = "A carregar…") {
    const box = document.getElementById("tabelaGestaoGeral");
    if (!box) return;
    box.classList.add("gestor-loading-container");
    box.setAttribute("aria-busy", "true");
    box.innerHTML = criarMarkupLoadingPainel(msg);
}

function esconderCarregamentoAtribuirSupervisor() {
    const box = document.getElementById("tabelaGestaoGeral");
    if (!box) return;
    box.classList.remove("gestor-loading-container");
    box.setAttribute("aria-busy", "false");
    const loading = box.querySelector("#loadingPainelGestor");
    if (loading) {
        loading.remove();
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

function normalizarDataPt(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "";
    }

    if (typeof valor === "number" && Number.isFinite(valor)) {
        const dataExcel = new Date(Math.round((valor - 25569) * 86400 * 1000));
        if (!Number.isNaN(dataExcel.getTime())) {
            const dia = String(dataExcel.getDate()).padStart(2, "0");
            const mes = String(dataExcel.getMonth() + 1).padStart(2, "0");
            const ano = dataExcel.getFullYear();
            return `${dia}/${mes}/${ano}`;
        }
    }

    const valorTexto = String(valor).trim();
    if (!valorTexto) {
        return "";
    }

    const correspondenciaDiaMesAno = valorTexto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (correspondenciaDiaMesAno) {
        const [, dia, mes, ano] = correspondenciaDiaMesAno;
        return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
    }

    return formatarDataDiaMesAno(valorTexto);
}

function obterDataSemHoraDefesa(valor) {
    const valorTexto = String(valor ?? "").trim();
    if (!valorTexto) {
        return "";
    }

    const dataSemHora = valorTexto.split(/[T\s]/)[0];
    return normalizarDataPt(dataSemHora) || dataSemHora;
}

function defesaAindaPendente(registo = {}) {
    return String(registo.defendido ?? "").trim() === "";
}

function obterSituacaoDefesaParaTabela(item = {}) {
    const banca = String(item.banca || item.avaliacaoBanca || "").trim();
    if (banca) {
        return `Em avaliação pela Banca em ${obterDataSemHoraDefesa(banca)}`;
    }

    const dataAgendada = String(item.dataAgendada || item.data_agendada || "").trim();
    if (dataAgendada) {
        return `Agendado: ${normalizarDataPt(dataAgendada)}`;
    }

    const enviadoRA = item.enviadoRA ?? item.enviadoAoRA ?? "";
    const enviadoRATexto = String(enviadoRA).trim();
    if (enviadoRATexto) {
        return `Enviado ao RA em ${normalizarDataPt(enviadoRA)}`;
    }

    const situacao = String(item.situacao || "").trim();
    if (situacao) {
        return situacao;
    }

    return "Aguardando actualização";
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
const modalParecerCredencial = document.getElementById("modalParecerCredencial");
const credModalNome = document.getElementById("credModalNome");
const credModalCurso = document.getElementById("credModalCurso");
const credModalOrganizacao = document.getElementById("credModalOrganizacao");
const credModalParecer = document.getElementById("credModalParecer");
const credModalObservacoes = document.getElementById("credModalObservacoes");
const btnGuardarParecerCredencial = document.getElementById("btnGuardarParecerCredencial");
const modalParecerTema = document.getElementById("modalParecerTema");
const temaModalNome = document.getElementById("temaModalNome");
const temaModalLinhaPesquisa = document.getElementById("temaModalLinhaPesquisa");
const temaModalTema = document.getElementById("temaModalTema");
const temaModalResumo = document.getElementById("temaModalResumo");
const temaModalParecer = document.getElementById("temaModalParecer");
const temaModalObservacoes = document.getElementById("temaModalObservacoes");
const btnGuardarParecerTema = document.getElementById("btnGuardarParecerTema");
const modalParecerMonografiaFinal = document.getElementById("modalParecerMonografiaFinal");
const monoModalNome = document.getElementById("monoModalNome");
const monoModalParecer = document.getElementById("monoModalParecer");
const monoModalObservacoes = document.getElementById("monoModalObservacoes");
const btnGuardarParecerMonografiaFinal = document.getElementById("btnGuardarParecerMonografiaFinal");
const modalAtribuirSupervisor = document.getElementById("modalAtribuirSupervisor");
const atribuirSupervisorModalNome = document.getElementById("atribuirSupervisorModalNome");
const atribuirSupervisorModalCurso = document.getElementById("atribuirSupervisorModalCurso");
const atribuirSupervisorModalLinhaPesquisa = document.getElementById("atribuirSupervisorModalLinhaPesquisa");
const atribuirSupervisorModalTema = document.getElementById("atribuirSupervisorModalTema");
const atribuirSupervisorModalSelect = document.getElementById("atribuirSupervisorModalSelect");
const btnAtribuirSupervisorModal = document.getElementById("btnAtribuirSupervisorModal");

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
    "Dr. Adão Indipita",
    "Dr. Anli Bugdade",
    "Dr. António Missomal",
    "Dr. Cremildo da Silva Filipe",
    "Dr. Elmano Mendes",
    "Dr. Isaquiel Estamilo",
    "Dr. Issufo Yancubo",
    "Dra. Lúcia Pulveira",
    "Dra Mónica Calande",
    "Mestre Abudo Sadate Ucade",
    "Mestre Alcido Manuel Juaniha",
    "Mestre Benedito Machado",
    "Mestre Fabião Jaquissone",
    "Mestre Faruque Jalilo",
    "Mestre Inês Neuana",
    "Mestre Lucília Consolo",
    "Mestre Itelvina Ribeiro",
    "Mestre Januário Augusto",
    "Mestre Reinaldo Cintura",
    "Mestre King Francisco Chigalo",
    "Mestre Sadoque Elias Nascimento",
    "Mestre Valdemiro Cumpe",
    "Prof. Dr. António Pereira",
    "Prof. Dr. Armando Agostinho Tomás",
    "Prof. Dr. Castigo José Castigo",
    "Prof. Dr. Cremildo José Yotamo",
    "Prof. Dr. Martinho Niamale"
];

let registoDefesaEmEdicao = null;
let indiceDefesaEmEdicao = null;
let defesasCache = [];
let credencialPesquisaRegistos = [];
let credencialEstagioRegistos = [];
let monografiaFinalRegistos = [];
let documentosEmitidosRegistos = [];
let documentosParaEmitirRegistos = [];
let idCredencialModalAtual = "";
let moduloCredencialModalAtual = "pesquisa";
let temasParecerRegistos = [];
let idTemaModalAtual = "";
let idMonografiaFinalModalAtual = "";
let idTemaAtribuirSupervisorAtual = "";
let paginaAtualDefesas = 1;
let paginaAtualCredencialPesquisa = 1;
let paginaAtualCredencialEstagio = 1;
let paginaAtualMonografiaFinal = 1;
let paginaAtualDocumentosEmitidos = 1;
let paginaAtualDocumentosParaEmitir = 1;
let paginaAtualTemasParecer = 1;

function calcularEstadoPaginacao(totalRegistos = 0, pagina = 1, registosPorPagina = 10) {
    const total = Number(totalRegistos) || 0;
    const porPagina = Math.max(1, Number(registosPorPagina) || 10);
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
    const paginaAtual = Math.min(Math.max(Number(pagina) || 1, 1), totalPaginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const fim = inicio + porPagina;

    return {
        totalPaginas,
        paginaAtual,
        inicio,
        fim,
        deveMostrarPaginacao: total > porPagina && totalPaginas > 1
    };
}

function obterDadosPaginados(dados = [], pagina = 1, registosPorPagina = linhasPorPagina) {
    const lista = Array.isArray(dados) ? dados : [];
    const estadoPaginacao = calcularEstadoPaginacao(lista.length, pagina, registosPorPagina);
    const paginaDados = lista.slice(estadoPaginacao.inicio, estadoPaginacao.fim);

    return {
        estadoPaginacao,
        paginaDados
    };
}

function markupPaginacaoPadrao({ paginaAtual, totalPaginas, ariaLabel = "Paginação" } = {}) {
    return `
        <div class="paginacao-analiticos" role="navigation" aria-label="${escaparHTML(ariaLabel)}">
            <button class="button btn-paginacao" type="button" data-pagina="anterior" ${paginaAtual <= 1 ? "disabled" : ""} aria-label="Página anterior">&lt;</button>
            <span class="paginacao-info">${paginaAtual} de ${totalPaginas}</span>
            <button class="button btn-paginacao" type="button" data-pagina="seguinte" ${paginaAtual >= totalPaginas ? "disabled" : ""} aria-label="Página seguinte">&gt;</button>
        </div>
    `;
}

function obterClasseStatusAtribuicaoSupervisor(registo = {}) {
    const supervisorFinal = String(registo.supervisorFinal ?? registo.supervisor ?? "").trim();
    return supervisorFinal ? "status-atribuido" : "status-pendente";
}

function obterLabelStatusAtribuicaoSupervisor(registo = {}) {
    const supervisorFinal = String(registo.supervisorFinal ?? registo.supervisor ?? "").trim();
    return supervisorFinal ? "ATRIBUÍDO" : "PENDENTE";
}

function obterClasseStatusCredencial(valor) {
    const normalizado = normalizarCampo(valor);
    if (normalizado === "aprovado") return "status-aprovado";
    if (normalizado === "recusado" || normalizado === "reprovado") return "status-recusado";
    return "status-pendente";
}

function obterLabelStatusCredencial(valor) {
    const normalizado = normalizarCampo(valor);
    if (normalizado === "aprovado") return "APROVADO";
    if (normalizado === "recusado" || normalizado === "reprovado") return "RECUSADO";
    return "PENDENTE";
}

function obterRegistosPorModuloCredencial(modulo = "pesquisa") {
    return modulo === "estagio" ? credencialEstagioRegistos : credencialPesquisaRegistos;
}

function abrirModalParecerCredencial(idCredencial, modulo = "pesquisa") {
    if (!modalParecerCredencial) return;
    const registos = obterRegistosPorModuloCredencial(modulo);
    const registo = registos.find((item) => String(item.id || "").trim() === String(idCredencial).trim());
    if (!registo) return;

    moduloCredencialModalAtual = modulo;
    idCredencialModalAtual = String(registo.id || "").trim();
    credModalNome.value = registo.nome || "";
    credModalCurso.value = registo.curso || "";
    credModalOrganizacao.value = registo.organizacao || "";
    credModalParecer.value = registo.parecer || "";
    credModalObservacoes.value = registo.observacoes || "";
    const tituloModal = document.getElementById("credencialModalTitulo");
    if (tituloModal) {
        tituloModal.textContent = modulo === "estagio"
            ? "Parecer do Pedido de Estágio"
            : "Parecer da Colecta de Dados";
    }

    modalParecerCredencial.style.display = "flex";
    modalParecerCredencial.setAttribute("aria-hidden", "false");
}

function fecharModalParecerCredencial() {
    if (!modalParecerCredencial) return;
    modalParecerCredencial.style.display = "none";
    modalParecerCredencial.setAttribute("aria-hidden", "true");
    idCredencialModalAtual = "";
    moduloCredencialModalAtual = "pesquisa";
}

function atualizarLinhaCredencialUI(idCredencial, dadosAtualizados = {}) {
    const linha = document.querySelector(`.credencial-linha[data-id="${idCredencial}"]`);
    if (!linha) return;

    const parecer = dadosAtualizados.parecer ?? "";
    const badge = linha.querySelector(".credencial-status .status");
    if (badge) {
        badge.className = `status ${obterClasseStatusCredencial(parecer)}`;
        badge.textContent = obterLabelStatusCredencial(parecer);
    }
}

function abrirModalParecerMonografiaFinal(idSubmissao) {
    if (!modalParecerMonografiaFinal) return;
    const idNormalizado = String(idSubmissao || "").trim();
    const registo = monografiaFinalRegistos.find((item) => String(item.idSubmissao || "").trim() === idNormalizado);
    if (!registo) return;

    idMonografiaFinalModalAtual = idNormalizado;
    monoModalNome.value = registo.nome || "";
    monoModalParecer.value = registo.parecer || "";
    monoModalObservacoes.value = registo.observacoes || "";
    modalParecerMonografiaFinal.style.display = "flex";
    modalParecerMonografiaFinal.setAttribute("aria-hidden", "false");
}

function fecharModalParecerMonografiaFinal() {
    if (!modalParecerMonografiaFinal) return;
    modalParecerMonografiaFinal.style.display = "none";
    modalParecerMonografiaFinal.setAttribute("aria-hidden", "true");
    idMonografiaFinalModalAtual = "";
}

function atualizarLinhaMonografiaFinalUI(idSubmissao, dadosAtualizados = {}) {
    const linha = document.querySelector(`.credencial-linha[data-id="${idSubmissao}"]`);
    if (!linha) return;

    const parecer = dadosAtualizados.parecer ?? "";
    const badge = linha.querySelector(".credencial-status .status");
    if (badge) {
        badge.className = `status ${obterClasseStatusCredencial(parecer)}`;
        badge.textContent = obterLabelStatusCredencial(parecer);
    }
}

function obterResumoTema(registo = {}) {
    return registo.resumo
        ?? registo.Resumo
        ?? registo.descricao
        ?? registo.colJ
        ?? "";
}

function normalizarIdTema(valor) {
    return String(valor ?? "").trim();
}

function construirIdTemaRegisto(item = {}, indice = 0) {
    const idTemaRecebido = normalizarIdTema(item.idTema ?? item.id_tema);
    if (idTemaRecebido) {
        return idTemaRecebido;
    }

    const idOrigem = normalizarIdTema(
        item.id
        ?? item.ID
        ?? item.idRegisto
        ?? item.id_registo
        ?? item.idSubmissao
    );
    if (idOrigem) {
        return `tema-id-${idOrigem}`;
    }

    const rowOrigem = normalizarIdTema(item.row ?? item.linha ?? item.Row);
    if (rowOrigem) {
        return `tema-row-${rowOrigem}`;
    }

    return `tema-idx-${indice + 1}`;
}

function abrirModalParecerTema(idTema) {
    console.log("[TemasMonografia][Modal] abrirModalParecerTema chamado com idTema:", idTema);
    if (!modalParecerTema) {
        console.error("[TemasMonografia][Modal] #modalParecerTema não encontrado no DOM.");
        return;
    }
    const idTemaNormalizado = normalizarIdTema(idTema);
    console.log("[TemasMonografia][Modal] Validação idTema normalizado:", idTemaNormalizado);
    const registo = temasParecerRegistos.find((item) => normalizarIdTema(item.idTema) === idTemaNormalizado);
    if (!registo) {
        console.error("[TemasMonografia][Modal] Nenhum registo encontrado para idTema:", idTemaNormalizado);
        console.log("[TemasMonografia][Modal] IDs disponíveis:", temasParecerRegistos.map((item) => normalizarIdTema(item.idTema)));
        alert("Não foi possível localizar o registo deste tema. Actualize a lista e tente novamente.");
        return;
    }

    console.log("[TemasMonografia][Modal] Registo encontrado:", registo);
    console.log("[TemasMonografia][Modal] Campos no registo:", Object.keys(registo));

    idTemaModalAtual = normalizarIdTema(registo.idTema);
    temaModalNome.value = registo.nome || "";
    temaModalLinhaPesquisa.value = registo.linhaPesquisa || registo.linha || "";
    temaModalTema.value = registo.tema || "";
    temaModalResumo.value = obterResumoTema(registo);
    temaModalParecer.value = registo.parecer || "";
    temaModalObservacoes.value = registo.observacoes || "";
    console.log("[TemasMonografia][Modal] Valor de resumo normalizado:", temaModalResumo.value);

    modalParecerTema.style.display = "flex";
    modalParecerTema.setAttribute("aria-hidden", "false");
    console.log("[TemasMonografia][Modal] Modal aberto com sucesso para idTema:", idTemaModalAtual);
}

function fecharModalParecerTema() {
    if (!modalParecerTema) return;
    modalParecerTema.style.display = "none";
    modalParecerTema.setAttribute("aria-hidden", "true");
    idTemaModalAtual = "";
}

function obterRegistoAtribuirSupervisorPorId(idTema = "") {
    const id = String(idTema).trim();
    if (!id) return null;
    return dadosGestaoGeral.find((item) => String(item.idTema).trim() === id) || null;
}

function ajustarAlturaTemaModalAtribuirSupervisor() {
    if (!atribuirSupervisorModalTema) return;
    atribuirSupervisorModalTema.style.height = "auto";
    const alturaNecessaria = Math.max(atribuirSupervisorModalTema.scrollHeight, 88);
    atribuirSupervisorModalTema.style.height = `${alturaNecessaria}px`;
}

function abrirModalAtribuirSupervisor(idTema = "") {
    if (!modalAtribuirSupervisor) return;
    console.log("[MODAL] Abrir modal com idTema:", idTema);
    console.log("[MODAL] Registos disponíveis:", dadosGestaoGeral);
    const registo = obterRegistoAtribuirSupervisorPorId(idTema);
    if (!registo) {
        console.error("[ATRIBUIR] Registo não encontrado para idTema:", idTema);
        alert("Erro: não foi possível localizar os dados deste registo.");
        return;
    }

    idTemaAtribuirSupervisorAtual = String(registo.idTema || "").trim();
    if (atribuirSupervisorModalNome) atribuirSupervisorModalNome.value = registo.nome || "";
    if (atribuirSupervisorModalCurso) atribuirSupervisorModalCurso.value = registo.curso || "";
    if (atribuirSupervisorModalLinhaPesquisa) atribuirSupervisorModalLinhaPesquisa.value = registo.linhaPesquisa ?? registo.linha ?? "";
    if (atribuirSupervisorModalTema) atribuirSupervisorModalTema.value = registo.tema ?? "";
    ajustarAlturaTemaModalAtribuirSupervisor();
    if (atribuirSupervisorModalSelect) {
        atribuirSupervisorModalSelect.innerHTML = opcoesSupervisoresHTML(registo.supervisorAtualOuVazio, registo.opcoesSupervisores);
        atribuirSupervisorModalSelect.disabled = false;
    }
    if (btnAtribuirSupervisorModal) {
        btnAtribuirSupervisorModal.disabled = false;
        btnAtribuirSupervisorModal.textContent = "Atribuir";
    }

    modalAtribuirSupervisor.style.display = "flex";
    modalAtribuirSupervisor.setAttribute("aria-hidden", "false");
}

function fecharModalAtribuirSupervisor() {
    if (!modalAtribuirSupervisor) return;
    modalAtribuirSupervisor.style.display = "none";
    modalAtribuirSupervisor.setAttribute("aria-hidden", "true");
    idTemaAtribuirSupervisorAtual = "";
}

async function guardarAtribuicaoSupervisorModal() {
    if (!idTemaAtribuirSupervisorAtual) return;
    const registo = obterRegistoAtribuirSupervisorPorId(idTemaAtribuirSupervisorAtual);
    if (!registo) return;

    const supervisor = String(atribuirSupervisorModalSelect?.value || "").trim();
    if (!supervisor) {
        alert("Seleccione um supervisor.");
        return;
    }

    if (!registo.idEstudante && !registo.row) {
        alert("Não foi possível identificar o estudante (sem ID/row).");
        return;
    }

    const botao = btnAtribuirSupervisorModal;
    activarLoadingGuardar(botao, "A atribuir...");

    try {
        const dados = new URLSearchParams();
        dados.append("action", "atribuirSupervisorLinha");
        dados.append("supervisor", supervisor);
        if (registo.idEstudante) dados.append("idEstudante", registo.idEstudante);
        if (registo.row) dados.append("row", registo.row);

        const resp = await fetch(WEB_URL, { method: "POST", body: dados });
        const json = await resp.json();
        if (!json.sucesso) throw new Error(json.mensagem || "Erro ao atribuir supervisor.");

        registo.supervisorAtualOuVazio = supervisor;
        registo.supervisor = supervisor;
        registo.supervisorFinal = supervisor;
        renderTabelaGestaoGeral();
        fecharModalAtribuirSupervisor();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao atribuir supervisor.");
        desactivarLoadingGuardar(botao);
    }
}

function atualizarLinhaTemaUI(idTema, dadosAtualizados = {}) {
    const linha = document.querySelector(`.tema-parecer-linha[data-id="${idTema}"]`);
    if (!linha) return;

    const parecer = dadosAtualizados.parecer ?? "";
    const badge = linha.querySelector(".credencial-status .status");
    if (badge) {
        badge.className = `status ${obterClasseStatusCredencial(parecer)}`;
        badge.textContent = obterLabelStatusCredencial(parecer);
    }
}

function mostrarMensagemTabelaDefesa(mensagem) {
    const tbody = document.getElementById("listaDefesas");
    const paginacaoContainer = document.getElementById("paginacaoDefesas");
    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="6">${escaparHTML(mensagem)}</td>
        </tr>
    `;
    paginaAtualDefesas = 1;
    if (paginacaoContainer) {
        paginacaoContainer.innerHTML = "";
    }
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
    const paginacaoContainer = document.getElementById("paginacaoDefesas");
    if (!tbody) {
        return;
    }

    const listaSegura = Array.isArray(lista) ? lista : [];
    const listaPendente = listaSegura
        .map((item, indiceOriginal) => ({ item, indiceOriginal }))
        .filter(({ item }) => defesaAindaPendente(item));
    const estadoPaginacao = calcularEstadoPaginacao(listaPendente.length, paginaAtualDefesas, linhasPorPagina);
    paginaAtualDefesas = estadoPaginacao.paginaAtual;

    if (!listaPendente.length) {
        mostrarMensagemTabelaDefesa("Nenhum registo de defesa encontrado.");
        return;
    }

    const inicio = estadoPaginacao.inicio;
    const fim = estadoPaginacao.fim;
    const paginaDados = listaPendente.slice(inicio, fim);
    console.log("[DefesaMonografia][Diagnostico] Paginação e renderização:", {
        totalAposTratamento: listaPendente.length,
        paginaAtual: paginaAtualDefesas,
        itensPorPagina: linhasPorPagina,
        totalRenderizado: paginaDados.length
    });

    tbody.innerHTML = paginaDados.map(({ item, indiceOriginal }) => {
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
        const linkPdfFinal = linkPdf || item.linkPDF || item.linkPdf || item.pdf || item.PDF || "";
        const situacaoTexto = obterSituacaoDefesaParaTabela(item);
        const situacaoNormalizada = situacaoTexto.toLowerCase();
        let situacaoClasse = "status-pendente";

        if (situacaoNormalizada.includes("agendado") || situacaoNormalizada.includes("aprov")) {
            situacaoClasse = "status-aprovado";
        } else if (situacaoNormalizada.includes("recus") || situacaoNormalizada.includes("reprov")) {
            situacaoClasse = "status-recusado";
        }

        const situacaoHtml = `<span class="status ${situacaoClasse} defesa-situacao-badge">${escaparHTML(situacaoTexto)}</span>`;
        const linkPdfHtml = linkPdfFinal
            ? `<a class="pdf-icon defesa-pdf-link" href="${escaparHTML(linkPdfFinal)}" target="_blank" rel="noopener noreferrer" aria-label="Ver PDF"><span>PDF</span></a>`
            : "—";

        return `
            <tr>
                <td class="col-data">${escaparHTML(formatarDataCurta(itemSeguro.data))}</td>
                <td class="col-nome">${escaparHTML(itemSeguro.nome)}</td>
                <td class="col-curso">${escaparHTML(itemSeguro.curso || "—")}</td>
                <td class="col-arquivo">${linkPdfHtml}</td>
                <td class="col-status">${situacaoHtml}</td>
                <td class="col-acao">
                    <button
                        type="button"
                        class="btn-editar-defesa"
                        data-index="${indiceOriginal}"
                        aria-label="Ver e actualizar registo de defesa"
                        title="Ver e actualizar"
                    ></button>
                </td>
            </tr>
        `;
    }).join("");
    if (paginacaoContainer) {
        paginacaoContainer.innerHTML = estadoPaginacao.deveMostrarPaginacao
            ? markupPaginacaoPadrao({
                paginaAtual: estadoPaginacao.paginaAtual,
                totalPaginas: estadoPaginacao.totalPaginas,
                ariaLabel: "Paginação Defesas"
            })
            : "";
        const btnAnterior = paginacaoContainer.querySelector("[data-pagina='anterior']");
        const btnSeguinte = paginacaoContainer.querySelector("[data-pagina='seguinte']");
        btnAnterior?.addEventListener("click", () => atualizarTabelaDefesas(paginaAtualDefesas - 1));
        btnSeguinte?.addEventListener("click", () => atualizarTabelaDefesas(paginaAtualDefesas + 1));
    }
}

function atualizarTabelaDefesas(pagina = 1) {
    paginaAtualDefesas = pagina;
    renderTabelaDefesa(defesasCache);
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
        curso: registo.curso || "",
        numero: registo.numero || "",
        contacto1: registo.contacto1 || "",
        contacto2: registo.contacto2 || "",
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
    const inputCurso = document.getElementById("defesaCurso");
    const inputNumero = document.getElementById("defesaNumero");
    const inputContacto1 = document.getElementById("defesaContacto1");
    const inputContacto2 = document.getElementById("defesaContacto2");
    const btnAgendar = document.getElementById("btnGuardarEdicaoDefesa");

    const defesaJaAgendada = defesaEstaAgendada(registoDefesaEmEdicao);

    if (inputNome) inputNome.value = registoDefesaEmEdicao.nome;
    if (inputSupervisor) inputSupervisor.value = registoDefesaEmEdicao.supervisor;
    if (inputCurso) inputCurso.value = registoDefesaEmEdicao.curso;
    if (inputNumero) inputNumero.value = registoDefesaEmEdicao.numero;
    if (inputContacto1) inputContacto1.value = registoDefesaEmEdicao.contacto1;
    if (inputContacto2) inputContacto2.value = registoDefesaEmEdicao.contacto2;
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

}

function guardarParecerModalCredencial({ fecharModal = true } = {}) {
    if (!idCredencialModalAtual) return false;
    const registos = obterRegistosPorModuloCredencial(moduloCredencialModalAtual);
    const registo = registos.find((item) => String(item.id || "").trim() === idCredencialModalAtual);
    if (!registo) return false;

    registo.parecer = (credModalParecer?.value || "").trim();
    registo.observacoes = (credModalObservacoes?.value || "").trim();

    atualizarLinhaCredencialUI(idCredencialModalAtual, {
        parecer: registo.parecer
    });
    if (fecharModal) {
        fecharModalParecerCredencial();
    }
    return true;
}

async function guardarParecerCredencialModalBackend() {
    const dadosAplicados = guardarParecerModalCredencial({ fecharModal: false });
    if (!dadosAplicados) return;
    const guardadoComSucesso = await guardarCredencialPesquisa(btnGuardarParecerCredencial);
    if (guardadoComSucesso) {
        fecharModalParecerCredencial();
    }
}

async function guardarParecerEstagioModalBackend() {
    const dadosAplicados = guardarParecerModalCredencial({ fecharModal: false });
    if (!dadosAplicados) return;
    const guardadoComSucesso = await guardarCredencialEstagioRegistos(btnGuardarParecerCredencial);
    if (guardadoComSucesso) {
        fecharModalParecerCredencial();
        await carregarCredenciaisEstagioGestor();
    }
}

function configurarEventosModalCredencial() {
    document.getElementById("btnFecharModalParecerCredencial")?.addEventListener("click", fecharModalParecerCredencial);
    btnGuardarParecerCredencial?.addEventListener("click", () => {
        if (moduloCredencialModalAtual === "estagio") {
            guardarParecerEstagioModalBackend();
            return;
        }
        guardarParecerCredencialModalBackend();
    });

    modalParecerCredencial?.addEventListener("click", (event) => {
        if (event.target === modalParecerCredencial) {
            fecharModalParecerCredencial();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalParecerCredencial?.style.display === "flex") {
            fecharModalParecerCredencial();
        }
    });
}

async function guardarParecerTemaModalBackend() {
    if (!idTemaModalAtual) return;
    const registo = temasParecerRegistos.find((item) => String(item.idTema || "").trim() === idTemaModalAtual);
    if (!registo) return;

    const parecer = String(temaModalParecer?.value || "").trim();
    const observacoes = String(temaModalObservacoes?.value || "").trim();
    const botao = btnGuardarParecerTema;
    activarLoadingGuardar(botao);

    try {
        const payload = [{ idTema: idTemaModalAtual, parecer, observacoes }];
        const params = new URLSearchParams({
            action: "guardarParecer",
            dados: JSON.stringify(payload)
        });

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: params
        });
        const res = await resposta.json();

        if (!res?.sucesso) {
            throw new Error(res?.mensagem || "Erro ao guardar parecer.");
        }

        registo.parecer = parecer;
        registo.observacoes = observacoes;
        atualizarLinhaTemaUI(idTemaModalAtual, { parecer });
        fecharModalParecerTema();
    } catch (err) {
        console.error("Erro ao guardar parecer de tema:", err);
        alert(err?.message || "Erro ao guardar parecer.");
    } finally {
        desactivarLoadingGuardar(botao);
    }
}

function configurarEventosModalTema() {
    document.getElementById("btnFecharModalParecerTema")?.addEventListener("click", fecharModalParecerTema);
    btnGuardarParecerTema?.addEventListener("click", guardarParecerTemaModalBackend);

    modalParecerTema?.addEventListener("click", (event) => {
        if (event.target === modalParecerTema) {
            fecharModalParecerTema();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalParecerTema?.style.display === "flex") {
            fecharModalParecerTema();
        }
    });
}

async function guardarParecerMonografiaFinalModalBackend() {
    if (!idMonografiaFinalModalAtual) return;
    const registo = monografiaFinalRegistos.find(
        (item) => String(item.idSubmissao || "").trim() === idMonografiaFinalModalAtual
    );
    if (!registo) return;

    const parecer = String(monoModalParecer?.value || "").trim();
    const observacoes = String(monoModalObservacoes?.value || "").trim();
    const botao = btnGuardarParecerMonografiaFinal;
    activarLoadingGuardar(botao);

    try {
        const payload = [{ idSubmissao: idMonografiaFinalModalAtual, parecer, observacoes }];
        const dados = new FormData();
        dados.append("action", "atualizarMonografiaFinal");
        dados.append("linhas", JSON.stringify(payload));

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: dados
        });
        const resultado = await resposta.json();

        if (!resultado || resultado.sucesso !== true) {
            throw new Error(resultado?.mensagem || "Erro ao guardar parecer.");
        }

        registo.parecer = parecer;
        registo.observacoes = observacoes;
        atualizarLinhaMonografiaFinalUI(idMonografiaFinalModalAtual, { parecer });
        fecharModalParecerMonografiaFinal();
    } catch (err) {
        console.error("Erro ao guardar parecer da monografia final:", err);
        alert(err?.message || "Erro ao guardar parecer.");
    } finally {
        desactivarLoadingGuardar(botao);
    }
}

function configurarEventosModalMonografiaFinal() {
    document.getElementById("btnFecharModalParecerMonografiaFinal")
        ?.addEventListener("click", fecharModalParecerMonografiaFinal);
    btnGuardarParecerMonografiaFinal?.addEventListener("click", guardarParecerMonografiaFinalModalBackend);

    modalParecerMonografiaFinal?.addEventListener("click", (event) => {
        if (event.target === modalParecerMonografiaFinal) {
            fecharModalParecerMonografiaFinal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalParecerMonografiaFinal?.style.display === "flex") {
            fecharModalParecerMonografiaFinal();
        }
    });
}

function configurarEventosModalAtribuirSupervisor() {
    document.getElementById("btnFecharModalAtribuirSupervisor")?.addEventListener("click", fecharModalAtribuirSupervisor);
    btnAtribuirSupervisorModal?.addEventListener("click", guardarAtribuicaoSupervisorModal);

    modalAtribuirSupervisor?.addEventListener("click", (event) => {
        if (event.target === modalAtribuirSupervisor) {
            fecharModalAtribuirSupervisor();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalAtribuirSupervisor?.style.display === "flex") {
            fecharModalAtribuirSupervisor();
        }
    });
}

window.abrirModalEdicaoDefesa = abrirModalEdicaoDefesa;
window.fecharModalEdicaoDefesa = fecharModalEdicaoDefesa;
window.guardarSituacaoDefesa = guardarSituacaoDefesa;
window.guardarEdicaoDefesa = guardarEdicaoDefesa;
window.renderTabelaDefesa = renderTabelaDefesa;
configurarEventosModalDefesa();
configurarEventosModalCredencial();
configurarEventosModalTema();
configurarEventosModalMonografiaFinal();
configurarEventosModalAtribuirSupervisor();

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


function utilizadorTemPermissao(permissao) {
    if (!permissao) return true;
    return typeof window.temPermissaoGestor === "function" && window.temPermissaoGestor(permissao);
}

function bloquearFuncionalidadeSemPermissao(permissao, mensagem = "Não tem permissão para aceder a esta funcionalidade.") {
    if (utilizadorTemPermissao(permissao)) {
        return false;
    }

    esconderCarregamento();
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();

    const tabelaGestaoGeral = document.getElementById("tabelaGestaoGeral");
    if (tabelaGestaoGeral) {
        tabelaGestaoGeral.classList.remove("gestor-loading-container");
        tabelaGestaoGeral.setAttribute("aria-busy", "false");
        tabelaGestaoGeral.innerHTML = `<p class="sem-dados">${mensagem}</p>`;
    }

    reaplicarRestricoesUI();
    return true;
}

function carregarInicioGestor() {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    modoTabelaGestao = "geral";

    const tabelaGestaoGeral = document.getElementById("tabelaGestaoGeral");
    if (!tabelaGestaoGeral) return;

    tabelaGestaoGeral.classList.remove("gestor-loading-container");
    tabelaGestaoGeral.setAttribute("aria-busy", "false");
    tabelaGestaoGeral.innerHTML = `
        <section class="gestor-boas-vindas" aria-label="Mensagem de boas-vindas">
            <h2>Bem-vindo ao painel do gestor da Secretaria Online – FACEE.</h2>
            <p>Seleccione uma funcionalidade no menu lateral para começar.</p>
        </section>
    `;

    reaplicarRestricoesUI();
}

// Tema Monografia
document.getElementById("btnInicio")?.addEventListener("click", () => {
    carregarInicioGestor();
});

document.getElementById("btnGestaoGeral").addEventListener("click", () => {
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    modoTabelaGestao = "geral";
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
    paginaAtualMonografiaFinal = 1;
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
    paginaAtualTemasParecer = 1;
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
    if (bloquearFuncionalidadeSemPermissao("CREDENCIAL")) return;
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    paginaAtualCredencialPesquisa = 1;
    mostrarLoadingPainelGestor("A carregar…");
    carregarCredencialPesquisa();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Estágios
document.getElementById("btnCredencialEstagio").addEventListener("click", () => {
    if (bloquearFuncionalidadeSemPermissao("CREDENCIAL")) return;
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    paginaAtualCredencialEstagio = 1;
    mostrarLoadingPainelGestor("A carregar…");
    carregarCredenciaisEstagioGestor();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Documentos Emitidos
document.getElementById("btnDocumentosEmitidos")?.addEventListener("click", () => {
    if (bloquearFuncionalidadeSemPermissao("DOCUMENTOS_EMITIDOS")) return;
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    paginaAtualDocumentosEmitidos = 1;
    renderSecaoDocumentosEmitidos();
    reaplicarRestricoesUI();
});

// Emitir Documentos
document.getElementById("btnEmitirDocumentos")?.addEventListener("click", () => {
    if (bloquearFuncionalidadeSemPermissao("EMITIR_DOCUMENTOS")) return;
    esconderEstatisticas();
    esconderSecaoDefesas();
    mostrarTabelaGestaoGeral();
    paginaAtualDocumentosParaEmitir = 1;
    carregarDocumentosParaEmitir();
    reaplicarRestricoesUI();
});

// Listas e Estatísticas (MOSTRA o container)
document.getElementById("btnEstatisticas").addEventListener("click", () => {
    if (bloquearFuncionalidadeSemPermissao("ESTATISTICAS")) return;
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
    tabelaGestaoGeral.addEventListener("click", (e) => {
        const btnAtribuir = e.target.closest("[data-atribuir-acao]");
        if (btnAtribuir && modoTabelaGestao === "atribuirSupervisor") {
            const idTema = String(btnAtribuir.dataset.atribuirAcao || "").trim();
            console.log("[CLICK] Botão atribuir clicado:", idTema);
            abrirModalAtribuirSupervisor(idTema);
            return;
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
    const isRelatorioPlanosAnaliticos = ehRelatorioPlanosAnaliticos(parametros.tipo);

    if (isRelatorioPlanosAnaliticos) {
        await gerarRelatorioPlanosAnaliticosPorTipo(parametros.tipo);
        if (window.aplicarRestricoesUI && window.userEmail) {
            aplicarRestricoesUI(window.userEmail);
        }
        return;
    }

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
    if (ehRelatorioPlanosAnaliticos(tipo)) {
        return "";
    }

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

function ehRelatorioPlanosAnaliticos(tipo) {
    return TIPOS_RELATORIO_PLANOS_ANALITICOS.has(tipo);
}

function normalizarTipoRelatorioPlanosAnaliticos(tipo) {
    const mapaTipos = {
        planos_analiticos_submetidos: "submetidos",
        planos_analiticos_nao_submetidos: "nao-submetidos",
        planos_analiticos_todos: "todos"
    };
    return mapaTipos[tipo] || "";
}

function definirLoadingBotaoRelatorios(emLoading) {
    const botao = document.getElementById("btnBuscarEstatisticas");
    if (!botao) return;

    if (emLoading) {
        if (!botao.disabled) {
            botao.dataset.textoOriginal = botao.textContent;
        }
        botao.disabled = true;
        botao.textContent = "A gerar...";
        return;
    }

    botao.disabled = false;
    botao.textContent = botao.dataset.textoOriginal || "Buscar";
}

async function gerarRelatorioPlanosAnaliticosPorTipo(tipo) {
    const tipoNormalizado = normalizarTipoRelatorioPlanosAnaliticos(tipo);
    if (!tipoNormalizado) {
        actualizarEstadoRelatorio("O tipo de relatório seleccionado não é válido.", true);
        return;
    }

    definirLoadingBotaoRelatorios(true);
    actualizarEstadoRelatorio("A gerar relatório…");

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

        mostrarLinkRelatorio(url);
    } catch (erro) {
        console.error("Erro ao gerar relatório de planos analíticos:", erro);
        actualizarEstadoRelatorio(
            erro?.message || "Ocorreu um erro ao gerar o relatório.",
            true
        );
    } finally {
        definirLoadingBotaoRelatorios(false);
        reaplicarRestricoesUI();
    }
}

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
            dadosFiltrados = dados.filter(item => {
                const estadoTemaAprovado = normalizarCampo(item.colL) === "aprovado";
                const supervisorJaAtribuido = String(item.supervisorFinal ?? item.supervisor ?? "").trim() !== "";
                return estadoTemaAprovado && !supervisorJaAtribuido;
            });
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
            const idTema = String(item.idTema || item.id || item.linha || index + 1).trim();

            return {
                ...item,
                idTema,
                row: linhaPlanilha,
                opcoesSupervisores: opcoes,
                supervisorAtualOuVazio
            };
        });

        dadosGestaoGeral = dadosOrdenados;
        paginaAtual = 1;
        renderTabelaGestaoGeral(dadosGestaoGeral, paginaAtual);
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

function renderizarControlesGestaoGeral(totalRegistos = dadosGestaoGeral.length) {
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

    const estadoPaginacao = calcularEstadoPaginacao(totalRegistos, paginaAtual, linhasPorPagina);
    if (estadoPaginacao.deveMostrarPaginacao) {
        const barraPaginacao = document.createElement("div");
        barraPaginacao.innerHTML = markupPaginacaoPadrao({
            paginaAtual: estadoPaginacao.paginaAtual,
            totalPaginas: estadoPaginacao.totalPaginas,
            ariaLabel: "Paginação Gestão Geral"
        });

        const nav = barraPaginacao.querySelector(".paginacao-analiticos");
        const btnAnterior = barraPaginacao.querySelector("[data-pagina='anterior']");
        const btnSeguinte = barraPaginacao.querySelector("[data-pagina='seguinte']");
        if (btnAnterior) {
            btnAnterior.addEventListener("click", () => mudarPagina(-1));
        }
        if (btnSeguinte) {
            btnSeguinte.addEventListener("click", () => mudarPagina(1));
        }
        if (nav) {
            nav.style.margin = "0";
        }
        container.appendChild(barraPaginacao);
    }

    area.appendChild(container);
}

function renderTabelaGestaoGeral(dados = dadosGestaoGeral, pagina = 1) {
    const container = document.getElementById("tabelaGestaoGeral");

    if (!container) return;

    const { estadoPaginacao, paginaDados } = obterDadosPaginados(dados, pagina, linhasPorPagina);
    paginaAtual = estadoPaginacao.paginaAtual;
    totalPaginas = estadoPaginacao.totalPaginas;
    const inicio = estadoPaginacao.inicio;
    const isGeral = modoTabelaGestao === "geral";
    const isHomologar = modoTabelaGestao === "homologarSupervisor";
    const isAtribuir = modoTabelaGestao === "atribuirSupervisor";

    if (isAtribuir) {
        let htmlAtribuir = `
            <div class="credencial-lista-head tema-lista-head">
                <div>Data</div>
                <div>Nome</div>
                <div>Curso</div>
                <div>Status</div>
                <div>Acções</div>
            </div>
            <div class="credencial-lista table-credencial table-tema-parecer">
        `;

        paginaDados.forEach((registo) => {
            const idTema = String(registo.idTema || "").trim();
            const statusClasse = obterClasseStatusAtribuicaoSupervisor(registo);
            const statusLabel = obterLabelStatusAtribuicaoSupervisor(registo);

            htmlAtribuir += `
                <article class="credencial-linha tema-parecer-linha" data-id="${escaparHTML(idTema)}">
                    <div class="credencial-data">${escaparHTML(formatarDataCurta(registo.data || registo.timestamp))}</div>
                    <div class="credencial-estudante">
                        <p class="credencial-nome">${escaparHTML(registo.nome || "—")}</p>
                    </div>
                    <div class="credencial-curso">${escaparHTML(registo.curso || "—")}</div>
                    <div class="credencial-status">
                        <span class="status ${statusClasse}">${statusLabel}</span>
                    </div>
                    <div class="credencial-acao">
                        <button class="credencial-btn-acao" type="button" data-atribuir-acao="${escaparHTML(registo.idTema)}" aria-label="Ver detalhes e atribuir supervisor">
                            <span aria-hidden="true">👁</span>
                        </button>
                    </div>
                </article>
            `;
        });

        htmlAtribuir += `</div>`;
        container.innerHTML = htmlAtribuir;
        renderizarControlesGestaoGeral(dados.length);
        aplicarDadosBloqueio();
        reaplicarRestricoesUI();
        return;
    }

    const classesTabela = ["tabela-gestao"];
    if (isHomologar) {
        classesTabela.push("tabela-defesas-resumo", "tabela-homologar-listas");
    }

    let html = `
            <div class="tabela-scroll">
            <table class="${classesTabela.join(" ")}">
                <thead>
                    <tr>
                        ${!isHomologar ? `<th class="col-ord">Ord</th>` : ""}
                        <th class="col-data">Data</th>
                        <th class="col-nome">Nome</th>
                        <th class="col-curso">Curso</th>
                        ${!isHomologar ? `<th class="col-linha">Linha de Pesquisa</th>` : ""}
                        ${!isHomologar ? `<th class="col-tema">Tema</th>` : ""}
                        ${!isHomologar ? `<th class="col-supervisor">Proposta de Supervisor</th>` : ""}
                        ${isHomologar ? `<th class="col-supervisor">Supervisor</th>` : ""}
                        ${isGeral ? `<th class="col-parecer">Parecer</th>` : ""}
                        ${isGeral ? `<th class="col-observacoes">Observações</th>` : ""}
                        ${(isGeral || isHomologar) ? `<th class="col-homologacao">Homologação</th>` : ""}
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
                    ${!isHomologar ? `<td class="col-ord">${indiceGlobal + 1}</td>` : ""}
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
                        <select class="homologacao homologacao-homologar-listas" data-row="${item.row}" data-id="${idTema}" data-original="${homologacaoAtual}">
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
    renderizarControlesGestaoGeral(dados.length);
    aplicarDadosBloqueio();
    reaplicarRestricoesUI();
}

function mudarPagina(delta) {
    atualizarTabelaGestaoGeral(paginaAtual + delta);
}

function atualizarTabelaGestaoGeral(pagina = 1) {
    paginaAtual = pagina;
    renderTabelaGestaoGeral(dadosGestaoGeral, paginaAtual);
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
        const dados = Array.isArray(resposta.dados) ? resposta.dados : [];
        const dadosFiltrados = dados.filter(item => {
            const parecer = item.parecer ?? item.Parecer ?? "";
            return parecer.toString().trim() === "";
        });
        monografiaFinalRegistos = dadosFiltrados.map((item) => ({
            ...item,
            idSubmissao: String(item.idSubmissao || "").trim(),
            parecer: String(item.parecer ?? item.Parecer ?? "").trim(),
            observacoes: String(item.observacoes ?? item.Observacoes ?? "").trim()
        }));
        if (!monografiaFinalRegistos || monografiaFinalRegistos.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Não existe nenhum dado para ser apresentado.</p>';
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }

        paginaAtualMonografiaFinal = 1;
        renderTabelaMonografiaFinal(monografiaFinalRegistos, paginaAtualMonografiaFinal);
        document.getElementById("btnGuardar")?.remove();
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

function renderTabelaMonografiaFinal(dados = [], pagina = 1) {
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;
    container.classList.add("gestor-card-listagem");
    const { estadoPaginacao, paginaDados } = obterDadosPaginados(dados, pagina, linhasPorPagina);
    paginaAtualMonografiaFinal = estadoPaginacao.paginaAtual;

        let html = `
            <div class="gestor-listagem-bloco">
                <div class="tabela-scroll tabela-scroll-monografia">
                    <div class="credencial-lista-head">
                        <div>Data</div>
                        <div>Nome</div>
                        <div>Curso</div>
                        <div>Ficheiro</div>
                        <div>Status</div>
                        <div>Acções</div>
                    </div>
                    <div class="credencial-lista table-credencial table-monografia-final">
            `;

        paginaDados.forEach((item) => {
            const idSubmissao = (item.idSubmissao || "").toString().trim();
            const statusClasse = obterClasseStatusCredencial(item.parecer);
            const statusLabel = obterLabelStatusCredencial(item.parecer);
            const linkPDF = item.linkPDF || item.pdfURL || "#";
            const idEmFalta = !idSubmissao;
            html += `
                <article class="credencial-linha" data-id="${idSubmissao}">
                    <div class="credencial-data">${formatarDataCurta(item.timestamp)}</div>
                    <div class="credencial-estudante">
                        <p class="credencial-nome">${item.nome || "—"}</p>
                    </div>
                    <div class="credencial-curso">${item.curso || "—"}</div>
                    <div class="credencial-arquivo">
                        <a class="pdf-icon credencial-pdf-link" href="${linkPDF}" target="_blank" rel="noopener noreferrer" aria-label="Ver documento PDF">
                            <span>PDF</span>
                        </a>
                    </div>
                    <div class="credencial-status">
                        <span class="status ${statusClasse}">${statusLabel}</span>
                    </div>
                    <div class="credencial-acao">
                        <button class="credencial-btn-acao" type="button" data-monografia-acao="${idSubmissao}" aria-label="Ver e emitir parecer"${idEmFalta ? " disabled" : ""}>
                            <span aria-hidden="true">👁</span>
                        </button>
                    </div>
                </article>
            `;
        });

        html += `
                    </div>
                </div>
        `;

        if (estadoPaginacao.deveMostrarPaginacao) {
            html += markupPaginacaoPadrao({
                paginaAtual: estadoPaginacao.paginaAtual,
                totalPaginas: estadoPaginacao.totalPaginas,
                ariaLabel: "Paginação Monografia Final"
            });
        }

        html += `
            </div>
        `;

        container.innerHTML = html;
        const btnAnterior = container.querySelector("[data-pagina='anterior']");
        const btnSeguinte = container.querySelector("[data-pagina='seguinte']");
        if (btnAnterior) {
            btnAnterior.addEventListener("click", () => {
                atualizarTabelaMonografiaFinal(paginaAtualMonografiaFinal - 1);
            });
        }
        if (btnSeguinte) {
            btnSeguinte.addEventListener("click", () => {
                atualizarTabelaMonografiaFinal(paginaAtualMonografiaFinal + 1);
            });
        }
}

function atualizarTabelaMonografiaFinal(pagina = 1) {
    paginaAtualMonografiaFinal = pagina;
    renderTabelaMonografiaFinal(monografiaFinalRegistos, paginaAtualMonografiaFinal);
}

function renderSecaoDocumentosEmitidos() {
    if (bloquearFuncionalidadeSemPermissao("DOCUMENTOS_EMITIDOS")) return;
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;

    container.classList.remove("gestor-loading-container");
    container.setAttribute("aria-busy", "false");
    container.innerHTML = `
        <section class="gestor-listagem-bloco">
            <div class="form-card documentos-emitidos-filtros">
                <div class="documentos-emitidos-linha">
                    <div class="form-field documentos-emitidos-campo documentos-emitidos-campo-tipo documentos-emitidos-campo-inline">
                        <label for="documentoEmitidoTipo">Tipo de documento</label>
                        <select id="documentoEmitidoTipo">
                            <option value="">Seleccione…</option>
                            <option value="Credencial de Pesquisa">Credencial de Pesquisa</option>
                            <option value="Pedido de Estagio">Pedido de Estagio</option>
                        </select>
                    </div>
                    <div class="form-field documentos-emitidos-campo documentos-emitidos-campo-numero documentos-emitidos-campo-inline">
                        <label for="documentoEmitidoNumero">Número</label>
                        <input id="documentoEmitidoNumero" type="text" inputmode="numeric" maxlength="12" placeholder="Digite o número de estudante">
                    </div>
                    <div class="documentos-emitidos-acao">
                        <button id="btnBuscarDocumentosEmitidos" class="documentos-emitidos-btn" type="button">Buscar</button>
                    </div>
                </div>
            </div>
            <div id="resultadoDocumentosEmitidos" class="gestor-card-listagem"></div>
        </section>
    `;

    document.getElementById("btnBuscarDocumentosEmitidos")?.addEventListener("click", buscarDocumentosEmitidos);
}

function renderMensagemDocumentosEmitidos(mensagem = "", tipo = "info") {
    const resultado = document.getElementById("resultadoDocumentosEmitidos");
    if (!resultado) return;

    if (tipo === "erro") {
        resultado.innerHTML = `<p>${escaparHTML(mensagem || "Ocorreu um erro ao buscar documentos emitidos.")}</p>`;
        return;
    }

    resultado.innerHTML = `<p class="sem-dados">${escaparHTML(mensagem || "Nenhum documento emitido encontrado para este número.")}</p>`;
}

async function buscarDocumentosEmitidos() {
    if (bloquearFuncionalidadeSemPermissao("DOCUMENTOS_EMITIDOS")) return;
    const tipoDocumento = (document.getElementById("documentoEmitidoTipo")?.value || "").trim();
    const numeroEstudante = (document.getElementById("documentoEmitidoNumero")?.value || "").trim();

    if (!tipoDocumento) {
        renderMensagemDocumentosEmitidos("Seleccione o tipo de documento.", "info");
        return;
    }

    if (!numeroEstudante) {
        renderMensagemDocumentosEmitidos("Preencha o número de estudante.", "info");
        return;
    }

    const resultado = document.getElementById("resultadoDocumentosEmitidos");
    if (!resultado) return;
    resultado.innerHTML = criarMarkupLoadingPainel("A carregar…");

    try {
        const params = new URLSearchParams();
        params.append("action", "getDocumentosEmitidos");
        params.append("tipoDocumento", tipoDocumento);
        params.append("numeroEstudante", numeroEstudante);

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: params
        });
        const retorno = await resposta.json();

        if (!resposta.ok || retorno?.sucesso === false) {
            throw new Error(retorno?.mensagem || "Não foi possível carregar os documentos emitidos.");
        }

        documentosEmitidosRegistos = Array.isArray(retorno?.documentos) ? retorno.documentos : [];
        paginaAtualDocumentosEmitidos = 1;

        if (!documentosEmitidosRegistos.length) {
            renderMensagemDocumentosEmitidos(retorno?.mensagem || "Nenhum documento emitido encontrado para este número.");
            return;
        }

        renderTabelaDocumentosEmitidos(documentosEmitidosRegistos, paginaAtualDocumentosEmitidos);
    } catch (erro) {
        console.error("Erro ao buscar documentos emitidos:", erro);
        renderMensagemDocumentosEmitidos(erro?.message || "Erro ao buscar documentos emitidos.", "erro");
    } finally {
        reaplicarRestricoesUI();
    }
}

function renderTabelaDocumentosEmitidos(dados = [], pagina = 1) {
    const container = document.getElementById("resultadoDocumentosEmitidos");
    if (!container) return;

    if (!dados.length) {
        renderMensagemDocumentosEmitidos();
        return;
    }

    const { estadoPaginacao, paginaDados } = obterDadosPaginados(dados, pagina, linhasPorPagina);
    paginaAtualDocumentosEmitidos = estadoPaginacao.paginaAtual;

    let html = `
        <div class="tabela-scroll tabela-scroll-monografia">
            <div class="credencial-lista-head">
                <div>Data</div>
                <div>Nome</div>
                <div>Tipo de Pedido</div>
                <div>PDF</div>
            </div>
            <div class="credencial-lista table-credencial table-monografia-final">
    `;

    paginaDados.forEach((item) => {
        const linkPDF = item?.pdf ? String(item.pdf).trim() : "";
        const linkPDFHtml = linkPDF
            ? `<a class="pdf-icon credencial-pdf-link" href="${escaparHTML(linkPDF)}" target="_blank" rel="noopener noreferrer" aria-label="Ver documento PDF"><span>PDF</span></a>`
            : "—";

        html += `
            <article class="credencial-linha">
                <div class="credencial-data">${escaparHTML(formatarDataDocumentoEmitido(item?.data || ""))}</div>
                <div class="credencial-estudante">
                    <p class="credencial-nome">${escaparHTML(item?.nome || "—")}</p>
                </div>
                <div class="credencial-curso">${escaparHTML(item?.tipoPedido || "—")}</div>
                <div class="credencial-arquivo">${linkPDFHtml}</div>
            </article>
        `;
    });

    html += `
            </div>
        </div>
    `;

    html += markupPaginacaoPadrao({
        paginaAtual: paginaAtualDocumentosEmitidos,
        totalPaginas: estadoPaginacao.totalPaginas,
        ariaLabel: "Paginação Documentos Emitidos"
    });

    container.innerHTML = html;

    const btnAnterior = container.querySelector("[data-pagina='anterior']");
    const btnSeguinte = container.querySelector("[data-pagina='seguinte']");

    if (btnAnterior) {
        btnAnterior.addEventListener("click", () => {
            renderTabelaDocumentosEmitidos(documentosEmitidosRegistos, paginaAtualDocumentosEmitidos - 1);
        });
    }
    if (btnSeguinte) {
        btnSeguinte.addEventListener("click", () => {
            renderTabelaDocumentosEmitidos(documentosEmitidosRegistos, paginaAtualDocumentosEmitidos + 1);
        });
    }
}

async function carregarDocumentosParaEmitir() {
    if (bloquearFuncionalidadeSemPermissao("EMITIR_DOCUMENTOS")) return;
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;

    container.classList.remove("gestor-loading-container");
    container.setAttribute("aria-busy", "false");
    container.innerHTML = '<section class="gestor-listagem-bloco"><div id="resultadoDocumentosParaEmitir" class="gestor-card-listagem">' + criarMarkupLoadingPainel("A carregar documentos…") + '</div></section>';

    const resultado = document.getElementById("resultadoDocumentosParaEmitir");
    if (!resultado) return;

    try {
        const resposta = await fetch(`${WEB_URL}?action=getDocumentosParaEmitir`);
        const retorno = await resposta.json();

        if (!resposta.ok || retorno?.sucesso === false) {
            throw new Error(retorno?.mensagem || "Não foi possível carregar os documentos para emissão.");
        }

        documentosParaEmitirRegistos = Array.isArray(retorno?.documentos) ? retorno.documentos : [];
        paginaAtualDocumentosParaEmitir = 1;

        if (!documentosParaEmitirRegistos.length) {
            resultado.innerHTML = '<p class="sem-dados">Não existem documentos aprovados pendentes de emissão.</p>';
            return;
        }

        renderizarDocumentosParaEmitir(documentosParaEmitirRegistos, paginaAtualDocumentosParaEmitir);
    } catch (erro) {
        console.error("Erro ao carregar documentos para emitir:", erro);
        resultado.innerHTML = `<p>${escaparHTML(erro?.message || "Erro ao carregar documentos para emitir.")}</p>`;
    }
}

function renderizarDocumentosParaEmitir(documentos = [], pagina = 1) {
    if (bloquearFuncionalidadeSemPermissao("EMITIR_DOCUMENTOS")) return;
    const container = document.getElementById("resultadoDocumentosParaEmitir");
    if (!container) return;

    if (!documentos.length) {
        container.innerHTML = '<p class="sem-dados">Não existem documentos aprovados pendentes de emissão.</p>';
        return;
    }

    const { estadoPaginacao, paginaDados } = obterDadosPaginados(documentos, pagina, linhasPorPagina);
    paginaAtualDocumentosParaEmitir = estadoPaginacao.paginaAtual;

    let html = `
        <div class="tabela-scroll tabela-scroll-monografia">
            <div class="credencial-lista-head">
                <div>Data</div>
                <div>Nome</div>
                <div>Curso</div>
                <div>Tipo</div>
                <div>Ficheiro</div>
                <div>Acção</div>
            </div>
            <div class="credencial-lista table-credencial table-monografia-final">
    `;

    paginaDados.forEach((documento) => {
        const linkFicheiro = String(documento?.ficheiro || "").trim();
        const ficheiroHtml = linkFicheiro
            ? `<a class="pdf-icon credencial-pdf-link" href="${escaparHTML(linkFicheiro)}" target="_blank" rel="noopener noreferrer">Ver ficheiro</a>`
            : '<span class="sem-dados">Sem ficheiro</span>';

        html += `
            <article class="credencial-linha">
                <div class="credencial-data">${escaparHTML(formatarDataDocumentoEmitido(documento?.data || ""))}</div>
                <div class="credencial-estudante"><p class="credencial-nome">${escaparHTML(documento?.nome || "—")}</p></div>
                <div class="credencial-curso">${escaparHTML(documento?.curso || "—")}</div>
                <div class="credencial-curso">${escaparHTML(documento?.tipo || "—")}</div>
                <div class="credencial-arquivo">${ficheiroHtml}</div>
                <div class="credencial-acoes"><button class="credencial-btn-acao" type="button" data-emitir-origem="${escaparHTML(String(documento?.origem || ""))}" data-emitir-linha="${escaparHTML(String(documento?.linha || ""))}">Emitido</button></div>
            </article>
        `;
    });

    html += `</div></div>`;

    html += markupPaginacaoPadrao({
        paginaAtual: paginaAtualDocumentosParaEmitir,
        totalPaginas: estadoPaginacao.totalPaginas,
        ariaLabel: "Paginação Emitir Documentos"
    });

    container.innerHTML = html;

    container.querySelector("[data-pagina='anterior']")?.addEventListener("click", () => {
        renderizarDocumentosParaEmitir(documentosParaEmitirRegistos, paginaAtualDocumentosParaEmitir - 1);
    });
    container.querySelector("[data-pagina='seguinte']")?.addEventListener("click", () => {
        renderizarDocumentosParaEmitir(documentosParaEmitirRegistos, paginaAtualDocumentosParaEmitir + 1);
    });

    container.querySelectorAll("[data-emitir-origem]").forEach((botao) => {
        botao.addEventListener("click", () => {
            marcarComoEmitido(
                botao.dataset.emitirOrigem || "",
                botao.dataset.emitirLinha || "",
                botao
            );
        });
    });
}

async function marcarComoEmitido(origem, linha, botaoAcao) {
    if (bloquearFuncionalidadeSemPermissao("EMITIR_DOCUMENTOS")) return;
    if (botaoAcao) {
        botaoAcao.disabled = true;
        botaoAcao.classList.add("is-loading");
        botaoAcao.setAttribute("aria-busy", "true");
    }

    try {
        const params = new URLSearchParams();
        params.append("action", "marcarDocumentoEmitido");
        params.append("origem", String(origem || ""));
        params.append("linha", String(linha || ""));

        const resposta = await fetch(WEB_URL, { method: "POST", body: params });
        const retorno = await resposta.json();

        if (!resposta.ok || retorno?.sucesso === false) {
            alert(retorno?.mensagem || "Não foi possível marcar o documento como emitido.");
            if (retorno?.actualizarLista === true) {
                await carregarDocumentosParaEmitir();
            }
            return;
        }

        await carregarDocumentosParaEmitir();
    } catch (erro) {
        console.error("Erro ao marcar documento como emitido:", erro);
        alert(erro?.message || "Erro de rede ao marcar documento como emitido.");
    } finally {
        if (botaoAcao?.isConnected) {
            botaoAcao.disabled = false;
            botaoAcao.classList.remove("is-loading");
            botaoAcao.removeAttribute("aria-busy");
        }
    }
}

function formatarDataDocumentoEmitido(valor) {
    if (!valor) return "—";

    const valorTexto = String(valor).trim();
    if (!valorTexto) return "—";

    const valorSemHora = valorTexto.split(/[T\s]/)[0];
    const dataFormatada = normalizarDataPt(valorSemHora);

    return dataFormatada || valorSemHora;
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
        console.log("[DefesaMonografia][Diagnostico] Total recebido:", lista.length);

        // Mostra apenas processos ainda pendentes e delega a distribuição para a paginação.
        const defesasTratadas = lista
            .filter((item) => defesaAindaPendente(item))
            .map((item) => ({
                ...item,
                dataAgendada: item.dataAgendada || item.data_agendada || "",
                enviadoRA: normalizarDataPt(item.enviadoRA || item.enviadoAoRA || "")
            }));
        console.log("[DefesaMonografia][Diagnostico] Total após filtros:", defesasTratadas.length);
        console.log("[DefesaMonografia][Diagnostico] Total após tratamento:", defesasTratadas.length);

        if (!defesasTratadas.length) {
            defesasCache = [];
            mostrarSecaoDefesas();
            esconderTabelaGestaoGeral();
            mostrarMensagemTabelaDefesa("Nenhum registo de defesa encontrado.");
            return;
        }

        defesasCache = defesasTratadas;

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
    } finally {
        esconderCarregamento();
        reaplicarRestricoesUI();
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
    if (bloquearFuncionalidadeSemPermissao("CREDENCIAL")) return;
    mostrarCarregamentoAtribuirSupervisor();

    fetch(WEB_URL,
    {
        method: "POST",
        body: new URLSearchParams({ action: "getCredencialPesquisa" })
    })
    .then(r => r.json())
    .then(resposta => {
        const dados = Array.isArray(resposta.dados) ? resposta.dados : [];
        const temParecer = dados.length > 0
            && dados.some(item => Object.prototype.hasOwnProperty.call(item, "parecer")
                || Object.prototype.hasOwnProperty.call(item, "Parecer"));
        const dadosFiltrados = temParecer
            ? dados.filter(item => {
                const parecerValor = item.parecer ?? item.Parecer ?? "";
                return String(parecerValor).trim() === "";
            })
            : dados;
        credencialPesquisaRegistos = dadosFiltrados.map((item) => ({
            ...item,
            id: String(item.id || "").trim(),
            parecer: String(item.parecer ?? item.Parecer ?? "").trim(),
            observacoes: String(item.observacoes ?? item.Observacoes ?? "").trim()
        }));

        if (!credencialPesquisaRegistos || credencialPesquisaRegistos.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Não existe nenhum dado para ser apresentado.</p>';
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }
        paginaAtualCredencialPesquisa = 1;
        renderTabelaCredencialPesquisa(credencialPesquisaRegistos, paginaAtualCredencialPesquisa);
        document.getElementById("btnGuardar")?.remove();
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

function renderTabelaCredencialPesquisa(dados = [], pagina = 1) {
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;
    const { estadoPaginacao, paginaDados } = obterDadosPaginados(dados, pagina, linhasPorPagina);
    paginaAtualCredencialPesquisa = estadoPaginacao.paginaAtual;

        let html = `
            <div class="credencial-lista-head">
                <div>Data</div>
                <div>Nome</div>
                <div>Curso</div>
                <div>Arquivo</div>
                <div>Status</div>
                <div>Acção</div>
            </div>
            <div class="credencial-lista table-credencial">
        `;

        paginaDados.forEach((item, index) => {
            const rowNumber = obterRowNumericoCredencial(item.row, estadoPaginacao.inicio + index + 2);
            const idCredencial = String(item.id || "").trim();

            if (rowNumber === null) {
                return;
            }

            const statusClasse = obterClasseStatusCredencial(item.parecer);
            const statusBase = obterLabelStatusCredencial(item.parecer);
            const statusLabel = statusBase === "PENDENTE" ? "Em processo" : statusBase;

            html += `
                <article class="credencial-linha" data-id="${idCredencial}">
                    <div class="credencial-data">${formatarDataCurta(item.timestamp)}</div>
                    <div class="credencial-estudante">
                        <p class="credencial-nome">${item.nome || "—"}</p>
                    </div>
                    <div class="credencial-curso">${item.curso || "—"}</div>
                    <div class="credencial-arquivo">
                        <a class="pdf-icon credencial-pdf-link" href="${item.pdfURL || item.linkPDF || "#"}" target="_blank" rel="noopener noreferrer" aria-label="Ver documento PDF">
                            <span>PDF</span>
                        </a>
                    </div>
                    <div class="credencial-status">
                        <span class="status ${statusClasse}">${statusLabel}</span>
                    </div>
                    <div class="credencial-acao">
                        <button class="credencial-btn-acao" type="button" data-credencial-acao="${idCredencial}" data-credencial-modulo="pesquisa" aria-label="Ver e emitir parecer">
                            <span aria-hidden="true">👁</span>
                        </button>
                    </div>
                </article>
            `;
        });

        html += `
            </div>
        `;

        if (estadoPaginacao.deveMostrarPaginacao) {
            html += markupPaginacaoPadrao({
                paginaAtual: estadoPaginacao.paginaAtual,
                totalPaginas: estadoPaginacao.totalPaginas,
                ariaLabel: "Paginação Colecta de Dados"
            });
        }

        container.innerHTML = html;
        const btnAnterior = container.querySelector("[data-pagina='anterior']");
        const btnSeguinte = container.querySelector("[data-pagina='seguinte']");
        if (btnAnterior) {
            btnAnterior.addEventListener("click", () => {
                atualizarTabelaCredencialPesquisa(paginaAtualCredencialPesquisa - 1);
            });
        }
        if (btnSeguinte) {
            btnSeguinte.addEventListener("click", () => {
                atualizarTabelaCredencialPesquisa(paginaAtualCredencialPesquisa + 1);
            });
        }
}

function atualizarTabelaCredencialPesquisa(pagina = 1) {
    paginaAtualCredencialPesquisa = pagina;
    renderTabelaCredencialPesquisa(credencialPesquisaRegistos, paginaAtualCredencialPesquisa);
}

let planosAnaliticosPaginaAtual = 1;
let planosAnaliticosDados = [];

function renderTabelaPlanosAnaliticos(dados = [], pagina = 1) {
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;
    const { estadoPaginacao, paginaDados: dadosPagina } = obterDadosPaginados(dados, pagina, linhasPorPagina);
    const paginaAtual = estadoPaginacao.paginaAtual;
    planosAnaliticosPaginaAtual = paginaAtual;
    const inicio = estadoPaginacao.inicio;

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
            ? `<a class="pdf-icon" href="${linkPDF}" target="_blank" rel="noopener"><span>PDF</span></a>`
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
        ${estadoPaginacao.deveMostrarPaginacao ? markupPaginacaoPadrao({
            paginaAtual,
            totalPaginas: estadoPaginacao.totalPaginas,
            ariaLabel: "Paginação Planos Analíticos"
        }) : ""}
    `;

    container.innerHTML = html;
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
    if (bloquearFuncionalidadeSemPermissao("CREDENCIAL")) return;
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
        console.log(`[PedidoEstagio] Total bruto recebido: ${lista.length}`);
        const listaFiltrada = lista.filter((item) => {
            const parecerVazio = String(item?.parecer || "").trim() === "";
            const observacoesVazio = String(item?.observacoes || "").trim() === "";
            return parecerVazio && observacoesVazio;
        });
        console.log(`[PedidoEstagio] Total após filtro: ${listaFiltrada.length}`);

        credencialEstagioRegistos = listaFiltrada.map((item) => ({
            ...item,
            id: String(item.id || "").trim(),
            parecer: String(item.parecer || "").trim(),
            observacoes: String(item.observacoes || "").trim()
        }));
        paginaAtualCredencialEstagio = 1;
        renderTabelaCredenciaisEstagio(credencialEstagioRegistos, paginaAtualCredencialEstagio);
        document.getElementById("btnGuardar")?.remove();
    } catch (err) {
        console.error("Erro ao carregar credenciais de estágio:", err);
        credencialEstagioRegistos = [];
        paginaAtualCredencialEstagio = 1;
        renderTabelaCredenciaisEstagio([], paginaAtualCredencialEstagio);
        alert(err.message || "Erro ao carregar registos de estágio.");
    } finally {
        esconderCarregamento();
        reaplicarRestricoesUI();
    }
}

function renderTabelaCredenciaisEstagio(dados = [], pagina = 1) {
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;

    if (!dados.length) {
        container.innerHTML = '<p class="sem-dados">Sem registos de estágio.</p>';
        return;
    }

    const { estadoPaginacao, paginaDados } = obterDadosPaginados(dados, pagina, linhasPorPagina);
    const paginaAtual = estadoPaginacao.paginaAtual;
    paginaAtualCredencialEstagio = paginaAtual;
    const inicio = estadoPaginacao.inicio;
    const fim = estadoPaginacao.fim;

    console.log(
        `[PedidoEstagio][Paginação] página=${paginaAtual} início=${inicio} fim=${fim} renderizados=${paginaDados.length}`
    );

    let html = `
        <div class="credencial-lista-head credencial-estagio-head">
            <div>Data</div>
            <div>Nome</div>
            <div>Curso</div>
            <div>Ver</div>
            <div>Plano</div>
            <div>Status</div>
            <div>Acções</div>
        </div>
        <div class="credencial-lista table-credencial table-credencial-estagio">
    `;

    paginaDados.forEach((item) => {
        const idCredencial = String(item.id || "").trim();
        const linkPDF = item.linkPDF || item.pdfURL || "";
        const linkPlanoEstagio = item.linkPlanoEstagio || "";
        const idEmFalta = !idCredencial;
        if (idEmFalta) {
            console.warn("Linha sem ID:", item);
        }
        const statusClasse = obterClasseStatusCredencial(item.parecer);
        const statusBase = obterLabelStatusCredencial(item.parecer);
        const statusLabel = statusBase === "PENDENTE" ? "Em processo" : statusBase;
        const linkPDFHtml = linkPDF
            ? `<a class="pdf-icon credencial-pdf-link" href="${linkPDF}" target="_blank" rel="noopener noreferrer" aria-label="Ver documento PDF"><span>PDF</span></a>`
            : "—";
        const linkPlanoHtml = linkPlanoEstagio
            ? `<a class="pdf-icon credencial-pdf-link" href="${linkPlanoEstagio}" target="_blank" rel="noopener noreferrer" title="Abrir plano de estágio"><span>PDF</span></a>`
            : "—";

        html += `
            <article class="credencial-linha" data-id="${idCredencial}">
                <div class="credencial-data">${formatarDataCurta(item.data || item.timestamp)}</div>
                <div class="credencial-estudante">
                    <p class="credencial-nome">${item.nome || "—"}</p>
                </div>
                <div class="credencial-curso">${item.curso || "—"}</div>
                <div class="credencial-arquivo">${linkPDFHtml}</div>
                <div class="credencial-arquivo">${linkPlanoHtml}</div>
                <div class="credencial-status">
                    <span class="status ${statusClasse}">${statusLabel}</span>
                </div>
                <div class="credencial-acao">
                    <button class="credencial-btn-acao" type="button" data-credencial-acao="${idCredencial}" data-credencial-modulo="estagio" aria-label="Ver e emitir parecer"${idEmFalta ? " disabled" : ""}>
                        <span aria-hidden="true">👁</span>
                    </button>
                </div>
            </article>
        `;
    });

    html += "</div>";

    if (estadoPaginacao.deveMostrarPaginacao) {
        html += markupPaginacaoPadrao({
            paginaAtual,
            totalPaginas: estadoPaginacao.totalPaginas,
            ariaLabel: "Paginação Pedido de Estágios"
        });
    }

    container.innerHTML = html;
    const btnAnterior = container.querySelector("[data-pagina='anterior']");
    const btnSeguinte = container.querySelector("[data-pagina='seguinte']");
    if (btnAnterior) {
        btnAnterior.addEventListener("click", () => {
            atualizarTabelaCredenciaisEstagio(paginaAtualCredencialEstagio - 1);
        });
    }
    if (btnSeguinte) {
        btnSeguinte.addEventListener("click", () => {
            atualizarTabelaCredenciaisEstagio(paginaAtualCredencialEstagio + 1);
        });
    }
}

function atualizarTabelaCredenciaisEstagio(pagina) {
    paginaAtualCredencialEstagio = pagina;
    renderTabelaCredenciaisEstagio(credencialEstagioRegistos, paginaAtualCredencialEstagio);
}

document.addEventListener("click", async (e) => {
    const botaoAcaoCredencial = e.target?.closest("[data-credencial-acao]");
    if (botaoAcaoCredencial) {
        const modulo = botaoAcaoCredencial.dataset.credencialModulo || "pesquisa";
        abrirModalParecerCredencial(botaoAcaoCredencial.dataset.credencialAcao, modulo);
        return;
    }

    const botaoAcaoTema = e.target?.closest("[data-tema-acao]");
    if (botaoAcaoTema) {
        console.log("[TemasMonografia][Click] Clique capturado no botão Acções.");
        console.log("[TemasMonografia][Click] data-tema-acao capturado:", botaoAcaoTema.dataset.temaAcao);
        abrirModalParecerTema(botaoAcaoTema.dataset.temaAcao);
        return;
    }

    const botaoAcaoMonografiaFinal = e.target?.closest("[data-monografia-acao]");
    if (botaoAcaoMonografiaFinal) {
        abrirModalParecerMonografiaFinal(botaoAcaoMonografiaFinal.dataset.monografiaAcao);
        return;
    }

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

async function guardarCredencialPesquisa(botaoOrigem = null) {
    if (bloquearFuncionalidadeSemPermissao("CREDENCIAL")) return false;
    const botao = botaoOrigem || document.getElementById("btnGuardar") || document.getElementById("btnGuardarCredencialPesquisa") || document.getElementById("btnGuardarParecerCredencial");
    console.log("[CRED] ENTROU NA FUNÇÃO guardarCredencialPesquisa", {
        botaoEncontrado: Boolean(botao),
    });
    activarLoadingGuardar(botao);
    let guardadoComSucesso = false;

    let idInvalido = false;
    const updates = credencialPesquisaRegistos
        .map((item) => ({
            id: String(item.id || "").trim(),
            parecer: String(item.parecer || "").trim(),
            observacoes: String(item.observacoes || "").trim()
        }))
        .filter((item) => item.parecer || item.observacoes)
        .map((item) => {
            if (!item.id) {
                idInvalido = true;
            }
            return item;
        });
    console.log("[CRED] PAYLOAD MONTADO", updates);

    if (updates.length === 0) {
        console.log("[CRED] Nenhuma linha com dados preenchidos. Fluxo interrompido.");
        desactivarLoadingGuardar(botao);
        return false;
    }

    if (idInvalido) {
        alert("Não foi possível identificar o estudante. Recarregue a página e tente novamente.");
        desactivarLoadingGuardar(botao);
        return false;
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

        guardadoComSucesso = true;

        updates.forEach(item => {
            const botaoAcao = document.querySelector(`.credencial-btn-acao[data-credencial-acao="${item.id}"]`);
            if (botaoAcao) {
                botaoAcao.disabled = true;
            }
        });
    } catch (err) {
        console.error("Erro ao guardar dados da credencial de pesquisa:", err);
    } finally {
        desactivarLoadingGuardar(botao);
    }

    return guardadoComSucesso;
}

async function guardarCredencialEstagio() {
    if (bloquearFuncionalidadeSemPermissao("CREDENCIAL")) return;
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

async function guardarCredencialEstagioRegistos(botaoOrigem) {
    if (bloquearFuncionalidadeSemPermissao("CREDENCIAL")) return false;
    const botao = botaoOrigem || document.getElementById("btnGuardarParecerCredencial");
    activarLoadingGuardar(botao);

    const updates = credencialEstagioRegistos
        .map((item) => ({
            id: String(item.id || "").trim(),
            parecer: String(item.parecer || "").trim(),
            observacoes: String(item.observacoes || "").trim()
        }))
        .filter((item) => item.id && (item.parecer || item.observacoes));

    if (updates.length === 0) {
        desactivarLoadingGuardar(botao);
        return false;
    }

    let guardadoComSucesso = false;

    try {
        const dados = new FormData();
        dados.append("action", "atualizarCredencialEstagio");
        dados.append("linhas", JSON.stringify(updates));

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: dados
        });

        const txt = await resposta.text();
        const resultado = txt ? JSON.parse(txt) : null;

        if (!resultado || resultado.sucesso !== true) {
            throw new Error(resultado?.mensagem || "Erro ao actualizar registos.");
        }

        guardadoComSucesso = true;
    } catch (err) {
        console.error("Erro ao guardar dados da credencial de estágio:", err);
        alert(err.message || "Erro ao actualizar registos.");
    } finally {
        desactivarLoadingGuardar(botao);
    }

    return guardadoComSucesso;
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
    fetch(WEB_URL, {
        method: "POST",
        body: new URLSearchParams({ action: "getGestaoGeral" })
    })
    .then(r => r.json())
    .then(json => {
        const dados = json.dados || [];
        console.log("[TemasMonografia][Backend] Resposta getGestaoGeral (json):", json);
        console.log("[TemasMonografia][Backend] Total de registos recebidos:", dados.length);
        if (dados.length > 0) {
            console.log("[TemasMonografia][Backend] Exemplo do primeiro registo bruto:", dados[0]);
            console.log("[TemasMonografia][Backend] Campos do primeiro registo bruto:", Object.keys(dados[0] || {}));
        }

        if (dados.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Não existe nenhum dado para ser apresentado.</p>';
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }

        dadosGestaoGeral = dados;
        const idsTemaGerados = new Set();
        temasParecerRegistos = dadosGestaoGeral.map((item, indice) => {
            const idTemaBase = construirIdTemaRegisto(item, indice);
            let idTema = idTemaBase;
            let sufixo = 1;
            while (idsTemaGerados.has(idTema)) {
                sufixo += 1;
                idTema = `${idTemaBase}-${sufixo}`;
            }
            idsTemaGerados.add(idTema);

            if (!normalizarIdTema(item.idTema ?? item.id_tema)) {
                console.warn("[TemasMonografia][Backend] idTema não enviado; gerado fallback para o registo.", {
                    indice,
                    idTemaGerado: idTema,
                    idFonte: item.id ?? item.ID ?? item.idRegisto ?? item.id_registo ?? item.idSubmissao ?? "",
                    rowFonte: item.row ?? item.linha ?? item.Row ?? ""
                });
            }

            console.log("[TemasMonografia][Validação] Registo normalizado com idTema:", {
                indice,
                idTema,
                idOriginal: item.idTema ?? item.id_tema ?? "",
                row: item.row ?? item.linha ?? item.Row ?? ""
            });

            return {
                ...item,
                idTema,
                parecer: String(item.parecer ?? item.Parecer ?? "").trim(),
                observacoes: String(item.observacoes ?? item.Observacoes ?? "").trim()
            };
        });

        const normalizarEstadoTema = (valor) => String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

        const ESTADOS_OCULTAR_TEMAS = new Set(["aprovado", "recusado", "reprovado"]);
        temasParecerRegistos = temasParecerRegistos.filter((item) => {
            const estadoRaw = item.parecer ?? item.status ?? item.situacao ?? item.Parecer ?? "";
            const estadoNormalizado = normalizarEstadoTema(estadoRaw);
            return !ESTADOS_OCULTAR_TEMAS.has(estadoNormalizado);
        });
        if (temasParecerRegistos.length > 0) {
            const registo = temasParecerRegistos[0];
            console.log("[TemasMonografia][Frontend] Exemplo do primeiro registo normalizado:", registo);
            console.log("[TemasMonografia][Frontend] Campos do primeiro registo normalizado:", Object.keys(registo || {}));
            console.log("[TemasMonografia][Frontend] Campo resumo (normalizado por obterResumoTema):", obterResumoTema(registo));
        }

        if (temasParecerRegistos.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Não existe nenhum dado para ser apresentado.</p>';
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }

        paginaAtualTemasParecer = 1;
        renderTabelaParecer(temasParecerRegistos, paginaAtualTemasParecer);
        esconderCarregamento();
    })
    .catch(err => {
        esconderCarregamento();
        console.error("Erro ao carregar parecer:", err);
    });
}

function renderTabelaParecer(dados = temasParecerRegistos, pagina = 1) {
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;

    const { estadoPaginacao, paginaDados } = obterDadosPaginados(dados, pagina, linhasPorPagina);
    paginaAtualTemasParecer = estadoPaginacao.paginaAtual;

    let html = `
        <div class="credencial-lista-head tema-lista-head">
            <div>Data</div>
            <div>Nome</div>
            <div>Curso</div>
            <div>Status</div>
            <div>Acções</div>
        </div>
        <div class="credencial-lista table-credencial table-tema-parecer">
    `;

    paginaDados.forEach((item) => {
        const idTema = normalizarIdTema(item.idTema);
        const statusClasse = obterClasseStatusCredencial(item.parecer);
        const statusLabel = obterLabelStatusCredencial(item.parecer);

        html += `
            <article class="credencial-linha tema-parecer-linha" data-id="${escaparHTML(idTema)}">
                <div class="credencial-data">${escaparHTML(formatarDataCurta(item.data || item.timestamp))}</div>
                <div class="credencial-estudante">
                    <p class="credencial-nome">${escaparHTML(item.nome || "—")}</p>
                </div>
                <div class="credencial-curso">${escaparHTML(item.curso || "—")}</div>
                <div class="credencial-status">
                    <span class="status ${statusClasse}">${statusLabel}</span>
                </div>
                <div class="credencial-acao">
                    <button class="credencial-btn-acao" type="button" data-tema-acao="${escaparHTML(idTema)}" aria-label="Ver e emitir parecer"${idTema ? "" : " disabled"}>
                        <span aria-hidden="true">👁</span>
                    </button>
                </div>
            </article>
        `;
    });

    html += `
        </div>
    `;

    container.innerHTML = html;
    if (estadoPaginacao.deveMostrarPaginacao) {
        const paginacaoWrapper = document.createElement("div");
        paginacaoWrapper.innerHTML = markupPaginacaoPadrao({
            paginaAtual: estadoPaginacao.paginaAtual,
            totalPaginas: estadoPaginacao.totalPaginas,
            ariaLabel: "Paginação Temas Monografia"
        });
        container.appendChild(paginacaoWrapper.firstElementChild);
    }
    renderizarControlesParecer();
    reaplicarRestricoesUI();
}

function renderizarControlesParecer() {
    const container = document.getElementById("tabelaGestaoGeral");
    if (!container) return;
    const btnAnterior = container.querySelector("[data-pagina='anterior']");
    const btnSeguinte = container.querySelector("[data-pagina='seguinte']");

    if (btnAnterior) {
        btnAnterior.addEventListener("click", () => mudarPaginaParecer(-1));
    }

    if (btnSeguinte) {
        btnSeguinte.addEventListener("click", () => mudarPaginaParecer(1));
    }

    reaplicarRestricoesUI();
}
function mudarPaginaParecer(delta) {
    atualizarTabelaTemasParecer(paginaAtualTemasParecer + delta);
}

function atualizarTabelaTemasParecer(pagina = 1) {
    paginaAtualTemasParecer = pagina;
    renderTabelaParecer(temasParecerRegistos, paginaAtualTemasParecer);
}
