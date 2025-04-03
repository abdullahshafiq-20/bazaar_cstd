import pool from '../server/config/pool.js'; // Ensure you have the pool configured correctly
import bcrypt from 'bcrypt';

const insertDemoData = async () => {
  try {
    await pool.query('BEGIN');
    
    // Insert stores (500 stores)
    let storeValues = [];
    for (let i = 1; i <= 500; i++) {
      storeValues.push(`('Store ${i}', 'Address ${i}', '123-456-78${i % 10}', 'store${i}@example.com')`);
    }
    const storeRes = await pool.query(
      `INSERT INTO stores (name, address, phone, email) VALUES ${storeValues.join(",")} RETURNING store_id;`
    );
    const storeIds = storeRes.rows.map(row => row.store_id);
    
    // Insert products (100 product catalogs)
    let productValues = [];
    for (let i = 1; i <= 100; i++) {
      productValues.push(`('Product ${i}', 'Description for product ${i}', 'SKU${i}', 'Category ${i % 10}', ${Math.floor(Math.random() * 1000) + 50})`);
    }
    const productRes = await pool.query(
      `INSERT INTO products (name, description, sku, category, unit_price) VALUES ${productValues.join(",")} RETURNING product_id;`
    );
    const productIds = productRes.rows.map(row => row.product_id);
    
    // Insert users (store managers, 500 managers)
    for (let i = 0; i < 500; i++) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(`manager${i + 1}Password`, salt);
      
      const userRes = await pool.query(
        `INSERT INTO users (username, password_hash, email, full_name) VALUES
        ($1, $2, $3, $4) RETURNING user_id;`,
        [`manager${i + 1}`, passwordHash, `manager${i + 1}@store.com`, `Manager ${i + 1}`]
      );
      const userId = userRes.rows[0].user_id;
      
      // Assign store manager role
      await pool.query(
        `INSERT INTO user_roles (user_id, store_id, role) VALUES ($1, $2, 'STORE_MANAGER');`,
        [userId, storeIds[i]]
      );
    }
    
    // Insert stock movements
    let stockValues = [];
    for (const productId of productIds) {
      for (let i = 0; i < 5; i++) { // Insert stock movements for each product
        const storeId = storeIds[Math.floor(Math.random() * storeIds.length)];
        const quantity = Math.floor(Math.random() * 100) + 10;
        stockValues.push(`(${productId}, 'STOCK_IN', ${quantity}, (SELECT unit_price FROM products WHERE product_id = ${productId}), ${storeId}, 'Initial stock entry')`);
      }
    }
    await pool.query(
      `INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, store_id, notes) VALUES ${stockValues.join(",")};`
    );
    
    await pool.query('COMMIT');
    console.log('Stores, products, users, and stock movements inserted successfully!');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error inserting demo data:', error);
  } finally {
    pool.end();
  }
};

insertDemoData();
