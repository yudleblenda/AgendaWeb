if (localStorage.getItem("usuarioLogado")) {
  window.location.href = "home.html";
}

const cadastroForm = document.querySelector(".cadastro-form");

cadastroForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

  if (!nome || !email || !senha || !confirmarSenha) {
    mostrarToast("Preencha todos os campos.", "error");
    return;
  }

  if (senha.length < 6) {
    mostrarToast("A senha deve ter pelo menos 6 caracteres.", "error");
    return;
  }

  if (senha !== confirmarSenha) {
    mostrarToast("As senhas não coincidem.", "error");
    return;
  }

  try {
    const resposta = await fetch("http://localhost:3333/usuarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome,
        email,
        senha,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarToast(resultado.erro || "Erro ao cadastrar.", "error");
      return;
    }

    mostrarToast("Conta criada com sucesso!");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);

  } catch (erro) {
    console.error(erro);
    mostrarToast("Erro ao conectar com o servidor.", "error");
  }
});