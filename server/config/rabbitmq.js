import amqp from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();

// Connection variables
let connection = null;
let channel = null;

// Exchange names
export const EXCHANGES = {
  INVENTORY: 'inventory',
  STORE: 'store',
  PRODUCT: 'product'
};

// Routing keys
export const ROUTING_KEYS = {
  STOCK_ADDED: 'stock.added',
  STOCK_REMOVED: 'stock.removed',
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  STORE_CREATED: 'store.created'
};

// Connect to RabbitMQ
const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Create exchanges
    await channel.assertExchange(EXCHANGES.INVENTORY, 'topic', { durable: true });
    await channel.assertExchange(EXCHANGES.STORE, 'topic', { durable: true });
    await channel.assertExchange(EXCHANGES.PRODUCT, 'topic', { durable: true });
    
    console.log('Connected to RabbitMQ');
    
    // Handle connection close
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      setTimeout(connectRabbitMQ, 5000);
    });
    
    connection.on('close', () => {
      console.log('RabbitMQ connection closed. Reconnecting...');
      setTimeout(connectRabbitMQ, 5000);
    });
    
    return { connection, channel };
  } catch (error) {
    console.error('RabbitMQ connection failed:', error);
    setTimeout(connectRabbitMQ, 5000);
  }
};

// Get connection and channel (creates if doesn't exist)
export const getChannel = async () => {
  if (!channel) {
    await connectRabbitMQ();
  }
  return channel;
};

// Initialize connection when the app starts
connectRabbitMQ();

export default { getChannel, EXCHANGES, ROUTING_KEYS };