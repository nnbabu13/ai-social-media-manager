"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Target, Layers, Calendar, MessageSquare, Sparkles, Check, Edit2, RotateCcw } from "lucide-react";
import type { SocialStrategy, ContentPillar } from "@/types/social-strategy";
import { getSocialStrategy, generateStrategy, approveStrategy, updateStrategy } from "@/app/actions/social-strategy";

interface StrategyReviewProps {
  businessId: string;
}

export function StrategyReview({ businessId }: StrategyReviewProps) {
  const [strategy, setStrategy] = useState<SocialStrategy | null>(null);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStrategy();
  }, [businessId]);

  const loadStrategy = async () => {
    setIsLoading(true);
    try {
      const data = await getSocialStrategy(businessId);
      setStrategy(data.strategy);
      setPillars(data.pillars);
    } catch (err) {
      setError("Failed to load strategy");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateStrategy(businessId);
      if (result.error) {
        setError(result.error);
      } else if (result.strategy) {
        setStrategy(result.strategy);
        setPillars(result.pillars || []);
      }
    } catch (err) {
      setError("Failed to generate strategy");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    const result = await approveStrategy(businessId);
    if (result.error) {
      setError(result.error);
    } else if (result.strategy) {
      setStrategy(result.strategy);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!strategy && !isGenerating) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Target className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-bold">Create Your Social Strategy</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Generate a comprehensive social media strategy based on your business information.
          </p>
          <Button onClick={handleGenerate} size="lg">
            Generate Strategy
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-xl font-bold">Generating your strategy...</h2>
          <p className="text-muted-foreground">
            Analyzing your business to create the perfect content strategy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your AI Social Strategy</CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant={strategy?.strategy_status === "approved" ? "default" : "secondary"}>
                  {strategy?.strategy_status || "draft"}
                </Badge>
                <Badge variant="outline">
                  {strategy?.source_type === "owner_confirmed" ? "Confirmed" : "AI Generated"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleGenerate}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
              {strategy?.strategy_status !== "approved" && (
                <Button size="sm" onClick={handleApprove}>
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {strategy?.explanation && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Why this strategy?</h3>
              <p className="text-sm text-muted-foreground">{strategy.explanation}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ObjectiveCard
              title="Primary Goal"
              objective={strategy?.primary_objective}
              icon={<Target className="h-4 w-4" />}
            />
            <ObjectiveCard
              title="Conversion Action"
              action={strategy?.conversion_strategy?.primary_action}
              icon={<MessageSquare className="h-4 w-4" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Content Pillars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pillars.map((pillar) => (
                  <PillarCard key={pillar.id} pillar={pillar} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Mix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {strategy?.content_mix.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32">{item.category}</span>
                    <Progress value={item.percentage} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-10">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Posting Cadence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{strategy?.posting_cadence?.posts_per_week} posts/week</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {strategy?.posting_cadence?.flexibility === "ai_decides" ? "AI decides optimal timing" : "Fixed schedule"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferred Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {strategy?.preferred_formats.map((format, i) => (
                    <Badge key={i} variant={format.priority === "high" ? "default" : "secondary"}>
                      {format.format}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap">
                {strategy?.conversion_strategy?.journey.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline">{step.step}</Badge>
                    {i < (strategy?.conversion_strategy?.journey.length || 0) - 1 && (
                      <span className="text-muted-foreground">→</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">CTA Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {strategy?.cta_strategy.map((cta, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-bold">{cta.percentage}%</p>
                    <p className="text-sm text-muted-foreground capitalize">{cta.type.replace("_", " ")}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">Always Emphasize</h4>
                <div className="flex flex-wrap gap-1">
                  {strategy?.content_rules?.always_emphasize.map((rule, i) => (
                    <Badge key={i} variant="secondary">{rule}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Avoid</h4>
                <div className="flex flex-wrap gap-1">
                  {strategy?.content_rules?.avoid.map((rule, i) => (
                    <Badge key={i} variant="destructive">{rule}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

function ObjectiveCard({
  title,
  objective,
  action,
  icon,
}: {
  title: string;
  objective?: { objective: string; description: string };
  action?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <p className="font-medium">{objective?.objective || action || "Not set"}</p>
        {objective?.description && (
          <p className="text-sm text-muted-foreground mt-1">{objective.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function PillarCard({ pillar }: { pillar: ContentPillar }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{pillar.name}</h4>
          <Badge variant={pillar.priority === "primary" ? "default" : "secondary"}>
            {pillar.priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{pillar.description}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {pillar.example_topics?.slice(0, 3).map((topic, i) => (
            <Badge key={i} variant="outline" className="text-xs">{topic}</Badge>
          ))}
        </div>
      </div>
      <div className="text-right ml-4">
        <p className="text-2xl font-bold">{pillar.recommended_percentage}%</p>
        <Badge variant="outline" className="mt-1">{pillar.purpose}</Badge>
      </div>
    </div>
  );
}
