import type {
  NormalizedSocialAccount,
  NormalizedSocialPost,
  NormalizedSocialComment,
  NormalizedMetrics,
  SocialAccountCandidate,
} from "@/types/social";

export function normalizeAccount(
  candidate: SocialAccountCandidate,
  platform: string
): NormalizedSocialAccount {
  return {
    platform: platform as NormalizedSocialAccount["platform"],
    platform_account_id: candidate.platform_account_id,
    account_name: candidate.account_name,
    username: candidate.username,
    account_type: candidate.account_type,
    profile_url: candidate.profile_url,
    profile_image_url: candidate.profile_image_url,
  };
}

export function normalizePost(raw: Record<string, unknown>): NormalizedSocialPost {
  return {
    platform_post_id: String(raw.id || ""),
    post_type: (raw.type as string) || undefined,
    caption: (raw.message as string) || undefined,
    permalink: (raw.permalink_url as string) || (raw.link as string) || undefined,
    published_at: (raw.created_time as string) || undefined,
    media_url: (raw.full_picture as string) || undefined,
    raw_data: raw,
  };
}

export function normalizeComment(raw: Record<string, unknown>): NormalizedSocialComment {
  const from = raw.from as Record<string, unknown> | undefined;
  const parent = raw.parent as Record<string, unknown> | undefined;
  return {
    platform_comment_id: String(raw.id || ""),
    parent_platform_comment_id: parent?.id ? String(parent.id) : undefined,
    author_platform_id: from?.id ? String(from.id) : undefined,
    author_name: from?.name ? String(from.name) : undefined,
    text: (raw.message as string) || undefined,
    created_at: (raw.created_time as string) || undefined,
    raw_data: raw,
  };
}

export function normalizeMetrics(raw: Record<string, unknown>): NormalizedMetrics {
  return {
    followers_count: typeof raw.followers_count === "number" ? raw.followers_count : undefined,
    following_count: typeof raw.following_count === "number" ? raw.following_count : undefined,
    posts_count: typeof raw.media_count === "number" ? raw.media_count : undefined,
    raw_data: raw,
  };
}
