import { encryptToken, decryptToken } from "../token-encryption";

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = "a".repeat(64);
});

afterAll(() => {
  process.env = originalEnv;
});

describe("token encryption", () => {
  it("encrypts and decrypts a token", () => {
    const token = "EAAGm0PX4ZCpsBADZCT6s0ZCjCZA";
    const encrypted = encryptToken(token);

    expect(encrypted).not.toBe(token);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(token);
  });

  it("produces different ciphertext for same input (random IV)", () => {
    const token = "test_token_123";
    const enc1 = encryptToken(token);
    const enc2 = encryptToken(token);

    expect(enc1).not.toBe(enc2);
  });

  it("throws when key is not set", () => {
    delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;

    expect(() => encryptToken("test")).toThrow("SOCIAL_TOKEN_ENCRYPTION_KEY is not set");
  });

  it("throws on invalid ciphertext format", () => {
    expect(() => decryptToken("invalid")).toThrow("Invalid ciphertext format");
  });
});
