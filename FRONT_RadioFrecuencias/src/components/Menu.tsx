"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Menu() {
  const p = usePathname();
  const item = (href: string, label: string) => (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm ${p === href ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
    >
      {label}
    </Link>
  );
  return (
    <aside className="card p-4">
      <div className="text-slate-900 font-semibold mb-3">Menú</div>
      <nav className="space-y-1">
        {item("/", "Inicio")}
        {item("/prestamos", "Prestamos y Devoluciones")}
        {item("/historico", "Consultar Histórico")}
      </nav>
    </aside>
  );
}
