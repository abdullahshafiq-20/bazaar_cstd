import messageConsumer from './messageConsumer.js';
import { EXCHANGES, ROUTING_KEYS } from '../config/rabbitmq.js';
import pool from '../config/pool.js';

// Initialize event handlers for inventory events
export const initializeInventoryEventHandlers = async () => {
  try {
    console.log('Starting initialization of inventory event handlers...');
    
    // Subscribe to stock.added events
    await messageConsumer.subscribe(
      EXCHANGES.INVENTORY, 
      ROUTING_KEYS.STOCK_ADDED, 
      handleStockAdded
    );
    
    // Subscribe to stock.removed events
    await messageConsumer.subscribe(
      EXCHANGES.INVENTORY,
      ROUTING_KEYS.STOCK_REMOVED,
      handleStockRemoved
    );
    
    // Subscribe to product.created events
    await messageConsumer.subscribe(
      EXCHANGES.PRODUCT,
      ROUTING_KEYS.PRODUCT_CREATED,
      handleProductCreated
    );
    
    // Subscribe to product.updated events
    await messageConsumer.subscribe(
      EXCHANGES.PRODUCT,
      ROUTING_KEYS.PRODUCT_UPDATED,
      handleProductUpdated
    );
    
    console.log('Successfully initialized inventory event handlers');
  } catch (error) {
    console.error('Failed to initialize inventory event handlers:', error);
    // Either retry or propagate the error as needed
    throw error;
  }
};

// Handler for stock.added events
async function handleStockAdded(event) {
  try {
    const { storeId, productId, quantity, unitPrice } = event.data;
    console.log(`Processing stock added event: ${quantity} units of product ${productId} added to store ${storeId}`);
    
    // Here you would add business logic that needs to happen when stock is added
    // For example:
    // 1. Update analytics
    // 2. Check if this resolves any low stock alerts
    // 3. Notify relevant users
    
    // Example: Log the event to a stock history table
    await pool.query(
      `INSERT INTO inventory_events 
       (event_type, store_id, product_id, quantity, unit_price, event_date, metadata)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      ['STOCK_ADDED', storeId, productId, quantity, unitPrice, JSON.stringify(event)]
    );
    
    console.log(`Processed stock added event for product ${productId}`);
  } catch (error) {
    console.error('Error handling stock added event:', error);
  }
}

// Handler for stock.removed events
async function handleStockRemoved(event) {
  try {
    const { storeId, productId, quantity, reason, currentStock } = event.data;
    console.log(`Processing stock removed event: ${quantity} units of product ${productId} removed from store ${storeId}`);
    
    // Example: Check if stock is now below threshold and create alert if needed
    if (currentStock < 10) { // Example threshold
      console.log(`Low stock alert: Product ${productId} in store ${storeId} has only ${currentStock} units left`);
      
      // You could insert this into an alerts table
      await pool.query(
        `INSERT INTO inventory_alerts (store_id, product_id, alert_type, threshold, current_value, alert_date)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [storeId, productId, 'LOW_STOCK', 10, currentStock]
      );
    }
    
    // Log the event
    await pool.query(
      `INSERT INTO inventory_events 
       (event_type, store_id, product_id, quantity, unit_price, event_date, metadata)
       VALUES ($1, $2, $3, $4, NULL, CURRENT_TIMESTAMP, $5)`,
      ['STOCK_REMOVED', storeId, productId, quantity, JSON.stringify(event)]
    );
    
    console.log(`Processed stock removed event for product ${productId}`);
  } catch (error) {
    console.error('Error handling stock removed event:', error);
  }
}

// Handler for product.created events
async function handleProductCreated(event) {
  try {
    const { productId, name, category } = event.data;
    console.log(`Processing product created event: ${name} (ID: ${productId})`);
    
    // Example: Add to product catalog
    await pool.query(
      `INSERT INTO product_catalog_events
       (event_type, product_id, name, category, event_date, metadata)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)`,
      ['PRODUCT_CREATED', productId, name, category, JSON.stringify(event)]
    );
    
    console.log(`Processed product created event for product ${productId}`);
  } catch (error) {
    console.error('Error handling product created event:', error);
  }
}

// Handler for product.updated events
async function handleProductUpdated(event) {
  try {
    const { productId, name, category } = event.data;
    console.log(`Processing product updated event: ${name} (ID: ${productId})`);
    
    // Example: Log product changes
    await pool.query(
      `INSERT INTO product_catalog_events
       (event_type, product_id, name, category, event_date, metadata)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)`,
      ['PRODUCT_UPDATED', productId, name, category, JSON.stringify(event)]
    );
    
    console.log(`Processed product updated event for product ${productId}`);
  } catch (error) {
    console.error('Error handling product updated event:', error);
  }
}