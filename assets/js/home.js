const usuarioLogado = localStorage.getItem("usuarioLogado");

if (!usuarioLogado) {
  window.location.href = "login.html";
}

// URL do backend
const API_URL = "http://localhost:3333/agendamentos";

let dataControladora = new Date();

let modal;
let formAgendamento;
let agendamentoEmEdicao = null;

/* Inicialização segura e carregamento */
document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioAgenda"));

  if (usuario) {
    const userName = document.getElementById("userName");

    if (userName) {
      const nomes = usuario.nome.split(" ");
      const nomeExibido = nomes.slice(0, 2).join(" ");

      userName.textContent = nomeExibido;
    }
  }
  try {
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    modal = document.getElementById("modalNovoAgendamento");
    formAgendamento = document.getElementById("formAgendamento");

    const miniCalDaysGrid = document.querySelector(".mini-cal-days-grid");
    const miniMonthLabel = document.querySelector(".mini-month");

    // Inicializa o Calendário Dinâmico
    if (miniCalDaysGrid) {
      renderizarCalendario(miniCalDaysGrid, miniMonthLabel);
    }

    agendamentoEmEdicao = null;

    carregarAgendamentos();

    atualizarTituloCalendario();

    renderizarDiasTopo();

    atualizarDataSidebar();

    /* CONTROLE DO MODAL (ABRIR E FECHAR) */
    if (openModalBtn && modal) {
      openModalBtn.addEventListener("click", () => {
        agendamentoEmEdicao = null;

        formAgendamento.reset();

        modal.classList.add("active");
      });
    }

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener("click", () => {
        modal.classList.remove("active");
      });
    }

    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });

    /* ENVIO PARA O BACKEND */
    if (formAgendamento) {
      formAgendamento.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Botão Criar Agendamento clicado!");

        try {
          // Coleta os dados usando Optional Chaining (?.) para evitar quebras se o ID não existir
          const agendamento = {
            titulo: document.getElementById("titulo")?.value || "",
            descricao: document.getElementById("descricao")?.value || "",
            data: document.getElementById("data")?.value || "",
            horario_inicio: document.getElementById("horaInicio")?.value || "",
            horario_fim: document.getElementById("horaFim")?.value || "",
            categoria:
              document.getElementById("categoria")?.value || "Lembretes",
            localizacao: document.getElementById("local")?.value || "",
            lembrete:
              document.getElementById("lembrete")?.value || "10 minutos antes",
            recorrente: document.getElementById("recorrente")?.checked ? 1 : 0,
          };

          console.log("Dados prontos para envio:", agendamento);

          const url = agendamentoEmEdicao
            ? `${API_URL}/${agendamentoEmEdicao}`
            : API_URL;

          const metodo = agendamentoEmEdicao ? "PUT" : "POST";

          const resposta = await fetch(url, {
            method: metodo,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(agendamento),
          });

          if (resposta.ok) {
            exibirToast(
              agendamentoEmEdicao
                ? "Agendamento atualizado com sucesso!"
                : "Agendamento criado com sucesso!",
            );
            agendamentoEmEdicao = null;

            formAgendamento.reset();

            if (modal) modal.classList.remove("active");

            carregarAgendamentos(); // Atualiza a lista
          } else {
            const resultado = await resposta.json();
            exibirToast(
              (agendamentoEmEdicao
                ? "Erro ao atualizar: "
                : "Erro ao criar: ") + (resultado.erro || "Verifique os dados"),
            );
          }
        } catch (erroForm) {
          exibirToast(
            "Erro interno ao tentar enviar o formulário: " + erroForm.message,
          );
        }
      });
    }
  } catch (erroGeral) {
    console.error("Erro na inicialização do DOM:", erroGeral);
  }
});

/* BUSCAR E RENDERIZAR AGENDAMENTOS (GET) */
async function carregarAgendamentos() {
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error("Erro ao buscar dados do servidor");

    const agendamentos = await resposta.json();

    renderizarLinhaDoTempo(agendamentos);
    renderizarProximasTarefas(agendamentos);
  } catch (erro) {
    console.error("Erro ao carregar agendamentos:", erro);

    exibirToast("Não foi possível conectar ao servidor");
  }
}

