function mostrarToast(mensagem, tipo = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  // Usa o nome exato da classe que sua amiga definiu no CSS
  toast.className = `custom-toast ${tipo}`;
  
  const icone = tipo === "success" ? "✅" : "❌";
  toast.innerHTML = `<span>${icone}</span> <span>${mensagem}</span>`;

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

// Se já estiver logado, redireciona para a home dentro da pasta 'pages'
if (localStorage.getItem("usuarioLogado")) {
  window.location.href = "home.html"; // Caso já esteja na pasta pages
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

      // MANTÉM A ATUALIZAÇÃO DELA: Salva as informações do usuário logado
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

      // CORREÇÃO: Garante o redirecionamento correto estando dentro ou fora da pasta pages
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