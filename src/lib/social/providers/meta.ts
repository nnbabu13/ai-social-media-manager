import type {
  SocialProvider,
  OAuthToken,
  SocialAccountCandidate,
  NormalizedSocialAccount,
  SyncOptions,
  PaginatedResult,
  NormalizedSocialPost,
  NormalizedSocialComment,
  NormalizedMetrics,
} from "@/types/social";

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function metaFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const errCode = body?.error?.code;
    const errMsg = body?.error?.message || res.statusText;
    throw new MetaApiError(errMsg, errCode, res.status);
  }
  return res.json();
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public status?: number
  ) {
    super(message);
    this.name = "MetaApiError";
  }

  get isTokenExpired(): boolean {
    return this.code === 190 || this.status === 401;
  }

  get isRateLimited(): boolean {
    return this.code === 4 || this.status === 429;
  }

  get isPermissionError(): boolean {
    return this.code === 200 || this.code === 10;
  }
}

export class MetaProvider implements SocialProvider {
  readonly platform = "facebook" as const;

  async getAuthorizationUrl(params: {
    state: string;
    scopes: string[];
    redirectUri: string;
    clientId: string;
  }): Promise<string> {
    const scope = params.scopes.join(",");
    const params_str = new URLSearchParams({
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      state: params.state,
      scope,
      response_type: "code",
    });
    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params_str.toString()}`;
  }

  async exchangeCode(params: {
    code: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
  }): Promise<OAuthToken> {
    const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
    url.searchParams.set("client_id", params.clientId);
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("client_secret", params.clientSecret);
    url.searchParams.set("code", params.code);

    const data = await metaFetch<{
      access_token: string;
      expires_in: number;
      token_type: string;
    }>(url.toString());

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  }

  async refreshAccessToken(params: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  }): Promise<OAuthToken> {
    const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", params.clientId);
    url.searchParams.set("client_secret", params.clientSecret);
    url.searchParams.set("fb_exchange_token", params.refreshToken);

    const data = await metaFetch<{
      access_token: string;
      expires_in: number;
      token_type: string;
    }>(url.toString());

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  }

  async getAvailableAccounts(
    token: OAuthToken
  ): Promise<SocialAccountCandidate[]> {
    const accounts: SocialAccountCandidate[] = [];

    // 1. Get Facebook Pages (with page access tokens)
    const pagesUrl = new URL(`${GRAPH_API_BASE}/me/accounts`);
    pagesUrl.searchParams.set("access_token", token.access_token);
    pagesUrl.searchParams.set("fields", "id,name,category,picture{url},access_token");

    const pagesData = await metaFetch<{
      data: Array<{
        id: string;
        name: string;
        category?: string;
        picture?: { data?: { url?: string } };
        access_token?: string;
      }>;
    }>(pagesUrl.toString());

    for (const page of pagesData.data) {
      accounts.push({
        platform_account_id: page.id,
        account_name: page.name,
        account_type: "facebook_page" as const,
        profile_image_url: page.picture?.data?.url,
      });

      // 2. Check for linked Instagram account using page access token
      if (page.access_token) {
        try {
          const igUrl = new URL(`${GRAPH_API_BASE}/${page.id}`);
          igUrl.searchParams.set("access_token", page.access_token);
          igUrl.searchParams.set("fields", "instagram_business_account{id,name,profile_picture_url,access_token}");

          const igData = await metaFetch<{
            instagram_business_account?: {
              id: string;
              name?: string;
              profile_picture_url?: string;
              access_token?: string;
            };
          }>(igUrl.toString());

          if (igData.instagram_business_account) {
            const ig = igData.instagram_business_account;
            accounts.push({
              platform_account_id: ig.id,
              account_name: ig.name || page.name,
              account_type: "instagram_professional" as const,
              profile_image_url: ig.profile_picture_url,
              access_token: ig.access_token,
            });
          }
        } catch {
          // Page may not have Instagram linked — skip
        }
      }
    }

    return accounts;
  }

  async getAccountProfile(params: {
    accountId: string;
    token: OAuthToken;
  }): Promise<NormalizedSocialAccount> {
    const url = new URL(`${GRAPH_API_BASE}/${params.accountId}`);
    url.searchParams.set("access_token", params.token.access_token);
    url.searchParams.set(
      "fields",
      "id,name,category,link,picture{url}"
    );

    const data = await metaFetch<{
      id: string;
      name: string;
      category?: string;
      link?: string;
      picture?: { data?: { url?: string } };
    }>(url.toString());

    return {
      platform: "facebook",
      platform_account_id: data.id,
      account_name: data.name,
      account_type: "facebook_page",
      profile_url: data.link,
      profile_image_url: data.picture?.data?.url,
    };
  }

  async fetchPosts(params: {
    accountId: string;
    token: OAuthToken;
    options?: SyncOptions;
  }): Promise<PaginatedResult<NormalizedSocialPost>> {
    const url = new URL(`${GRAPH_API_BASE}/${params.accountId}/posts`);
    url.searchParams.set("access_token", params.token.access_token);
    url.searchParams.set(
      "fields",
      "id,type,message,link,created_time,full_picture,permalink_url"
    );
    url.searchParams.set("limit", String(params.options?.limit || 25));

    if (params.options?.since) {
      url.searchParams.set("since", params.options.since);
    }

    const data = await metaFetch<{
      data: Array<{
        id: string;
        type?: string;
        message?: string;
        link?: string;
        created_time?: string;
        full_picture?: string;
        permalink_url?: string;
      }>;
      paging?: { next?: string; previous?: string };
    }>(url.toString());

    return {
      data: data.data.map((post) => ({
        platform_post_id: post.id,
        post_type: post.type,
        caption: post.message,
        permalink: post.permalink_url,
        published_at: post.created_time,
        media_url: post.full_picture,
        raw_data: post as unknown as Record<string, unknown>,
      })),
      paging: data.paging,
    };
  }

  async fetchComments(params: {
    postId: string;
    token: OAuthToken;
    options?: SyncOptions;
  }): Promise<PaginatedResult<NormalizedSocialComment>> {
    const url = new URL(`${GRAPH_API_BASE}/${params.postId}/comments`);
    url.searchParams.set("access_token", params.token.access_token);
    url.searchParams.set("fields", "id,from,message,created_time,parent");
    url.searchParams.set("limit", String(params.options?.limit || 25));

    if (params.options?.since) {
      url.searchParams.set("since", params.options.since);
    }

    const data = await metaFetch<{
      data: Array<{
        id: string;
        from?: { id: string; name: string };
        message?: string;
        created_time?: string;
        parent?: { id: string };
      }>;
      paging?: { next?: string; previous?: string };
    }>(url.toString());

    return {
      data: data.data.map((comment) => ({
        platform_comment_id: comment.id,
        parent_platform_comment_id: comment.parent?.id,
        author_platform_id: comment.from?.id,
        author_name: comment.from?.name,
        text: comment.message,
        created_at: comment.created_time,
        raw_data: comment as unknown as Record<string, unknown>,
      })),
      paging: data.paging,
    };
  }

  async fetchMetrics(params: {
    accountId: string;
    token: OAuthToken;
    options?: SyncOptions;
  }): Promise<NormalizedMetrics> {
    const url = new URL(`${GRAPH_API_BASE}/${params.accountId}`);
    url.searchParams.set("access_token", params.token.access_token);
    url.searchParams.set(
      "fields",
      "followers_count,following_count,media_count"
    );

    const data = await metaFetch<{
      followers_count?: number;
      following_count?: number;
      media_count?: number;
    }>(url.toString());

    return {
      followers_count: data.followers_count,
      following_count: data.following_count,
      posts_count: data.media_count,
      raw_data: data as unknown as Record<string, unknown>,
    };
  }

  async revokeAccess(params: {
    accountId: string;
    token: OAuthToken;
  }): Promise<void> {
    try {
      const url = new URL(`${GRAPH_API_BASE}/${params.accountId}/permissions`);
      url.searchParams.set("access_token", params.token.access_token);
      await fetch(url.toString(), { method: "DELETE" });
    } catch {
      // Best-effort revocation; don't throw if revoke fails
    }
  }
}

export function classifyMetaError(error: unknown): {
  retryable: boolean;
  reauthRequired: boolean;
} {
  if (error instanceof MetaApiError) {
    return {
      retryable: error.isRateLimited || (error.status !== undefined && error.status >= 500),
      reauthRequired: error.isTokenExpired || error.isPermissionError,
    };
  }
  return { retryable: true, reauthRequired: false };
}
