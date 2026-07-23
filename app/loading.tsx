export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#FAF8F4]"
    >
      <img
        src="/icon-512.png?v=4"
        alt="BeTacora — bitácora inteligente de viajes"
        width={128}
        height={128}
        className="w-24 h-24 sm:w-32 sm:h-32 rounded-[8px] object-contain animate-pulse"
      />
    </div>
  );
}
