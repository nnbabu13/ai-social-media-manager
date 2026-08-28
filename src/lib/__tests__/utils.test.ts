import { cn, slugify } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });

  it("handles undefined and null", () => {
    const result = cn("base", undefined, null);
    expect(result).toBe("base");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });
});

describe("slugify utility", () => {
  it("converts text to slug", () => {
    expect(slugify("My Business")).toBe("my-business");
  });

  it("handles special characters", () => {
    expect(slugify("Business & Co!")).toBe("business-co");
  });

  it("handles multiple spaces", () => {
    expect(slugify("My   Business")).toBe("my-business");
  });

  it("handles leading/trailing spaces", () => {
    expect(slugify("  My Business  ")).toBe("my-business");
  });

  it("handles uppercase", () => {
    expect(slugify("BUSINESS")).toBe("business");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles underscores and hyphens", () => {
    expect(slugify("my_business-name")).toBe("my-business-name");
  });
});
