const usuarioLogado = localStorage.getItem('usuarioLogado');

if (usuarioLogado !== 'true') {
  window.location.href = 'login.html';
}

const btnNovo = document.querySelector('.btn-new-event');
const modal = document.getElementById('modalNovoAgendamento');
const btnCancelar = document.querySelector('.btn-cancelar');
const form = document.querySelector('.modal-form');
const btnCriar = document.querySelector('.btn-criar');

let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
let agendamentoEditandoId = null;

btnNovo.addEventListener('click', () => {
  agendamentoEditandoId = null;
  form.reset();
  btnCriar.textContent = 'Criar agendamento';
  modal.classList.add('active');
});

btnCancelar.addEventListener('click', () => {
  fecharModal();
});

function fecharModal() {
  modal.classList.remove('active');
  agendamentoEditandoId = null;
  form.reset();
  btnCriar.textContent = 'Criar agendamento';
}

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    fecharModal();
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const titulo = form.querySelector('input[type="text"]').value;
  const descricao = form.querySelector('textarea').value;
  const horarios = form.querySelectorAll('input[type="time"]');
  const categoria = form.querySelector('select').value;

  const horaInicio = horarios[0].value;
  const horaFim = horarios[1].value;

  if (!titulo || !horaInicio || !horaFim) {
    mostrarToast('Preencha o título e o horário do agendamento.');
    return;
  }

  const horaNumero = Number(horaInicio.split(':')[0]);

  if (horaNumero < 8 || horaNumero > 18) {
    mostrarToast('Escolha um horário entre 08:00 e 18:00.');
    return;
  }

  if (horaFim <= horaInicio) {
    mostrarToast('O horário final deve ser maior que o horário inicial.');
    return;
  }

  if (agendamentoEditandoId) {
    editarAgendamento(titulo, descricao, horaInicio, horaFim, categoria);
  } else {
    const novoAgendamento = {
      id: Date.now(),
      titulo,
      descricao,
      horaInicio,
      horaFim,
      categoria
    };

    agendamentos.push(novoAgendamento);
    salvarAgendamentos();
  }

  renderizarAgendamentos();
  fecharModal();
});

function salvarAgendamentos() {
  localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
}

function renderizarAgendamentos() {
  const slots = document.querySelectorAll('.hour-slot');

  slots.forEach((slot) => {
    slot.innerHTML = '';
  });

  agendamentos.forEach((agendamento) => {
    criarAgendamento(agendamento);
  });
}

function criarAgendamento(agendamento) {
  const hora = agendamento.horaInicio.split(':')[0];
  const linhaHorario = encontrarLinhaHorario(hora);

  if (!linhaHorario) {
    mostrarToast('Não existe esse horário na agenda.');
    return;
  }

  const slot = linhaHorario.querySelector('.hour-slot');

  const card = document.createElement('div');
  card.classList.add('event-card', definirCorCategoria(agendamento.categoria));
  card.setAttribute('data-id', agendamento.id);

  card.innerHTML = `
    <div class="event-card-header">
      <h4>${agendamento.titulo}</h4>
      <button class="btn-delete-event" type="button">×</button>
    </div>

    <p class="event-time">${agendamento.horaInicio} - ${agendamento.horaFim}</p>
    ${agendamento.descricao ? `<p class="event-desc">${agendamento.descricao}</p>` : ''}
  `;

  const btnDelete = card.querySelector('.btn-delete-event');

  btnDelete.addEventListener('click', (event) => {
    event.stopPropagation();

    excluirAgendamento(agendamento.id);
    renderizarAgendamentos();
  });

  card.addEventListener('click', () => {
    abrirEdicaoAgendamento(agendamento);
  });

  slot.appendChild(card);
}

function abrirEdicaoAgendamento(agendamento) {
  agendamentoEditandoId = agendamento.id;

  const tituloInput = form.querySelector('input[type="text"]');
  const descricaoInput = form.querySelector('textarea');
  const horarios = form.querySelectorAll('input[type="time"]');
  const categoriaInput = form.querySelector('select');

  tituloInput.value = agendamento.titulo;
  descricaoInput.value = agendamento.descricao;
  horarios[0].value = agendamento.horaInicio;
  horarios[1].value = agendamento.horaFim;
  categoriaInput.value = agendamento.categoria;

  btnCriar.textContent = 'Salvar alterações';
  modal.classList.add('active');
}

function editarAgendamento(titulo, descricao, horaInicio, horaFim, categoria) {
  agendamentos = agendamentos.map((agendamento) => {
    if (agendamento.id === agendamentoEditandoId) {
      return {
        ...agendamento,
        titulo,
        descricao,
        horaInicio,
        horaFim,
        categoria
      };
    }

    return agendamento;
  });

  salvarAgendamentos();
}

function excluirAgendamento(id) {
  agendamentos = agendamentos.filter((agendamento) => agendamento.id !== id);
  salvarAgendamentos();
}

function encontrarLinhaHorario(hora) {
  const linhas = document.querySelectorAll('.hour-row');

  for (const linha of linhas) {
    const horarioTexto = linha.querySelector('.time-label').textContent;
    const horaLinha = horarioTexto.split(':')[0];

    if (horaLinha === hora) {
      return linha;
    }
  }

  return null;
}

function definirCorCategoria(categoria) {
  if (categoria === 'Trabalho') {
    return 'card-blue';
  }

  if (categoria === 'Pessoal') {
    return 'card-yellow';
  }

  return 'card-purple';
}

function mostrarToast(mensagem) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  toastMessage.textContent = mensagem;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

const tarefas = document.querySelectorAll('.task-item input[type="checkbox"]');

tarefas.forEach((checkbox, index) => {
  const salvo = localStorage.getItem(`tarefa-${index}`);

  if (salvo === 'true') {
    checkbox.checked = true;
    checkbox.closest('.task-item').classList.add('checked');
  } else {
    checkbox.checked = false;
    checkbox.closest('.task-item').classList.remove('checked');
  }

  checkbox.addEventListener('change', () => {
    const item = checkbox.closest('.task-item');

    item.classList.toggle('checked', checkbox.checked);

    localStorage.setItem(`tarefa-${index}`, checkbox.checked);
  });
});

const userProfile = document.querySelector('.user-profile');
const profileMenu = document.querySelector('.profile-menu');
const btnLogout = document.querySelector('.btn-logout');

userProfile.addEventListener('click', () => {
  profileMenu.classList.toggle('active');
});

btnLogout.addEventListener('click', () => {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'login.html';
});

renderizarAgendamentos();