const amqp = require('amqplib');

async function iniciarWorker() {
  try {
    // 1. Conecta no RabbitMQ
    const conexao = await amqp.connect('amqp://localhost');
    const canal = await conexao.createChannel();
    
    const nomeFila = 'fila_lembretes';
    
    await canal.assertQueue(nomeFila, { durable: true });
    
    console.log(' [*] Worker aguardando mensagens em fila_lembretes. Para sair use CTRL+C');
    
    // 2. Fica escutando a fila ativamente
    canal.consume(nomeFila, (mensagem) => {
      if (mensagem !== null) {
        const agendamento = JSON.parse(mensagem.content.toString());
        
        console.log('\n--- NOVA MENSAGEM RECEBIDA DO RABBITMQ ---');
        console.log(`Processando agendamento ID: ${agendamento.id}`);
        console.log(`Compromisso: ${agendamento.titulo}`);
        console.log(`Horário: ${agendamento.horario_inicio}`);
        console.log(`Configuração de Lembrete: ${agendamento.lembrete}`);
        console.log('Simulando envio de notificação em segundo plano...');
        console.log('-------------------------------------------\n');
        
        // Confirma para o RabbitMQ que processou com sucesso para tirar da fila
        canal.ack(mensagem);
      }
    });

  } catch (error) {
    console.error('Erro no Worker:', error);
  }
}

iniciarWorker();