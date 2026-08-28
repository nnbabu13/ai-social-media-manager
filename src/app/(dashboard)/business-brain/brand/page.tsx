import { redirect } from "next/navigation";
import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { getBusinessBrain } from "@/lib/business-brain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function BrandSectionPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  const brain = await getBusinessBrain(business.id);
  if (!brain) redirect("/onboarding");

  const persona = brain.business_persona;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Brand</h1>
        <p className="text-muted-foreground">How your brand looks, sounds, and positions itself.</p>
      </div>

      {persona && (
        <>
          <Card>
            <CardHeader><CardTitle>Brand Personality</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {persona.personality_traits.length > 0 && (
                <div><span className="text-xs text-muted-foreground">Personality traits:</span>
                  <div className="flex flex-wrap gap-1 mt-1">{persona.personality_traits.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}</div>
                </div>
              )}
              {persona.tone.length > 0 && (
                <div><span className="text-xs text-muted-foreground">Tone:</span>
                  <div className="flex flex-wrap gap-1 mt-1">{persona.tone.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}</div>
                </div>
              )}
              {persona.communication_style && (
                <div><span className="text-xs text-muted-foreground">Communication style:</span>
                  <p className="text-sm mt-1">{persona.communication_style}</p>
                </div>
              )}
              {persona.brand_values.length > 0 && (
                <div><span className="text-xs text-muted-foreground">Brand values:</span>
                  <div className="flex flex-wrap gap-1 mt-1">{persona.brand_values.map((v, i) => <Badge key={i} variant="outline">{v}</Badge>)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Positioning</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {persona.positioning && (
                <div><span className="text-xs text-muted-foreground">Positioning:</span>
                  <p className="text-sm mt-1">{persona.positioning}</p>
                </div>
              )}
              {persona.differentiators.length > 0 && (
                <div><span className="text-xs text-muted-foreground">Differentiators:</span>
                  <ul className="text-sm mt-1 space-y-1">{persona.differentiators.map((d, i) => <li key={i}>• {d}</li>)}</ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Content Personality</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {persona.content_personality.length > 0 && (
                <div><span className="text-xs text-muted-foreground">Content personality:</span>
                  <div className="flex flex-wrap gap-1 mt-1">{persona.content_personality.map((c, i) => <Badge key={i} variant="outline">{c}</Badge>)}</div>
                </div>
              )}
              {persona.approved_claims.length > 0 && (
                <div><span className="text-xs text-muted-foreground">Approved claims:</span>
                  <ul className="text-sm mt-1 space-y-1">{persona.approved_claims.map((c, i) => <li key={i} className="text-green-700">✓ {c}</li>)}</ul>
                </div>
              )}
              {persona.restricted_claims.length > 0 && (
                <div><span className="text-xs text-muted-foreground">Restricted claims:</span>
                  <ul className="text-sm mt-1 space-y-1">{persona.restricted_claims.map((c, i) => <li key={i} className="text-red-700">✕ {c}</li>)}</ul>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {brain.brand && (
        <Card>
          <CardHeader><CardTitle>Brand Voice</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {brain.brand.tone && <div><span className="text-muted-foreground">Tone:</span> {brain.brand.tone}</div>}
            {brain.brand.style_description && <div><span className="text-muted-foreground">Style:</span> {brain.brand.style_description}</div>}
            {brain.brand.tagline && <div><span className="text-muted-foreground">Tagline:</span> {brain.brand.tagline}</div>}
            {brain.brand.avoid_words && <div><span className="text-muted-foreground">Avoid words:</span> {brain.brand.avoid_words}</div>}
            {brain.brand.brand_keywords.length > 0 && (
              <div><span className="text-muted-foreground">Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">{brain.brand.brand_keywords.map((k, i) => <Badge key={i} variant="outline" className="text-xs">{k}</Badge>)}</div>
              </div>
            )}
            {brain.brand.preferred_phrases.length > 0 && (
              <div><span className="text-muted-foreground">Preferred phrases:</span>
                <div className="flex flex-wrap gap-1 mt-1">{brain.brand.preferred_phrases.map((p, i) => <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>)}</div>
              </div>
            )}
            {brain.brand.forbidden_phrases.length > 0 && (
              <div><span className="text-muted-foreground">Forbidden phrases:</span>
                <div className="flex flex-wrap gap-1 mt-1">{brain.brand.forbidden_phrases.map((p, i) => <Badge key={i} variant="destructive" className="text-xs">{p}</Badge>)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!persona && !brain.brand && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Brand information has not been configured yet. Complete the business profiling to define your brand personality.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
