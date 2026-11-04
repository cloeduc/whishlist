/** Phone operating system (feature 011, US3): the app icon is shown only on a phone. */
export type PhonePlatform = "ios" | "android";

/**
 * Platform from the browser: iPhone or iPod → iOS; Android with « Mobile » (or `userAgentData.mobile`)
 * → Android. An iPad (which presents itself as a Mac since iPadOS 13), an Android tablet and a computer → `null`.
 */
export function phonePlatform(userAgent: string, uaDataMobile?: boolean): PhonePlatform | null {
  if (/\b(iPhone|iPod)\b/.test(userAgent)) return "ios";
  if (/\bAndroid\b/.test(userAgent) && (/\bMobile\b/.test(userAgent) || uaDataMobile === true)) return "android";
  return null;
}
