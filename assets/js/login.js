const loginForm = document.querySelector('.login-form');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  const usuarioSalvo = JSON.parse(localStorage.getItem('usuarioAgenda'));

  if (!email || !senha) {
    alert('Preencha todos os campos.');
    return;
  }

  if (!usuarioSalvo) {
    alert('Nenhum usuário cadastrado. Crie uma conta primeiro.');
    window.location.href = 'cadastro.html';
    return;
  }

  if (email !== usuarioSalvo.email || senha !== usuarioSalvo.senha) {
    alert('E-mail ou senha inválidos.');
    return;
  }

  localStorage.setItem('usuarioLogado', 'true');

  window.location.href = 'home.html';
});