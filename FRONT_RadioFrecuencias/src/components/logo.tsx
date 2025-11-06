import Image from "next/image";

export default function Logo() {
  return (
    <>
      {/* Tema claro */}
      <Image
        src="/image/Prebel_AzulClaro_SF.webp"
        alt="Prebel"
        width={112}
        height={28}
        priority
        className="block dark:hidden h-6 w-auto"
      />
      {/* Tema oscuro */}
      <Image
        src="/image/Prebel_Blanco.webp"
        alt="Prebel"
        width={112}
        height={28}
        priority
        className="hidden dark:block h-6 w-auto"
      />
    </>
  );
}
