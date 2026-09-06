/* Módulo isolado para consulta e finalização de denúncias. */
(function () {
  const porPagina = 10;
  let denuncias = [], pagina = 1;
  const valor = (item, ...chaves) => { for (const chave of chaves) if (item?.[chave] != null && String(item[chave]).trim()) return String(item[chave]).trim(); return ''; };
  const idDa = item => valor(item, 'id', 'idDenuncia', 'ID', 'codigo', 'row');
  const permitido = () => typeof window.utilizadorTemPermissao === 'function'
    ? window.utilizadorTemPermissao('DENUNCIAS') : typeof window.temPermissaoGestor === 'function' && window.temPermissaoGestor('DENUNCIAS');
  function esconderOutrasSecoes() {
    document.getElementById('tabelaGestaoGeral').style.display = 'none';
    document.getElementById('secaoDefesas').style.display = 'none';
    const estatisticas = document.getElementById('estatisticasContainer'); if (estatisticas) estatisticas.style.display = 'none';
  }
  function texto(el, conteudo) { el.textContent = conteudo || '—'; return el; }
  function botao(rotulo, classe, handler) { const b = document.createElement('button'); b.type = 'button'; b.className = classe; b.textContent = rotulo; b.addEventListener('click', handler); return b; }
  function urlProva(item) { return valor(item, 'provas', 'prova', 'pdf', 'pdfUrl', 'urlPDF', 'anexoUrl', 'linkAnexo', 'anexo'); }
  function urlSegura(url) { try { const u = new URL(url, window.location.href); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (_) { return ''; } }
  function renderizar() {
    const destino = document.getElementById('denunciaLista'); const paginacao = document.getElementById('denunciaPaginacao');
    destino.replaceChildren(); paginacao.replaceChildren();
    if (!denuncias.length) { destino.appendChild(texto(document.createElement('p'), 'Não existem denúncias activas.')); return; }
    const total = Math.max(1, Math.ceil(denuncias.length / porPagina)); pagina = Math.min(Math.max(1, pagina), total);
    const tabela = document.createElement('table'); tabela.className = 'table-credencial';
    const cabecalho = document.createElement('thead'), linhaHead = document.createElement('tr');
    ['Data', 'Nome/Anónimo', 'Tipo', 'Data da ocorrência', 'Local', 'Pessoas envolvidas', 'Provas', 'Ver', 'Acção'].forEach(t => linhaHead.appendChild(texto(document.createElement('th'), t)));
    cabecalho.appendChild(linhaHead); tabela.appendChild(cabecalho); const corpo = document.createElement('tbody');
    denuncias.slice((pagina - 1) * porPagina, pagina * porPagina).forEach(item => {
      const tr = document.createElement('tr');
      [valor(item, 'data', 'dataSubmissao', 'createdAt', 'timestamp'), valor(item, 'nome') || (valor(item, 'identificacao').toLowerCase() === 'sim' ? 'Não informado' : 'Anónimo'), valor(item, 'tipo', 'tipoDenuncia'), valor(item, 'dataOcorrencia'), valor(item, 'local'), valor(item, 'pessoasEnvolvidas')].forEach(v => tr.appendChild(texto(document.createElement('td'), v)));
      const prova = document.createElement('td'), link = urlSegura(urlProva(item));
      if (link) { const a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Abrir PDF'; prova.appendChild(a); } else texto(prova, 'Sem provas'); tr.appendChild(prova);
      const ver = document.createElement('td'); ver.appendChild(botao('Ver', 'button btn-padrao-portal', () => abrirDetalhes(idDa(item), item))); tr.appendChild(ver);
      const accao = document.createElement('td'); accao.appendChild(botao('Finalizar processo', 'button btn-padrao-portal', () => finalizar(idDa(item)))); tr.appendChild(accao); corpo.appendChild(tr);
    });
    tabela.appendChild(corpo); destino.appendChild(tabela);
    if (total > 1) { const nav = document.createElement('div'); nav.className = 'paginacao-analiticos'; nav.append(botao('<', 'button btn-paginacao', () => { pagina--; renderizar(); }), texto(document.createElement('span'), `${pagina} de ${total}`), botao('>', 'button btn-paginacao', () => { pagina++; renderizar(); })); nav.querySelectorAll('button')[0].disabled = pagina === 1; nav.querySelectorAll('button')[1].disabled = pagina === total; paginacao.appendChild(nav); }
  }
  async function abrirDetalhes(id, resumo) {
    try {
      const resposta = await fetch(WEB_URL, { method: 'POST', body: new URLSearchParams({ action: 'obterDenuncia', id }) });
      const resultado = await resposta.json(); const item = resultado?.dados || resultado?.denuncia || resumo;
      const modal = document.getElementById('modalSucesso'), titulo = document.getElementById('modalTitulo'), mensagem = document.getElementById('modalMensagem');
      titulo.textContent = 'Detalhes da denúncia'; mensagem.replaceChildren();
      [['Descrição dos factos', valor(item, 'descricao', 'descricaoFactos')], ['Local', valor(item, 'local')], ['Pessoas envolvidas', valor(item, 'pessoasEnvolvidas')], ['Contacto', valor(item, 'contacto')], ['Identificação', valor(item, 'identificacao')], ['Nome', valor(item, 'nome')]].forEach(([rotulo, conteudo]) => { const p = document.createElement('p'); const forte = document.createElement('strong'); forte.textContent = `${rotulo}: `; p.append(forte, document.createTextNode(conteudo || '—')); mensagem.appendChild(p); });
      modal.style.display = 'flex'; document.getElementById('modalOk').onclick = () => { modal.style.display = 'none'; };
    } catch (_) { mostrarModal('Não foi possível carregar os detalhes da denúncia.'); }
  }
  async function finalizar(id) {
    if (!id) { mostrarModal('Não foi possível identificar a denúncia.'); return; }
    if (!window.confirm('Pretende finalizar este processo?')) return;
    try { const resposta = await fetch(WEB_URL, { method: 'POST', body: new URLSearchParams({ action: 'finalizarDenuncia', id }) }); const resultado = await resposta.json(); if (!resposta.ok || resultado?.sucesso === false) throw new Error(); denuncias = denuncias.filter(item => idDa(item) !== id); renderizar(); mostrarModal(resultado?.mensagem || 'Processo finalizado com sucesso.'); }
    catch (_) { mostrarModal('Não foi possível finalizar o processo.'); }
  }
  async function carregar() {
    const lista = document.getElementById('denunciaLista'); lista.replaceChildren(texto(document.createElement('p'), 'A carregar denúncias…'));
    try { const resposta = await fetch(WEB_URL, { method: 'POST', body: new URLSearchParams({ action: 'listarDenuncias' }) }); const resultado = await resposta.json(); if (!resposta.ok || resultado?.sucesso === false) throw new Error(); denuncias = Array.isArray(resultado) ? resultado : (resultado?.dados || resultado?.denuncias || []); pagina = 1; renderizar(); }
    catch (_) { lista.replaceChildren(texto(document.createElement('p'), 'Não foi possível carregar as denúncias.')); }
  }
  document.getElementById('btnDenuncias')?.addEventListener('click', () => {
    const secao = document.getElementById('secaoDenuncias');
    if (!permitido()) { window.bloquearFuncionalidadeSemPermissao?.('DENUNCIAS'); secao.style.display = 'block'; esconderOutrasSecoes(); document.getElementById('denunciaLista').replaceChildren(texto(document.createElement('p'), 'Não tem permissão para aceder a esta funcionalidade.')); window.reaplicarRestricoesUI?.(); return; }
    esconderOutrasSecoes(); secao.style.display = 'block'; carregar(); window.reaplicarRestricoesUI?.();
  });
}());
