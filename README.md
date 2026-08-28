# AI Social Media Employee

An AI-powered social media management platform for small businesses. This application acts as an AI employee that monitors social media accounts, creates and publishes content, responds to customer interactions, identifies leads, and alerts business owners to important issues.

## Phase 1 - Foundation

This phase includes:

- Authentication (signup, login, logout, password reset)
- Business onboarding flow
- Business profile management
- Products/services management
- Goals management
- Brand voice configuration
- AI policy settings
- Dashboard with setup status
- Settings page
- Row Level Security (RLS)
- Audit logging
- Notification architecture

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Forms**: React Hook Form, Zod validation
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Supabase Configuration

1. Create a new Supabase project
2. Go to Settings > API to find your project URL and keys
3. Copy the values to your `.env.local` file
4. Go to Authentication > Settings and configure your email templates
5. Enable Email auth provider

## Database Setup

1. Go to the SQL Editor in your Supabase dashboard
2. Run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`

Or use the Supabase CLI:

```bash
npx supabase db push
```

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/      # Dashboard pages
│   │   ├── dashboard/
│   │   ├── business/
│   │   ├── accounts/
│   │   ├── content/
│   │   ├── inbox/
│   │   ├── leads/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── onboarding/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/             # Authentication components
│   ├── business/         # Business management components
│   ├── dashboard/        # Dashboard layout components
│   ├── onboarding/       # Onboarding wizard
│   ├── settings/         # Settings components
│   └── ui/               # Reusable UI components (shadcn/ui)
├── lib/
│   ├── audit.ts          # Audit logging utility
│   ├── authorization.ts  # Authorization utilities
│   ├── notifications.ts  # Notification utility
│   ├── supabase/         # Supabase client configuration
│   ├── utils.ts          # Utility functions
│   └── validators/       # Zod validation schemas
├── types/
│   └── database.ts       # TypeScript types for database
└── middleware.ts          # Next.js middleware for auth
```

## Features

### Authentication

- Email/password signup
- Email/password login
- Password reset flow
- Session management
- Protected routes

### Onboarding

4-step wizard:
1. Business information
2. Goals selection
3. Brand voice configuration
4. AI policy settings

### Business Management

- Edit business information
- Manage products/services
- Set business goals
- Configure brand voice
- Set AI autonomy levels and approval requirements

### Security

- Row Level Security (RLS) on all tables
- Server-side authorization checks
- Secure session handling
- No client-side secrets exposure

## Database Tables

- `businesses` - Business information
- `business_members` - User-business relationships
- `business_products` - Products and services
- `business_goals` - Business goals
- `brand_profiles` - Brand voice configuration
- `ai_policies` - AI autonomy settings
- `audit_logs` - Activity audit trail
- `notifications` - User notifications

## API Routes

The application uses server actions and server components for data operations. No public API routes are exposed in Phase 1.

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## Known Limitations

- No social media integrations (Phase 2)
- No AI content generation (Phase 2)
- No automated publishing (Phase 2)
- No billing/Stripe integration (Phase 3)
- No analytics dashboard (Phase 3)

## Next Steps (Phase 2)

- Instagram integration
- Facebook integration
- TikTok integration
- LinkedIn integration
- AI content generation
- AI reply suggestions
- Automated publishing
- Competitor monitoring

## License

Private - All rights reserved.