// 4.1 Desenha os blocos de compromissos na Agenda Central (Corrigido)
function renderizarLinhaDoTempo(agendamentos) {
  try {
    // Remove os blocos antigos para não duplicar
    document
      .querySelectorAll(".compromisso-card, .event-block")
      .forEach((el) => el.remove());

    agendamentos.forEach((item) => {
      if (!item.data || !item.horario_inicio) return;

      const dataFormatada = item.data.split("T")[0];

      const anoC = dataControladora.getFullYear();
      const mesC = String(dataControladora.getMonth() + 1).padStart(2, "0");
      const diaC = String(dataControladora.getDate()).padStart(2, "0");

      const dataSelecionadaStr = `${anoC}-${mesC}-${diaC}`;

      // Só mostra os eventos do dia selecionado
      if (dataFormatada === dataSelecionadaStr) {
        const horaInicio = item.horario_inicio.substring(0, 5);
        const horaChave = item.horario_inicio.split(":")[0] + ":00";

        const linhas = document.querySelectorAll(".hour-row");

        linhas.forEach((linha) => {
          const horario = linha.querySelector(".time-label").textContent.trim();

          if (horario === horaChave) {
            const slotDestino = linha.querySelector(".hour-slot");

            const divCompromisso = document.createElement("div");

            divCompromisso.className = "compromisso-card";

            divCompromisso.style.background = "#e0ebff";
            divCompromisso.style.borderLeft = "4px solid #2563eb";
            divCompromisso.style.padding = "8px";
            divCompromisso.style.margin = "4px 0";
            divCompromisso.style.borderRadius = "6px";
            divCompromisso.style.zIndex = "10";

            divCompromisso.innerHTML = `
              <strong style="color:#1e40af; display:block;">
                ${item.titulo}
              </strong>

              <span style="font-size:12px; color:#4b5563;">
                ${horaInicio} - ${item.localizacao || "Sem local"}
              </span>

              <div style="
                display:flex;
                justify-content:flex-end;
                gap:8px;
                margin-top:6px;
              ">
                <button
                  class="btn-edit-calendar"
                  title="Editar"
                >
                  <i data-lucide="pencil"></i>
                </button>

                <button
                  class="btn-delete-calendar"
                  title="Excluir"
                >
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            `;

            const btnEditar =
              divCompromisso.querySelector(".btn-edit-calendar");

            btnEditar.addEventListener("click", () => {
              agendamentoEmEdicao = item.id;

              document.getElementById("titulo").value = item.titulo || "";
              document.getElementById("descricao").value = item.descricao || "";

              document.getElementById("data").value = item.data
                ? item.data.split("T")[0]
                : "";

              document.getElementById("horaInicio").value = item.horario_inicio
                ? item.horario_inicio.substring(0, 5)
                : "";

              document.getElementById("horaFim").value = item.horario_fim
                ? item.horario_fim.substring(0, 5)
                : "";

              document.getElementById("categoria").value = item.categoria || "";

              document.getElementById("local").value = item.localizacao || "";

              document.getElementById("lembrete").value = item.lembrete || "";

              document.getElementById("recorrente").checked =
                item.recorrente === 1;

              modal.classList.add("active");
            });

            const btnExcluir = divCompromisso.querySelector(
              ".btn-delete-calendar",
            );

            btnExcluir.addEventListener("click", async () => {
              const confirmar = confirm(
                `Deseja realmente excluir "${item.titulo}"?`,
              );

              if (!confirmar) return;

              try {
                const response = await fetch(`${API_URL}/${item.id}`, {
                  method: "DELETE",
                });

                const resultado = await response.json();

                if (!response.ok) {
                  throw new Error(
                    resultado.erro || "Erro ao excluir agendamento",
                  );
                }

                exibirToast("Agendamento excluído com sucesso!");
                carregarAgendamentos();
              } catch (error) {
                console.error(error);
                exibirToast("Erro ao excluir agendamento.");
              }
            });

            slotDestino.appendChild(divCompromisso);
          }
        });
      }
    }); lucide.createIcons();
  } catch (e) {
    console.error("Erro ao renderizar linha do tempo:", e);
  }
}

