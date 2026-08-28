import { createClient } from "@/lib/supabase/server";
import { getBusinessPersona, generateBusinessPersona } from "@/app/actions/business-persona";
import { getCustomerPersonas, generateCustomerPersonas } from "@/app/actions/customer-persona";
import { BusinessPersonaReview } from "@/components/business-brain/business-persona-review";
import { CustomerPersonaReview } from "@/components/business-brain/customer-persona-review";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PersonasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return null;
  }

  const businessId = business.id;

  const [businessPersona, customerPersonas] = await Promise.all([
    getBusinessPersona(businessId),
    getCustomerPersonas(businessId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Personas</h1>
        <p className="text-muted-foreground">
          Define how your AI represents your brand and who it&apos;s trying to attract.
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList>
          <TabsTrigger value="business">Your Brand</TabsTrigger>
          <TabsTrigger value="customers">Your Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Brand</CardTitle>
              <p className="text-sm text-muted-foreground">
                How your AI represents your business.
              </p>
            </CardHeader>
          </Card>
          <BusinessPersonaReview
            businessId={businessId}
            initialPersona={businessPersona}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Customers</CardTitle>
              <p className="text-sm text-muted-foreground">
                Who your AI is trying to attract.
              </p>
            </CardHeader>
          </Card>
          <CustomerPersonaReview businessId={businessId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
