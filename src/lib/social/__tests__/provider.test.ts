import { classifyMetaError, MetaApiError } from "../providers/meta";

describe("classifyMetaError", () => {
  it("classifies token expiration error", () => {
    const error = new MetaApiError("OAuthException", 190, 401);

    const result = classifyMetaError(error);
    expect(result.reauthRequired).toBe(true);
    expect(result.retryable).toBe(false);
  });

  it("classifies rate limit error", () => {
    const error = new MetaApiError("Rate limit exceeded", 4, 429);

    const result = classifyMetaError(error);
    expect(result.retryable).toBe(true);
    expect(result.reauthRequired).toBe(false);
  });

  it("classifies permission error", () => {
    const error = new MetaApiError("Permission denied", 200, 403);

    const result = classifyMetaError(error);
    expect(result.reauthRequired).toBe(true);
    expect(result.retryable).toBe(false);
  });

  it("classifies server error as retryable", () => {
    const error = new MetaApiError("Server error", undefined, 500);

    const result = classifyMetaError(error);
    expect(result.retryable).toBe(true);
    expect(result.reauthRequired).toBe(false);
  });

  it("classifies generic error as retryable", () => {
    const error = new Error("Network timeout");

    const result = classifyMetaError(error);
    expect(result.retryable).toBe(true);
    expect(result.reauthRequired).toBe(false);
  });
});
