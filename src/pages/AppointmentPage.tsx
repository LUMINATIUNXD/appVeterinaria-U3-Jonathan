import { useEffect, useState, type FormEvent } from "react";
import { AppointmentCard } from "../components/AppointmentCard";
import { StatCard } from "../components/StatCard";
import { actualizarEstado, obtenerCitas, registrarCita } from "../services/citasAPI";
import type { Cita, EstadoCita, NuevaCita } from "../types";

type Filtro = "todas" | EstadoCita;
const formularioVacio: NuevaCita = { mascota: "", cliente: "", servicio: "", fecha: "", hora: "" };
const fechaLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

export function AppointmentsPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [datos, setDatos] = useState<NuevaCita>(formularioVacio);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerCitas()
      .then((resultado) => { if (activo) setCitas(resultado); })
      .catch((e: unknown) => {
        if (activo) setError(e instanceof Error ? e.message : "No fue posible cargar las citas.");
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  async function guardarCita(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const nueva = await registrarCita({
        mascota: datos.mascota.trim(), cliente: datos.cliente.trim(),
        servicio: datos.servicio.trim(), fecha: datos.fecha, hora: datos.hora,
      });
      setCitas((actuales) => [...actuales, nueva].sort((a, b) =>
        `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)));
      setDatos(formularioVacio);
      setMostrarFormulario(false);
      setMensaje("La cita se registró y quedó guardada correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible registrar la cita.");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarCita(id: number) {
    try {
      setError(""); setMensaje("");
      const actualizada = await actualizarEstado(id, "confirmada");
      setCitas((actuales) => actuales.map((cita) => cita.id === id ? actualizada : cita));
      setMensaje("La cita se confirmó correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al confirmar la cita.");
    }
  }

  const citasFiltradas = filtro === "todas" ? citas : citas.filter((cita) => cita.estado === filtro);
  const pendientes = citas.filter((cita) => cita.estado === "solicitada").length;
  const confirmadas = citas.filter((cita) => cita.estado === "confirmada").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">Agenda de citas</h2>
          <p className="mt-1 text-slate-600">Consulta y administra las citas veterinarias.</p>
        </div>
        <button type="button" onClick={() => { setMostrarFormulario(true); setError(""); }}
          className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">
          + Nueva cita
        </button>
      </section>

      {mensaje && <p role="status" className="mt-6 rounded-xl bg-green-100 px-4 py-3 text-green-800">{mensaje}</p>}
      {error && <p role="alert" className="mt-6 rounded-xl bg-red-100 px-4 py-3 text-red-800">{error}</p>}

      {mostrarFormulario && (
        <section aria-labelledby="formulario-titulo" className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 id="formulario-titulo" className="text-xl font-bold text-slate-900">Registrar nueva cita</h3>
            <button type="button" onClick={() => { setMostrarFormulario(false); setDatos(formularioVacio); }}
              className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Cancelar</button>
          </div>
          <form onSubmit={guardarCita} className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-slate-700">Nombre de la mascota
              <input required maxLength={80} value={datos.mascota} onChange={(e) => setDatos({ ...datos, mascota: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Nombre del cliente
              <input required maxLength={120} value={datos.cliente} onChange={(e) => setDatos({ ...datos, cliente: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Servicio
              <input required maxLength={120} placeholder="Ej. Vacunación" value={datos.servicio} onChange={(e) => setDatos({ ...datos, servicio: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Fecha
              <input required type="date" min={fechaLocal} value={datos.fecha} onChange={(e) => setDatos({ ...datos, fecha: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Hora
              <input required type="time" value={datos.hora} onChange={(e) => setDatos({ ...datos, hora: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <div className="flex items-end">
              <button disabled={guardando} type="submit" className="w-full rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">
                {guardando ? "Guardando…" : "Guardar cita"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard titulo="Citas registradas" valor={citas.length} color="text-teal-700" />
        <StatCard titulo="Pendientes" valor={pendientes} color="text-amber-600" />
        <StatCard titulo="Confirmadas" valor={confirmadas} color="text-green-600" />
      </section>

      <section className="mt-8">
        <label htmlFor="filtro" className="mb-2 block font-semibold text-slate-700">Filtrar por estado</label>
        <select id="filtro" value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 sm:w-64">
          <option value="todas">Todas</option><option value="solicitada">Solicitadas</option>
          <option value="confirmada">Confirmadas</option><option value="atendida">Atendidas</option>
          <option value="rechazada">Rechazadas</option><option value="cancelada">Canceladas</option>
        </select>
      </section>

      {cargando ? <p className="mt-6 text-center text-slate-500">Cargando citas...</p> : (
        <section className="mt-6 grid gap-4">
          {citasFiltradas.length ? citasFiltradas.map((cita) => <AppointmentCard key={cita.id} cita={cita} onConfirmar={confirmarCita} />) :
            !error && <p className="rounded-2xl bg-white p-8 text-center text-slate-500">No se encontraron citas con ese estado.</p>}
        </section>
      )}
    </main>
  );
}
