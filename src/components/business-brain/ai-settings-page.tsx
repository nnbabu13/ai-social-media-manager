"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIRulesReview } from "./ai-rules-review";
import {
  initializeDefaultRules,
  updateOperatingRule,
  updateAutonomyProfile,
  addCustomRule,
  deleteCustomRule,
  addEscalationRule,
  deleteEscalationRule,
} from "@/app/actions/ai-operating-rules";
import type { AIOperatingRule, CustomAIRule, AIEscalationRule, AutonomyConfig } from "@/types/ai-operating-rules";

interface AISettingsPageProps {
  businessId: string;
  initialOperatingRules: AIOperatingRule[];
  initialCustomRules: CustomAIRule[];
  initialEscalationRules: AIEscalationRule[];
  initialAutonomyConfig: AutonomyConfig | null;
}

export function AISettingsPage({
  businessId,
  initialOperatingRules,
  initialCustomRules,
  initialEscalationRules,
  initialAutonomyConfig,
}: AISettingsPageProps) {
  const router = useRouter();
  const [operatingRules, setOperatingRules] = useState<AIOperatingRule[]>(initialOperatingRules);
  const [customRules, setCustomRules] = useState<CustomAIRule[]>(initialCustomRules);
  const [escalationRules, setEscalationRules] = useState<AIEscalationRule[]>(initialEscalationRules);
  const [autonomyConfig, setAutonomyConfig] = useState<AutonomyConfig | null>(initialAutonomyConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleInitialize = async () => {
    const result = await initializeDefaultRules(businessId);
    if (result.success) {
      router.refresh();
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<AIOperatingRule>) => {
    setIsSaving(true);
    try {
      const result = await updateOperatingRule(ruleId, updates);
      if (result.rule) {
        setOperatingRules(prev =>
          prev.map(r => r.id === ruleId ? { ...r, ...updates } : r)
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async (profile: string) => {
    setIsSaving(true);
    try {
      const result = await updateAutonomyProfile(businessId, profile);
      if (result.config) {
        setAutonomyConfig(result.config);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const rulesCount = operatingRules.length;
  const customRulesCount = customRules.length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure your AI employee's behavior, permissions, and autonomy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {rulesCount > 0 ? (
              <Badge variant="default">
                {rulesCount} rules configured
              </Badge>
            ) : (
              <Button onClick={handleInitialize}>Initialize Default Rules</Button>
            )}
          </div>
        </div>

        {rulesCount > 0 ? (
          <Tabs defaultValue="operating">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="operating">Operating Rules</TabsTrigger>
              <TabsTrigger value="custom">Custom Rules</TabsTrigger>
              <TabsTrigger value="escalation">Escalation</TabsTrigger>
            </TabsList>

            <TabsContent value="operating" className="mt-4">
              <AIRulesReview
                operatingRules={operatingRules}
                autonomyConfig={autonomyConfig}
                onUpdateRule={handleUpdateRule}
                onUpdateProfile={handleUpdateProfile}
              />
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Business Rules</CardTitle>
                  <CardDescription>
                    Define your own rules for how the AI should handle specific situations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {customRules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No custom rules defined yet. Add rules to customize AI behavior.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customRules.map(rule => (
                        <div key={rule.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{rule.name}</h4>
                              <p className="text-sm text-muted-foreground">{rule.description}</p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                await deleteCustomRule(rule.id!);
                                setCustomRules(prev => prev.filter(r => r.id !== rule.id));
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="escalation" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Escalation Rules</CardTitle>
                  <CardDescription>
                    Configure when and how the AI should escalate to you.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {escalationRules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No escalation rules defined. Add rules to handle specific triggers.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {escalationRules.map(rule => (
                        <div key={rule.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{rule.trigger_type}</h4>
                              <p className="text-sm text-muted-foreground">{rule.condition}</p>
                            </div>
                            <Badge variant="outline">{rule.action}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Initialize AI Operating Rules</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Set up the default rules for your AI employee. You can customize these later.
                </p>
                <Button onClick={handleInitialize} size="lg">
                  Initialize Default Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
