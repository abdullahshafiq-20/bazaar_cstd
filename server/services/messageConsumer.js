import { getChannel, EXCHANGES } from '../config/rabbitmq.js';

class MessageConsumer {
  constructor() {
    this.subscriptions = {};
  }
  
  async subscribe(exchange, routingKey, callback) {
    try {
      const channel = await getChannel();
      
      // Assert exchange exists
      await channel.assertExchange(exchange, 'topic', { durable: true });
      
      // Create queue with random name (exclusive queue)
      const q = await channel.assertQueue('', { exclusive: true });
      
      // Bind queue to exchange with routing key
      await channel.bindQueue(q.queue, exchange, routingKey);
      
      // Track subscription for potential reconnect handling
      const key = `${exchange}.${routingKey}`;
      this.subscriptions[key] = { exchange, routingKey, callback };
      
      // Consume messages
      channel.consume(
        q.queue, 
        async (msg) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              console.log(`Received message on ${exchange}.${routingKey}`);
              
              // Process message
              await callback(content);
              
              // Acknowledge message
              channel.ack(msg);
            } catch (error) {
              console.error(`Error processing message on ${exchange}.${routingKey}:`, error);
              // Negative acknowledge, don't requeue as it may cause an infinite loop if processing is failing
              channel.nack(msg, false, false);
            }
          }
        },
        { noAck: false }
      );
      
      console.log(`Subscribed to ${exchange}.${routingKey}`);
      return q.queue;
    } catch (error) {
      console.error(`Failed to subscribe to ${exchange}.${routingKey}:`, error);
      throw error;
    }
  }
}

export default new MessageConsumer();