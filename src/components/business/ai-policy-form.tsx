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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { aiPolicySchema, type AiPolicyInput } from "@/lib/validators";
import { createAuditLog, AuditActions } from "@/lib/audit";
import type { AiPolicy } from "@/types/database";

interface AiPolicyFormProps {
  businessId: string;
  aiPolicy: AiPolicy | null;
}

export function AiPolicyForm({ businessId, aiPolicy }: AiPolicyFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AiPolicyInput>({
    resolver: zodResolver(aiPolicySchema),
    defaultValues: {
      autonomy_level: aiPolicy?.autonomy_level || "assistant",
      require_approval_discount: aiPolicy?.require_approval_discount ?? true,
      require_approval_refund: aiPolicy?.require_approval_refund ?? true,
      require_approval_complaint: aiPolicy?.require_approval_complaint ?? true,
      require_approval_pricing: aiPolicy?.require_approval_pricing ?? true,
      require_approval_legal: aiPolicy?.require_approval_legal ?? true,
      require_approval_medical: aiPolicy?.require_approval_medical ?? true,
      require_approval_partnership: aiPolicy?.require_approval_partnership ?? true,
      require_approval_promises: aiPolicy?.require_approval_promises ?? true,
    },
  });

  const autonomyLevel = watch("autonomy_level");

  const onSubmit = async (data: AiPolicyInput) => {
    setIsSaving(true);

    try {
      const supabase = createClient();

      if (aiPolicy) {
        const { error } = await supabase
          .from("ai_policies")
          .update({
            autonomy_level: data.autonomy_level,
            require_approval_discount: data.require_approval_discount,
            require_approval_refund: data.require_approval_refund,
            require_approval_complaint: data.require_approval_complaint,
            require_approval_pricing: data.require_approval_pricing,
            require_approval_legal: data.require_approval_legal,
            require_approval_medical: data.require_approval_medical,
            require_approval_partnership: data.require_approval_partnership,
            require_approval_promises: data.require_approval_promises,
            updated_at: new Date().toISOString(),
          })
          .eq("id", aiPolicy.id);

        if (error) {
          addToast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update AI policy",
          });
          return;
        }
      } else {
        const { error } = await supabase.from("ai_policies").insert({
          business_id: businessId,
          autonomy_level: data.autonomy_level,
          require_approval_discount: data.require_approval_discount,
          require_approval_refund: data.require_approval_refund,
          require_approval_complaint: data.require_approval_complaint,
          require_approval_pricing: data.require_approval_pricing,
          require_approval_legal: data.require_approval_legal,
          require_approval_medical: data.require_approval_medical,
          require_approval_partnership: data.require_approval_partnership,
          require_approval_promises: data.require_approval_promises,
        });

        if (error) {
          addToast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create AI policy",
          });
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createAuditLog({
          businessId,
          userId: user.id,
          action: AuditActions.AI_POLICY_UPDATED,
          entityType: "ai_policy",
          metadata: { autonomy_level: data.autonomy_level },
        });
      }

      addToast({
        variant: "success",
        title: "Success",
        description: "AI policy updated successfully",
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <Label>Autonomy Level</Label>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={cn(
              "rounded-md border p-4 cursor-pointer transition-colors",
              autonomyLevel === "assistant"
                ? "border-primary bg-primary/5"
                : "border-muted"
            )}
            onClick={() =>
              setValue("autonomy_level", "assistant", { shouldValidate: true })
            }
          >
            <div className="font-medium">Assistant</div>
            <div className="text-sm text-muted-foreground">
              AI prepares actions but requires approval
            </div>
          </div>
          <div
            className={cn(
              "rounded-md border p-4 cursor-pointer transition-colors",
              autonomyLevel === "manager"
                ? "border-primary bg-primary/5"
                : "border-muted"
            )}
            onClick={() =>
              setValue("autonomy_level", "manager", { shouldValidate: true })
            }
          >
            <div className="font-medium">Manager</div>
            <div className="text-sm text-muted-foreground">
              AI performs routine actions automatically
            </div>
          </div>
        </div>
        {errors.autonomy_level && (
          <p className="text-sm text-destructive">
            {errors.autonomy_level.message}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>Approval Requirements</Label>
        <p className="text-sm text-muted-foreground">
          AI will require your approval before performing these actions.
        </p>
        <div className="space-y-3">
          {[
            { key: "require_approval_discount" as const, label: "Discounts" },
            { key: "require_approval_refund" as const, label: "Refunds" },
            { key: "require_approval_complaint" as const, label: "Complaints" },
            { key: "require_approval_pricing" as const, label: "Pricing changes" },
            { key: "require_approval_legal" as const, label: "Legal claims" },
            { key: "require_approval_medical" as const, label: "Medical claims" },
            { key: "require_approval_partnership" as const, label: "Partnerships" },
            { key: "require_approval_promises" as const, label: "Promises/Commitments" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <Label htmlFor={item.key} className="cursor-pointer">
                {item.label}
              </Label>
              <Checkbox
                id={item.key}
                checked={watch(item.key)}
                onCheckedChange={(checked) =>
                  setValue(item.key, checked === true, { shouldValidate: true })
                }
              />
            </div>
          ))}
        </div>
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
