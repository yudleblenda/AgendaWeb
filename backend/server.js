const express = require("express");
const cors = require("cors");
const db = require("./db");
const amqp = require("amqplib"); // Biblioteca do RabbitMQ

const app = express();

app.use(cors());
app.use(express.json());

// Função para enviar mensagem para o RabbitMQ
async function enviarParaFila(dadosAgendamento) {
  try {
    // 1. Conecta no RabbitMQ que ativamos no seu Windows
    const conexao = await amqp.connect("amqp://localhost");
    const canal = await conexao.createChannel();

    const nomeFila = "fila_lembretes";
    // Garante que a fila existe
    await canal.assertQueue(nomeFila, { durable: true });
    // Envia os dados convertidos em texto (JSON) para a fila
    canal.sendToQueue(nomeFila, Buffer.from(JSON.stringify(dadosAgendamento)), {
      persistent: true,
    });

    console.log(" [x] Mensagem enviada ao RabbitMQ:", dadosAgendamento.titulo);
    // Fecha a conexão após enviar
    setTimeout(() => {
      conexao.close();
    }, 500);
  } catch (error) {
    console.error("Erro ao enviar para o RabbitMQ:", error);
  }
}

/* TESTE */
app.get("/", (req, res) => {
  res.send("Backend Agenda funcionando com RabbitMQ");
});

/* Buscar agendamentos */
app.get("/agendamentos", (req, res) => {
  const sql = "SELECT * FROM agendamentos";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar agendamentos:", err);
      return res
        .status(500)
        .json({ erro: "Erro ao buscar dados no Banco de Dados" });
    }
    // Devolve a lista de agendamentos para o navegador desenhar na tela
    res.status(200).json(results);
  });
});

/* Salvar agendamentos */
app.post("/agendamentos", (req, res) => {
  const {
    titulo,
    descricao,
    data,
    horario_inicio,
    horario_fim,
    categoria,
    localizacao,
    lembrete,
    recorrente,
  } = req.body;

  if (!titulo || !data || !horario_inicio) {
    return res.status(400).json({
      erro: "Título, data e horário são obrigatórios",
    });
  }

  const sql = `
    INSERT INTO agendamentos 
    (titulo, descricao, data, horario_inicio, horario_fim, categoria, localizacao, lembrete, recorrente) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      titulo,
      descricao,
      data,
      horario_inicio,
      horario_fim,
      categoria,
      localizacao,
      lembrete,
      recorrente,
    ],
    (err, result) => {
        if (err) {
          console.error("Erro ao salvar agendamento:", err);

          return res.status(500).json({
            erro: "Erro ao salvar agendamento no Banco de Dados",
          });
        }
      // salvou no banco com sucesso, joga a tarefa na fila do RabbitMQ!
      const dadosMensagem = {
        id: result.insertId,
        titulo,
        data,
        horario_inicio,
        lembrete,
      };

      enviarParaFila(dadosMensagem);

      res.status(201).json({
        mensagem: "Agendamento criado e enviado para a fila de processamento!",
      });
    },
  );
});

/* Atualizar agendamento */
app.put("/agendamentos/:id", (req, res) => {
  const { id } = req.params;

  const {
    titulo,
    descricao,
    data,
    horario_inicio,
    horario_fim,
    categoria,
    localizacao,
    lembrete,
    recorrente,
  } = req.body;

  if (!titulo || !data || !horario_inicio) {
    return res.status(400).json({
      erro: "Título, data e horário são obrigatórios",
    });
  }

  const sql = `
    UPDATE agendamentos
    SET
      titulo = ?,
      descricao = ?,
      data = ?,
      horario_inicio = ?,
      horario_fim = ?,
      categoria = ?,
      localizacao = ?,
      lembrete = ?,
      recorrente = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      titulo,
      descricao,
      data,
      horario_inicio,
      horario_fim,
      categoria,
      localizacao,
      lembrete,
      recorrente,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("Erro ao atualizar agendamento:", err);
        return res.status(500).json({
          erro: "Erro ao atualizar agendamento",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          erro: "Agendamento não encontrado",
        });
      }

      res.status(200).json({
        mensagem: "Agendamento atualizado com sucesso!",
      });
    },
  );
});

/* Deletar agendamento */
app.delete("/agendamentos/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM agendamentos WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar agendamento:", err);

      return res.status(500).json({
        erro: "Erro ao deletar agendamento",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        erro: "Agendamento não encontrado",
      });
    }

    res.status(200).json({
      mensagem: "Agendamento deletado com sucesso!",
    });
  });
});

app.listen(3333, () => {
  console.log("Servidor rodando na porta 3333 e pronto para o RabbitMQ!");
});

app.post("/usuarios", (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      erro: "Todos os campos são obrigatórios",
    });
  }

  const verificarEmail =
    "SELECT id FROM usuarios WHERE email = ?";

  db.query(verificarEmail, [email], (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        erro: "Erro ao verificar usuário",
      });
    }

    if (results.length > 0) {
      return res.status(400).json({
        erro: "Este e-mail já está cadastrado",
      });
    }

    const sql = `
      INSERT INTO usuarios (nome, email, senha)
      VALUES (?, ?, ?)
    `;

    db.query(sql, [nome, email, senha], (err) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          erro: "Erro ao cadastrar usuário",
        });
      }

      res.status(201).json({
        mensagem: "Usuário cadastrado com sucesso",
      });
    });
  });
});

app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  const sql =
    "SELECT id, nome, email, senha FROM usuarios WHERE email = ?";

  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({
        erro: "Erro interno",
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        erro: "Usuário não encontrado",
      });
    }

    const usuario = results[0];

    if (usuario.senha !== senha) {
      return res.status(401).json({
        erro: "Senha inválida",
      });
    }

    res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    });
  });
});
