"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { businessInfoSchema, type BusinessInfoInput } from "@/lib/validators";
import { createAuditLog, AuditActions } from "@/lib/audit";
import type { Business } from "@/types/database";

const categories = [
  "Restaurant & Food",
  "Retail & E-commerce",
  "Professional Services",
  "Health & Wellness",
  "Education",
  "Technology",
  "Real Estate",
  "Travel & Hospitality",
  "Entertainment",
  "Non-profit",
  "Other",
];

export function BusinessInfoForm({ business }: { business: Business }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessInfoInput>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      name: business.name,
      website_url: business.website_url || "",
      category: business.category,
      description: business.description || "",
      country: business.country || "",
      region: business.region || "",
      city: business.city || "",
      target_customers: business.target_customers || "",
    },
  });

  const onSubmit = async (data: BusinessInfoInput) => {
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("businesses")
        .update({
          name: data.name,
          website_url: data.website_url || null,
          category: data.category,
          description: data.description || null,
          country: data.country || null,
          region: data.region || null,
          city: data.city || null,
          target_customers: data.target_customers || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", business.id);

      if (error) {
        addToast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update business",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createAuditLog({
          businessId: business.id,
          userId: user.id,
          action: AuditActions.BUSINESS_UPDATED,
          entityType: "business",
          entityId: business.id,
        });
      }

      addToast({
        variant: "success",
        title: "Success",
        description: "Business updated successfully",
      });

      router.refresh();
    } catch (error) {
      addToast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Business Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={watch("category")}
            onValueChange={(value) => setValue("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website</Label>
        <Input id="website_url" {...register("website_url")} placeholder="https://example.com" />
        {errors.website_url && (
          <p className="text-sm text-destructive">{errors.website_url.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register("country")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input id="region" {...register("region")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_customers">Target Customers</Label>
        <Textarea id="target_customers" {...register("target_customers")} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
