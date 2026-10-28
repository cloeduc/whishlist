import { Geist_500Medium, Geist_700Bold, useFonts } from "@expo-google-fonts/geist";

/** Charge Geist 500 et 700 ; l'app attend la police avant le premier écran. */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ Geist_500Medium, Geist_700Bold });
  // Sans police (erreur de chargement), on affiche quand même l'app avec la police du système.
  return loaded || error !== null;
}
