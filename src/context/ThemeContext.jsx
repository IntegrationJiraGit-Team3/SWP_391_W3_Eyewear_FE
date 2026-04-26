import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "app-theme";

const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
  } catch {
    // Ignore storage read failures.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    body.classList.toggle("dark-theme", theme === "dark");

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage write failures.
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      try {
        const storedTheme = localStorage.getItem(STORAGE_KEY);
        if (storedTheme === "dark" || storedTheme === "light") {
          return;
        }
      } catch {
        // Ignore storage access issues.
      }

      setTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === "dark" ? "light" : "dark",
        ),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
