"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Pencil, Loader2, Package, HelpCircle, MapPin, Tag, Users, FileText, ShoppingBag } from "lucide-react";
import {
  addProduct, updateProduct, deleteProduct,
  addService, updateService, deleteService,
  addFaq, updateFaq, deleteFaq,
  addFact, updateFact, deleteFact,
  addLocation, updateLocation, deleteLocation,
  addOffer, updateOffer, deleteOffer,
  addPersona, updatePersona, deletePersona,
} from "@/app/actions/knowledge";
import { createClient } from "@/lib/supabase/client";

export type KnowledgeType = "products" | "services" | "faqs" | "facts" | "locations" | "offers" | "personas";

interface KnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: KnowledgeType;
  businessId: string;
}

interface Item {
  id: string;
  [key: string]: unknown;
}

interface FieldConfig {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required?: boolean;
  options?: string[];
}

const TYPE_CONFIG: Record<KnowledgeType, { title: string; icon: React.ReactNode; fields: FieldConfig[]; tableName: string; displayName: (item: Item) => string; displayDesc: (item: Item) => string }> = {
  products: {
    title: "Products",
    icon: <Package className="h-4 w-4" />,
    tableName: "business_products",
    displayName: (item) => String(item.name || "Untitled"),
    displayDesc: (item) => String(item.description || ""),
    fields: [
      { id: "name", label: "Product Name", type: "text", required: true },
      { id: "description", label: "Description", type: "textarea" },
      { id: "price", label: "Price", type: "text" },
      { id: "price_visibility", label: "Price Visibility", type: "select", options: ["public", "private", "on_request"] },
    ],
  },
  services: {
    title: "Services",
    icon: <ShoppingBag className="h-4 w-4" />,
    tableName: "business_services",
    displayName: (item) => String(item.name || "Untitled"),
    displayDesc: (item) => String(item.description || ""),
    fields: [
      { id: "name", label: "Service Name", type: "text", required: true },
      { id: "description", label: "Description", type: "textarea" },
      { id: "price_text", label: "Price Info", type: "text" },
    ],
  },
  faqs: {
    title: "FAQs",
    icon: <HelpCircle className="h-4 w-4" />,
    tableName: "business_faqs",
    displayName: (item) => String(item.question || "Untitled"),
    displayDesc: (item) => String(item.answer || ""),
    fields: [
      { id: "question", label: "Question", type: "text", required: true },
      { id: "answer", label: "Answer", type: "textarea", required: true },
      { id: "category", label: "Category", type: "text" },
    ],
  },
  facts: {
    title: "Business Facts",
    icon: <FileText className="h-4 w-4" />,
    tableName: "business_facts",
    displayName: (item) => String(item.title || "Untitled"),
    displayDesc: (item) => String(item.content || ""),
    fields: [
      { id: "title", label: "Title", type: "text", required: true },
      { id: "content", label: "Content", type: "textarea", required: true },
      { id: "category", label: "Category", type: "select", options: ["general", "products", "services", "customers", "customer_needs", "customer_journey", "policies", "pricing", "differentiation", "content", "brand"] },
    ],
  },
  locations: {
    title: "Locations",
    icon: <MapPin className="h-4 w-4" />,
    tableName: "business_locations",
    displayName: (item) => String(item.name || "Untitled"),
    displayDesc: (item) => [item.city, item.region, item.country].filter(Boolean).join(", ") || "",
    fields: [
      { id: "name", label: "Location Name", type: "text", required: true },
      { id: "city", label: "City", type: "text" },
      { id: "region", label: "Region/State", type: "text" },
      { id: "country", label: "Country", type: "text" },
      { id: "service_area", label: "Service Area", type: "text" },
    ],
  },
  offers: {
    title: "Offers & Promotions",
    icon: <Tag className="h-4 w-4" />,
    tableName: "business_offers",
    displayName: (item) => String(item.name || "Untitled"),
    displayDesc: (item) => String(item.description || ""),
    fields: [
      { id: "name", label: "Offer Name", type: "text", required: true },
      { id: "description", label: "Description", type: "textarea", required: true },
      { id: "discount_text", label: "Discount Text", type: "text" },
      { id: "terms", label: "Terms & Conditions", type: "textarea" },
    ],
  },
  personas: {
    title: "Customer Personas",
    icon: <Users className="h-4 w-4" />,
    tableName: "customer_personas",
    displayName: (item) => String(item.name || "Untitled"),
    displayDesc: (item) => String(item.description || ""),
    fields: [
      { id: "name", label: "Persona Name", type: "text", required: true },
      { id: "description", label: "Description", type: "textarea" },
      { id: "pain_points", label: "Pain Points", type: "textarea" },
      { id: "needs", label: "Needs", type: "textarea" },
    ],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ADD_FN: Record<KnowledgeType, (businessId: string, data: any) => Promise<any>> = {
  products: addProduct,
  services: addService,
  faqs: addFaq,
  facts: addFact,
  locations: addLocation,
  offers: addOffer,
  personas: addPersona,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UPDATE_FN: Record<KnowledgeType, (id: string, data: any) => Promise<any>> = {
  products: updateProduct,
  services: updateService,
  faqs: updateFaq,
  facts: updateFact,
  locations: updateLocation,
  offers: updateOffer,
  personas: updatePersona,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DELETE_FN: Record<KnowledgeType, (id: string) => Promise<any>> = {
  products: deleteProduct,
  services: deleteService,
  faqs: deleteFaq,
  facts: deleteFact,
  locations: deleteLocation,
  offers: deleteOffer,
  personas: deletePersona,
};

export function KnowledgeDialog({ open, onOpenChange, type, businessId }: KnowledgeDialogProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const config = TYPE_CONFIG[type];

  useEffect(() => {
    if (open) {
      loadItems();
      setShowForm(false);
      setEditing(null);
      setFormData({});
    }
  }, [open, type]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from(config.tableName)
        .select("*")
        .eq("business_id", businessId)
        .eq("is_active", true);
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let result;
      if (editing) {
        result = await UPDATE_FN[type](editing.id, formData);
      } else {
        result = await ADD_FN[type](businessId, formData);
      }
      if (result && "success" in result && result.success) {
        setShowForm(false);
        setEditing(null);
        setFormData({});
        await loadItems();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await DELETE_FN[type](id);
    await loadItems();
  };

  const startEdit = (item: Item) => {
    setEditing(item);
    const form: Record<string, string> = {};
    config.fields.forEach((f) => {
      form[f.id] = String(item[f.id] ?? "");
    });
    setFormData(form);
    setShowForm(true);
  };

  const startAdd = () => {
    setEditing(null);
    const form: Record<string, string> = {};
    config.fields.forEach((f) => {
      form[f.id] = "";
    });
    setFormData(form);
    setShowForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {showForm ? (editing ? `Edit ${config.title.slice(0, -1)}` : `Add ${config.title.slice(0, -1)}`) : config.title}
          </DialogTitle>
          <DialogDescription>
            {showForm ? "Fill in the details below" : `Manage your ${config.title.toLowerCase()}`}
          </DialogDescription>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-4">
            <Button onClick={startAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add {config.title.slice(0, -1)}
            </Button>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {config.title.toLowerCase()} added yet.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{config.displayName(item)}</div>
                          {config.displayDesc(item) && (
                            <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {config.displayDesc(item)}
                            </div>
                          )}
                          {type === "facts" && "category" in item && typeof item.category === "string" && (
                            <Badge variant="outline" className="mt-1 text-xs">{item.category}</Badge>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>
                {field.type === "text" && (
                  <Input
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  />
                )}
                {field.type === "textarea" && (
                  <Textarea
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    rows={3}
                  />
                )}
                {field.type === "select" && field.options && (
                  <div className="flex flex-wrap gap-1">
                    {field.options.map((opt) => (
                      <Badge
                        key={opt}
                        variant={formData[field.id] === opt ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFormData({ ...formData, [field.id]: opt })}
                      >
                        {opt}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? "Update" : "Add"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
