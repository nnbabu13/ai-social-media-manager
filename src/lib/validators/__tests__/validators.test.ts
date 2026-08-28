import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  businessInfoSchema,
  productSchema,
  productsSchema,
  goalsSchema,
  brandProfileSchema,
  aiPolicySchema,
} from "@/lib/validators";

describe("Login Schema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("Signup Schema", () => {
  it("accepts matching passwords", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-matching passwords", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "differentpassword",
    });
    expect(result.success).toBe(false);
  });
});

describe("Forgot Password Schema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("Reset Password Schema", () => {
  it("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpassword",
      confirmPassword: "newpassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpassword",
      confirmPassword: "oldpassword",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("Business Info Schema", () => {
  it("accepts valid business data", () => {
    const result = businessInfoSchema.safeParse({
      name: "My Business",
      category: "Technology",
      website_url: "https://example.com",
      description: "A test business",
      country: "US",
      region: "California",
      city: "San Francisco",
      target_customers: "Tech companies",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields", () => {
    const result = businessInfoSchema.safeParse({
      name: "My Business",
      category: "Technology",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = businessInfoSchema.safeParse({
      name: "",
      category: "Technology",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = businessInfoSchema.safeParse({
      name: "My Business",
      category: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = businessInfoSchema.safeParse({
      name: "My Business",
      category: "Technology",
      website_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty website_url", () => {
    const result = businessInfoSchema.safeParse({
      name: "My Business",
      category: "Technology",
      website_url: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("Product Schema", () => {
  it("accepts valid product", () => {
    const result = productSchema.safeParse({
      name: "Product 1",
      description: "Description",
      url: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal product", () => {
    const result = productSchema.safeParse({
      name: "Product 1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = productSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("Products Schema", () => {
  it("accepts products array", () => {
    const result = productsSchema.safeParse({
      products: [{ name: "Product 1" }, { name: "Product 2" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty products array", () => {
    const result = productsSchema.safeParse({
      products: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("Goals Schema", () => {
  it("accepts valid goals with primary", () => {
    const result = goalsSchema.safeParse({
      goals: ["Get more customers", "Increase sales"],
      primary_goal: "Get more customers",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty goals", () => {
    const result = goalsSchema.safeParse({
      goals: [],
      primary_goal: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing primary goal", () => {
    const result = goalsSchema.safeParse({
      goals: ["Get more customers"],
      primary_goal: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("Brand Profile Schema", () => {
  it("accepts valid brand profile", () => {
    const result = brandProfileSchema.safeParse({
      tone: "Professional",
      style_description: "Formal writing style",
      avoid_words: "slang, informal",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty tone", () => {
    const result = brandProfileSchema.safeParse({
      tone: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("AI Policy Schema", () => {
  it("accepts valid AI policy", () => {
    const result = aiPolicySchema.safeParse({
      autonomy_level: "assistant",
      require_approval_discount: true,
      require_approval_refund: true,
      require_approval_complaint: false,
      require_approval_pricing: true,
      require_approval_legal: true,
      require_approval_medical: false,
      require_approval_partnership: true,
      require_approval_promises: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts manager autonomy level", () => {
    const result = aiPolicySchema.safeParse({
      autonomy_level: "manager",
      require_approval_discount: false,
      require_approval_refund: true,
      require_approval_complaint: true,
      require_approval_pricing: false,
      require_approval_legal: true,
      require_approval_medical: true,
      require_approval_partnership: false,
      require_approval_promises: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid autonomy level", () => {
    const result = aiPolicySchema.safeParse({
      autonomy_level: "invalid",
      require_approval_discount: true,
      require_approval_refund: true,
      require_approval_complaint: true,
      require_approval_pricing: true,
      require_approval_legal: true,
      require_approval_medical: true,
      require_approval_partnership: true,
      require_approval_promises: true,
    });
    expect(result.success).toBe(false);
  });
});
