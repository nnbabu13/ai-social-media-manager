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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { goalsSchema, type GoalsInput } from "@/lib/validators";
import { createAuditLog, AuditActions } from "@/lib/audit";
import type { BusinessGoal } from "@/types/database";

const availableGoals = [
  "Get more customers",
  "Generate leads",
  "Increase sales",
  "Grow followers",
  "Increase engagement",
  "Build brand awareness",
  "Promote products/services",
  "Increase website traffic",
  "Get more enquiries",
  "Increase repeat customers",
  "Other",
];

interface GoalsFormProps {
  businessId: string;
  goals: BusinessGoal[];
}

export function GoalsForm({ businessId, goals }: GoalsFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const selectedGoals = goals.map((g) => g.goal);
  const primaryGoal = goals.find((g) => g.is_primary)?.goal || "";

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GoalsInput>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      goals: selectedGoals,
      primary_goal: primaryGoal,
    },
  });

  const selectedGoalsValue = watch("goals");
  const primaryGoalValue = watch("primary_goal");

  const toggleGoal = (goal: string) => {
    const currentGoals = watch("goals");
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter((g) => g !== goal)
      : [...currentGoals, goal];
    setValue("goals", newGoals, { shouldValidate: true });

    if (primaryGoalValue === goal && !currentGoals.includes(goal)) {
      setValue("primary_goal", "", { shouldValidate: true });
    }
  };

  const onSubmit = async (data: GoalsInput) => {
    setIsSaving(true);

    try {
      const supabase = createClient();

      await supabase
        .from("business_goals")
        .delete()
        .eq("business_id", businessId);

      if (data.goals.length > 0) {
        const { error } = await supabase.from("business_goals").insert(
          data.goals.map((goal) => ({
            business_id: businessId,
            goal,
            is_primary: goal === data.primary_goal,
          }))
        );

        if (error) {
          addToast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update goals",
          });
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createAuditLog({
          businessId,
          userId: user.id,
          action: AuditActions.GOALS_UPDATED,
          entityType: "goal",
          metadata: { goals: data.goals },
        });
      }

      addToast({
        variant: "success",
        title: "Success",
        description: "Goals updated successfully",
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
        <Label>Select your goals</Label>
        <div className="grid grid-cols-2 gap-3">
          {availableGoals.map((goal) => (
            <div
              key={goal}
              className="flex items-center space-x-2"
            >
              <Checkbox
                id={goal}
                checked={selectedGoalsValue.includes(goal)}
                onCheckedChange={() => toggleGoal(goal)}
              />
              <Label htmlFor={goal} className="cursor-pointer">
                {goal}
              </Label>
            </div>
          ))}
        </div>
        {errors.goals && (
          <p className="text-sm text-destructive">{errors.goals.message}</p>
        )}
      </div>

      {selectedGoalsValue.length > 0 && (
        <div className="space-y-2">
          <Label>Primary Goal</Label>
          <Select
            value={primaryGoalValue}
            onValueChange={(value) =>
              setValue("primary_goal", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select primary goal" />
            </SelectTrigger>
            <SelectContent>
              {selectedGoalsValue.map((goal) => (
                <SelectItem key={goal} value={goal}>
                  {goal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.primary_goal && (
            <p className="text-sm text-destructive">
              {errors.primary_goal.message}
            </p>
          )}
        </div>
      )}

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
