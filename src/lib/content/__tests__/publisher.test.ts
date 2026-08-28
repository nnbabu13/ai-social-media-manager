import { MetaPublisher } from "../publishers/meta-publisher";

describe("MetaPublisher", () => {
  let publisher: MetaPublisher;

  beforeEach(() => {
    publisher = new MetaPublisher();
  });

  describe("validatePublish", () => {
    it("validates caption is required", async () => {
      const result = await publisher.validatePublish(
        { accountId: "123", caption: "" },
        "encrypted_token"
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Caption is required");
    });

    it("validates caption length", async () => {
      const longCaption = "a".repeat(2201);
      const result = await publisher.validatePublish(
        { accountId: "123", caption: longCaption },
        "encrypted_token"
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("2200 characters"))).toBe(true);
    });

    it("passes valid input", async () => {
      const result = await publisher.validatePublish(
        { accountId: "123", caption: "Test post" },
        "encrypted_token"
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("warns when no media", async () => {
      const result = await publisher.validatePublish(
        { accountId: "123", caption: "Test post" },
        "encrypted_token"
      );
      expect(result.warnings.some((w) => w.includes("No media"))).toBe(true);
    });
  });
});
