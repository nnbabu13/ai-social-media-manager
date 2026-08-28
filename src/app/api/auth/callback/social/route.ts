import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleOAuthCallback, connectSocialAccount } from "@/app/actions/social-accounts";
import { runInitialSync } from "@/app/actions/social-sync";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/accounts?error=missing_parameters", request.url)
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const result = await handleOAuthCallback({
      code,
      state,
      userId: user.id,
    });

    const accounts = result.accounts;

    if (accounts.length === 0) {
      return NextResponse.redirect(
        new URL(
          `/accounts?error=no_pages_found&platform=${result.provider}`,
          request.url
        )
      );
    }

    const connectedIds: string[] = [];

    for (const candidate of accounts) {
      try {
        const { accountId } = await connectSocialAccount({
          businessId: result.businessId,
          platform: candidate.platform_account_id ? result.provider as any : "facebook",
          platformAccountId: candidate.platform_account_id,
          accountName: candidate.account_name,
          username: candidate.username,
          accountType: candidate.account_type,
          profileUrl: candidate.profile_url,
          profileImageUrl: candidate.profile_image_url,
          accessToken: result.token.access_token,
          tokenExpiresIn: result.token.expires_in,
          userId: user.id,
        });

        connectedIds.push(accountId);
        runInitialSync(accountId, result.businessId, user.id).catch(() => {});
      } catch {
        // Continue connecting other accounts even if one fails
      }
    }

    return NextResponse.redirect(
      new URL(
        `/accounts?connected=true&count=${connectedIds.length}`,
        request.url
      )
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(msg)}`, request.url)
    );
  }
}
