import pool from "./config/pool.js";

// Randomly choose a stock movement type
function getRandomMovementType() {
    const movementTypes = ['STOCK_IN', 'SALE', 'MANUAL_REMOVAL'];
    const randomIndex = Math.floor(Math.random() * movementTypes.length);
    return movementTypes[randomIndex];
}

// Get appropriate quantity based on movement type
// For STOCK_IN: positive quantity
// For SALE and MANUAL_REMOVAL: ensure they don't exceed available stock
function getQuantity(movementType) {
    if (movementType === 'STOCK_IN') {
        // For stock in, generate random positive quantity between 10 and 100
        return Math.floor(Math.random() * 91) + 10; 
    } else {
        // For sales and removals, smaller quantities to ensure we don't go negative
        // We'll add STOCK_IN movements first, then SALE/MANUAL_REMOVAL
        return Math.floor(Math.random() * 5) + 1; // 1-5 items
    }
}

async function insertDemoData() {
    try {
        // Insert Products
        const productRes = await pool.query(
            `INSERT INTO products (name, description, sku, category, unit_price) VALUES
            ('Laptop', 'High-end gaming laptop', 'LAP123', 'Electronics', 1200.00),
            ('Smartphone', 'Latest model smartphone', 'SMT456', 'Electronics', 800.00),
            ('Headphones', 'Noise-canceling headphones', 'HP789', 'Accessories', 150.00),
            ('Keyboard', 'Mechanical keyboard', 'KB101', 'Accessories', 100.00),
            ('Monitor', '4K UHD Monitor', 'MON202', 'Electronics', 350.00),
            ('Mouse', 'Wireless ergonomic mouse', 'MSE303', 'Accessories', 50.00),
            ('Tablet', '10-inch Android tablet', 'TAB404', 'Electronics', 600.00),
            ('Smartwatch', 'Fitness tracking smartwatch', 'SWT505', 'Wearables', 200.00),
            ('Charger', 'Fast charging USB-C charger', 'CHR606', 'Accessories', 30.00),
            ('Bluetooth Speaker', 'Portable Bluetooth speaker', 'SPK707', 'Audio', 80.00),
            ('Gaming Chair', 'Ergonomic gaming chair', 'GC808', 'Furniture', 250.00),
            ('Desk Lamp', 'LED desk lamp with adjustable brightness', 'DL909', 'Furniture', 45.00),
            ('Smart Light Bulb', 'Wi-Fi enabled smart light bulb', 'SLB101', 'Smart Home', 20.00),
            ('Security Camera', '1080p HD security camera', 'CAM202', 'Smart Home', 120.00),
            ('VR Headset', 'Virtual Reality headset', 'VR303', 'Gaming', 400.00),
            ('Game Controller', 'Wireless game controller', 'GC404', 'Gaming', 60.00),
            ('Camera', 'DSLR camera with 4K video recording', 'CAM505', 'Photography', 1000.00),
            ('Tripod', 'Adjustable tripod for cameras', 'TRP606', 'Photography', 100.00),
            ('T-shirt', 'Cotton T-shirt in various sizes', 'TS707', 'Apparel', 20.00),
            ('Jeans', 'Denim jeans in different sizes', 'JN808', 'Apparel', 40.00),
            ('Sneakers', 'Running sneakers in various sizes', 'SN909', 'Footwear', 60.00),
            ('Boots', 'Leather boots for men', 'BT1010', 'Footwear', 90.00),
            ('Backpack', 'Durable travel backpack', 'BP1111', 'Accessories', 40.00),
            ('Sunglasses', 'UV protection sunglasses', 'SG1212', 'Accessories', 25.00)
            RETURNING product_id, unit_price;`
        );
        
        const products = productRes.rows;
        console.log('Inserted Products:', products);

        // First, insert STOCK_IN movements for all products
        for (let product of products) {
            const quantity = getQuantity('STOCK_IN');
            const unitPrice = product.unit_price;
            const notes = 'Initial stock addition';

            await pool.query(
                `INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, notes) VALUES
                (${product.product_id}, 'STOCK_IN', ${quantity}, ${unitPrice}, '${notes}');`
            );
        }
        
        console.log('Initial STOCK_IN movements created successfully.');

        // Then add some SALE and MANUAL_REMOVAL movements
        for (let product of products) {
            // Randomly decide if we want to add a SALE or MANUAL_REMOVAL for this product
            if (Math.random() > 0.3) { // 70% chance to add these movements
                const movementType = Math.random() > 0.5 ? 'SALE' : 'MANUAL_REMOVAL';
                const quantity = getQuantity(movementType);
                const unitPrice = product.unit_price;
                const notes = `Random ${movementType.toLowerCase()} movement`;

                await pool.query(
                    `INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, notes) VALUES
                    (${product.product_id}, '${movementType}', ${quantity}, ${unitPrice}, '${notes}');`
                );
            }
        }

        console.log('All stock movements inserted successfully. Stock levels are positive!');
    } catch (err) {
        console.error('Error inserting demo data:', err);
    } finally {
        pool.end();
    }
}

insertDemoData();