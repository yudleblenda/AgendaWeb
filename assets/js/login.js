if (localStorage.getItem("usuarioLogado")) {
  window.location.href = "home.html";
}

const loginForm = document.querySelector(".login-form");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    mostrarToast("Preencha todos os campos.", "error");
    return;
  }

  try {
    const resposta = await fetch("http://localhost:3333/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        senha,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarToast(resultado.erro || "E-mail ou senha inválidos.", "error");
      return;
    }

    localStorage.setItem(
      "usuarioAgenda",
      JSON.stringify({
        id: resultado.id,
        nome: resultado.nome,
        email: resultado.email,
      })
    );

    localStorage.setItem("usuarioLogado", "true");

    mostrarToast("Login realizado com sucesso!");

    setTimeout(() => {
      window.location.href = "home.html";
    }, 1500);

    } catch (erro) {
    console.error(erro);
    mostrarToast("Erro ao conectar com o servidor.", "error");
  }
});