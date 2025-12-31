# EnduranceBloc

EnduranceBloc is a smart calendar for endurance athletes with busy schedules.

## Goals

- Weekly plans supported by a weekly Sunday Prep ritual
- Calendar sync with TrainingPeaks and Outlook
- AI suggestions for optimal workout times

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account

### Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project (or create a new one)
   - Go to Settings > API
   - Copy the `Project URL` and `anon/public` key

3. Update `.env.local` with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Repository Secrets (for CI/CD)

If you're setting up GitHub Actions workflows, add the following secrets to your repository:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

To add repository secrets:
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with its corresponding value