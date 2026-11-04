// Called once at server startup, before the first request (Next 16, `register`).
// Opens the database: migrations, then import of the old JSON file if not done yet.
// An unreadable or inconsistent old file stops the server instead of serving empty pages.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { openStoreOrExit } = await import("./src/store/startup");
    openStoreOrExit();
  }
}
