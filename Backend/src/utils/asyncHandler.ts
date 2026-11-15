import type { RequestHandler } from "express";

// estrae automaticamente los paramegtros de un controlador de express
// req, res, nex 

type FuncionAsincrona = (
  ...argumentos: Parameters<RequestHandler>
) => Promise<void>;

export const asyncHandler = (
  funcion: FuncionAsincrona,
): RequestHandler => (req, res, next) => {
  void funcion(req, res, next).catch(next);
};