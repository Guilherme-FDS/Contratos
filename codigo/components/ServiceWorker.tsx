"use client";

import { useEffect } from "react";

/** Registra o service worker (PWA). Só em produção. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const registrar = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar);
    return () => window.removeEventListener("load", registrar);
  }, []);
  return null;
}
