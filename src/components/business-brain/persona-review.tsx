"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Edit, Save, X, Sparkles, User } from "lucide-react";
import type { GeneratedPersona } from "@/types/business-profiling";

interface PersonaReviewProps {
  personas: GeneratedPersona[];
  derivedInsights: string[];
  onApprove: (index: number, edited?: Record<string, unknown>) => Promise<void>;
  onApproveAll: () => Promise<void>;
  onRegenerate: () => void;
}

export function PersonaReview({
  personas,
  derivedInsights,
  onApprove,
  onApproveAll,
  onRegenerate,
}: PersonaReviewProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedPersona, setEditedPersona] = useState<Record<string, string>>({});
  const [approvedIndices, setApprovedIndices] = useState<Set<number>>(new Set());

  const startEditing = (index: number, persona: GeneratedPersona) => {
    setEditingIndex(index);
    setEditedPersona({
      name: persona.name,
      description: persona.description,
      needs: persona.needs.join(", "),
      pain_points: persona.pain_points.join(", "),
      buying_triggers: persona.buying_triggers.join(", "),
    });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditedPersona({});
  };

  const saveEdit = async (index: number) => {
    const edited = {
      name: editedPersona.name,
      description: editedPersona.description,
      needs: editedPersona.needs.split(",").map(s => s.trim()).filter(Boolean),
      pain_points: editedPersona.pain_points.split(",").map(s => s.trim()).filter(Boolean),
      buying_triggers: editedPersona.buying_triggers.split(",").map(s => s.trim()).filter(Boolean),
    };
    await onApprove(index, edited);
    setApprovedIndices(prev => new Set(prev).add(index));
    setEditingIndex(null);
    setEditedPersona({});
  };

  const handleApprove = async (index: number) => {
    await onApprove(index);
    setApprovedIndices(prev => new Set(prev).add(index));
  };

  const priorityLabel = (priority: string) => {
    switch (priority) {
      case "primary": return { label: "Primary", color: "bg-blue-100 text-blue-800" };
      case "secondary": return { label: "Secondary", color: "bg-purple-100 text-purple-800" };
      case "occasional": return { label: "Occasional", color: "bg-gray-100 text-gray-800" };
      default: return { label: priority, color: "" };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Your Customer Personas</h2>
        <p className="text-muted-foreground">
          AI-generated personas based on your selections. Review, edit, or approve each one.
        </p>
      </div>

      {/* Derived Insights */}
      {derivedInsights.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              AI-derived Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {derivedInsights.map((insight, i) => (
                <li key={i}>- {insight}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Personas */}
      {personas.map((persona, index) => {
        const isApproved = approvedIndices.has(index);
        const isEditing = editingIndex === index;
        const priority = priorityLabel(persona.priority);

        return (
          <Card key={index} className={isApproved ? "border-green-200 bg-green-50/30" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={editedPersona.name}
                        onChange={(e) => setEditedPersona(prev => ({ ...prev, name: e.target.value }))}
                        className="text-lg font-bold"
                      />
                    ) : (
                      <CardTitle>{persona.name}</CardTitle>
                    )}
                    <Badge className={priority.color}>{priority.label}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {persona.source === "ai_derived" ? "AI-generated" : "Owner confirmed"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!isApproved && !isEditing && (
                    <Button size="sm" variant="ghost" onClick={() => startEditing(index, persona)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                {isEditing ? (
                  <Textarea
                    value={editedPersona.description}
                    onChange={(e) => setEditedPersona(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                ) : (
                  <p className="text-sm">{persona.description}</p>
                )}
              </div>

              <Separator />

              {/* Segments */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Customer Segments</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {persona.segments.map((seg, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{seg}</Badge>
                  ))}
                </div>
              </div>

              {/* Needs */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Needs</label>
                {isEditing ? (
                  <Input
                    value={editedPersona.needs}
                    onChange={(e) => setEditedPersona(prev => ({ ...prev, needs: e.target.value }))}
                    placeholder="Comma-separated needs"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {persona.needs.map((need, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{need}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Pain Points */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Pain Points</label>
                {isEditing ? (
                  <Input
                    value={editedPersona.pain_points}
                    onChange={(e) => setEditedPersona(prev => ({ ...prev, pain_points: e.target.value }))}
                    placeholder="Comma-separated pain points"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {persona.pain_points.map((pp, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{pp}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Buying Triggers */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Buying Triggers</label>
                {isEditing ? (
                  <Input
                    value={editedPersona.buying_triggers}
                    onChange={(e) => setEditedPersona(prev => ({ ...prev, buying_triggers: e.target.value }))}
                    placeholder="Comma-separated triggers"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {persona.buying_triggers.map((trigger, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{trigger}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Interests */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Content They Engage With</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {persona.content_interests.map((interest, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{interest}</Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      <X className="mr-1 h-3 w-3" /> Cancel
                    </Button>
                    <Button size="sm" onClick={() => saveEdit(index)}>
                      <Save className="mr-1 h-3 w-3" /> Save & Approve
                    </Button>
                  </>
                ) : isApproved ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" /> Approved
                  </Badge>
                ) : (
                  <Button size="sm" onClick={() => handleApprove(index)}>
                    <CheckCircle className="mr-1 h-3 w-3" /> Approve
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onRegenerate}>
          Regenerate Personas
        </Button>
        <Button onClick={onApproveAll} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve All & Continue
        </Button>
      </div>
    </div>
  );
}
