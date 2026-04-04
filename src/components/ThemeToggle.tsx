import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

function getInitialTheme() {
  if (typeof window === "undefined") return true;

  try {
    const storedTheme = window.localStorage.getItem("theme");
    if (storedTheme) {
      return storedTheme !== "light";
    }
  } catch {
    // localStorage may throw in sandboxed/mobile contexts.
  }

  try {
    return !window.matchMedia("(prefers-color-scheme: light)").matches;
  } catch {
    return true;
  }
}

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(getInitialTheme);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.classList.toggle("light", !dark);
    }

    try {
      window.localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Ignore storage failures so the whole layout never crashes.
    }
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark((d) => !d)}
      className="h-9 w-9 rounded-xl"
      aria-label="Basculer le thème"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
