import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { BusinessInfoForm } from "@/components/business/business-info-form";
import { ProductsForm } from "@/components/business/products-form";
import { GoalsForm } from "@/components/business/goals-form";
import { BrandProfileForm } from "@/components/business/brand-profile-form";
import { AiPolicyForm } from "@/components/business/ai-policy-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BusinessPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);
  const supabase = await createClient();

  const [productsRes, goalsRes, brandRes, policyRes] = await Promise.all([
    supabase.from("business_products").select("*").eq("business_id", business.id).order("created_at"),
    supabase.from("business_goals").select("*").eq("business_id", business.id).order("created_at"),
    supabase.from("brand_profiles").select("*").eq("business_id", business.id).single(),
    supabase.from("ai_policies").select("*").eq("business_id", business.id).single(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Business</h1>
        <p className="text-muted-foreground">Manage your business information and settings</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
        <CardContent><BusinessInfoForm business={business} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Products & Services</CardTitle></CardHeader>
        <CardContent><ProductsForm businessId={business.id} products={productsRes.data || []} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Goals</CardTitle></CardHeader>
        <CardContent><GoalsForm businessId={business.id} goals={goalsRes.data || []} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Brand Voice</CardTitle></CardHeader>
        <CardContent><BrandProfileForm businessId={business.id} brandProfile={brandRes.data} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>AI Rules</CardTitle></CardHeader>
        <CardContent><AiPolicyForm businessId={business.id} aiPolicy={policyRes.data} /></CardContent>
      </Card>
    </div>
  );
}
