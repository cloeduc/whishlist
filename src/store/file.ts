import lockfile from "proper-lockfile";

export async function withFileLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const release = await lockfile.lock(file, {
    retries: { retries: 30, minTimeout: 20, maxTimeout: 200 },
    realpath: false,
  });
  try {
    return await fn();
  } finally {
    await release();
  }
}
