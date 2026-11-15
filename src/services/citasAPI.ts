
import type { Cita, EstadoCita, NuevaCita } from "../types";

const API_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/citas`;

async function leerRespuesta<T>(respuesta: Response): Promise<T> {
  const resultado = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(resultado.mensaje ?? "Ocurrió un error al comunicarse con la API.");
  }
  return resultado as T;
}

export async function obtenerCitas(): Promise<Cita[]> {
  const respuesta = await fetch(API_URL);
  return leerRespuesta<Cita[]>(respuesta);
}

export async function registrarCita(datos: NuevaCita): Promise<Cita> {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const resultado = await leerRespuesta<{ cita: Cita }>(respuesta);
  return resultado.cita;
}

export async function actualizarEstado(
  id: number,
  estado: EstadoCita,
): Promise<Cita> {
  const respuesta = await fetch(`${API_URL}/${id}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado }),
  });

  const resultado = await leerRespuesta<{ cita: Cita }>(respuesta);
  return resultado.cita;
}
