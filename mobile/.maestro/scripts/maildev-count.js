// Number of emails received by TO in MailDev (MAILDEV_URL): returns output.inboxCount.
const response = http.get(MAILDEV_URL + "/api/email");
output.inboxCount = json(response.body).filter((email) =>
  email.to.some((recipient) => recipient.address.toLowerCase() === TO.toLowerCase()),
).length;
