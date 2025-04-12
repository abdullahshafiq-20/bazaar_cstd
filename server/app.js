import express from "express";
import pool from "./config/pool.js";
import dotenv from "dotenv";
import productRouter from "./routes/productRoutes.js";
import stockRouter from "./routes/stockRoutes.js";
import inventoryRouter from "./routes/inventoryRoutes.js";
import authRouter from "./routes/authRoutes.js";
import storeRouter from "./routes/storeRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import { setupSwagger } from './config/swagger.js';
import cors from "cors";
import { rateLimiter } from "./middleware/rateLimiter.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
setupSwagger(app);
app.use(cors({ 
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://bazaar-cstd-frontend-v2.vercel.app'
    ].filter(Boolean),
    credentials: true // Important for cookies/sessions
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Basic route, doesn't need rate limiting
app.get("/", (req, res) => {
    res.send("Hello World!");
});

pool.connect((err) => {
    if (err) {
        console.error("Database connection error:", err.stack);
    } else {
        console.log("Connected to the database");
    }
});

pool.on('error', (err) => {
    console.error('Database connection error:', err.stack);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use("/api", rateLimiter);

// Route registration
app.use("/api", productRouter);
app.use("/api", stockRouter);
app.use("/api", inventoryRouter);
app.use("/api", authRouter);
app.use("/api", storeRouter);
app.use("/api", adminRouter);

export default app;