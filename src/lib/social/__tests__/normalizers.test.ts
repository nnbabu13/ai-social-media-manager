import { normalizeAccount, normalizePost, normalizeComment, normalizeMetrics } from "../normalizers";
import type { SocialAccountCandidate } from "@/types/social";

describe("social normalizers", () => {
  describe("normalizeAccount", () => {
    it("normalizes a Facebook Page candidate", () => {
      const candidate: SocialAccountCandidate = {
        platform_account_id: "123456",
        account_name: "My Business Page",
        account_type: "facebook_page",
        profile_image_url: "https://example.com/image.jpg",
      };

      const result = normalizeAccount(candidate, "facebook");

      expect(result).toEqual({
        platform: "facebook",
        platform_account_id: "123456",
        account_name: "My Business Page",
        username: undefined,
        account_type: "facebook_page",
        profile_url: undefined,
        profile_image_url: "https://example.com/image.jpg",
      });
    });

    it("normalizes an Instagram Professional candidate", () => {
      const candidate: SocialAccountCandidate = {
        platform_account_id: "789012",
        account_name: "My Business",
        username: "mybusiness",
        account_type: "instagram_professional",
      };

      const result = normalizeAccount(candidate, "instagram");

      expect(result.platform).toBe("instagram");
      expect(result.username).toBe("mybusiness");
      expect(result.account_type).toBe("instagram_professional");
    });
  });

  describe("normalizePost", () => {
    it("normalizes a Meta post", () => {
      const raw = {
        id: "123_456",
        type: "photo",
        message: "Check out our new product!",
        created_time: "2024-01-15T10:30:00+0000",
        full_picture: "https://example.com/photo.jpg",
        permalink_url: "https://facebook.com/post/123_456",
      };

      const result = normalizePost(raw);

      expect(result.platform_post_id).toBe("123_456");
      expect(result.post_type).toBe("photo");
      expect(result.caption).toBe("Check out our new product!");
      expect(result.published_at).toBe("2024-01-15T10:30:00+0000");
      expect(result.media_url).toBe("https://example.com/photo.jpg");
      expect(result.permalink).toBe("https://facebook.com/post/123_456");
      expect(result.raw_data).toEqual(raw);
    });

    it("handles missing optional fields", () => {
      const raw = { id: "789" };

      const result = normalizePost(raw);

      expect(result.platform_post_id).toBe("789");
      expect(result.post_type).toBeUndefined();
      expect(result.caption).toBeUndefined();
      expect(result.media_url).toBeUndefined();
    });
  });

  describe("normalizeComment", () => {
    it("normalizes a Meta comment", () => {
      const raw = {
        id: "comment_123",
        from: { id: "user_456", name: "Jane Doe" },
        message: "Great post!",
        created_time: "2024-01-15T12:00:00+0000",
        parent: { id: "parent_comment_789" },
      };

      const result = normalizeComment(raw);

      expect(result.platform_comment_id).toBe("comment_123");
      expect(result.author_platform_id).toBe("user_456");
      expect(result.author_name).toBe("Jane Doe");
      expect(result.text).toBe("Great post!");
      expect(result.parent_platform_comment_id).toBe("parent_comment_789");
    });

    it("handles comments without parent", () => {
      const raw = {
        id: "comment_456",
        from: { id: "user_789", name: "John Smith" },
        message: "Thanks!",
      };

      const result = normalizeComment(raw);

      expect(result.parent_platform_comment_id).toBeUndefined();
      expect(result.author_name).toBe("John Smith");
    });
  });

  describe("normalizeMetrics", () => {
    it("normalizes Meta metrics", () => {
      const raw = {
        followers_count: 1234,
        following_count: 567,
        media_count: 89,
      };

      const result = normalizeMetrics(raw);

      expect(result.followers_count).toBe(1234);
      expect(result.following_count).toBe(567);
      expect(result.posts_count).toBe(89);
    });

    it("handles missing metrics", () => {
      const raw = {};

      const result = normalizeMetrics(raw);

      expect(result.followers_count).toBeUndefined();
      expect(result.following_count).toBeUndefined();
      expect(result.posts_count).toBeUndefined();
    });

    it("handles partial metrics", () => {
      const raw = { followers_count: 100 };

      const result = normalizeMetrics(raw);

      expect(result.followers_count).toBe(100);
      expect(result.following_count).toBeUndefined();
      expect(result.posts_count).toBeUndefined();
    });
  });
});
