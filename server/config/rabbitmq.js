import amqp from 'amqplib';

// Connection variables
let connection = null;
let channel = null;

// RabbitMQ configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const RECONNECT_TIMEOUT = 5000; // 5 seconds

// Exchange definitions
export const EXCHANGES = {
  INVENTORY: 'inventory',
  PRODUCT: 'product',
  ORDER: 'order'
};

// Routing key definitions
export const ROUTING_KEYS = {
  STOCK_ADDED: 'stock.added',
  STOCK_REMOVED: 'stock.removed',
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated'
};

// Connect to RabbitMQ with retry mechanism
export const connectRabbitMQ = async () => {
  try {
    console.log(`Connecting to RabbitMQ at ${RABBITMQ_URL}...`);
    connection = await amqp.connect(RABBITMQ_URL);
    
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      setTimeout(reconnect, RECONNECT_TIMEOUT);
    });
    
    connection.on('close', () => {
      console.error('RabbitMQ connection closed unexpectedly');
      setTimeout(reconnect, RECONNECT_TIMEOUT);
    });
    
    channel = await connection.createChannel();
    
    // Assert exchanges exist
    for (const exchange of Object.values(EXCHANGES)) {
      await channel.assertExchange(exchange, 'topic', { durable: true });
    }
    
    console.log('Successfully connected to RabbitMQ');
    return true;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    setTimeout(reconnect, RECONNECT_TIMEOUT);
    return false;
  }
};

// Reconnection function
async function reconnect() {
  console.log('Attempting to reconnect to RabbitMQ...');
  await connectRabbitMQ();
}

// Get channel (with connection check)
export const getChannel = async () => {
  if (!channel) {
    await connectRabbitMQ();
  }
  return channel;
};

// Close connection
export const closeConnection = async () => {
  if (connection) {
    await connection.close();
    connection = null;
    channel = null;
  }
};

// Initialize connection on module import
connectRabbitMQ().catch(console.error);