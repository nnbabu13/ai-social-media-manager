"use server";

import { createClient } from "@/lib/supabase/server";
import { encryptToken, decryptToken } from "@/lib/social/token-encryption";
import { createServerAuditLog, AuditActions } from "@/lib/audit-server";
import { createServerNotification } from "@/lib/notifications-server";
import { MetaProvider, classifyMetaError } from "@/lib/social/providers/meta";
import type {
  SocialPlatform,
  SocialAccountStatus,
  ConnectionStatus,
} from "@/types/social";

const metaProvider = new MetaProvider();

function getMetaEnv() {
  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Meta environment variables are not configured");
  }
  return { clientId, clientSecret, redirectUri };
}

// ========== Start OAuth flow ==========
export async function startFacebookOAuth(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { clientId, redirectUri } = getMetaEnv();
  const { state } = await import("@/lib/social/oauth-state").then((m) =>
    m.createOAuthState({
      userId: user.id,
      businessId,
      provider: "facebook",
    })
  );

  const url = await metaProvider.getAuthorizationUrl({
    state,
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "instagram_basic",
      "instagram_manage_insights",
      "instagram_content_publish",
    ],
    redirectUri,
    clientId,
  });

  return { url, state };
}

export async function startInstagramOAuth(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { clientId, redirectUri } = getMetaEnv();
  const { state } = await import("@/lib/social/oauth-state").then((m) =>
    m.createOAuthState({
      userId: user.id,
      businessId,
      provider: "instagram",
    })
  );

  const url = await metaProvider.getAuthorizationUrl({
    state,
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_manage_insights",
    ],
    redirectUri,
    clientId,
  });

  return { url, state };
}

// ========== Handle OAuth callback ==========
export async function handleOAuthCallback(params: {
  code: string;
  state: string;
  userId: string;
}) {
  const supabase = await createClient();
  const { validateOAuthState } = await import("@/lib/social/oauth-state");

  const validated = await validateOAuthState({
    state: params.state,
    userId: params.userId,
  });

  if (!validated) {
    throw new Error("Invalid or expired OAuth state");
  }

  const { clientId, clientSecret, redirectUri } = getMetaEnv();

  const token = await metaProvider.exchangeCode({
    code: params.code,
    redirectUri,
    clientId,
    clientSecret,
  });

  const accounts = await metaProvider.getAvailableAccounts(token);

  return {
    businessId: validated.businessId,
    provider: validated.provider,
    accounts,
    token,
  };
}

// ========== Connect a specific account ==========
export async function connectSocialAccount(params: {
  businessId: string;
  platform: SocialPlatform;
  platformAccountId: string;
  accountName: string;
  username?: string;
  accountType: string;
  profileUrl?: string;
  profileImageUrl?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresIn?: number;
  userId: string;
}) {
  const supabase = await createClient();

  await createServerAuditLog({
    businessId: params.businessId,
    userId: params.userId,
    action: AuditActions.SOCIAL_ACCOUNT_CONNECT_STARTED,
    entityType: "social_account",
    metadata: {
      platform: params.platform,
      platform_account_id: params.platformAccountId,
    },
  });

  const { data: existing } = await supabase
    .from("social_accounts")
    .select("id")
    .eq("platform", params.platform)
    .eq("platform_account_id", params.platformAccountId)
    .single();

  let accountId: string;

  if (existing) {
    const { error: updateErr } = await supabase
      .from("social_accounts")
      .update({
        account_name: params.accountName,
        username: params.username || null,
        profile_url: params.profileUrl || null,
        profile_image_url: params.profileImageUrl || null,
        status: "active" as SocialAccountStatus,
        connection_status: "connected" as ConnectionStatus,
        last_sync_error: null,
      })
      .eq("id", existing.id);

    if (updateErr) throw new Error(`Failed to update account: ${updateErr.message}`);
    accountId = existing.id;

    const encrypted = encryptToken(params.accessToken);
    const expiresAt = params.tokenExpiresIn
      ? new Date(Date.now() + params.tokenExpiresIn * 1000).toISOString()
      : null;

    await supabase.from("social_account_credentials").upsert(
      {
        social_account_id: accountId,
        access_token_encrypted: encrypted,
        refresh_token_encrypted: params.refreshToken
          ? encryptToken(params.refreshToken)
          : null,
        token_expires_at: expiresAt,
      },
      { onConflict: "social_account_id" }
    );
  } else {
    const { data: newAccount, error: insertErr } = await supabase
      .from("social_accounts")
      .insert({
        business_id: params.businessId,
        platform: params.platform,
        platform_account_id: params.platformAccountId,
        account_name: params.accountName,
        username: params.username || null,
        account_type: params.accountType,
        profile_url: params.profileUrl || null,
        profile_image_url: params.profileImageUrl || null,
        status: "active" as SocialAccountStatus,
        connection_status: "connected" as ConnectionStatus,
      })
      .select("id")
      .single();

    if (insertErr || !newAccount) {
      throw new Error(`Failed to create account: ${insertErr?.message}`);
    }

    accountId = newAccount.id;

    const encrypted = encryptToken(params.accessToken);
    const expiresAt = params.tokenExpiresIn
      ? new Date(Date.now() + params.tokenExpiresIn * 1000).toISOString()
      : null;

    const { error: credErr } = await supabase
      .from("social_account_credentials")
      .insert({
        social_account_id: accountId,
        access_token_encrypted: encrypted,
        refresh_token_encrypted: params.refreshToken
          ? encryptToken(params.refreshToken)
          : null,
        token_expires_at: expiresAt,
      });

    if (credErr) throw new Error(`Failed to store credentials: ${credErr.message}`);
  }

  await createServerAuditLog({
    businessId: params.businessId,
    userId: params.userId,
    action: AuditActions.SOCIAL_ACCOUNT_CONNECTED,
    entityType: "social_account",
    entityId: accountId,
    metadata: { platform: params.platform },
  });

  return { accountId };
}

