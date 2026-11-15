
import type { ErrorRequestHandler, RequestHandler } from "express";

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const rutaNoEncontrada: RequestHandler = (req, res) => {
  res.status(404).json({
    mensaje: `No existe la ruta ${req.method} ${req.path}`,
  });
};

export const manejarErrores: ErrorRequestHandler = (
  error, _req, res, _next,
) => {
  const jsonInvalido = error instanceof SyntaxError && "type" in error && error.type === "entity.parse.failed";
  const status = error instanceof AppError ? error.status : jsonInvalido ? 400 : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    mensaje: error instanceof AppError
      ? error.message
      : jsonInvalido ? "El cuerpo de la solicitud contiene JSON inválido."
      : status === 404
        ? "No se encontró el recurso solicitado."
        : "Error interno del servidor.",
  });
};
