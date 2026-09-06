/* Módulo isolado de denúncias do estudante. */
(function () {
  function criarFormulario() {
    const container = document.getElementById('form-container');
    if (!container) return;
    container.style.display = '';
    container.innerHTML = `
      <form id="denunciaForm" class="form-card" novalidate>
        <div class="form-header"><h2>Denuncie aqui</h2><p>O seu contacto é obrigatório para acompanhamento, inclusive em denúncias anónimas.</p></div>
        <div class="form-grid">
          <div class="form-field full-row"><label>Tipo de denúncia</label>
            <label><input id="denunciaTipoCorrupcao" type="checkbox" value="Corrupção"> Corrupção</label>
            <label><input id="denunciaTipoAssedio" type="checkbox" value="Assédio Sexual"> Assédio Sexual</label></div>
          <div class="form-field"><label for="denunciaDataOcorrencia">Data da ocorrência</label><input id="denunciaDataOcorrencia" type="date" required></div>
          <div class="form-field"><label for="denunciaLocal">Local</label><input id="denunciaLocal" type="text" required></div>
          <div class="form-field full-row"><label for="denunciaPessoasEnvolvidas">Pessoas envolvidas</label><textarea id="denunciaPessoasEnvolvidas" rows="3" required></textarea></div>
          <div class="form-field full-row"><label for="denunciaDescricao">Descrição dos factos</label><textarea id="denunciaDescricao" rows="5" required></textarea></div>
          <div class="form-field"><label for="denunciaContacto">Contacto</label><input id="denunciaContacto" type="text" required></div>
          <div class="form-field"><label for="denunciaIdentificacao">Pretende identificar-se?</label><select id="denunciaIdentificacao" required><option value="">Seleccione...</option><option value="Sim">Sim</option><option value="Não">Não</option></select></div>
          <div class="form-field" id="denunciaNomeCampo" style="display:none;"><label for="denunciaNome">Nome</label><input id="denunciaNome" type="text"></div>
          <div class="form-field"><label for="denunciaAnexo">Anexo PDF (opcional)</label><input id="denunciaAnexo" type="file" accept="application/pdf"></div>
          <div class="form-actions"><button id="denunciaSubmeter" type="submit" class="btn-submeter">Submeter denúncia</button></div>
        </div>
      </form>`;
    const form = document.getElementById('denunciaForm');
    const identificacao = document.getElementById('denunciaIdentificacao');
    const nome = document.getElementById('denunciaNome');
    identificacao.addEventListener('change', () => {
      const mostrar = identificacao.value === 'Sim';
      document.getElementById('denunciaNomeCampo').style.display = mostrar ? '' : 'none';
      nome.required = mostrar;
      if (!mostrar) nome.value = '';
    });
    form.addEventListener('submit', submeter);
  }

  async function submeter(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const tipos = [
      document.getElementById('denunciaTipoCorrupcao').checked && 'Corrupção',
      document.getElementById('denunciaTipoAssedio').checked && 'Assédio Sexual'
    ].filter(Boolean);
    const ficheiro = document.getElementById('denunciaAnexo').files[0];
    if (!tipos.length || !form.checkValidity() || (ficheiro && !ficheiroEhPdf(ficheiro))) {
      mostrarModal('Preencha correctamente os campos obrigatórios e seleccione pelo menos um tipo de denúncia.');
      form.reportValidity(); return;
    }
    const botao = document.getElementById('denunciaSubmeter');
    activarLoading(botao);
    try {
      const dados = new URLSearchParams({
        action: 'submeterDenuncia', tipo: tipos.join(', '), dataOcorrencia: document.getElementById('denunciaDataOcorrencia').value,
        local: document.getElementById('denunciaLocal').value.trim(), pessoasEnvolvidas: document.getElementById('denunciaPessoasEnvolvidas').value.trim(),
        descricao: document.getElementById('denunciaDescricao').value.trim(), contacto: document.getElementById('denunciaContacto').value.trim(),
        identificacao: document.getElementById('denunciaIdentificacao').value, nome: document.getElementById('denunciaNome').value.trim()
      });
      if (ficheiro) {
        dados.append('anexoBase64', await lerFicheiroComoBase64(ficheiro));
        dados.append('anexoNome', ficheiro.name); dados.append('anexoTipo', ficheiro.type || 'application/pdf');
      }
      const resposta = await fetch(WEB_URL, { method: 'POST', body: dados });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado?.sucesso === false) throw new Error(resultado?.mensagem || 'Submissão recusada.');
      form.reset(); document.getElementById('denunciaNomeCampo').style.display = 'none';
      mostrarModal(resultado?.mensagem || 'A denúncia foi submetida com sucesso.');
    } catch (erro) { mostrarModal(erro.message || 'Ocorreu um erro ao enviar a denúncia.'); }
    finally { desativarLoading(botao); }
  }
  document.getElementById('btnDenuncia')?.addEventListener('click', criarFormulario);
}());
