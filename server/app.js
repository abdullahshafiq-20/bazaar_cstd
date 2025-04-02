import express from "express";
import pool from "./config/pool.js";
import dotenv from "dotenv";
import productRouter from "./routes/productRoutes.js";
import stockRouter from "./routes/stockRoutes.js";
import cors from "cors";
dotenv.config();



const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", productRouter);
app.use("/api", stockRouter);



export default app;