export function calcularTurno(date: Date): string {
  const h = date.getHours();
  if (h >= 6 && h < 14) return "Turno 1 (6 am - 2 pm)";
  if (h >= 14 && h < 22) return "Turno 2 (2 pm - 10 pm)";
  return "Turno 3 (10 pm - 6 am)";
}
export function formatoFecha(d: Date) {
  return new Intl.DateTimeFormat("es-CO").format(d);
}
export function formatoHora(d: Date) {
  return new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" }).format(d);
}
