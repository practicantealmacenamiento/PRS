"use client";

import Link from "next/link";
import Logo from "./logo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { logout } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    setUser(typeof window !== "undefined" ? localStorage.getItem("username") : null);
  }, [pathname]);

  function onLogout() {
    logout();
    setUser(null);
    router.replace("/login");
  }

  const item = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
        pathname === href
          ? "bg-sky-blue text-white"
          : "hover:bg-cloud text-grey dark:text-cloud dark:hover:bg-coffee/30"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-40 border-b border-light-grey/40 bg-bone/70 dark:bg-coffee/40 backdrop-blur">
      <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo (claro/oscuro) */}
          <Link href="/" aria-label="Ir al inicio" className="flex items-center gap-2">
            <span className="sr-only">Suministros</span>
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-1 ml-2">
            {item("/prestamos", "Préstamos")}
            {item("/historico", "Histórico")}
            {item("/admin", "Admin")}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <span className="text-sm text-grey dark:text-cloud">
                Hola, <b>{user}</b>
              </span>
              <button onClick={onLogout} className="btn btn-outline">
                Salir
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
