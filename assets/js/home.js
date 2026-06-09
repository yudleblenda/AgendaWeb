// URL do seu Backend Node.js
const API_URL = 'http://localhost:3333/agendamentos';

// Controle de Data Atual
let dataControladora = new Date();

// Elementos Globais
let modal;
let formAgendamento;

/* ==========================================
   1. INICIALIZAÇÃO SEGURA E CARREGAMENTO
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    modal = document.getElementById('modalNovoAgendamento');
    formAgendamento = document.getElementById('formAgendamento');
    
    const miniCalDaysGrid = document.querySelector('.mini-cal-days-grid');
    const miniMonthLabel = document.querySelector('.mini-month');

    // Inicializa o Calendário Dinâmico
    if (miniCalDaysGrid) {
      renderizarCalendario(miniCalDaysGrid, miniMonthLabel);
    }

    // Carrega os agendamentos salvos assim que a página abre
    carregarAgendamentos();

    /* ==========================================
       2. CONTROLE DO MODAL (ABRIR E FECHAR)
       ========================================== */
    if (openModalBtn && modal) {
      openModalBtn.addEventListener('click', () => {
        modal.classList.add('active'); 
      });
    }

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    /* ==========================================
       3. ENVIO PARA O BACKEND
       ========================================== */
    if (formAgendamento) {
      formAgendamento.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Botão Criar Agendamento clicado!");

        try {
          // Coleta os dados usando Optional Chaining (?.) para evitar quebras se o ID não existir
          const agendamento = {
            titulo: document.getElementById('titulo')?.value || '',
            descricao: document.getElementById('descricao')?.value || '',
            data: document.getElementById('data')?.value || '',
            horario_inicio: document.getElementById('horaInicio')?.value || '',
            horario_fim: document.getElementById('horaFim')?.value || '',
            categoria: document.getElementById('categoria')?.value || 'Lembretes',
            localizacao: document.getElementById('local')?.value || '',
            lembrete: document.getElementById('lembrete')?.value || '10 minutos antes',
            recorrente: document.getElementById('recorrente')?.checked ? 1 : 0
          };

          console.log("Dados prontos para envio:", agendamento);

          const resposta = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agendamento)
          });

          if (resposta.ok) {
            exibirToast("Agendamento criado com sucesso! 🚀");
            formAgendamento.reset();
            if (modal) modal.classList.remove('active');
            carregarAgendamentos(); // Atualiza a lista
          } else {
            const resultado = await resposta.json();
            exibirToast("Erro ao criar: " + (resultado.erro || "Verifique os dados"));
          }
        } catch (erroForm) {
          alert("Erro interno ao tentar enviar o formulário: " + erroForm.message);
        }
      });
    }
  } catch (erroGeral) {
    console.error("Erro na inicialização do DOM:", erroGeral);
  }
});

/* ==========================================
   4. BUSCAR E RENDERIZAR AGENDAMENTOS (GET)
   ========================================== */
async function carregarAgendamentos() {
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error("Erro ao buscar dados do servidor");
    
    const agendamentos = await resposta.json();
    
    renderizarLinhaDoTempo(agendamentos);
    renderizarProximasTarefas(agendamentos);

  } catch (erro) {
    console.error("Erro ao carregar agendamentos:", erro);
  }
}

// 4.1 Desenha os blocos de compromissos na Agenda Central (Corrigido)
function renderizarLinhaDoTempo(agendamentos) {
  try {
    // Remove os blocos antigos para não duplicar
    document.querySelectorAll('.compromisso-card, .event-block').forEach(el => el.remove());

    agendamentos.forEach(item => {
      if (!item.data || !item.horario_inicio) return;

      // Trata a data de forma limpa para ignorar fusos horários
      const dataFormatada = item.data.split('T')[0]; 
      
      const anoC = dataControladora.getFullYear();
      const mesC = String(dataControladora.getMonth() + 1).padStart(2, '0');
      const diaC = String(dataControladora.getDate()).padStart(2, '0');
      const dataSelecionadaStr = `${anoC}-${mesC}-${diaC}`;

      // Só renderiza no miolo central se for o mesmo dia selecionado
      if (dataFormatada === dataSelecionadaStr) {
        const horaInicio = item.horario_inicio.substring(0, 5);
        const horaChave = item.horario_inicio.split(':')[0] + ':00';
        
        // Seleciona as linhas de horários da agenda central
        const slots = document.querySelectorAll('.grid-time-slot, .horario-linha, td, div');
        let slotDestino = null;

        slots.forEach(slot => {
          if (slot.textContent && slot.textContent.trim().includes(horaChave)) {
            slotDestino = slot;
          }
        });

        if (slotDestino) {
          const divCompromisso = document.createElement('div');
          divCompromisso.className = 'compromisso-card';
          divCompromisso.style.background = '#e0ebff';
          divCompromisso.style.borderLeft = '4px solid #2563eb';
          divCompromisso.style.padding = '8px';
          divCompromisso.style.margin = '4px 0';
          divCompromisso.style.borderRadius = '6px';
          divCompromisso.style.zIndex = '10';
          
          divCompromisso.innerHTML = `
            <strong style="color: #1e40af; display:block;">${item.titulo}</strong>
            <span style="font-size: 12px; color: #4b5563;">${horaInicio} - ${item.localizacao || 'Sem local'}</span>
          `;
          
          slotDestino.appendChild(divCompromisso);
        }
      }
    });
  } catch (e) {
    console.error("Erro ao renderizar linha do tempo:", e);
  }
}

