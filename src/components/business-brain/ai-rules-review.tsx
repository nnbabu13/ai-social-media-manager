"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACTION_CATEGORIES,
  ACTION_LABELS,
  MODE_LABELS,
  RISK_LABELS,
  PROFILE_LABELS,
  PROFILE_DESCRIPTIONS,
  AUTONOMY_PROFILES,
  ACTION_MODES,
} from "@/types/ai-operating-rules";
import type { AIOperatingRule, AutonomyConfig, AIActionType } from "@/types/ai-operating-rules";

interface AIRulesReviewProps {
  operatingRules: AIOperatingRule[];
  autonomyConfig: AutonomyConfig | null;
  onUpdateRule: (ruleId: string, updates: Partial<AIOperatingRule>) => void;
  onUpdateProfile: (profile: string) => void;
}

export function AIRulesReview({
  operatingRules,
  autonomyConfig,
  onUpdateRule,
  onUpdateProfile,
}: AIRulesReviewProps) {
  const [editingRules, setEditingRules] = useState<Map<string, Partial<AIOperatingRule>>>(new Map());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const currentProfile = autonomyConfig?.profile || "assistant";

  const getRuleForAction = (action: AIActionType) => {
    return operatingRules.find(r => r.action_type === action);
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "auto": return "bg-green-100 text-green-800";
      case "approval": return "bg-yellow-100 text-yellow-800";
      case "human_only": return "bg-orange-100 text-orange-800";
      case "disabled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleModeChange = (actionType: AIActionType, newMode: string) => {
    const rule = getRuleForAction(actionType);
    if (rule) {
      onUpdateRule(rule.id!, { mode: newMode as AIOperatingRule["mode"] });
    }
  };

  const handleToggleRule = (actionType: AIActionType, enabled: boolean) => {
    const rule = getRuleForAction(actionType);
    if (rule) {
      onUpdateRule(rule.id!, { enabled });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Operating Rules</h3>
          <p className="text-sm text-muted-foreground">
            Control what the AI can do automatically, with approval, or not at all.
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Autonomy Profile</TabsTrigger>
          <TabsTrigger value="rules">Action Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Autonomy Profile</CardTitle>
              <CardDescription>
                Choose how much independence the AI has for your social media.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AUTONOMY_PROFILES.map(profile => (
                  <div
                    key={profile}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      currentProfile === profile
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => onUpdateProfile(profile)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{PROFILE_LABELS[profile]}</h4>
                      {currentProfile === profile && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {PROFILE_DESCRIPTIONS[profile]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <div className="space-y-4">
            {Object.entries(ACTION_CATEGORIES).map(([categoryKey, category]) => (
              <Card key={categoryKey}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{category.label}</CardTitle>
                      <CardDescription>
                        {category.actions.length} actions
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {expandedCategory === categoryKey ? "Collapse" : "Expand"}
                    </Badge>
                  </div>
                </CardHeader>
                {(expandedCategory === categoryKey || expandedCategory === null) && (
                  <CardContent>
                    <div className="space-y-3">
                      {category.actions.map(actionType => {
                        const rule = getRuleForAction(actionType);
                        if (!rule) return null;

                        return (
                          <div
                            key={actionType}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Label className="font-medium">
                                  {ACTION_LABELS[actionType]}
                                </Label>
                                <Badge className={getRiskColor(rule.risk_level)}>
                                  {RISK_LABELS[rule.risk_level]}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <Select
                                value={rule.mode}
                                onValueChange={(value) => handleModeChange(actionType, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ACTION_MODES.map(mode => (
                                    <SelectItem key={mode} value={mode}>
                                      {MODE_LABELS[mode]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(checked) => handleToggleRule(actionType, checked)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
