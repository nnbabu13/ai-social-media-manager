import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Building2,
  LinkIcon,
  Brain,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("business_members")
    .select("*, businesses(*)")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <h1 className="text-2xl font-bold">Welcome to AI Social Media Employee</h1>
        <p className="text-muted-foreground">
          Get started by setting up your business profile
        </p>
        <Link href="/onboarding">
          <Button>
            Set up your business
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const business = membership.businesses;

  const setupItems = [
    {
      label: "Business profile",
      complete: !!business?.name,
      icon: Building2,
    },
    {
      label: "AI preferences",
      complete: true,
      icon: Brain,
    },
    {
      label: "Social accounts",
      complete: false,
      icon: LinkIcon,
    },
    {
      label: "AI knowledge base",
      complete: false,
      icon: Brain,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.email}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span>{item.label}</span>
              </div>
              {item.complete ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Not connected
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <LinkIcon className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">
              Connect your social accounts
            </h2>
            <p className="text-center text-muted-foreground max-w-md">
              Connect your social media accounts to let AI manage your presence.
              This feature is coming soon.
            </p>
            <Link href="/accounts">
              <Button>
                Connect accounts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
