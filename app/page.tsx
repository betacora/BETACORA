import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <header className="w-full px-6 py-6 md:px-12 md:py-8">
        <span className="text-2xl md:text-3xl font-bold text-[#0E6B7A]">
          Be<span className="uppercase">T</span>acora
        </span>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 pb-16 md:px-12 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0E6B7A] max-w-4xl leading-tight">
          El lugar donde vive toda tu vida como viajero
        </h1>

        <p className="mt-4 md:mt-6 text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl">
          Tu bitácora inteligente · Your Smart Logbook
        </p>

        <Link
          href="/questionnaire"
          className="mt-8 md:mt-10 px-8 py-3 md:px-10 md:py-4 rounded-full bg-[#FF6F61] text-white font-semibold text-base md:text-lg hover:opacity-90 transition-opacity shadow-md"
        >
          Descubre tu perfil viajero
        </Link>
      </section>
    </main>
  );
}