// 4.2 Lista todos os agendamentos na lateral direita (Preservando o mini-calendário)
function renderizarProximasTarefas(agendamentos) {
  try {
    // Procura o elemento maior da barra lateral direita
    const sidebarRight =
      document.querySelector(".sidebar-right") ||
      document.querySelector("aside");
    if (!sidebarRight) {
      console.warn(
        "Não foi possível encontrar o elemento da barra lateral no HTML.",
      );
      return;
    }

    // Busca ou cria uma div dedicada EXCLUSIVA para a lista para não zerar o calendário com innerHTML
    const containerTarefas = document.getElementById("tasksWrapper");

    if (!containerTarefas) return;

    containerTarefas.innerHTML = "";

    // Cria uma caixinha interna para listar os itens organizados
    const listaItens = document.createElement("div");
    listaItens.style.display = "flex";
    listaItens.style.flexDirection = "column";
    listaItens.style.gap = "12px";
    listaItens.style.marginTop = "10px";

    // Ordena os agendamentos por data para mostrar os mais próximos primeiro
    const ordenados = [...agendamentos].sort(
      (a, b) => new Date(a.data) - new Date(b.data),
    );

    // Pega os 5 primeiros agendamentos e coloca na lista lateral
    ordenados.slice(0, 5).forEach((item) => {
      if (!item.data) return;

      const dataPartes = item.data.split("T")[0].split("-");
      const dataExibicao = `${dataPartes[2]}/${dataPartes[1]}`;
      const horaInicio = item.horario_inicio
        ? item.horario_inicio.substring(0, 5)
        : "00:00";

      const divTarefa = document.createElement("div");
      divTarefa.className = "task-item-lateral";
      divTarefa.style.display = "flex";
      divTarefa.style.justifyContent = "space-between";
      divTarefa.style.alignItems = "center";
      divTarefa.style.padding = "10px";
      divTarefa.style.background = "#f9fafb";
      divTarefa.style.borderRadius = "8px";
      divTarefa.style.borderLeft = "4px solid #3b82f6";

      divTarefa.innerHTML = `
        <div>
          <span style="font-weight: 600; display: block; font-size: 14px; color: #1f2937;">
            ${item.titulo}
          </span>
          <span style="font-size: 12px; color: #6b7280;">
            ${item.categoria || "Geral"}
          </span>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          <div style="text-align: right; font-size: 12px; color: #4b5563;">
            <span style="font-weight: bold; color: #2563eb;">
              ${dataExibicao}
            </span>
            <span style="display: block; font-size: 11px; color: #9ca3af;">
              ${horaInicio}
            </span>
          </div>

          <button
            class="btn-edit-event"
            title="Editar"
          >
            <i data-lucide="pencil"></i>
          </button>

          <button
            class="btn-delete-event"
            data-id="${item.id}"
            title="Excluir agendamento"
          >
            <i data-lucide="trash-2"></i>
          </button>
          </div>
        `;

      const btnEditar = divTarefa.querySelector(".btn-edit-event");

      btnEditar.addEventListener("click", () => {
        agendamentoEmEdicao = item.id;

        document.getElementById("titulo").value = item.titulo || "";

        document.getElementById("descricao").value = item.descricao || "";

        document.getElementById("data").value = item.data
          ? item.data.split("T")[0]
          : "";

        document.getElementById("horaInicio").value = item.horario_inicio
          ? item.horario_inicio.substring(0, 5)
          : "";

        document.getElementById("horaFim").value = item.horario_fim
          ? item.horario_fim.substring(0, 5)
          : "";

        document.getElementById("categoria").value = item.categoria || "";
        document.getElementById("local").value = item.localizacao || "";
        document.getElementById("lembrete").value = item.lembrete || "";

        document.getElementById("recorrente").checked = item.recorrente === 1;

        modal.classList.add("active");
      });

      const btnExcluir = divTarefa.querySelector(".btn-delete-event");

      btnExcluir.addEventListener("click", async () => {
        const confirmar = confirm(`Deseja realmente excluir "${item.titulo}"?`);

        if (!confirmar) return;

        try {
          const response = await fetch(`${API_URL}/${item.id}`, {
            method: "DELETE",
          });

          const resultado = await response.json();

          if (!response.ok) {
            throw new Error(resultado.erro || "Erro ao excluir agendamento");
          }

          exibirToast("Agendamento excluído com sucesso!");
          carregarAgendamentos();
        } catch (error) {
          console.error(error);
          exibirToast("Erro ao excluir agendamento.");
        }
      });

      listaItens.appendChild(divTarefa);
      lucide.createIcons();
    });

    containerTarefas.appendChild(listaItens);
  } catch (e) {
    console.error("Erro ao renderizar próximas tarefas:", e);
  }
}

// Funções do calendário dinâmico
function renderizarCalendario(miniCalDaysGrid, miniMonthLabel) {
  const ano = dataControladora.getFullYear();
  const mes = dataControladora.getMonth();

  const mesesNome = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  if (miniMonthLabel) {
    miniMonthLabel.textContent = `${mesesNome[mes]} ${ano}`;
  }

  const labels = Array.from(miniCalDaysGrid.querySelectorAll(".week-label"));
  miniCalDaysGrid.innerHTML = "";
  labels.forEach((label) => miniCalDaysGrid.appendChild(label));

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    const span = document.createElement("span");
    span.classList.add("day-off");
    span.textContent = totalDiasMesAnterior - i;
    miniCalDaysGrid.appendChild(span);
  }

  const hoje = new Date();
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const span = document.createElement("span");
    span.textContent = dia;

    if (
      dia === hoje.getDate() &&
      mes === hoje.getMonth() &&
      ano === hoje.getFullYear()
    ) {
      span.classList.add("mini-active");
    }

    span.addEventListener("click", () => {
      document
        .querySelectorAll(".mini-cal-days-grid span")
        .forEach((s) => s.classList.remove("mini-active"));
      span.classList.add("mini-active");

      dataControladora.setFullYear(ano);
      dataControladora.setMonth(mes);
      dataControladora.setDate(dia);

      atualizarTituloCalendario();
      renderizarDiasTopo();
      atualizarDataSidebar();
      carregarAgendamentos();
    });

    miniCalDaysGrid.appendChild(span);
  }
}

