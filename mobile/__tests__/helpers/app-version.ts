import Constants from "expo-constants";

/** The installed app version, as the build gives it (`Constants.expoConfig.version`); restored by `jest.restoreAllMocks`. */
export function installVersion(version: string): void {
  jest.replaceProperty(Constants, "expoConfig", { name: "app", slug: "app", version, extra: { apiUrl: "https://api.example.test" } });
}
