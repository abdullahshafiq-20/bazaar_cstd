// filepath: d:\All_Repos_by_as053266\bazaar_cstd\server\utils\mqViewer.js
import { getChannel, EXCHANGES, ROUTING_KEYS } from '../config/rabbitmq.js';

// Function to view all messages on a specific topic
export async function viewMessages(exchange, routingKey) {
  try {
    const channel = await getChannel();
    if (!channel) {
      console.error('Cannot connect to RabbitMQ to view messages');
      return;
    }
    
    // Create a queue specifically for monitoring
    const q = await channel.assertQueue('', { exclusive: true });
    console.log(`Monitoring queue ${q.queue} created for exchange: ${exchange}, routing key: ${routingKey}`);
    
    // Bind to exchange with routing key
    await channel.bindQueue(q.queue, exchange, routingKey);
    console.log(`Waiting for messages on ${exchange}.${routingKey}. To exit press CTRL+C`);
    
    // Start consuming messages
    channel.consume(q.queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        console.log('\n==================================');
        console.log(`MESSAGE RECEIVED on ${exchange}.${routingKey}`);
        console.log('----------------------------------');
        console.log('Event ID:', content.id);
        console.log('Timestamp:', content.timestamp);
        console.log('Data:', JSON.stringify(content.data, null, 2));
        console.log('==================================\n');
        
        // Don't acknowledge the message so it remains in the queue
        // This allows other consumers to still process it
      }
    }, { noAck: true });
    
    // Keep process running
    console.log("Viewer running. Press Ctrl+C to exit.");
  } catch (error) {
    console.error('Error setting up message viewer:', error);
  }
}

// Command line utility
if (process.argv[2] && process.argv[3]) {
  const exchange = process.argv[2];
  const routingKey = process.argv[3];
  
  console.log(`Starting message viewer for ${exchange}.${routingKey}`);
  viewMessages(exchange, routingKey)
    .catch(err => {
      console.error('Viewer error:', err);
      process.exit(1);
    });
} else {
  console.log('Usage: node mqViewer.js [exchange] [routingKey]');
  console.log('Example: node mqViewer.js inventory stock.added');
  process.exit(1);
}