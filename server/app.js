import express from "express";
import pool from "./config/pool.js";
import dotenv from "dotenv";
import productRouter from "./routes/productRoutes.js";
import stockRouter from "./routes/stockRoutes.js";
import inventoryRouter from "./routes/inventoryRoutes.js";
import cors from "cors";
dotenv.config();



const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({ 
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://bazaar-cstd-frontedn-v1.vercel.app'
    ].filter(Boolean),
    credentials: true // Important for cookies/sessions
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

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
}
);


app.use("/api", productRouter);
app.use("/api", stockRouter);
app.use("/api", inventoryRouter);



export default app;