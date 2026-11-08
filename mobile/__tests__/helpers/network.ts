import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import { act } from "@testing-library/react-native";

import { watchNetwork } from "@/network";

/** Cuts or restores the network, as NetInfo would announce it (the NetInfo mock keeps the app's listener). */
export async function setOnline(online: boolean): Promise<void> {
  watchNetwork();
  const listener = jest.mocked(NetInfo.addEventListener).mock.calls[0][0];
  await act(async () =>
    listener({
      isConnected: online,
      isInternetReachable: online,
      type: online ? NetInfoStateType.wifi : NetInfoStateType.none,
      details: null,
      isWifiEnabled: online,
    } as Parameters<typeof listener>[0]),
  );
}
