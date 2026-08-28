"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { connectSocialAccount } from "@/app/actions/social-accounts";
import { runInitialSync } from "@/app/actions/social-sync";

interface Props {
  businessId: string;
  provider: string;
  accounts: Array<{
    platform_account_id: string;
    account_name: string;
    username?: string;
    account_type: string;
    profile_image_url?: string;
  }>;
  accessToken: string;
  tokenExpiresIn?: number;
}

export function SelectAccountClient({
  businessId,
  provider,
  accounts,
  accessToken,
  tokenExpiresIn,
}: Props) {
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleSelect = async (account: (typeof accounts)[0]) => {
    setConnecting(account.platform_account_id);
    try {
      const { accountId } = await connectSocialAccount({
        businessId,
        platform: provider as "facebook" | "instagram",
        platformAccountId: account.platform_account_id,
        accountName: account.account_name,
        username: account.username,
        accountType: account.account_type,
        profileImageUrl: account.profile_image_url,
        accessToken,
        tokenExpiresIn,
        userId: "",
      });

      runInitialSync(accountId, businessId, "").catch(() => {});
      router.push(`/accounts?connected=true&id=${accountId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to connect");
      setConnecting(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Choose which {provider === "facebook" ? "Page" : "account"} to connect</h1>
        <p className="text-muted-foreground">
          Select the {provider === "facebook" ? "Facebook Page" : "Instagram account"} you want your AI manager to learn from.
        </p>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <Card key={account.platform_account_id} className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {account.profile_image_url ? (
                  <img
                    src={account.profile_image_url}
                    alt=""
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {account.account_name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-medium">{account.account_name}</div>
                  {account.username && (
                    <div className="text-sm text-muted-foreground">@{account.username}</div>
                  )}
                  <div className="text-xs text-muted-foreground">{account.account_type.replace("_", " ")}</div>
                </div>
              </div>
              <Button
                onClick={() => handleSelect(account)}
                disabled={connecting !== null}
                size="sm"
              >
                {connecting === account.platform_account_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="ghost" onClick={() => router.push("/accounts")}>
        Cancel
      </Button>
    </div>
  );
}
