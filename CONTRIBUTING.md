# Contributing

Thanks for your interest in contributing to EnduranceBloc. Please follow these steps:

## Getting Started

1. Fork the repo and create a branch from `dev`.

2. Set up your local environment:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials to `.env.local` (see README.md for details)

3. Install dependencies and run the development server:
   ```bash
   npm install
   npm run dev
   ```

4. Make your changes and test locally.

5. Follow code style and run linters before submitting:
   ```bash
   npm run lint
   npm run format
   ```

6. Open a PR against `dev` and include tests or screenshots if applicable.

## Environment Variables

The application requires the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

See `.env.example` for a template and README.md for detailed setup instructions.
