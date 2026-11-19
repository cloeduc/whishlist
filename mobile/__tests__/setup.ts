// Native modules replaced for jest.
jest.mock("@react-native-community/netinfo", () => require("@react-native-community/netinfo/jest/netinfo-mock.js"));

jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __store: store,
  };
});

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: () => {
    throw new Error("Les tests utilisent __tests__/helpers/memory-db.ts");
  },
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiUrl: "https://api.example.test" } } },
}));

// App cache: fake files, by name (`__cache`).
jest.mock("expo-file-system", () => {
  const cache = new Map<string, string>();
  class File {
    name: string;
    uri: string;
    constructor(_dir: unknown, name: string) {
      this.name = name;
      this.uri = `file:///cache/${name}`;
    }
    create() {
      cache.set(this.name, "");
    }
    async write(content: string) {
      cache.set(this.name, content);
    }
    delete() {
      cache.delete(this.name);
    }
  }
  return { File, Paths: { cache: { list: () => [...cache.keys()].map((name) => new File(null, name)) } }, __cache: cache };
});

jest.mock("expo-sharing", () => require("./helpers/sharing").sharingMock);

// Store updates (021): nothing is available unless a test says otherwise; listeners are kept by event name.
jest.mock("expo-in-app-updates", () => {
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  return {
    AppUpdateType: { FLEXIBLE: 0, IMMEDIATE: 1 },
    checkForUpdate: jest.fn(async () => ({ updateAvailable: false })),
    startUpdate: jest.fn(async () => true),
    checkAndStartUpdate: jest.fn(async () => false),
    addUpdateListener: jest.fn((name: string, listener: (event: unknown) => void) => {
      const set = listeners.get(name) ?? new Set();
      set.add(listener);
      listeners.set(name, set);
      return () => set.delete(listener);
    }),
    /** Test helper: sends an event to the registered listeners. */
    __emit: (name: string, event: unknown) => listeners.get(name)?.forEach((listener) => listener(event)),
  };
});
