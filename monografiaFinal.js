document.getElementById("formMonografiaFinal").addEventListener("submit", enviarMonografiaFinal);

function enviarMonografiaFinal(e) {
    e.preventDefault();

    const dados = new FormData();
    dados.append("action", "submeterMonografiaFinal");
    dados.append("nome", document.getElementById("nome").value);
    dados.append("numero", document.getElementById("numero").value);
    dados.append("contacto1", document.getElementById("contacto1").value);
    dados.append("contacto2", document.getElementById("contacto2").value);
    dados.append("departamento", document.getElementById("departamento").value);
    dados.append("curso", document.getElementById("curso").value);
    dados.append("titulo", document.getElementById("titulo").value);
    dados.append("keywords", document.getElementById("keywords").value);
    dados.append("supervisor", document.getElementById("supervisor").value);
    dados.append("nota", document.getElementById("nota").value);

    // PDF
    const ficheiro = document.getElementById("ficheiro").files[0];
    dados.append("ficheiro", ficheiro);

    fetch("https://script.google.com/macros/s/AKfycbw9G6XaMAi1_zPQpR46Ez83PKI0sIUnJg4X6pL9hI0K6zy_wuQxAi2Q0o-itXLdjC-e0w/exec", {
        method: "POST",
        body: dados
    })
    .then(r => r.json())
    .then(res => {
        const msg = document.getElementById("mensagem");
        msg.textContent = res.mensagem || "Submetido com sucesso!";
        msg.style.color = res.sucesso ? "green" : "red";
    })
    .catch(err => {
        document.getElementById("mensagem").textContent = "Erro ao enviar: " + err;
    });
}
