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

const cadastroForm = document.querySelector(".cadastro-form") || document.querySelector("form");

if (cadastroForm) {
  cadastroForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

    if (!nome || !email || !senha || !confirmarSenha) {
      if (typeof mostrarToast === "function") mostrarToast("Preencha todos os campos.", "error");
      else alert("Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      if (typeof mostrarToast === "function") mostrarToast("A senha deve ter pelo menos 6 caracteres.", "error");
      else alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      if (typeof mostrarToast === "function") mostrarToast("As senhas não coincidem.", "error");
      else alert("As senhas não coincidem.");
      return;
    }

    try {
      const resposta = await fetch("http://localhost:3333/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, email, senha }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        if (typeof mostrarToast === "function") mostrarToast(resultado.erro || "Erro ao cadastrar.", "error");
        else alert(resultado.erro || "Erro ao cadastrar.");
        return;
      }

      if (typeof mostrarToast === "function") mostrarToast("Conta criada com sucesso!");
      else alert("Conta criada com sucesso!");

      setTimeout(() => {
        window.location.href = window.location.pathname.includes("/pages/") ? "login.html" : "pages/login.html";
      }, 2000);

    } catch (erro) {
      console.error(erro);
      if (typeof mostrarToast === "function") mostrarToast("Erro ao conectar com o servidor.", "error");
      else alert("Erro ao conectar com o servidor.");
    }
  });
}