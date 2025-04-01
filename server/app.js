import express from "express";
import pool from "./config/pool.js";
import dotenv from "dotenv";
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



export default app;