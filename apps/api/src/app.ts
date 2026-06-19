import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error.js";
import { router } from "./routes/index.js";

export const app = express();
const dirname = path.dirname(fileURLToPath(import.meta.url));
const webDistPath = path.resolve(dirname, "../../web/dist");

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", router);
if (existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(webDistPath, "index.html"));
  });
}
app.use(errorHandler);
