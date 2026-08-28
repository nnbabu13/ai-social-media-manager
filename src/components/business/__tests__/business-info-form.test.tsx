import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { BusinessInfoForm } from "@/components/business/business-info-form";
import { ToastProvider } from "@/components/ui/toast";

const mockBusiness = {
  id: "test-id",
  name: "Test Business",
  slug: "test-business",
  category: "Technology",
  website_url: "https://example.com",
  description: "A test business",
  country: "US",
  region: "California",
  city: "San Francisco",
  target_customers: "Tech companies",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-id" } },
      }),
    },
    from: jest.fn(() => ({
      update: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
    })),
  }),
}));

describe("BusinessInfoForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with business data", () => {
    render(<ToastProvider><BusinessInfoForm business={mockBusiness} /></ToastProvider>);
    expect(screen.getByDisplayValue("Test Business")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Technology")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://example.com")).toBeInTheDocument();
  });

  it("renders all form fields", () => {
    render(<ToastProvider><BusinessInfoForm business={mockBusiness} /></ToastProvider>);
    expect(screen.getByText("Business Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("Region")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
    expect(screen.getByText("Target Customers")).toBeInTheDocument();
  });

  it("renders save button", () => {
    render(<ToastProvider><BusinessInfoForm business={mockBusiness} /></ToastProvider>);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<ToastProvider><BusinessInfoForm business={mockBusiness} /></ToastProvider>);

    const nameInput = screen.getByDisplayValue("Test Business");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Business name is required")).toBeInTheDocument();
    });
  });
});
