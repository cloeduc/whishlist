import { Geist_500Medium, Geist_700Bold, useFonts } from "@expo-google-fonts/geist";

/** Loads Geist 500 and 700; the app waits for the font before the first screen. */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ Geist_500Medium, Geist_700Bold });
  // Without the font (loading error), we still show the app with the system font.
  return loaded || error !== null;
}
