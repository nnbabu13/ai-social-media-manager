import { redirect } from "next/navigation";
import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { getBusinessBrain } from "@/lib/business-brain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AudienceSectionPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  const brain = await getBusinessBrain(business.id);
  if (!brain) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audience</h1>
        <p className="text-muted-foreground">Who your customers are, what they need, and how they behave.</p>
      </div>

      {brain.business.target_customers && (
        <Card>
          <CardHeader><CardTitle>Target Audience</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{brain.business.target_customers}</p>
          </CardContent>
        </Card>
      )}

      {brain.customer_personas && brain.customer_personas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Customer Personas</h2>
          {brain.customer_personas.map((persona) => (
            <Card key={persona.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{persona.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{persona.priority}</Badge>
                    <Badge variant="secondary">{persona.source_type}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {persona.description && <p className="text-sm text-muted-foreground">{persona.description}</p>}

                {persona.segments.length > 0 && (
                  <div><span className="text-xs text-muted-foreground">Segments:</span>
                    <div className="flex flex-wrap gap-1 mt-1">{persona.segments.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}</div>
                  </div>
                )}

                {persona.needs.length > 0 && (
                  <div><span className="text-xs text-muted-foreground">Needs:</span>
                    <ul className="text-sm mt-1 space-y-1">{persona.needs.map((n, i) => <li key={i}>• {n}</li>)}</ul>
                  </div>
                )}

                {persona.pain_points.length > 0 && (
                  <div><span className="text-xs text-muted-foreground">Pain points:</span>
                    <ul className="text-sm mt-1 space-y-1">{persona.pain_points.map((p, i) => <li key={i}>• {p}</li>)}</ul>
                  </div>
                )}

                {persona.buying_triggers.length > 0 && (
                  <div><span className="text-xs text-muted-foreground">Buying triggers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">{persona.buying_triggers.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}</div>
                  </div>
                )}

                {persona.objections.length > 0 && (
                  <div><span className="text-xs text-muted-foreground">Common objections:</span>
                    <ul className="text-sm mt-1 space-y-1">{persona.objections.map((o, i) => <li key={i}>• {o}</li>)}</ul>
                  </div>
                )}

                {persona.conversion_action && (
                  <div><span className="text-xs text-muted-foreground">Preferred conversion:</span>
                    <div className="text-sm font-medium mt-1">{persona.conversion_action}</div>
                  </div>
                )}

                {persona.preferred_channels.length > 0 && (
                  <div><span className="text-xs text-muted-foreground">Preferred channels:</span>
                    <div className="flex flex-wrap gap-1 mt-1">{persona.preferred_channels.map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {brain.personas.length > 0 && (!brain.customer_personas || brain.customer_personas.length === 0) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Customer Personas</h2>
          {brain.personas.map((p, i) => (
            <Card key={i}>
              <CardHeader><CardTitle className="text-base">{p.name}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                {p.pain_points && <div className="text-sm"><span className="text-muted-foreground">Pain points:</span> {p.pain_points}</div>}
                {p.needs && <div className="text-sm"><span className="text-muted-foreground">Needs:</span> {p.needs}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
