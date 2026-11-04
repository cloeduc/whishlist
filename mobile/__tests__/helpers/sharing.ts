import type { SharePayload } from "expo-sharing";

/**
 * Fake expo-sharing: `shareAsync` (data export) and a received share that the tests set.
 * Like the native module, it notifies nothing: the app reads the share again (`getSharedPayloads`) when it wants.
 * `getResolvedSharedPayloadsAsync` (and `useIncomingShare`, which calls it) opens the shared address from
 * the device: the app must not use it, the tests check that it is never called.
 */
let payloads: SharePayload[] = [];

/** Simulates content shared to the app (or `[]`: nothing shared). */
export function setSharedPayloads(next: SharePayload[]): void {
  payloads = next;
}

export const sharingMock = {
  shareAsync: jest.fn(async () => undefined),
  getSharedPayloads: jest.fn(() => payloads),
  getResolvedSharedPayloadsAsync: jest.fn(async () => []),
  clearSharedPayloads: jest.fn(() => {
    payloads = [];
  }),
  useIncomingShare: jest.fn(() => {
    throw new Error("useIncomingShare fetches the shared URL from the device: use useSharedPayloads");
  }),
};
