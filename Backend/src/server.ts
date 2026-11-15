import cors from "cors";
import "dotenv/config";
import express from "express";
import { probarConexion } from "./config/database.js";
import {
  manejarErrores, rutaNoEncontrada,
} from "./middlewares/error.middleware.js";
import { citaRouter } from "./routes/cita.routes.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
const origenLocal = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(cors({
  origin: (origin, callback) => {
    // Flutter móvil, Postman y Thunder Client pueden no enviar Origin.
    if (!origin || origin === frontendUrl || origenLocal.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origen no permitido por CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.get("/api/salud", (_req, res) => {
  res.json({ mensaje: "API de Veterinaria funcionando" });
});

app.use("/api/citas", citaRouter);
app.use(rutaNoEncontrada);
app.use(manejarErrores);

async function iniciarServidor(): Promise<void> {
  await probarConexion();
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
}

iniciarServidor().catch((error) => {
  console.error("No fue posible iniciar el servidor:", error);
  process.exit(1);
});
