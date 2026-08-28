import React from "react";
import { screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ToastProvider } from "@/components/ui/toast";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("@/app/actions/onboarding", () => ({
  completeOnboarding: jest.fn().mockResolvedValue({ success: true }),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("OnboardingWizard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders step 1 (Business)", () => {
    renderWithProviders(<OnboardingWizard />);
    expect(screen.getByRole("heading", { name: "Business" })).toBeInTheDocument();
    expect(screen.getByLabelText("Business Name *")).toBeInTheDocument();
    expect(screen.getByText("Category *")).toBeInTheDocument();
  });

  it("shows all step indicators", () => {
    renderWithProviders(<OnboardingWizard />);
    expect(screen.getAllByText("Business").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Goals")).toBeInTheDocument();
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("AI Rules")).toBeInTheDocument();
  });

  it("navigates to next step", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Goals" })).toBeInTheDocument();
    });
  });

  it("navigates back to previous step", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Goals" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Business" })).toBeInTheDocument();
    });
  });

  it("disables back button on first step", () => {
    renderWithProviders(<OnboardingWizard />);
    const backButton = screen.getByRole("button", { name: /back/i });
    expect(backButton).toBeDisabled();
  });

  it("shows Complete Setup button on last step", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /complete setup/i })).toBeInTheDocument();
    });
  });
});
