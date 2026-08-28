export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: August 2026</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              AI Social Media Manager collects business information you provide during onboarding,
              including your business name, products, services, customer demographics, and social media
              account credentials necessary to manage your social media presence.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to operate the AI social media management service, including
              generating content, managing your social media accounts, and providing analytics
              and insights about your social media performance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Social Media Access</h2>
            <p className="text-muted-foreground">
              When you connect your social media accounts, we receive access tokens that allow us
              to post content, respond to messages, and analyze engagement on your behalf. These
              tokens are stored securely and are only used to provide the service you requested.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Data Storage</h2>
            <p className="text-muted-foreground">
              Your data is stored securely using industry-standard encryption. We do not sell or
              share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Contact</h2>
            <p className="text-muted-foreground">
              For questions about this privacy policy, please contact us through the application.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
