const express = require('express');
const cors = require('cors');
const db = require('./db'); 
const amqp = require('amqplib'); // Biblioteca do RabbitMQ

const app = express();

app.use(cors());
app.use(express.json());

// Função para enviar mensagem para o RabbitMQ
async function enviarParaFila(dadosAgendamento) {
  try {
    // 1. Conecta no RabbitMQ que ativamos no seu Windows
    const conexao = await amqp.connect('amqp://localhost');
    const canal = await conexao.createChannel();
    
    const nomeFila = 'fila_lembretes';    
    // Garante que a fila existe
    await canal.assertQueue(nomeFila, { durable: true });    
    // Envia os dados convertidos em texto (JSON) para a fila
    canal.sendToQueue(nomeFila, Buffer.from(JSON.stringify(dadosAgendamento)), {
      persistent: true
    });
    
    console.log(' [x] Mensagem enviada ao RabbitMQ:', dadosAgendamento.titulo);
    // Fecha a conexão após enviar
    setTimeout(() => {
      conexao.close();
    }, 500);

  } catch (error) {
    console.error('Erro ao enviar para o RabbitMQ:', error);
  }
}

/* TESTE */
app.get('/', (req, res) => {
  res.send('Backend Agenda funcionando com RabbitMQ 🚀');
});

/* 1. ROTA PARA BUSCAR OS AGENDAMENTOS (O que estava faltando e dando 404!) */
app.get('/agendamentos', (req, res) => {
  const sql = 'SELECT * FROM agendamentos';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar agendamentos:', err);
      return res.status(500).json({ erro: 'Erro ao buscar dados no Banco de Dados' });
    }
    // Devolve a lista de agendamentos para o navegador desenhar na tela
    res.status(200).json(results);
  });
});

/* 2. ROTA DE AGENDAMENTOS (SALVAR) */
app.post('/agendamentos', (req, res) => {
  const {
    titulo,
    descricao,
    data,
    horario_inicio,
    horario_fim,
    categoria,
    localizacao,
    lembrete,
    recorrente
  } = req.body;

  const sql = `
    INSERT INTO agendamentos 
    (titulo, descricao, data, horario_inicio, horario_fim, categoria, localizacao, lembrete, recorrente) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [titulo, descricao, data, horario_inicio, horario_fim, categoria, localizacao, lembrete, recorrente],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ erro: 'Erro ao salvar agendamento no Banco de Dados' });
      }
      // salvou no banco com sucesso, joga a tarefa na fila do RabbitMQ!
      const dadosMensagem = {
        id: result.insertId,
        titulo,
        data,
        horario_inicio,
        lembrete
      };
      
      enviarParaFila(dadosMensagem);
      // ------------------------------------------

      res.status(201).json({
        mensagem: 'Agendamento criado e enviado para a fila de processamento!'
      });
    }
  );
});

app.listen(3333, () => {
  console.log('Servidor rodando na porta 3333 e pronto para o RabbitMQ!');
});