// ========== Get accounts for a business ==========
export async function getSocialAccounts(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
  return data || [];
}

// ========== Get single account ==========
export async function getSocialAccount(accountId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error) throw new Error(`Failed to fetch account: ${error.message}`);
  return data;
}

// ========== Disconnect account ==========
export async function disconnectSocialAccount(
  accountId: string,
  userId: string
) {
  const supabase = await createClient();

  const { data: account, error: fetchErr } = await supabase
    .from("social_accounts")
    .select("id, business_id, platform, platform_account_id")
    .eq("id", accountId)
    .single();

  if (fetchErr || !account) throw new Error("Account not found");

  const { data: credData } = await supabase
    .from("social_account_credentials")
    .select("access_token_encrypted")
    .eq("social_account_id", accountId)
    .single();

  if (credData) {
    try {
      const accessToken = decryptToken(credData.access_token_encrypted);
      await metaProvider.revokeAccess({
        accountId: account.platform_account_id,
        token: { access_token: accessToken },
      });
    } catch {
      // Best-effort revocation
    }

    await supabase
      .from("social_account_credentials")
      .delete()
      .eq("social_account_id", accountId);
  }

  await supabase
    .from("social_accounts")
    .update({
      status: "disconnected" as SocialAccountStatus,
      connection_status: "disconnected" as ConnectionStatus,
    })
    .eq("id", accountId);

  await createServerAuditLog({
    businessId: account.business_id,
    userId,
    action: AuditActions.SOCIAL_ACCOUNT_DISCONNECTED,
    entityType: "social_account",
    entityId: accountId,
    metadata: { platform: account.platform },
  });

  return { success: true };
}

// ========== Reconnect account ==========
export async function reconnectSocialAccount(
  accountId: string,
  userId: string
) {
  const supabase = await createClient();

  const { data: account, error: fetchErr } = await supabase
    .from("social_accounts")
    .select("id, business_id, platform")
    .eq("id", accountId)
    .single();

  if (fetchErr || !account) throw new Error("Account not found");

  const { clientId, redirectUri } = getMetaEnv();
  const { state } = await import("@/lib/social/oauth-state").then((m) =>
    m.createOAuthState({
      userId,
      businessId: account.business_id,
      provider: account.platform,
    })
  );

  const url = await metaProvider.getAuthorizationUrl({
    state,
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "instagram_basic",
      "instagram_manage_insights",
    ],
    redirectUri,
    clientId,
  });

  await createServerAuditLog({
    businessId: account.business_id,
    userId,
    action: AuditActions.SOCIAL_ACCOUNT_RECONNECTED,
    entityType: "social_account",
    entityId: accountId,
    metadata: { platform: account.platform },
  });

  return { url, state };
}

// ========== Get sync jobs ==========
export async function getSyncJobs(accountId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_sync_jobs")
    .select("*")
    .eq("social_account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(`Failed to fetch sync jobs: ${error.message}`);
  return data || [];
}

// ========== Get posts ==========
export async function getSocialPosts(
  accountId: string,
  params?: { limit?: number; offset?: number }
) {
  const supabase = await createClient();
  const limit = params?.limit || 25;
  const offset = params?.offset || 0;

  const { data, error, count } = await supabase
    .from("social_posts")
    .select("*", { count: "exact" })
    .eq("social_account_id", accountId)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch posts: ${error.message}`);
  return { data: data || [], total: count || 0 };
}

// ========== Get comments ==========
export async function getSocialComments(
  postId: string,
  params?: { limit?: number; offset?: number }
) {
  const supabase = await createClient();
  const limit = params?.limit || 25;
  const offset = params?.offset || 0;

  const { data, error, count } = await supabase
    .from("social_comments")
    .select("*", { count: "exact" })
    .eq("social_post_id", postId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch comments: ${error.message}`);
  return { data: data || [], total: count || 0 };
}

// ========== Get metrics ==========
export async function getSocialMetrics(accountId: string, days?: number) {
  const supabase = await createClient();

  let query = supabase
    .from("social_account_metrics")
    .select("*")
    .eq("social_account_id", accountId)
    .order("metric_date", { ascending: false });

  if (days) {
    const since = new Date(Date.now() - days * 86400000)
      .toISOString()
      .split("T")[0];
    query = query.gte("metric_date", since);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch metrics: ${error.message}`);
  return data || [];
}

// ========== Get linked accounts ==========
export async function getLinkedAccounts(accountId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_account_links")
    .select("*, parent:social_accounts!parent_account_id(*), child:social_accounts!child_account_id(*)")
    .or(`parent_account_id.eq.${accountId},child_account_id.eq.${accountId}`);

  if (error) throw new Error(`Failed to fetch linked accounts: ${error.message}`);
  return data || [];
}
