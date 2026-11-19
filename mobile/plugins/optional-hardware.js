// Marks hardware features as optional in the Android manifest, so Google Play does not hide the app
// from tablets, desktops or devices without Wi-Fi. `screen.portrait` comes from the portrait orientation,
// `wifi` from the network permissions of the libraries; neither is required to use the app.
const { withAndroidManifest } = require("expo/config-plugins");

const OPTIONAL_FEATURES = ["android.hardware.screen.portrait", "android.hardware.wifi"];

function withOptionalHardware(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const features = (manifest["uses-feature"] ??= []);
    for (const name of OPTIONAL_FEATURES) {
      const existing = features.find((feature) => feature.$["android:name"] === name);
      if (existing) existing.$["android:required"] = "false";
      else features.push({ $: { "android:name": name, "android:required": "false" } });
    }
    return mod;
  });
}

module.exports = withOptionalHardware;
