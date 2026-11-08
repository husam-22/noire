import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Metadata } from 'next';

/**
 * Combines class names cleanly with Tailwind conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric price in USD with optional decimals.
 */
export function formatPrice(
  amount: number,
  options?: {
    currency?: 'USD' | 'EUR' | 'GBP' | 'JPY';
    showCents?: boolean;
  }
): string {
  const currency = options?.currency ?? 'USD';
  const showCents = options?.showCents ?? amount % 1 !== 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
}

/**
 * Calculates integer discount percentage between compareAtPrice and price.
 */
export function calculateDiscountPercentage(
  price: number,
  compareAtPrice?: number
): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/**
 * Formats compact numbers for analytics (e.g. 142.8K, $1.2M).
 */
export function formatCompactNumber(value: number, isCurrency = false): string {
  if (isCurrency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Formats ISO dates into editorial format (e.g., "October 14, 2026").
 */
export function formatDate(isoString: string, locale = 'en-US'): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/**
 * Formats ISO dates into technical short format (e.g., "2026.10.14").
 */
export function formatTechnicalDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch {
    return isoString;
  }
}

/**
 * Generates consistent, canonical-ready Next.js SEO Metadata for NOIRÉ pages.
 */
export function createNoireMetadata({
  title,
  description,
  path = '/',
  image = 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1600&q=85',
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const fullTitle = title.includes('NOIRÉ') ? title : `${title} — NOIRÉ`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: 'NOIRÉ',
      images: [
        {
          url: image,
          width: 1600,
          height: 1000,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
