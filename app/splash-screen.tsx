"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = () => setVisible(false);
    if (document.readyState === "complete") {
      requestAnimationFrame(hide);
    } else {
      window.addEventListener("load", hide, { once: true });
    }
    const timer = setTimeout(hide, 2500);
    return () => {
      window.removeEventListener("load", hide);
      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      id="app-splash"
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300"
      style={{ background: "#2D7B7B" }}
    >
      <img
        src="/icon-512.png?v=2"
        alt="BeTacora"
        width={160}
        height={160}
        className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 drop-shadow-lg"
      />
    </div>
  );
}
