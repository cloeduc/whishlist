"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  resolveTheme,
  themeToCssVars,
  type WishlistTheme,
} from "@/src/domain/theme";

type ThemeScopeValue = {
  theme: WishlistTheme;
  setTheme: (theme: WishlistTheme) => void;
};

const WishlistThemeContext = createContext<ThemeScopeValue | null>(null);

export function useWishlistTheme(): ThemeScopeValue {
  const ctx = useContext(WishlistThemeContext);
  if (!ctx) {
    throw new Error("useWishlistTheme must be used within WishlistThemeScope");
  }
  return ctx;
}

/** Applique le thème wishlist (CSS vars) et permet un preview live. */
export function WishlistThemeScope({
  theme: initialTheme,
  children,
}: {
  theme: WishlistTheme;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState(() => resolveTheme(initialTheme));
  const [sourceTheme, setSourceTheme] = useState(initialTheme);
  if (initialTheme !== sourceTheme) {
    setSourceTheme(initialTheme);
    setThemeState(resolveTheme(initialTheme));
  }

  const setTheme = useCallback((next: WishlistTheme) => {
    setThemeState(resolveTheme(next));
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  const style = themeToCssVars(theme) as CSSProperties;

  return (
    <WishlistThemeContext.Provider value={value}>
      <div className="w-full" style={style}>
        {children}
      </div>
    </WishlistThemeContext.Provider>
  );
}
