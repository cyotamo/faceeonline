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
        const idEstudante = (item.idEstudante || item.numeroEstudante || "").toString().trim();
        const seletorId = idEstudante ? `[data-id="${idEstudante}"]` : null;
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

function activarLoadingGuardar(botao) {
  if (!botao) return;
  if (botao.disabled) return; // já está em loading, não sobrescreve
  botao.dataset.textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = "A guardar...";
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

function esconderEstatisticas() {
    estatisticasContainer.style.display = "none";
}

function reaplicarRestricoesUI() {
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
}

// Tema Monografia
document.getElementById("btnGestaoGeral").addEventListener("click", () => {
    esconderEstatisticas();
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
document.getElementById("btnMonografiaFinal").addEventListener("click", () => {
    esconderEstatisticas();
    mostrarLoadingPainelGestor("A carregar…");
    carregarMonografiaFinal();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// --- COPY-PASTE FUNCIONALIDADE PARA OS NOVOS BOTÕES ---

// Botão Parecer
document.getElementById("btnParecerTec").addEventListener("click", () => {
    mostrarLoadingPainelGestor("A carregar…");
    carregarParecer();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});


// Botão Atribuir Supervisor
document.getElementById("btnAtribuirSuperv").addEventListener("click", function () {
    modoTabelaGestao = "atribuirSupervisor";
    mostrarLoadingPainelGestor("A carregar…");
    carregarGestaoGeral();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Botão Homologar Supervisor
document.getElementById("btnHomologarSuperv").addEventListener("click", function () {
    modoTabelaGestao = "homologarSupervisor";
    mostrarLoadingPainelGestor("A carregar…");
    carregarGestaoGeral();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});



// Credencial Pesquisa
document.getElementById("btnCredencialPesquisa").addEventListener("click", () => {
    esconderEstatisticas();
    mostrarLoadingPainelGestor("A carregar…");
    carregarCredencialPesquisa();
    if (window.aplicarRestricoesUI && window.userEmail) {
        aplicarRestricoesUI(window.userEmail);
    }
});

// Listas e Estatísticas (MOSTRA o container)
document.getElementById("btnEstatisticas").addEventListener("click", () => {
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

    actualizarEstadoRelatorio("Gerando relatório…");

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

    if (!resposta.ok) {
        throw new Error(`Falha ao contactar o servidor (${resposta.status})`);
    }

    return resposta.json();
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
        const idEstudante = (item.numeroEstudante || item.idEstudante || "").toString().trim();

        html += `
                <tr data-id="${idEstudante}">
                    <td class="col-ord">${indiceGlobal + 1}</td>
                    <td class="col-data">${formatarDataCurta(item.data)}</td>
                    <td class="col-nome">${item.nome}</td>
                    <td class="col-curso">${item.curso}</td>
                    ${!isHomologar ? `<td class="col-linha">${item.linhaPesquisa ?? item.linha ?? ""}</td>` : ""}
                    ${!isHomologar ? `<td class="col-tema">${item.tema ?? ""}</td>` : ""}
                    ${!isHomologar ? `
                    <td class="col-supervisor">
                        <select class="supervisorProposto" data-row="${item.row || ""}" data-id="${idEstudante}">
                            ${opcoesSupervisoresHTML(item.supervisorAtualOuVazio, item.opcoesSupervisores)}
                        </select>
                    </td>` : ""}
                    ${isHomologar ? `
                    <td class="col-supervisor">${item.supervisorFinal}</td>
                    <td class="col-homologacao">
                        <select class="homologacao" data-row="${item.row}" data-id="${idEstudante}">
                            <option value="">Seleccione…</option>
                            <option>Homologado</option>
                        </select>
                    </td>` : ""}
                    ${isGeral ? `
                    <td class="col-parecer">
                        <select class="parecer" data-row="${item.row}" data-id="${idEstudante}">
                            <option value="">Seleccione…</option>
                            <option>Aprovado</option>
                            <option>Reprovado</option>
                        </select>
                    </td>

                    <td class="col-observacoes">
                        <textarea class="observacoesTema" data-row="${item.row}" data-id="${idEstudante}" rows="4"></textarea>
                    </td>

                    <td class="col-homologacao">
                        <select class="homologacao" data-row="${item.row}" data-id="${idEstudante}">
                            <option value="">Seleccione…</option>
                            <option>Homologado</option>
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
                const rowValue = Number(textarea.dataset.row);
                const item = dadosFiltrados.find((entrada) => Number(entrada.row) === rowValue);

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
            const idEstudante = (item.numeroEstudante || item.idEstudante || "").toString().trim();

            if (rowNumber === null) {
                return;
            }

            html += `
                <tr data-row="${rowNumber}" data-id="${idEstudante}">
                    <td class="col-ord">${index + 1}</td>
                    <td class="col-data">${formatarDataCurta(item.timestamp)}</td>
                    <td class="col-nome">${item.nome}</td>
                    <td class="col-curso">${item.curso}</td>
                    <td class="col-organizacao">${item.organizacao}</td>
                    <td class="col-parecer">
                        <select class="parecerPesquisa" data-row="${rowNumber}" data-id="${idEstudante}">
                            <option value="">Seleccione…</option>
                            <option>Aprovado</option>
                            <option>Recusado</option>
                        </select>
                    </td>
                    <td class="col-pdf"><a class="pdf-icon" href="${item.pdfURL || item.linkPDF}" target="_blank" rel="noopener noreferrer" aria-label="Ver PDF">PDF</a></td>
                    <td class="col-observacoes">
                        <textarea class="observacoes" data-row="${rowNumber}" data-id="${idEstudante}" rows="4" aria-label="Observações"></textarea>
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
    activarLoadingGuardar(botao);

    const linhas = new Map();
    let idInvalido = false;

    const obterIdEstudante = (elemento) => {
        const id = (elemento?.dataset?.id || elemento?.closest("tr")?.dataset?.id || "").trim();

        if (!id) {
            idInvalido = true;
            return "";
        }

        return id;
    };

    if (!idBotao && !document.querySelector("tr[data-id]")) {
        alert("Não foi possível identificar o estudante. Recarregue a página e tente novamente.");
        desactivarLoadingGuardar(botao);
        return;
    }

    const processarSelects = (selects, chave) => {
        selects.forEach(select => {
            const idEstudante = obterIdEstudante(select);
            const valor = select.value.trim();

            if (!idEstudante || valor === "") {
                return;
            }

            if (!linhas.has(idEstudante)) {
                linhas.set(idEstudante, {
                    idEstudante,
                    parecer: "",
                    homologacao: "",
                    observacoes: "",
                    supervisor: ""
                });
            }

            const linha = linhas.get(idEstudante);
            linha[chave] = valor;
        });
    };

    const processarSupervisores = (selects) => {
        selects.forEach(select => {
            const idEstudante = obterIdEstudante(select);
            const valor = select.value.trim();

            if (!idEstudante || valor === "") {
                return;
            }

            if (!linhas.has(idEstudante)) {
                linhas.set(idEstudante, {
                    idEstudante,
                    parecer: "",
                    homologacao: "",
                    observacoes: "",
                    supervisor: ""
                });
            }

            const linha = linhas.get(idEstudante);
            linha.supervisor = valor;
        });
    };

    const processarObservacoes = (inputs) => {
        inputs.forEach(input => {
            const idEstudante = obterIdEstudante(input);

            if (!idEstudante) {
                return;
            }

            if (!linhas.has(idEstudante)) {
                linhas.set(idEstudante, {
                    idEstudante,
                    parecer: "",
                    homologacao: "",
                    observacoes: "",
                    supervisor: ""
                });
            }

            const linha = linhas.get(idEstudante);
            linha.observacoes = input.value.trim();
        });
    };

    processarSupervisores(document.querySelectorAll("select.supervisorProposto"));
    processarSelects(document.querySelectorAll("select.parecer"), "parecer");
    processarSelects(document.querySelectorAll("select.homologacao"), "homologacao");
    processarObservacoes(document.querySelectorAll("textarea.observacoesTema"));

    if (idInvalido) {
        alert("Não foi possível identificar o estudante. Recarregue a página e tente novamente.");
        desactivarLoadingGuardar(botao);
        return;
    }

    const payload = Array.from(linhas.values()).filter(item =>
        item.parecer || item.homologacao || item.observacoes || item.supervisor
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
            throw new Error("Resposta de erro do servidor");
        }

        payload.forEach(item => {
            document.querySelectorAll(`select.parecer[data-id="${item.idEstudante}"]`).forEach(select => {
                select.disabled = true;
            });
            document.querySelectorAll(`select.homologacao[data-id="${item.idEstudante}"]`).forEach(select => {
                select.disabled = true;
            });
            if (item.supervisor) {
                document.querySelectorAll(`select.supervisorProposto[data-id="${item.idEstudante}"]`).forEach(select => {
                    select.disabled = true;
                });
            }
            if (item.observacoes) {
                document.querySelectorAll(`textarea.observacoesTema[data-id="${item.idEstudante}"]`).forEach(textarea => {
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

    const obterIdEstudanteDoElemento = (elemento) => {
        const idEstudante = (elemento?.dataset?.id || elemento?.closest("tr")?.dataset?.id || "").trim();

        if (!idEstudante) {
            idInvalido = true;
            return "";
        }

        return idEstudante;
    };

    const processarPareceres = (selects) => {
        selects.forEach(select => {
            const idEstudante = obterIdEstudanteDoElemento(select);
            const valor = select.value.trim();

            if (!idEstudante || valor === "") {
                return;
            }

            if (!linhas.has(idEstudante)) {
                linhas.set(idEstudante, {
                    idEstudante,
                    parecer: "",
                    observacoes: "",
                    homologacao: "",
                    supervisor: ""
                });
            }

            const linha = linhas.get(idEstudante);
            linha.parecer = valor;
        });
    };

    const processarObservacoes = (inputs) => {
        inputs.forEach(input => {
            const idEstudante = obterIdEstudanteDoElemento(input);

            if (!idEstudante) {
                return;
            }

            if (!linhas.has(idEstudante)) {
                linhas.set(idEstudante, {
                    idEstudante,
                    parecer: "",
                    observacoes: "",
                    homologacao: "",
                    supervisor: ""
                });
            }

            const linha = linhas.get(idEstudante);
            linha.observacoes = input.value.trim();
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

    const payload = Array.from(linhas.values()).filter(item => item.parecer || item.observacoes);
    console.log("[CRED] PAYLOAD MONTADO", payload);

    if (payload.length === 0) {
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
        dados.append("linhas", JSON.stringify(payload));

        console.log("[CRED] ANTES DO FETCH", { payloadSerializado: [...dados.entries()] });

        const resposta = await fetch(WEB_URL, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();
        console.log("[CRED] RESPOSTA RECEBIDA", resultado);

        if (!resultado || resultado.sucesso !== true) {
            throw new Error("Resposta de erro do servidor");
        }

        payload.forEach(item => {
            document.querySelectorAll(`select.parecerPesquisa[data-id="${item.idEstudante}"]`).forEach(select => {
                select.disabled = true;
            });
            document
                .querySelectorAll(`textarea.observacoes[data-id="${item.idEstudante}"]`)
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
        body: new URLSearchParams({ action: "getParecer" })
    })
    .then(r => r.json())
    .then(resposta => {
        const dados = resposta.dados || [];

        if (dados.length === 0) {
            document.getElementById("tabelaGestaoGeral").innerHTML =
                '<p class="sem-dados">Nenhum dado a ser processado.</p>';
            esconderCarregamento();
            reaplicarRestricoesUI();
            return;
        }

        // 🔥 Agora usamos a nova Tabela Parecer (não a Gestão Geral)
        dadosGestaoGeral = dados.filter(item => {
            const parecer = item.parecer ?? item.Parecer ?? "";
            return !parecer || parecer.toString().trim() === "";
        });

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
        const idEstudante = (item.numeroEstudante || item.idEstudante || "").toString().trim();

        html += `
            <tr data-id="${idEstudante}">
                <td class="col-ord">${indiceGlobal + 1}</td>
                <td class="col-data">${formatarDataCurta(item.data)}</td>
                <td class="col-nome">${item.nome}</td>
                <td class="col-curso">${item.curso}</td>
                <td class="col-linha">${item.linha}</td>
                <td class="col-tema">${item.tema}</td>

                <td class="col-parecer">
                    <select class="parecerSelect" data-row="${item.row}" data-id="${idEstudante}">
                        <option value="">Seleccione…</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Reprovado">Reprovado</option>
                    </select>
                </td>

                <td class="col-observacoes">
                    <textarea class="observacoesInput" data-row="${item.row}" data-id="${idEstudante}" rows="3"></textarea>
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

    // 👉 Procura selects com class="parecerSelect" OU class="parecer"
    const selects = container.querySelectorAll("select.parecerSelect, select.parecer");

    console.log("Selects encontrados:", selects.length);
    // Debug rápido: ver se está a achar alguma coisa
    // alert("Selects encontrados: " + selects.length);

    const pareceres = [];

    let idInvalido = false;

    const obterIdEstudanteDoElemento = (elemento) => {
        const idEstudante = (elemento?.dataset?.id || elemento?.closest("tr")?.dataset?.id || "").trim();

        if (!idEstudante) {
            idInvalido = true;
            return "";
        }

        return idEstudante;
    };

    selects.forEach(select => {
        const idEstudante = obterIdEstudanteDoElemento(select);
        const parecer = (select.value || "").trim();
        const obsElement = select.closest("tr")?.querySelector("textarea");
        const observacoes = obsElement ? (obsElement.value || "").trim() : "";

        if (parecer !== "" && idEstudante) {
            pareceres.push({
                idEstudante,
                parecer,
                observacoes
            });
        }
    });

    console.log("Pareceres prontos para envio:", pareceres);

    if (pareceres.length === 0) {
        desactivarLoadingGuardar(botao);
        alert("Nenhum parecer preenchido.");
        if (window.aplicarRestricoesUI && window.userEmail) {
            aplicarRestricoesUI(window.userEmail);
        }
        return;
    }

    if (idInvalido) {
        desactivarLoadingGuardar(botao);
        alert("Não foi possível identificar o estudante. Recarregue a página e tente novamente.");
        if (window.aplicarRestricoesUI && window.userEmail) {
            aplicarRestricoesUI(window.userEmail);
        }
        return;
    }

    fetch(WEB_URL, {
        method: "POST",
        body: new URLSearchParams({
            action: "guardarParecer",
            dados: JSON.stringify(pareceres)
        })
    })
    .then(r => r.json())
    .then(res => {
        if (res.sucesso) {
            carregarParecer(); // recarrega a lista, já sem esses registos
        } else {
            alert("Erro ao guardar: " + res.mensagem);
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
