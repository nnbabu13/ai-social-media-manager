"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { brandProfileSchema, type BrandProfileInput } from "@/lib/validators";
import { createAuditLog, AuditActions } from "@/lib/audit";
import type { BrandProfile } from "@/types/database";

const tones = [
  "Professional",
  "Friendly",
  "Casual",
  "Premium",
  "Expert",
  "Funny",
  "Educational",
  "Bold",
  "Helpful",
  "Local",
  "Conversational",
];

interface BrandProfileFormProps {
  businessId: string;
  brandProfile: BrandProfile | null;
}

export function BrandProfileForm({
  businessId,
  brandProfile,
}: BrandProfileFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BrandProfileInput>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      tone: brandProfile?.tone || "",
      style_description: brandProfile?.style_description || "",
      avoid_words: brandProfile?.avoid_words || "",
    },
  });

  const toneValue = watch("tone");

  const onSubmit = async (data: BrandProfileInput) => {
    setIsSaving(true);

    try {
      const supabase = createClient();

      if (brandProfile) {
        const { error } = await supabase
          .from("brand_profiles")
          .update({
            tone: data.tone,
            style_description: data.style_description || null,
            avoid_words: data.avoid_words || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", brandProfile.id);

        if (error) {
          addToast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update brand profile",
          });
          return;
        }
      } else {
        const { error } = await supabase.from("brand_profiles").insert({
          business_id: businessId,
          tone: data.tone,
          style_description: data.style_description || null,
          avoid_words: data.avoid_words || null,
        });

        if (error) {
          addToast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create brand profile",
          });
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createAuditLog({
          businessId,
          userId: user.id,
          action: AuditActions.BRAND_PROFILE_UPDATED,
          entityType: "brand_profile",
          metadata: { tone: data.tone },
        });
      }

      addToast({
        variant: "success",
        title: "Success",
        description: "Brand profile updated successfully",
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
      <div className="space-y-2">
        <Label>Tone</Label>
        <div className="grid grid-cols-3 gap-2">
          {tones.map((tone) => (
            <div
              key={tone}
              className={cn(
                "flex items-center justify-center rounded-md border p-3 cursor-pointer transition-colors text-sm",
                toneValue === tone
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted hover:border-primary"
              )}
              onClick={() => setValue("tone", tone, { shouldValidate: true })}
            >
              {tone}
            </div>
          ))}
        </div>
        {errors.tone && (
          <p className="text-sm text-destructive">{errors.tone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="style_description">Writing Style</Label>
        <Textarea
          id="style_description"
          {...register("style_description")}
          placeholder="Describe your preferred writing style"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avoid_words">Things to Avoid</Label>
        <Textarea
          id="avoid_words"
          {...register("avoid_words")}
          placeholder="Words or phrases AI should avoid"
        />
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
