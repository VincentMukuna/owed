"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HeaderSurface({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / 64));
      headerRef.current?.style.setProperty(
        "--header-background-opacity",
        `${progress * 100}%`,
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("pageshow", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("pageshow", update);
    };
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      {children}
    </header>
  );
}
