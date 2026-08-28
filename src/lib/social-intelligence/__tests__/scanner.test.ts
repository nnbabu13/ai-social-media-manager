describe("social scanner detection logic", () => {
  describe("posting gap detection", () => {
    function detectPostingGap(posts: Array<{ published_at: string | null }>): number | null {
      if (posts.length === 0) return null;
      const sorted = [...posts].sort(
        (a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
      );
      const lastPost = sorted[0];
      if (!lastPost.published_at) return null;
      const daysSince = (Date.now() - new Date(lastPost.published_at).getTime()) / 86400000;
      return daysSince > 7 ? daysSince : null;
    }

    it("returns null for empty posts", () => {
      expect(detectPostingGap([])).toBeNull();
    });

    it("returns null when last post was recent", () => {
      const recent = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(detectPostingGap([{ published_at: recent }])).toBeNull();
    });

    it("detects gap when last post was >7 days ago", () => {
      const old = new Date(Date.now() - 10 * 86400000).toISOString();
      const result = detectPostingGap([{ published_at: old }]);
      expect(result).not.toBeNull();
      expect(result!).toBeGreaterThan(7);
    });
  });

  describe("spam detection", () => {
    function detectSpam(comments: Array<{ text: string | null }>): number {
      const spamPatterns = [
        /follow me/i,
        /check (my|out my) (profile|page|link)/i,
        /dm for/i,
        /click here/i,
        /free money/i,
        /earn \$\d+/i,
        /www\..+\.com/i,
      ];
      return comments.filter((c) => c.text && spamPatterns.some((p) => p.test(c.text))).length;
    }

    it("detects spam comments", () => {
      const comments = [
        { text: "Follow me for more!" },
        { text: "Check my profile for deals" },
        { text: "Great post!" },
        { text: "DM for wholesale" },
        { text: "Visit www.spam.com" },
      ];
      expect(detectSpam(comments)).toBe(4);
    });

    it("returns 0 for non-spam comments", () => {
      const comments = [
        { text: "Love this product!" },
        { text: "How much does it cost?" },
        { text: "Great quality" },
      ];
      expect(detectSpam(comments)).toBe(0);
    });
  });

  describe("lead signal detection", () => {
    function detectLeadSignals(comments: Array<{ text: string | null }>): Array<{ intent: string; reason: string }> {
      const leads: Array<{ intent: string; reason: string }> = [];
      const highIntentPatterns = [
        { pattern: /how much.*\d+/i, reason: "Asking for pricing with specific quantity" },
        { pattern: /can you deliver/i, reason: "Asking about delivery availability" },
        { pattern: /how do (i|we) order/i, reason: "Asking how to place an order" },
        { pattern: /can someone call/i, reason: "Requesting a call back" },
      ];
      const mediumIntentPatterns = [
        { pattern: /price|cost|how much/i, reason: "Asking about pricing" },
        { pattern: /available|in stock/i, reason: "Asking about availability" },
      ];

      for (const comment of comments) {
        if (!comment.text) continue;
        for (const { pattern, reason } of highIntentPatterns) {
          if (pattern.test(comment.text)) {
            leads.push({ intent: "high", reason });
            break;
          }
        }
        for (const { pattern, reason } of mediumIntentPatterns) {
          if (pattern.test(comment.text)) {
            const existing = leads.find((l) => l.reason === reason);
            if (!existing) {
              leads.push({ intent: "medium", reason });
            }
            break;
          }
        }
      }
      return leads;
    }

    it("detects high intent leads", () => {
      const comments = [
        { text: "How much for 100 units?" },
        { text: "Can you deliver to Hyderabad?" },
        { text: "How do I order?" },
      ];
      const leads = detectLeadSignals(comments);
      expect(leads.length).toBeGreaterThanOrEqual(1);
      expect(leads.some((l) => l.intent === "high")).toBe(true);
    });

    it("detects medium intent leads", () => {
      const comments = [
        { text: "What's the price?" },
        { text: "Is this available?" },
      ];
      const leads = detectLeadSignals(comments);
      expect(leads).toHaveLength(2);
      expect(leads.every((l) => l.intent === "medium")).toBe(true);
    });

    it("ignores non-lead comments", () => {
      const comments = [
        { text: "Nice post!" },
        { text: "Love this" },
      ];
      expect(detectLeadSignals(comments)).toHaveLength(0);
    });
  });

  describe("complaint detection", () => {
    function detectComplaints(comments: Array<{ text: string | null }>): number {
      const complaintPatterns = [
        /terrible|worst|awful|hate/i,
        /nobody.*replied|no response|ignored/i,
        /late|delayed|never arrived/i,
        /refund|money back/i,
        /disappoint|unsatisfied|unhappy/i,
        /complaint|problem|issue/i,
      ];
      return comments.filter((c) => c.text && complaintPatterns.some((p) => p.test(c.text))).length;
    }

    it("detects complaints", () => {
      const comments = [
        { text: "Terrible service!" },
        { text: "Nobody replied to my message" },
        { text: "My delivery was late" },
        { text: "I want a refund" },
      ];
      expect(detectComplaints(comments)).toBe(4);
    });

    it("ignores non-complaint comments", () => {
      const comments = [
        { text: "Great product!" },
        { text: "Love the quality" },
      ];
      expect(detectComplaints(comments)).toBe(0);
    });
  });

  describe("repeated question detection", () => {
    function findRepeatedQuestions(comments: Array<{ text: string | null }>): Array<{ pattern: string; count: number }> {
      const questionPatterns = [
        { pattern: "delivery", regex: /deliver/i },
        { pattern: "price", regex: /price|cost|how much/i },
        { pattern: "order", regex: /order/i },
        { pattern: "minimum", regex: /minimum/i },
      ];
      const buckets: Record<string, number> = {};
      for (const comment of comments) {
        if (!comment.text) continue;
        for (const { pattern, regex } of questionPatterns) {
          if (regex.test(comment.text)) {
            buckets[pattern] = (buckets[pattern] || 0) + 1;
          }
        }
      }
      return Object.entries(buckets)
        .filter(([, count]) => count >= 3)
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count);
    }

    it("detects repeated questions", () => {
      const comments = [
        { text: "Do you deliver to Vizag?" },
        { text: "What are your delivery timings?" },
        { text: "Is delivery available on weekends?" },
        { text: "How much does it cost?" },
        { text: "What's the price for bulk?" },
      ];
      const trends = findRepeatedQuestions(comments);
      expect(trends.length).toBeGreaterThanOrEqual(1);
      expect(trends[0].pattern).toBe("delivery");
      expect(trends[0].count).toBe(3);
    });
  });

  describe("content mix analysis", () => {
    it("identifies promotional ratio", () => {
      const classifications = [
        { promotional: true },
        { promotional: true },
        { promotional: true },
        { promotional: false },
        { promotional: false },
      ];
      const promoCount = classifications.filter((c) => c.promotional).length;
      const ratio = promoCount / classifications.length;
      expect(ratio).toBe(0.6);
    });

    it("handles empty classifications", () => {
      const classifications: Array<{ promotional: boolean }> = [];
      expect(classifications.length).toBe(0);
    });
  });
});
