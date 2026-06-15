"use client";

export default function QuestionnairePage() {
  return (
    <main
      className="bg-[#FAFAF8]"
      style={{ position: "fixed", inset: 0, margin: 0, padding: 0 }}
    >
      <iframe
        src="/questionnaire.html"
        title="Cuestionario BeTacora"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        onLoad={() => {
          console.log("[BeTacora] questionnaire iframe loaded");
        }}
        onError={() => {
          console.error("[BeTacora] questionnaire iframe failed to load");
        }}
      />
    </main>
  );
}
