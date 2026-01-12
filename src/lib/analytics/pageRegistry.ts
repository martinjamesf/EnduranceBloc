/**
 * Page Analytics Registry
 * 
 * Centralized metadata for all pages in EnduranceBloc.
 * Used for Google Analytics tracking and page categorization.
 */

export type PageCategory = 'auth' | 'planning' | 'calendar' | 'settings' | 'marketing' | 'account' | 'workout'

export interface PageMetadata {
  /** URL path of the page */
  path: string
  /** Display name for analytics */
  name: string
  /** Page description for context */
  description: string
  /** Analytics tags for grouping and filtering */
  tags: string[]
  /** Page category */
  category: PageCategory
  /** Whether page requires authentication */
  requiresAuth: boolean
}

/**
 * Registry of all pages in the application.
 * Key should match the page's route structure.
 */
export const PAGES: Record<string, PageMetadata> = {
  // Marketing Pages
  home: {
    path: '/',
    name: 'Home',
    description: 'Landing page and waitlist signup',
    tags: ['landing', 'marketing', 'waitlist'],
    category: 'marketing',
    requiresAuth: false,
  },
  product: {
    path: '/product',
    name: 'Product',
    description: 'Product overview and features',
    tags: ['landing', 'marketing'],
    category: 'marketing',
    requiresAuth: false,
  },

  // Authentication Pages
  login: {
    path: '/login',
    name: 'Login',
    description: 'User login page',
    tags: ['auth', 'onboarding'],
    category: 'auth',
    requiresAuth: false,
  },
  signup: {
    path: '/signup',
    name: 'Sign Up',
    description: 'User registration page',
    tags: ['auth', 'onboarding'],
    category: 'auth',
    requiresAuth: false,
  },
  forgotPassword: {
    path: '/forgot-password',
    name: 'Forgot Password',
    description: 'Password reset page',
    tags: ['auth', 'account'],
    category: 'account',
    requiresAuth: false,
  },

  // Core App Pages
  calendar: {
    path: '/calendar',
    name: 'Calendar',
    description: 'Unified calendar view for workouts and life blocks with day/week/weekend views',
    tags: ['planning', 'calendar', 'core-feature', 'workouts', 'blocks'],
    category: 'calendar',
    requiresAuth: true,
  },
  sundayPrep: {
    path: '/sunday-prep',
    name: 'Sunday Prep',
    description: '5-step weekly planning ritual for athletes',
    tags: ['planning', 'core-feature', 'ritual', 'weekly-planning'],
    category: 'planning',
    requiresAuth: true,
  },
  blockEditor: {
    path: '/block-editor',
    name: 'Block Editor',
    description: 'Create and manage recurring life blocks (work, sleep, family, etc)',
    tags: ['planning', 'blocks', 'templates'],
    category: 'planning',
    requiresAuth: true,
  },
  workoutDetail: {
    path: '/workout/[id]',
    name: 'Workout Detail',
    description: 'Individual workout view and editing',
    tags: ['workout', 'detail'],
    category: 'workout',
    requiresAuth: true,
  },

  // Settings & Account
  settings: {
    path: '/settings',
    name: 'Settings',
    description: 'User preferences and integration management (TrainingPeaks, Outlook, Google Calendar)',
    tags: ['settings', 'account', 'integrations'],
    category: 'settings',
    requiresAuth: true,
  },
}

/**
 * Get page metadata by key
 */
export function getPageMetadata(pageKey: string): PageMetadata | null {
  return PAGES[pageKey] || null
}

/**
 * Get all pages by category
 */
export function getPagesByCategory(category: PageCategory): PageMetadata[] {
  return Object.values(PAGES).filter((page) => page.category === category)
}

/**
 * Get all pages requiring authentication
 */
export function getProtectedPages(): PageMetadata[] {
  return Object.values(PAGES).filter((page) => page.requiresAuth)
}

/**
 * Get all public pages
 */
export function getPublicPages(): PageMetadata[] {
  return Object.values(PAGES).filter((page) => !page.requiresAuth)
}
