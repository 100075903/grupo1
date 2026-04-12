import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import apiRoutes from "./routes/api.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
const corsOptions =
  env.CORS_ORIGIN === "*"
    ? {}
    : {
        origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
        credentials: true,
      };
app.use(cors(corsOptions));
app.use(express.json({ limit: "128kb" }));
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>API</title></head>
<body>
  <p>Backend activo. La API está en <code>/api</code>.</p>
  <ul>
    <li><a href="/health">/health</a> — comprobar que responde</li>
  </ul>
</body></html>`);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", apiRoutes);

app.use(errorHandler);

export default app;
