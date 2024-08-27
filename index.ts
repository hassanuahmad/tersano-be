import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const TOKEN_SECRET = process.env.TOKEN_SECRET as string;

type User = {
    id: number;
    name: string;
    email: string;
    password: string;
};

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token)
        return res.status(401).json({ error: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, TOKEN_SECRET);
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: "Invalid token." });
    }
};

app.post("/register", (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: "Error hashing password" });
        }

        db.run(
            `INSERT INTO users (name, email, password) VALUES (?,?,?)`,
            [name, email, hash],
            function(this: { lastID: number }, err: Error | null) {
                if (err)
                    return res.status(500).json({ error: "Error registering user" });

                const token = jwt.sign({ id: this.lastID, email }, TOKEN_SECRET, {
                    expiresIn: "1h",
                });

                res.status(201).json({ token, name });
            },
        );
    });
});

app.post("/login", (req: Request, res: Response) => {
    const { email, password } = req.body;

    db.get<User>(
        "SELECT * FROM users WHERE email = ?",
        [email],
        function(err: Error | null, user: User | undefined) {
            if (err) return res.status(500).json({ error: "Error finding user" });
            if (!user) return res.status(404).json({ error: "User not found" });

            bcrypt.compare(password, user.password, (err, result) => {
                if (err)
                    return res.status(500).json({ error: "Error comparing passwords" });
                if (!result)
                    return res.status(401).json({ error: "Invalid credentials" });

                const token = jwt.sign({ id: user.id, email }, TOKEN_SECRET, {
                    expiresIn: "1h",
                });

                res.status(201).json({ token, name: user.name });
            });
        },
    );
});

app.get("/dashboard", (req: Request, res: Response) => {
    db.all("SELECT * FROM products", (err: Error | null, result) => {
        if (err) console.log(err);
        else res.send(result);
    });
});

app.post("/dashboard", authenticateToken, (req: Request, res: Response) => {
    const { name, price, description } = req.body;

    db.run(
        `INSERT INTO products (name, price, description) VALUES (?,?,?)`,
        [name, price, description],
        function(err: Error | null) {
            if (err) {
                console.log(err.message);
                return res.status(500).json({ error: "Error saving product" });
            } else {
                res.status(200).json({
                    id: Math.random() * (100000 - 50000) + 50000,
                    name,
                    price,
                    description,
                });
            }
        },
    );
});

app.delete("/product/:id", authenticateToken, (req: Request, res: Response) => {
    const id = req.params.id;

    db.run("DELETE FROM products WHERE id=?", id, (err) => {
        if (err) {
            console.log(err);
        }
        res.status(204).send();
    });
});

app
    .listen(PORT, () => {
        console.log("Server running at PORT: ", PORT);
    })
    .on("error", (error) => {
        throw new Error(error.message);
    });
