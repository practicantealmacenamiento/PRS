import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "RadioFrecuencias",
  description: "Préstamos y Devoluciones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bone text-grey">
        <Navbar />
        {children}
      </body>
    </html>
  );
}