// 4.2 Lista todos os agendamentos na lateral direita (Preservando o mini-calendário)
function renderizarProximasTarefas(agendamentos) {
  try {
    // Procura o elemento maior da barra lateral direita
    const sidebarRight = document.querySelector('.sidebar-right') || document.querySelector('aside');
    if (!sidebarRight) {
      console.warn("Não foi possível encontrar o elemento da barra lateral no HTML.");
      return;
    }

    // Busca ou cria uma div dedicada EXCLUSIVA para a lista para não zerar o calendário com innerHTML
    let containerTarefas = document.getElementById('listaTarefasDinamica');
    
    if (!containerTarefas) {
      containerTarefas = document.createElement('div');
      containerTarefas.id = 'listaTarefasDinamica';
      containerTarefas.style.marginTop = '20px';
      containerTarefas.style.width = '100%';
      sidebarRight.appendChild(containerTarefas);
    }
    
    // Limpa apenas o interior da área dedicada às tarefas
    containerTarefas.innerHTML = '<h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">Próximas tarefas</h3>';

    // Cria uma caixinha interna para listar os itens organizados
    const listaItens = document.createElement('div');
    listaItens.style.display = 'flex';
    listaItens.style.flexDirection = 'column';
    listaItens.style.gap = '12px';
    listaItens.style.marginTop = '10px';

    // Ordena os agendamentos por data para mostrar os mais próximos primeiro
    const ordenados = agendamentos.sort((a, b) => new Date(a.data) - new Date(b.data));

    // Pega os 5 primeiros agendamentos e coloca na lista lateral
    ordenados.slice(0, 5).forEach(item => {
      if (!item.data) return;
      
      const dataPartes = item.data.split('T')[0].split('-');
      const dataExibicao = `${dataPartes[2]}/${dataPartes[1]}`; // Formato DD/MM
      const horaInicio = item.horario_inicio ? item.horario_inicio.substring(0, 5) : '00:00';

      const divTarefa = document.createElement('div');
      divTarefa.className = 'task-item-lateral';
      divTarefa.style.display = 'flex';
      divTarefa.style.justifyContent = 'space-between';
      divTarefa.style.alignItems = 'center';
      divTarefa.style.padding = '10px';
      divTarefa.style.background = '#f9fafb';
      divTarefa.style.borderRadius = '8px';
      divTarefa.style.borderLeft = '4px solid #3b82f6';

      divTarefa.innerHTML = `
        <div>
          <span style="font-weight: 600; display: block; font-size: 14px; color: #1f2937;">${item.titulo}</span>
          <span style="font-size: 12px; color: #6b7280;">${item.categoria || 'Geral'}</span>
        </div>
        <div style="text-align: right; font-size: 12px; color: #4b5563;">
          <span style="font-weight: bold; color: #2563eb;">${dataExibicao}</span>
          <span style="display: block; font-size: 11px; color: #9ca3af;">${horaInicio}</span>
        </div>
      `;

      listaItens.appendChild(divTarefa);
    });

    containerTarefas.appendChild(listaItens);
  } catch (e) {
    console.error("Erro ao renderizar próximas tarefas:", e);
  }
}

/* ==========================================
   5. FUNÇÕES DO CALENDÁRIO DINÂMICO
   ========================================== */
function renderizarCalendario(miniCalDaysGrid, miniMonthLabel) {
  const ano = dataControladora.getFullYear();
  const mes = dataControladora.getMonth();

  const mesesNome = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  if (miniMonthLabel) {
    miniMonthLabel.textContent = `${mesesNome[mes]} ${ano}`;
  }

  const labels = Array.from(miniCalDaysGrid.querySelectorAll('.week-label'));
  miniCalDaysGrid.innerHTML = '';
  labels.forEach(label => miniCalDaysGrid.appendChild(label));

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    const span = document.createElement('span');
    span.classList.add('day-off');
    span.textContent = totalDiasMesAnterior - i;
    miniCalDaysGrid.appendChild(span);
  }

  const hoje = new Date();
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const span = document.createElement('span');
    span.textContent = dia;

    if (dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) {
      span.classList.add('mini-active');
    }

    span.addEventListener('click', () => {
      document.querySelectorAll('.mini-cal-days-grid span').forEach(s => s.classList.remove('mini-active'));
      span.classList.add('mini-active');
      
      dataControladora.setFullYear(ano);
      dataControladora.setMonth(mes);
      dataControladora.setDate(dia);
      carregarAgendamentos();
    });

    miniCalDaysGrid.appendChild(span);
  }
}

// Configuração das setas do calendário
document.addEventListener('DOMContentLoaded', () => {
  const setasMini = document.querySelectorAll('.arrow-mini');
  const miniCalDaysGrid = document.querySelector('.mini-cal-days-grid');
  const miniMonthLabel = document.querySelector('.mini-month');
  
  if (setasMini.length >= 2 && miniCalDaysGrid) {
    setasMini[0].addEventListener('click', () => {
      dataControladora.setMonth(dataControladora.getMonth() - 1);
      renderizarCalendario(miniCalDaysGrid, miniMonthLabel);
      carregarAgendamentos();
    });
    setasMini[1].addEventListener('click', () => {
      dataControladora.setMonth(dataControladora.getMonth() + 1);
      renderizarCalendario(miniCalDaysGrid, miniMonthLabel);
      carregarAgendamentos();
    });
  }
});

/* ==========================================
   6. EXIBIÇÃO DE TOAST (AVISOS)
   ========================================== */
function exibirToast(mensagem) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  if (toast && toastMessage) {
    toastMessage.textContent = message = mensagem;
    toast.style.display = 'block';
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
      toast.style.display = 'none';
    }, 4000);
  } else {
    alert(mensagem);
  }
}