"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Edit2, RotateCcw, Check, X } from "lucide-react";
import type { BusinessPersona } from "@/types/business-persona";
import { generateBusinessPersona, updateBusinessPersona, approveBusinessPersona } from "@/app/actions/business-persona";

interface BusinessPersonaReviewProps {
  businessId: string;
  initialPersona?: BusinessPersona | null;
}

export function BusinessPersonaReview({ businessId, initialPersona }: BusinessPersonaReviewProps) {
  const [persona, setPersona] = useState<BusinessPersona | null>(initialPersona || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<BusinessPersona>>({});
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateBusinessPersona(businessId);
      if (result.error) {
        setError(result.error);
      } else if (result.persona) {
        setPersona(result.persona);
      }
    } catch (err) {
      setError("Failed to generate persona");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      personality_traits: persona?.personality_traits || [],
      tone: persona?.tone || [],
      communication_style: persona?.communication_style || "",
      brand_values: persona?.brand_values || [],
      positioning: persona?.positioning || "",
      differentiators: persona?.differentiators || [],
      content_personality: persona?.content_personality || [],
      customer_facing_behavior: persona?.customer_facing_behavior || "",
      approved_claims: persona?.approved_claims || [],
      restricted_claims: persona?.restricted_claims || [],
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const result = await updateBusinessPersona(businessId, editData);
    if (result.error) {
      setError(result.error);
    } else if (result.persona) {
      setPersona(result.persona);
      setIsEditing(false);
      setEditData({});
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleApprove = async () => {
    const result = await approveBusinessPersona(businessId);
    if (result.error) {
      setError(result.error);
    } else if (result.persona) {
      setPersona(result.persona);
    }
  };

  if (!persona && !isGenerating) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-bold">Create Your AI&apos;s Personality</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Generate a Business Persona that defines how your AI represents your brand.
          </p>
          <Button onClick={handleGenerate} size="lg">
            Generate Business Persona
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
          <h2 className="text-xl font-bold">Generating your AI&apos;s personality...</h2>
          <p className="text-muted-foreground">
            Analyzing your business information to create the perfect persona.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
              <CardTitle>Your AI&apos;s Personality</CardTitle>
              <p className="text-sm text-muted-foreground">
                {persona?.approval_status === "approved" ? (
                  <Badge variant="default" className="mt-1">Approved</Badge>
                ) : (
                  <Badge variant="secondary" className="mt-1">Pending Review</Badge>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerate}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                  {persona?.approval_status !== "approved" && (
                    <Button size="sm" onClick={handleApprove}>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <EditingForm
              data={editData}
              onChange={setEditData}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          ) : (
            <DisplayPersona persona={persona!} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DisplayPersona({ persona }: { persona: BusinessPersona }) {
  return (
    <div className="space-y-6">
      <Section title="Personality" items={persona.personality_traits} />
      <Section title="Tone" items={persona.tone} />
      <Section title="Brand Values" items={persona.brand_values} />

      <div>
        <h3 className="font-medium mb-2">Positioning</h3>
        <p className="text-sm text-muted-foreground">{persona.positioning}</p>
      </div>

      <div>
        <h3 className="font-medium mb-2">Communication Style</h3>
        <p className="text-sm text-muted-foreground">{persona.communication_style}</p>
      </div>

      <div>
        <h3 className="font-medium mb-2">Customer-Facing Behavior</h3>
        <p className="text-sm text-muted-foreground">{persona.customer_facing_behavior}</p>
      </div>

      <Section title="Content Personality" items={persona.content_personality} />
      <Section title="Differentiators" items={persona.differentiators} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Emoji Preference</h3>
          <Badge variant="outline">{persona.emoji_preference}</Badge>
        </div>
        <div>
          <h3 className="font-medium mb-2">Formality</h3>
          <Badge variant="outline">{persona.formality}</Badge>
        </div>
      </div>

      {persona.preferred_phrases.length > 0 && (
        <Section title="Preferred Phrases" items={persona.preferred_phrases} />
      )}

      {persona.forbidden_phrases.length > 0 && (
        <Section title="Avoids" items={persona.forbidden_phrases} variant="destructive" />
      )}

      {persona.approved_claims.length > 0 && (
        <Section title="Approved Claims" items={persona.approved_claims} />
      )}

      {persona.restricted_claims.length > 0 && (
        <Section title="Restricted Claims" items={persona.restricted_claims} variant="destructive" />
      )}
    </div>
  );
}

function Section({
  title,
  items,
  variant = "default",
}: {
  title: string;
  items: string[];
  variant?: "default" | "destructive";
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="font-medium mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} variant={variant === "destructive" ? "destructive" : "secondary"}>
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function EditingForm({
  data,
  onChange,
  onSave,
  onCancel,
}: {
  data: Partial<BusinessPersona>;
  onChange: (data: Partial<BusinessPersona>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const handleArrayChange = (field: keyof BusinessPersona, value: string) => {
    const items = value.split(",").map(s => s.trim()).filter(Boolean);
    onChange({ ...data, [field]: items });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Personality Traits</label>
        <Input
          value={data.personality_traits?.join(", ") || ""}
          onChange={(e) => handleArrayChange("personality_traits", e.target.value)}
          placeholder="Friendly, Professional, Helpful"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Tone</label>
        <Input
          value={data.tone?.join(", ") || ""}
          onChange={(e) => handleArrayChange("tone", e.target.value)}
          placeholder="Friendly, Professional"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Communication Style</label>
        <Textarea
          value={data.communication_style || ""}
          onChange={(e) => onChange({ ...data, communication_style: e.target.value })}
          placeholder="Short, friendly and informative"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Brand Values</label>
        <Input
          value={data.brand_values?.join(", ") || ""}
          onChange={(e) => handleArrayChange("brand_values", e.target.value)}
          placeholder="Quality, Reliability, Customer Focus"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Positioning</label>
        <Textarea
          value={data.positioning || ""}
          onChange={(e) => onChange({ ...data, positioning: e.target.value })}
          placeholder="A reliable local supplier of..."
        />
      </div>

      <div>
        <label className="text-sm font-medium">Content Personality</label>
        <Input
          value={data.content_personality?.join(", ") || ""}
          onChange={(e) => handleArrayChange("content_personality", e.target.value)}
          placeholder="Practical, Visual, Event-focused"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Customer-Facing Behavior</label>
        <Textarea
          value={data.customer_facing_behavior || ""}
          onChange={(e) => onChange({ ...data, customer_facing_behavior: e.target.value })}
          placeholder="Represents the business in a friendly manner..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}
