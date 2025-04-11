import { getChannel, EXCHANGES, ROUTING_KEYS } from '../config/rabbitmq.js';
import { v4 as uuidv4 } from 'uuid';

class MessageProducer {
  async publishEvent(exchange, routingKey, message) {
    try {
      const channel = await getChannel();
      
      // Add metadata
      const eventMessage = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        data: message
      };
      
      // Publish message
      channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(eventMessage)),
        { 
          persistent: true,
          contentType: 'application/json'
        }
      );
      
      console.log(`Published event to ${exchange}.${routingKey}`);
    } catch (error) {
      console.error(`Error publishing message to ${exchange}.${routingKey}:`, error);
      throw error;
    }
  }
  
  // Helper methods for specific events
  async publishStockAdded(storeId, productId, quantity, unitPrice, currentStock) {
    await this.publishEvent(
      EXCHANGES.INVENTORY,
      ROUTING_KEYS.STOCK_ADDED,
      {
        storeId,
        productId,
        quantity,
        unitPrice,
        currentStock,
        timestamp: new Date().toISOString()
      }
    );
  }
  
  async publishStockRemoved(storeId, productId, quantity, reason, currentStock) {
    await this.publishEvent(
      EXCHANGES.INVENTORY,
      ROUTING_KEYS.STOCK_REMOVED,
      {
        storeId,
        productId,
        quantity,
        reason,
        currentStock,
        timestamp: new Date().toISOString()
      }
    );
  }
  
  async publishProductCreated(productId, name, category, unitPrice) {
    await this.publishEvent(
      EXCHANGES.PRODUCT,
      ROUTING_KEYS.PRODUCT_CREATED,
      {
        productId,
        name,
        category,
        unitPrice,
        timestamp: new Date().toISOString()
      }
    );
  }
  
  async publishProductUpdated(productId, name, category, unitPrice) {
    await this.publishEvent(
      EXCHANGES.PRODUCT,
      ROUTING_KEYS.PRODUCT_UPDATED,
      {
        productId,
        name,
        category,
        unitPrice,
        timestamp: new Date().toISOString()
      }
    );
  }
  
  async publishStoreCreated(storeId, name, address) {
    await this.publishEvent(
      EXCHANGES.STORE,
      ROUTING_KEYS.STORE_CREATED,
      {
        storeId,
        name,
        address,
        timestamp: new Date().toISOString()
      }
    );
  }
}

export default new MessageProducer();