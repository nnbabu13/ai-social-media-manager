"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Edit2, Trash2, Plus, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { CustomerPersonaData } from "@/app/actions/customer-persona";
import {
  getCustomerPersonas,
  generateCustomerPersonas,
  updateCustomerPersona,
  addCustomerPersona,
  deactivateCustomerPersona,
  approveCustomerPersona,
} from "@/app/actions/customer-persona";

interface CustomerPersonaReviewProps {
  businessId: string;
}

export function CustomerPersonaReview({ businessId }: CustomerPersonaReviewProps) {
  const [personas, setPersonas] = useState<CustomerPersonaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<CustomerPersonaData>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonas();
  }, [businessId]);

  const loadPersonas = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomerPersonas(businessId);
      setPersonas(data);
    } catch (err) {
      setError("Failed to load personas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateCustomerPersonas(businessId);
      if (result.error) {
        setError(result.error);
      } else if (result.personas) {
        setPersonas(result.personas);
      }
    } catch (err) {
      setError("Failed to generate personas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = (persona: CustomerPersonaData) => {
    setEditingId(persona.id);
    setEditData({
      name: persona.name,
      description: persona.description || "",
      segments: persona.segments || [],
      needs: persona.needs || [],
      pain_points: persona.pain_points || [],
      buying_triggers: persona.buying_triggers || [],
      objections: persona.objections || [],
      decision_factors: persona.decision_factors || [],
      desired_outcomes: persona.desired_outcomes || [],
      content_interests: persona.content_interests || [],
      preferred_channels: persona.preferred_channels || [],
      conversion_action: persona.conversion_action || "",
      priority: persona.priority as "primary" | "secondary" | "occasional",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const result = await updateCustomerPersona(editingId, editData);
    if (result.error) {
      setError(result.error);
    } else if (result.persona) {
      setPersonas(personas.map(p => p.id === editingId ? result.persona! : p));
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDeactivate = async (personaId: string) => {
    const result = await deactivateCustomerPersona(personaId);
    if (result.error) {
      setError(result.error);
    } else {
      setPersonas(personas.filter(p => p.id !== personaId));
    }
  };

  const handleApprove = async (personaId: string) => {
    const result = await approveCustomerPersona(personaId);
    if (result.error) {
      setError(result.error);
    } else if (result.persona) {
      setPersonas(personas.map(p => p.id === personaId ? result.persona! : p));
    }
  };

  const handleAddPersona = async (newPersona: Omit<CustomerPersonaData, "id" | "business_id" | "created_at" | "updated_at">) => {
    const result = await addCustomerPersona(businessId, newPersona);
    if (result.error) {
      setError(result.error);
    } else if (result.persona) {
      setPersonas([...personas, result.persona]);
      setShowAddForm(false);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Customers</CardTitle>
              <p className="text-sm text-muted-foreground">
                {personas.length} persona(s) defined
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Persona
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Generate Personas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
              {error}
            </div>
          )}

          {personas.length === 0 && !isGenerating ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No personas yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate personas based on your business information, or add one manually.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {personas.map(persona => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isExpanded={expandedId === persona.id}
                  isEditing={editingId === persona.id}
                  editData={editData}
                  onToggleExpand={() => setExpandedId(expandedId === persona.id ? null : persona.id)}
                  onEdit={() => handleEdit(persona)}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onChangeEditData={setEditData}
                  onDeactivate={() => handleDeactivate(persona.id)}
                  onApprove={() => handleApprove(persona.id)}
                />
              ))}
            </div>
          )}

          {showAddForm && (
            <AddPersonaForm
              onSave={handleAddPersona}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PersonaCard({
  persona,
  isExpanded,
  isEditing,
  editData,
  onToggleExpand,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onChangeEditData,
  onDeactivate,
  onApprove,
}: {
  persona: CustomerPersonaData;
  isExpanded: boolean;
  isEditing: boolean;
  editData: Partial<CustomerPersonaData>;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditData: (data: Partial<CustomerPersonaData>) => void;
  onDeactivate: () => void;
  onApprove: () => void;
}) {
  const priorityColor = {
    primary: "default",
    secondary: "secondary",
    occasional: "outline",
  }[persona.priority] || "outline";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <div>
              <h3 className="font-medium">{persona.name}</h3>
              <div className="flex gap-2 mt-1">
                <Badge variant={priorityColor as "default" | "secondary" | "outline"}>
                  {persona.priority}
                </Badge>
                {persona.source_type === "owner_confirmed" && (
                  <Badge variant="default">Confirmed</Badge>
                )}
                {persona.approval_status === "pending" && (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                {persona.approval_status === "pending" && (
                  <Button variant="ghost" size="sm" onClick={onApprove}>
                    Approve
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onDeactivate}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {isEditing ? (
            <EditingForm
              data={editData}
              onChange={onChangeEditData}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{persona.description}</p>

              {persona.segments && persona.segments.length > 0 && (
                <Section title="Segments" items={persona.segments} />
              )}

              {persona.needs && persona.needs.length > 0 && (
                <Section title="Needs" items={persona.needs} />
              )}

              {persona.pain_points && persona.pain_points.length > 0 && (
                <Section title="Pain Points" items={persona.pain_points} />
              )}

              {persona.buying_triggers && persona.buying_triggers.length > 0 && (
                <Section title="Buying Triggers" items={persona.buying_triggers} />
              )}

              {persona.objections && persona.objections.length > 0 && (
                <Section title="Objections" items={persona.objections} />
              )}

              {persona.decision_factors && persona.decision_factors.length > 0 && (
                <Section title="Decision Factors" items={persona.decision_factors} />
              )}

              {persona.desired_outcomes && persona.desired_outcomes.length > 0 && (
                <Section title="Desired Outcomes" items={persona.desired_outcomes} />
              )}

              {persona.content_interests && persona.content_interests.length > 0 && (
                <Section title="Content Interests" items={persona.content_interests} />
              )}

              {persona.preferred_channels && persona.preferred_channels.length > 0 && (
                <Section title="Preferred Channels" items={persona.preferred_channels} />
              )}

              {persona.conversion_action && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Conversion Action</h4>
                  <p className="text-sm text-muted-foreground">{persona.conversion_action}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
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
  data: Partial<CustomerPersonaData>;
  onChange: (data: Partial<CustomerPersonaData>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const handleArrayChange = (field: keyof CustomerPersonaData, value: string) => {
    const items = value.split(",").map(s => s.trim()).filter(Boolean);
    onChange({ ...data, [field]: items });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          value={data.name || ""}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={data.description || ""}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Needs (comma-separated)</label>
        <Input
          value={data.needs?.join(", ") || ""}
          onChange={(e) => handleArrayChange("needs", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Pain Points (comma-separated)</label>
        <Input
          value={data.pain_points?.join(", ") || ""}
          onChange={(e) => handleArrayChange("pain_points", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Buying Triggers (comma-separated)</label>
        <Input
          value={data.buying_triggers?.join(", ") || ""}
          onChange={(e) => handleArrayChange("buying_triggers", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Content Interests (comma-separated)</label>
        <Input
          value={data.content_interests?.join(", ") || ""}
          onChange={(e) => handleArrayChange("content_interests", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Conversion Action</label>
        <Input
          value={data.conversion_action || ""}
          onChange={(e) => onChange({ ...data, conversion_action: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Priority</label>
        <select
          value={data.priority || "secondary"}
          onChange={(e) => onChange({ ...data, priority: e.target.value as "primary" | "secondary" | "occasional" })}
          className="w-full border rounded px-3 py-2"
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="occasional">Occasional</option>
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  );
}

function AddPersonaForm({
  onSave,
  onCancel,
}: {
  onSave: (persona: Omit<CustomerPersonaData, "id" | "business_id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<Partial<CustomerPersonaData>>({
    name: "",
    description: "",
    needs: [],
    pain_points: [],
    buying_triggers: [],
    content_interests: [],
    conversion_action: "",
    priority: "secondary",
    source_type: "owner_confirmed",
    approval_status: "approved",
    is_active: true,
  });

  const handleArrayChange = (field: keyof CustomerPersonaData, value: string) => {
    const items = value.split(",").map(s => s.trim()).filter(Boolean);
    setData({ ...data, [field]: items });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Add Customer Persona</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={data.name || ""}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="e.g., Event Organizers"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={data.description || ""}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Who are these customers?"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Needs (comma-separated)</label>
            <Input
              value={data.needs?.join(", ") || ""}
              onChange={(e) => handleArrayChange("needs", e.target.value)}
              placeholder="e.g., Reliable supply, Customization"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Pain Points (comma-separated)</label>
            <Input
              value={data.pain_points?.join(", ") || ""}
              onChange={(e) => handleArrayChange("pain_points", e.target.value)}
              placeholder="e.g., Late deliveries, Poor quality"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Conversion Action</label>
            <Input
              value={data.conversion_action || ""}
              onChange={(e) => setData({ ...data, conversion_action: e.target.value })}
              placeholder="e.g., Request quotation via WhatsApp"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button
              onClick={() => onSave(data as Omit<CustomerPersonaData, "id" | "business_id" | "created_at" | "updated_at">)}
              disabled={!data.name}
            >
              Add Persona
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
