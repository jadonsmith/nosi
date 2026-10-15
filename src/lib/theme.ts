"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light" | "system";

export const THEME_KEY = "nosi-theme";

/** Runs before paint to avoid a flash of the wrong theme. Default: dark. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}')||'dark';var d=t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:t!=='light';document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;

function systemDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function getStored(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage blocked */
  }
  return "dark";
}

export function applyTheme(t: Theme): void {
  document.documentElement.classList.toggle(
    "dark",
    t === "system" ? systemDark() : t !== "light",
  );
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onMq = () => {
    if (getStored() === "system") applyTheme("system");
    cb();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) {
      applyTheme(getStored());
      cb();
    }
  };
  mq.addEventListener("change", onMq);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", onMq);
    window.removeEventListener("storage", onStorage);
  };
}

const SERVER_SNAPSHOT: Theme = "dark";

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getStored,
    () => SERVER_SNAPSHOT,
  );

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
    applyTheme(t);
    for (const l of listeners) l();
  }, []);

  const resolvedTheme: "dark" | "light" =
    theme === "system" ? (systemDark() ? "dark" : "light") : theme;

  return { theme, resolvedTheme, setTheme };
}
