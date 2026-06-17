export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ background: "#2D7B7B" }}
    >
      <img
        src="/icon-512.png?v=2"
        alt="BeTacora"
        width={128}
        height={128}
        className="w-24 h-24 sm:w-32 sm:h-32 animate-pulse"
      />
    </div>
  );
}