// setas do calendário
document.addEventListener("DOMContentLoaded", () => {
  ["data", "horaInicio", "horaFim"].forEach((id) => {
    const campo = document.getElementById(id);

    if (campo) {
      campo.addEventListener("click", () => {
        if (campo.showPicker) {
          campo.showPicker();
        }
      });
    }
  });

  let larguraAnterior = window.innerWidth;

  window.addEventListener("resize", () => {
    const mudouBreakpoint =
      (larguraAnterior < 768 && window.innerWidth >= 768) ||
      (larguraAnterior >= 768 && window.innerWidth < 768);

    if (mudouBreakpoint) {
      renderizarDiasTopo();
    }

    larguraAnterior = window.innerWidth;
  });

  const setasMini = document.querySelectorAll(".arrow-mini");
  const miniCalDaysGrid = document.querySelector(".mini-cal-days-grid");
  const miniMonthLabel = document.querySelector(".mini-month");

  if (setasMini.length >= 2 && miniCalDaysGrid) {
    setasMini[0].addEventListener("click", () => {
      dataControladora.setMonth(dataControladora.getMonth() - 1);
      renderizarCalendario(miniCalDaysGrid, miniMonthLabel);
      atualizarTituloCalendario();
      renderizarDiasTopo();
      atualizarDataSidebar();
      carregarAgendamentos();
    });
    setasMini[1].addEventListener("click", () => {
      dataControladora.setMonth(dataControladora.getMonth() + 1);
      renderizarCalendario(miniCalDaysGrid, miniMonthLabel);
      atualizarTituloCalendario();
      renderizarDiasTopo();
      atualizarDataSidebar();
      carregarAgendamentos();
    });
  }
});

/* TOAST */
function exibirToast(mensagem) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  if (toast && toastMessage) {
    toastMessage.textContent = mensagem;
    toast.style.display = "block";
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      toast.style.display = "none";
    }, 4000);
  } else {
    alert(mensagem);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const userProfile = document.querySelector(".user-profile");
  const profileMenu = document.querySelector(".profile-menu");

  if (userProfile && profileMenu) {
    userProfile.addEventListener("click", () => {
      profileMenu.classList.toggle("active");
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const btnLogout = document.getElementById("btnLogout");

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioAgenda");
      localStorage.removeItem("usuarioLogado");

      window.location.href = "login.html";
    });
  }
});

function atualizarTituloCalendario() {
  const titulo = document.getElementById("tituloCalendario");

  if (!titulo) return;

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  titulo.textContent = `${meses[dataControladora.getMonth()]} ${dataControladora.getFullYear()}`;
}

function renderizarDiasTopo() {
  const grid = document.getElementById("weekDaysGrid");

  if (!grid) return;

  grid.innerHTML = "";

  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];

  const dataBase = new Date(dataControladora);

  let totalDias;

  if (window.innerWidth < 768) {
    dataBase.setDate(dataControladora.getDate() - 3);
    totalDias = 7;
  } else {
    dataBase.setDate(dataControladora.getDate() - 5);
    totalDias = 12;
  }

  console.log("Largura:", window.innerWidth);
  console.log("Total dias:", totalDias);

  for (let i = 0; i < totalDias; i++) {
    const data = new Date(dataBase);
    data.setDate(dataBase.getDate() + i);

    const coluna = document.createElement("div");
    coluna.classList.add("day-col-header");

    if (
      data.getDate() === dataControladora.getDate() &&
      data.getMonth() === dataControladora.getMonth() &&
      data.getFullYear() === dataControladora.getFullYear()
    ) {
      coluna.classList.add("active");
    }

    const letraDia = diasSemana[data.getDay()];

    coluna.innerHTML = `
      <span>${letraDia}</span>
      ${
        coluna.classList.contains("active")
          ? `<span class="day-bubble">${data.getDate()}</span>`
          : `<span>${data.getDate()}</span>`
      }
    `;

    coluna.addEventListener("click", () => {
      dataControladora = new Date(data);

      atualizarTituloCalendario();
      renderizarDiasTopo();
      atualizarDataSidebar();
      carregarAgendamentos();
    });

    grid.appendChild(coluna);
  }
}

function atualizarDataSidebar() {
  const elemento = document.getElementById("dataAtualSidebar");

  if (!elemento) return;

  const diasSemana = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const diaSemana = diasSemana[dataControladora.getDay()];
  const dia = dataControladora.getDate();
  const mes = meses[dataControladora.getMonth()];

  elemento.innerHTML = `
    ${diaSemana},
    <span class="highlight-date">
      ${dia} de ${mes}
    </span>
  `;
}
