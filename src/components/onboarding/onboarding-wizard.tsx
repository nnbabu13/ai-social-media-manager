"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { slugify } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

const steps = [
  { id: 1, title: "Business", description: "Tell us about your business" },
  { id: 2, title: "Goals", description: "What do you want to achieve?" },
  { id: 3, title: "Brand", description: "Define your brand voice" },
  { id: 4, title: "AI Rules", description: "Set AI preferences" },
];

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

interface BusinessData {
  name: string;
  website_url: string;
  category: string;
  description: string;
  country: string;
  region: string;
  city: string;
  target_customers: string;
}

interface GoalsData {
  goals: string[];
  primary_goal: string;
}

interface BrandData {
  tone: string;
  style_description: string;
  avoid_words: string;
}

interface AiPolicyData {
  autonomy_level: "assistant" | "manager";
  require_approval_discount: boolean;
  require_approval_refund: boolean;
  require_approval_complaint: boolean;
  require_approval_pricing: boolean;
  require_approval_legal: boolean;
  require_approval_medical: boolean;
  require_approval_partnership: boolean;
  require_approval_promises: boolean;
}

export function OnboardingWizard() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [businessData, setBusinessData] = useState<BusinessData>({
    name: "",
    website_url: "",
    category: "",
    description: "",
    country: "",
    region: "",
    city: "",
    target_customers: "",
  });

  const [goalsData, setGoalsData] = useState<GoalsData>({
    goals: [],
    primary_goal: "",
  });

  const [brandData, setBrandData] = useState<BrandData>({
    tone: "",
    style_description: "",
    avoid_words: "",
  });

  const [aiPolicyData, setAiPolicyData] = useState<AiPolicyData>({
    autonomy_level: "assistant",
    require_approval_discount: true,
    require_approval_refund: true,
    require_approval_complaint: true,
    require_approval_pricing: true,
    require_approval_legal: true,
    require_approval_medical: true,
    require_approval_partnership: true,
    require_approval_promises: true,
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGoal = (goal: string) => {
    setGoalsData((prev) => {
      const goals = prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal];
      return { ...prev, goals };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const slug = slugify(businessData.name);

      const result = await completeOnboarding({
        business: {
          name: businessData.name,
          slug,
          category: businessData.category,
          website_url: businessData.website_url || null,
          description: businessData.description || null,
          country: businessData.country || null,
          region: businessData.region || null,
          city: businessData.city || null,
          target_customers: businessData.target_customers || null,
        },
        goals: goalsData.goals.map((goal) => ({
          goal,
          is_primary: goal === goalsData.primary_goal,
        })),
        brand: {
          tone: brandData.tone,
          style_description: brandData.style_description || null,
          avoid_words: brandData.avoid_words || null,
        },
        aiPolicy: {
          autonomy_level: aiPolicyData.autonomy_level,
          require_approval_discount: aiPolicyData.require_approval_discount,
          require_approval_refund: aiPolicyData.require_approval_refund,
          require_approval_complaint: aiPolicyData.require_approval_complaint,
          require_approval_pricing: aiPolicyData.require_approval_pricing,
          require_approval_legal: aiPolicyData.require_approval_legal,
          require_approval_medical: aiPolicyData.require_approval_medical,
          require_approval_partnership: aiPolicyData.require_approval_partnership,
          require_approval_promises: aiPolicyData.require_approval_promises,
        },
      });

      if (result.error) {
        addToast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        return;
      }

      addToast({
        variant: "success",
        title: "Business created",
        description: "Your business has been set up successfully",
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      addToast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Set up your business</h1>
          <p className="text-muted-foreground">
            Complete the steps below to get started
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium",
                  currentStep > step.id
                    ? "border-green-500 bg-green-500 text-white"
                    : currentStep === step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "ml-2 hidden text-sm font-medium md:block",
                  currentStep === step.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 hidden h-px w-12 md:block",
                    currentStep > step.id ? "bg-green-500" : "bg-muted-foreground"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <BusinessStep
                data={businessData}
                onChange={setBusinessData}
              />
            )}
            {currentStep === 2 && (
              <GoalsStep data={goalsData} onChange={setGoalsData} />
            )}
            {currentStep === 3 && (
              <BrandStep data={brandData} onChange={setBrandData} />
            )}
            {currentStep === 4 && (
              <AiPolicyStep data={aiPolicyData} onChange={setAiPolicyData} />
            )}

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BusinessStep({
  data,
  onChange,
}: {
  data: BusinessData;
  onChange: (data: BusinessData) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Business Name *</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="My Business"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={data.website_url}
          onChange={(e) => onChange({ ...data, website_url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={data.category}
          onValueChange={(value) => onChange({ ...data, category: value })}
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Brief description of your business"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={data.country}
            onChange={(e) => onChange({ ...data, country: e.target.value })}
            placeholder="Country"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            value={data.region}
            onChange={(e) => onChange({ ...data, region: e.target.value })}
            placeholder="Region"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => onChange({ ...data, city: e.target.value })}
            placeholder="City"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="target_customers">Target Customers</Label>
        <Textarea
          id="target_customers"
          value={data.target_customers}
          onChange={(e) =>
            onChange({ ...data, target_customers: e.target.value })
          }
          placeholder="Describe your ideal customers"
        />
      </div>
    </div>
  );
}

function GoalsStep({
  data,
  onChange,
}: {
  data: GoalsData;
  onChange: (data: GoalsData) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select your goals and choose one primary goal.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {availableGoals.map((goal) => (
          <div
            key={goal}
            className={cn(
              "flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-colors",
              data.goals.includes(goal)
                ? "border-primary bg-primary/5"
                : "border-muted"
            )}
            onClick={() => {
              const newGoals = data.goals.includes(goal)
                ? data.goals.filter((g) => g !== goal)
                : [...data.goals, goal];
              onChange({
                ...data,
                goals: newGoals,
                primary_goal:
                  data.primary_goal === goal && !data.goals.includes(goal)
                    ? ""
                    : data.primary_goal,
              });
            }}
          >
            <Checkbox checked={data.goals.includes(goal)} />
            <span className="text-sm">{goal}</span>
          </div>
        ))}
      </div>
      {data.goals.length > 0 && (
        <div className="space-y-2">
          <Label>Primary Goal *</Label>
          <Select
            value={data.primary_goal}
            onValueChange={(value) => onChange({ ...data, primary_goal: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select primary goal" />
            </SelectTrigger>
            <SelectContent>
              {data.goals.map((goal) => (
                <SelectItem key={goal} value={goal}>
                  {goal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function BrandStep({
  data,
  onChange,
}: {
  data: BrandData;
  onChange: (data: BrandData) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tone *</Label>
        <div className="grid grid-cols-3 gap-2">
          {tones.map((tone) => (
            <div
              key={tone}
              className={cn(
                "flex items-center justify-center rounded-md border p-3 cursor-pointer transition-colors text-sm",
                data.tone === tone
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted hover:border-primary"
              )}
              onClick={() => onChange({ ...data, tone })}
            >
              {tone}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="style_description">Writing Style</Label>
        <Textarea
          id="style_description"
          value={data.style_description}
          onChange={(e) =>
            onChange({ ...data, style_description: e.target.value })
          }
          placeholder="Describe your preferred writing style"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avoid_words">Things to Avoid</Label>
        <Textarea
          id="avoid_words"
          value={data.avoid_words}
          onChange={(e) => onChange({ ...data, avoid_words: e.target.value })}
          placeholder="Words or phrases AI should avoid"
        />
      </div>
    </div>
  );
}

function AiPolicyStep({
  data,
  onChange,
}: {
  data: AiPolicyData;
  onChange: (data: AiPolicyData) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Autonomy Level</Label>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={cn(
              "rounded-md border p-4 cursor-pointer transition-colors",
              data.autonomy_level === "assistant"
                ? "border-primary bg-primary/5"
                : "border-muted"
            )}
            onClick={() => onChange({ ...data, autonomy_level: "assistant" })}
          >
            <div className="font-medium">Assistant</div>
            <div className="text-sm text-muted-foreground">
              AI prepares actions but requires approval
            </div>
          </div>
          <div
            className={cn(
              "rounded-md border p-4 cursor-pointer transition-colors",
              data.autonomy_level === "manager"
                ? "border-primary bg-primary/5"
                : "border-muted"
            )}
            onClick={() => onChange({ ...data, autonomy_level: "manager" })}
          >
            <div className="font-medium">Manager</div>
            <div className="text-sm text-muted-foreground">
              AI performs routine actions automatically
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>Approval Requirements</Label>
        <p className="text-sm text-muted-foreground">
          AI will require your approval before performing these actions.
        </p>
        <div className="space-y-3">
          {[
            { key: "require_approval_discount", label: "Discounts" },
            { key: "require_approval_refund", label: "Refunds" },
            { key: "require_approval_complaint", label: "Complaints" },
            { key: "require_approval_pricing", label: "Pricing changes" },
            { key: "require_approval_legal", label: "Legal claims" },
            { key: "require_approval_medical", label: "Medical claims" },
            { key: "require_approval_partnership", label: "Partnerships" },
            { key: "require_approval_promises", label: "Promises/Commitments" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between"
            >
              <Label htmlFor={item.key} className="cursor-pointer">
                {item.label}
              </Label>
              <Checkbox
                id={item.key}
                checked={
                  data[item.key as keyof AiPolicyData] as boolean
                }
                onCheckedChange={(checked) =>
                  onChange({
                    ...data,
                    [item.key]: checked === true,
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
