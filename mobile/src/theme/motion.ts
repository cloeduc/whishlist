import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * The phone's « réduire les animations » setting, followed live. `null` while the system
 * has not answered: an animation that starts on its own waits for the answer before running.
 */
export function useReduceMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
