// Site address (URL) → same path on the app's scheme (output.appLink), to open it in the app:
// locally, the domain is not associated with the app, and an http link would open the browser (011).
const match = URL.match(/^https?:\/\/[^/]+\/(.*)$/);
if (!match) throw new Error("Adresse du site attendue : " + URL);
output.appLink = "ohyoushouldnt://" + match[1];
