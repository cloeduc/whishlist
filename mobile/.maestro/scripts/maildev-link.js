// Last link sent to TO, read in MailDev (MAILDEV_URL, passed by the e2e command).
// KIND picks the link's page: confirm-email (default), reset-password or invite.
// Returns output.link (and output.confirmUrl, name kept for the 010 flows);
// fails if no email has arrived yet (the caller retries).
const kind = typeof KIND === "undefined" || !KIND ? "confirm-email" : KIND;
const pattern = new RegExp("https?:\\/\\/\\S+\\/" + kind + "\\/[\\w-]+(\\?\\S*)?");
const response = http.get(MAILDEV_URL + "/api/email");
const emails = json(response.body).filter((email) =>
  email.to.some((recipient) => recipient.address.toLowerCase() === TO.toLowerCase()),
);
const links = emails.map((email) => (email.text.match(pattern) || [])[0]).filter((link) => link);
if (links.length === 0) throw new Error("Aucun lien " + kind + " pour " + TO + " dans MailDev");
output.link = links[links.length - 1];
output.confirmUrl = output.link;
output.confirmLinks = links.length;
