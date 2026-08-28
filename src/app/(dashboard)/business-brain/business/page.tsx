import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { getBusinessBrain } from "@/lib/business-brain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function BusinessSectionPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  const brain = await getBusinessBrain(business.id);
  if (!brain) redirect("/onboarding");

  const location = [brain.business.city, brain.business.region, brain.business.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business</h1>
        <p className="text-muted-foreground">Your business identity, offerings, and key facts.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Business name:</span><div className="font-medium">{brain.business.name}</div></div>
            <div><span className="text-muted-foreground">Category:</span><div className="font-medium">{brain.business.category || "Not set"}</div></div>
            <div><span className="text-muted-foreground">Location:</span><div className="font-medium">{location || "Not set"}</div></div>
            <div><span className="text-muted-foreground">Website:</span><div className="font-medium">{brain.business.website_url || "Not set"}</div></div>
          </div>
          {brain.business.description && (
            <div><span className="text-muted-foreground text-sm">Description:</span><p className="text-sm mt-1">{brain.business.description}</p></div>
          )}
          {brain.business.target_customers && (
            <div><span className="text-muted-foreground text-sm">Target customers:</span><p className="text-sm mt-1">{brain.business.target_customers}</p></div>
          )}
        </CardContent>
      </Card>

      {brain.products.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Products ({brain.products.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brain.products.map((p, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    {p.description && <div className="text-sm text-muted-foreground mt-1">{p.description}</div>}
                  </div>
                  {p.price_visibility === "public" && p.price && <Badge variant="secondary">${p.price}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {brain.services.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Services ({brain.services.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brain.services.map((s, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    {s.description && <div className="text-sm text-muted-foreground mt-1">{s.description}</div>}
                  </div>
                  {s.price_text && <Badge variant="secondary">{s.price_text}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {brain.facts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Business Facts ({brain.facts.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {brain.facts.map((f, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{f.category}</Badge>
                    <span className="font-medium text-sm">{f.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {brain.locations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Locations ({brain.locations.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {brain.locations.map((l, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="font-medium">{l.name}</div>
                  {l.city && <div className="text-sm text-muted-foreground">{l.city}</div>}
                  {l.service_area && <div className="text-sm text-muted-foreground">Service area: {l.service_area}</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
