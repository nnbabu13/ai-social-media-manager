export type SocialPlatform = "facebook" | "instagram";
export type SocialAccountType = "facebook_page" | "instagram_professional";
export type SocialAccountStatus = "not_connected" | "connecting" | "active" | "syncing" | "error" | "expired" | "disconnected";
export type ConnectionStatus = "not_connected" | "connecting" | "connected" | "expired" | "disconnected" | "error";
export type SyncType = "initial" | "manual" | "incremental" | "scheduled";
export type SyncStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface SocialAccountCandidate {
  platform_account_id: string;
  account_name: string;
  username?: string;
  account_type: SocialAccountType;
  profile_url?: string;
  profile_image_url?: string;
}

export interface NormalizedSocialAccount {
  platform: SocialPlatform;
  platform_account_id: string;
  account_name: string;
  username?: string;
  account_type: SocialAccountType;
  profile_url?: string;
  profile_image_url?: string;
}

export interface SyncOptions {
  since?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  paging?: {
    next?: string;
    previous?: string;
  };
}

export interface NormalizedSocialPost {
  platform_post_id: string;
  post_type?: string;
  caption?: string;
  permalink?: string;
  published_at?: string;
  media_url?: string;
  thumbnail_url?: string;
  raw_data?: Record<string, unknown>;
}

export interface NormalizedSocialComment {
  platform_comment_id: string;
  parent_platform_comment_id?: string;
  author_platform_id?: string;
  author_name?: string;
  text?: string;
  created_at?: string;
  raw_data?: Record<string, unknown>;
}

export interface NormalizedMetrics {
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  raw_data?: Record<string, unknown>;
}

export interface SocialProvider {
  readonly platform: SocialPlatform;

  getAuthorizationUrl(params: {
    state: string;
    scopes: string[];
    redirectUri: string;
    clientId: string;
  }): Promise<string>;

  exchangeCode(params: {
    code: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
  }): Promise<OAuthToken>;

  refreshAccessToken(params: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  }): Promise<OAuthToken>;

  getAvailableAccounts(token: OAuthToken): Promise<SocialAccountCandidate[]>;

  getAccountProfile(params: {
    accountId: string;
    token: OAuthToken;
  }): Promise<NormalizedSocialAccount>;

  fetchPosts(params: {
    accountId: string;
    token: OAuthToken;
    options?: SyncOptions;
  }): Promise<PaginatedResult<NormalizedSocialPost>>;

  fetchComments(params: {
    postId: string;
    token: OAuthToken;
    options?: SyncOptions;
  }): Promise<PaginatedResult<NormalizedSocialComment>>;

  fetchMetrics(params: {
    accountId: string;
    token: OAuthToken;
    options?: SyncOptions;
  }): Promise<NormalizedMetrics>;

  revokeAccess(params: {
    accountId: string;
    token: OAuthToken;
  }): Promise<void>;
}
