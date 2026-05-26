const cadastroForm = document.querySelector('.cadastro-form');

cadastroForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const confirmarSenha = document.getElementById('confirmarSenha').value.trim();

  if (!nome || !email || !senha || !confirmarSenha) {
    alert('Preencha todos os campos.');
    return;
  }

  if (senha.length < 6) {
    alert('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  if (senha !== confirmarSenha) {
    alert('As senhas não coincidem.');
    return;
  }

  const usuario = {
    nome,
    email,
    senha
  };

  localStorage.setItem('usuarioAgenda', JSON.stringify(usuario));

  alert('Conta criada com sucesso!');

  window.location.href = 'login.html';
});