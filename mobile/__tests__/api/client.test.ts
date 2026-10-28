import { api, ApiError, configureClient, NetworkError, ok } from "@/api/client";

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

// Le client appelle fetch avec un objet Request.
function sentRequest(): Request {
  const input = fetchMock.mock.calls[0][0];
  if (!(input instanceof Request)) throw new Error("fetch called without a Request");
  return input;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const onUnauthorized = jest.fn();
const onUpgradeRequired = jest.fn();
let token: string | null = null;

beforeEach(() => {
  fetchMock.mockReset();
  onUnauthorized.mockReset();
  onUpgradeRequired.mockReset();
  token = null;
  globalThis.fetch = fetchMock;
  configureClient({ getToken: () => token, getLocale: () => "en", onUnauthorized, onUpgradeRequired });
});

test("adds the bearer token, the app language and the JSON content type", async () => {
  token = "secret-token";
  fetchMock.mockResolvedValue(json(200, { lists: [] }));
  await ok(api.GET("/lists"));
  const request = sentRequest();
  expect(request.url).toBe("https://api.example.test/api/v1/lists");
  expect(request.headers.get("Authorization")).toBe("Bearer secret-token");
  expect(request.headers.get("Accept-Language")).toBe("en");
  expect(request.headers.get("Content-Type")).toBe("application/json");
});

test("sends no Authorization header without a session", async () => {
  fetchMock.mockResolvedValue(json(200, { apiVersion: "1.1.0", enrich: false, mail: false }));
  await ok(api.GET("/capabilities"));
  expect(sentRequest().headers.has("Authorization")).toBe(false);
});

test("turns an error body into an ApiError with code, status and message", async () => {
  fetchMock.mockResolvedValue(json(400, { error: { code: "priceInvalid", message: "Enter a valid price" } }));
  const error = await ok(
    api.POST("/lists/{listId}/items", {
      params: { path: { listId: "l1" } },
      body: { name: "Puzzle", typeId: "t", personId: "p", price: "abc" },
    }),
  ).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ code: "priceInvalid", status: 400, message: "Enter a valid price" });
});

test("turns a failed fetch into a NetworkError", async () => {
  fetchMock.mockRejectedValue(new TypeError("Network request failed"));
  await expect(ok(api.GET("/lists"))).rejects.toBeInstanceOf(NetworkError);
});

test("calls onUnauthorized on 401", async () => {
  fetchMock.mockResolvedValue(json(401, { error: { code: "unauthorized", message: "Sign in" } }));
  await expect(ok(api.GET("/me"))).rejects.toMatchObject({ code: "unauthorized", status: 401 });
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

test("calls onUpgradeRequired with the server message on 410", async () => {
  fetchMock.mockResolvedValue(json(410, { error: { code: "apiVersionUnsupported", message: "Update the app" } }));
  await expect(ok(api.GET("/lists"))).rejects.toMatchObject({ code: "apiVersionUnsupported" });
  expect(onUpgradeRequired).toHaveBeenCalledWith("Update the app");
});
