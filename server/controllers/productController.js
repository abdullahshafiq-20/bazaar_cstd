// CREATE TABLE products (
//     product_id SERIAL PRIMARY KEY,
//     name VARCHAR(255) NOT NULL,
//     description TEXT,
//     sku VARCHAR(50) UNIQUE,
//     category VARCHAR(100),
//     unit_price DECIMAL(10, 2) NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
import pool from '../config/pool.js';

// const client = await pool.connect();
// const result = await client.query("SELECT current_database();");
// console.log(result.rows);
// client.release();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - unit_price
 *       properties:
 *         product_id:
 *           type: integer
 *           description: The auto-generated ID of the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         description:
 *           type: string
 *           description: Detailed description of the product
 *         sku:
 *           type: string
 *           description: Stock keeping unit, unique identifier
 *         category:
 *           type: string
 *           description: Product category
 *         unit_price:
 *           type: number
 *           format: float
 *           description: Price per unit
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date and time when the product was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Date and time when the product was last updated
 *       example:
 *         product_id: 1
 *         name: Wireless Headphones
 *         description: Premium noise-cancelling wireless headphones with 30-hour battery life
 *         sku: AUDIO-WH100
 *         category: Electronics
 *         unit_price: 149.99
 *         created_at: 2023-01-01T00:00:00.000Z
 *         updated_at: 2023-01-01T00:00:00.000Z
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API for managing products
 */

/**
 * @swagger
 * /api/product/get:
 *   get:
 *     summary: Returns a list of all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       404:
 *         description: No products found
 *       500:
 *         description: Internal server error
 */
export const getProducts = async (req, res) => {
    try {
        const query = `
        SELECT product_id, name, description, sku, category, unit_price, created_at, updated_at
        FROM public.products
        ORDER BY product_id ASC
    `;        
        const result = await pool.query(query);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No products found' });
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/product/get_by_id/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - Product ID is required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const getProductById = async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        
        const query = `
            SELECT product_id, name, description, sku, category, unit_price, created_at, updated_at
            FROM public.products
            WHERE product_id = $1
        `;
        const values = [id];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


/**
 * @swagger
 * /api/product/create:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - unit_price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sku:
 *                 type: string
 *               category:
 *                 type: string
 *               unit_price:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 productId:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
export const createProduct = async (req, res) => {
    const { name, description, sku, category, unit_price } = req.body;

    const query = `
        INSERT INTO public.products (name, description, sku, category, unit_price)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING product_id
    `;
    const values = [name, description, sku, category, unit_price];  
    try {
        const result = await pool.query(query, values);
        const productId = result.rows[0].product_id;
        res.status(201).json({ message: 'Product created successfully', productId });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }

};

/**
 * @swagger
 * /api/products/create_demo:
 *   post:
 *     summary: Create demo products
 *     tags: [Products]
 *     responses:
 *       201:
 *         description: Demo products created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
export const createDemoProducts = async (req, res) => {
    try {
        const demoProducts = [
            {
                name: 'Wireless Headphones',
                description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
                sku: 'AUDIO-WH100',
                category: 'Electronics',
                unit_price: 149.99
            },
            {
                name: 'Organic Coffee Beans',
                description: 'Fair-trade certified organic coffee beans, medium roast, 1lb bag',
                sku: 'GROC-COF001',
                category: 'Groceries',
                unit_price: 12.99
            },
            {
                name: 'Cotton T-Shirt',
                description: 'Classic fit 100% cotton t-shirt, available in multiple colors',
                sku: 'APP-TS001',
                category: 'Apparel',
                unit_price: 19.99
            },
            {
                name: 'Stainless Steel Water Bottle',
                description: 'Double-walled insulated water bottle, keeps drinks cold for 24 hours',
                sku: 'HOME-WB050',
                category: 'Home Goods',
                unit_price: 24.95
            },
            {
                name: 'Yoga Mat',
                description: 'Non-slip eco-friendly yoga mat with carry strap, 5mm thickness',
                sku: 'SPRT-YM001',
                category: 'Sports & Fitness',
                unit_price: 29.99
            }
        ];

        const insertPromises = demoProducts.map(product => {
            const query = `
                INSERT INTO public.products (name, description, sku, category, unit_price)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING product_id
            `;
            const values = [
                product.name, 
                product.description, 
                product.sku, 
                product.category, 
                product.unit_price
            ];
            
            return pool.query(query, values);
        });

        await Promise.all(insertPromises);
        
        res.status(201).json({ 
            message: 'Demo products created successfully', 
            count: demoProducts.length 
        });
    } catch (error) {
        console.error('Error creating demo products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


/**
 * @swagger
 * /api/product/update/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sku:
 *                 type: string
 *               category:
 *                 type: string
 *               unit_price:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - Product ID is required or No fields to update provided
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, sku, category, unit_price } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        
        // Check if the product exists first
        const checkQuery = 'SELECT * FROM public.products WHERE product_id = $1';
        const checkResult = await pool.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Build the update query dynamically based on the fields provided
        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;
        
        if (name !== undefined) {
            updateFields.push(`name = $${paramIndex}`);
            queryParams.push(name);
            paramIndex++;
        }
        
        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex}`);
            queryParams.push(description);
            paramIndex++;
        }
        
        if (sku !== undefined) {
            updateFields.push(`sku = $${paramIndex}`);
            queryParams.push(sku);
            paramIndex++;
        }
        
        if (category !== undefined) {
            updateFields.push(`category = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        }
        
        if (unit_price !== undefined) {
            updateFields.push(`unit_price = $${paramIndex}`);
            queryParams.push(parseFloat(unit_price));
            paramIndex++;
        }
        
        // Always update the updated_at timestamp
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // If no fields to update, return early
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update provided' });
        }
        
        // Create the update query
        const updateQuery = `
            UPDATE public.products 
            SET ${updateFields.join(', ')}
            WHERE product_id = $${paramIndex}
            RETURNING product_id, name, description, sku, category, unit_price, created_at, updated_at
        `;
        
        // Add the ID as the last parameter
        queryParams.push(id);
        
        // Execute the update
        const result = await pool.query(updateQuery, queryParams);
        
        res.json({
            message: 'Product updated successfully',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/product/delete/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - Product ID is required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        
        // Check if the product exists first
        const checkQuery = 'SELECT * FROM public.products WHERE product_id = $1';
        const checkResult = await pool.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Create the delete query
        const deleteQuery = 'DELETE FROM public.products WHERE product_id = $1 RETURNING *';
        const deleteResult = await pool.query(deleteQuery, [id]);
        
        res.json({
            message: 'Product deleted successfully',
            product: deleteResult.rows[0]
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};