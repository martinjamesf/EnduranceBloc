'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getPageMetadata } from './pageRegistry'

/**
 * Hook for tracking page views in Google Analytics
 * 
 * Usage:
 * export default function MyPage() {
 *   usePageAnalytics('myPageKey')
 *   return <div>...</div>
 * }
 */
export function usePageAnalytics(pageKey: string) {
  const pathname = usePathname()

  useEffect(() => {
    const metadata = getPageMetadata(pageKey)
    if (!metadata) {
      console.warn(`[Analytics] Page key "${pageKey}" not found in registry`)
      return
    }

    // Send page view to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_title: metadata.name,
        page_description: metadata.description,
      })

      if (measurementId) {
        // Attach custom dimensions to the active GA property
        window.gtag('config', measurementId, {
          custom_map: {
            dimension1: 'page_category',
            dimension2: 'page_tags',
          },
        })
      }

      window.gtag('event', 'view_page', {
        page_category: metadata.category,
        page_tags: metadata.tags.join(','),
      })
    }
  }, [pageKey, pathname])
}

/**
 * Track custom events for analytics
 * 
 * Usage:
 * trackEvent('workout_created', { type: 'run', duration: 45 })
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

/**
 * Set user ID for analytics (call after login)
 */
export function setAnalyticsUserId(userId: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
    if (measurementId) {
      window.gtag('config', measurementId, {
        user_id: userId,
      })
    }
  }
}

/**
 * Clear user ID (call on logout)
 */
export function clearAnalyticsUserId() {
  if (typeof window !== 'undefined' && window.gtag) {
    const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
    if (measurementId) {
      window.gtag('config', measurementId, {
        user_id: null,
      })
    }
  }
}

// Type extension for gtag on window
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config',
      name: string,
      params?: Record<string, any>
    ) => void
  }
}
