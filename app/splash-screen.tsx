"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const hide = () => {
      setFading(true);
      setTimeout(() => setVisible(false), 320);
    };
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
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "#FAF8F4",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      <img
        src="/icon-512.png?v=4"
        alt="BeTacora"
        width={160}
        height={160}
        className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-[8px] object-contain"
      />
    </div>
  );
}
