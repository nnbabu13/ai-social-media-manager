export type ProfilingStage =
  | "customer_segments"
  | "customer_needs"
  | "buying_triggers"
  | "pain_points"
  | "differentiators"
  | "conversion_actions"
  | "content_interests"
  | "communication_preferences";

export interface ProfilingOption {
  id: string;
  label: string;
  description?: string;
}

export interface ProfilingQuestion {
  id: string;
  title: string;
  description?: string;
  stage: ProfilingStage;
  selection_mode: "single" | "multiple";
  options: ProfilingOption[];
  allow_other: boolean;
  allow_none: boolean;
  required: boolean;
}

export interface ProfilingAnswer {
  question_id: string;
  selected_option_ids: string[];
  custom_text?: string;
}

export interface ProfilingScreen {
  id: string;
  title: string;
  description: string;
  questions: ProfilingQuestion[];
}

export interface ProfilingSession {
  id: string;
  business_id: string;
  status: "in_progress" | "completed";
  current_screen: number;
  answers: ProfilingAnswer[];
  screens: ProfilingScreen[];
}

export interface GeneratedPersona {
  name: string;
  description: string;
  segments: string[];
  needs: string[];
  pain_points: string[];
  buying_triggers: string[];
  objections: string[];
  content_interests: string[];
  preferred_channels: string[];
  priority: "primary" | "secondary" | "occasional";
  confidence: number;
  source: "owner_confirmed" | "ai_derived";
}

export interface PersonaReviewData {
  personas: GeneratedPersona[];
  derived_insights: string[];
}

export const PROFILING_STAGES: { key: ProfilingStage; label: string; icon: string }[] = [
  { key: "customer_segments", label: "Customers", icon: "1" },
  { key: "customer_needs", label: "Needs", icon: "2" },
  { key: "buying_triggers", label: "Triggers", icon: "3" },
  { key: "pain_points", label: "Pain points", icon: "4" },
  { key: "differentiators", label: "Differentiation", icon: "5" },
  { key: "conversion_actions", label: "Goals", icon: "6" },
  { key: "content_interests", label: "Content", icon: "7" },
  { key: "communication_preferences", label: "Communication", icon: "8" },
];
