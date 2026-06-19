function mostrarToast(mensagem, tipo = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `custom-toast ${tipo}`;
  
  toast.innerHTML = `<span>${mensagem}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

if (localStorage.getItem("usuarioLogado")) {
  window.location.href = "home.html";
}

const loginForm = document.querySelector(".login-form") || document.querySelector("form");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      if (typeof mostrarToast === "function") mostrarToast("Preencha todos os campos.", "error");
      else alert("Preencha todos os campos.");
      return;
    }

    try {
      const resposta = await fetch("http://localhost:3333/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        if (typeof mostrarToast === "function") mostrarToast(resultado.erro || "E-mail ou senha inválidos.", "error");
        else alert(resultado.erro || "E-mail ou senha inválidos.");
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

      if (typeof mostrarToast === "function") mostrarToast("Login realizado com sucesso!");
      else alert("Login realizado com sucesso!");

      setTimeout(() => {
        window.location.href = window.location.pathname.includes("/pages/") ? "home.html" : "pages/home.html";
      }, 1500);

    } catch (erro) {
      console.error(erro);
      if (typeof mostrarToast === "function") mostrarToast("Erro ao conectar com o servidor.", "error");
      else alert("Erro ao conectar com o servidor.");
    }
  });
}