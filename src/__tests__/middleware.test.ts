/**
 * @jest-environment node
 */
import "@testing-library/jest-dom";

const mockGetUser = jest.fn();

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

const { NextRequest, NextResponse } = require("next/server");
const { middleware } = require("@/middleware");

function createRequest(path: string) {
  return new NextRequest(new Request(`http://localhost:3000${path}`));
}

describe("Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createRequest("/dashboard");
    const response = await middleware(request);
    const url = new URL(response.headers.get("location") || "");
    expect(url.pathname).toBe("/login");
  });

  it("redirects authenticated users away from auth pages", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const request = createRequest("/login");
    const response = await middleware(request);
    const url = new URL(response.headers.get("location") || "");
    expect(url.pathname).toBe("/dashboard");
  });

  it("allows authenticated users to access dashboard", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const request = createRequest("/dashboard");
    const response = await middleware(request);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows unauthenticated users to access public pages", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createRequest("/signup");
    const response = await middleware(request);
    expect(response.headers.get("location")).toBeNull();
  });
});
