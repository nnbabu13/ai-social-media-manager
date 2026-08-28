import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const businessInfoSchema = z.object({
  name: z.string().min(1, "Business name is required").max(100),
  website_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  description: z.string().max(500).optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  target_customers: z.string().max(500).optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().max(500).optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export const productsSchema = z.object({
  products: z.array(productSchema).min(1, "Add at least one product or service"),
});

export const goalsSchema = z.object({
  goals: z.array(z.string()).min(1, "Select at least one goal"),
  primary_goal: z.string().min(1, "Select a primary goal"),
});

export const brandProfileSchema = z.object({
  tone: z.string().min(1, "Select a tone"),
  style_description: z.string().max(500).optional(),
  avoid_words: z.string().max(500).optional(),
});

export const aiPolicySchema = z.object({
  autonomy_level: z.enum(["assistant", "manager"]),
  require_approval_discount: z.boolean(),
  require_approval_refund: z.boolean(),
  require_approval_complaint: z.boolean(),
  require_approval_pricing: z.boolean(),
  require_approval_legal: z.boolean(),
  require_approval_medical: z.boolean(),
  require_approval_partnership: z.boolean(),
  require_approval_promises: z.boolean(),
});

export const settingsSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductsInput = z.infer<typeof productsSchema>;
export type GoalsInput = z.infer<typeof goalsSchema>;
export type BrandProfileInput = z.infer<typeof brandProfileSchema>;
export type AiPolicyInput = z.infer<typeof aiPolicySchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
