/**
 * NOIRÉ — Core Domain & Data Architecture Type Definitions
 * Designed for seamless replacement of Mock API services with a production backend.
 */

export type CategorySlug =
  | 'audio'
  | 'desk-architecture'
  | 'lighting'
  | 'travel-carry'
  | 'smart-instruments'
  | 'tactile-input';

export type StockStatus = 'in_stock' | 'low_stock' | 'pre_order' | 'out_of_stock';

export type ProductBadgeType =
  | 'new_release'
  | 'limited_edition'
  | 'archival'
  | 'bestseller'
  | 'award_winner';

export interface ProductColorVariant {
  id: string;
  name: string;
  hex: string;
  finish: string; // e.g., "Bead-Blasted Anodized Aluminum", "Matte Obsidian Ceramic"
  image: string;
  secondaryImage?: string;
  inStock: boolean;
  skuSuffix: string;
}

export interface ProductOptionVariant {
  id: string;
  label: string; // e.g., "Standard Edition", "Studio Edition (+ Balanced Cable)"
  value: string;
  priceDelta: number;
  inStock: boolean;
}

export interface ProductSpecification {
  group: 'Acoustics & Electronics' | 'Architecture & Materials' | 'Dimensions & Weight' | 'Connectivity & Power' | 'In The Box';
  label: string;
  value: string;
}

export interface ProductStoryBlock {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  caption?: string;
  layout: 'split-left' | 'split-right' | 'full-bleed' | 'technical-grid';
  metrics?: Array<{
    label: string;
    value: string;
    unit?: string;
  }>;
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  slug: string;
  sku: string;
  modelNumber: string; // e.g., "NR-01 // AETHER"
  name: string;
  subtitle: string;
  shortDescription: string;
  editorialDescription: string;
  category: CategorySlug;
  categoryName: string;
  collectionIds: string[];
  price: number;
  compareAtPrice?: number;
  currency: 'USD';
  stockStatus: StockStatus;
  inventoryCount: number;
  badge?: ProductBadgeType;
  badgeLabel?: string;
  featured: boolean;
  isSpotlight?: boolean;
  isNewArrival?: boolean;
  releaseYear: number;
  designedIn: string;
  primaryImage: string;
  secondaryImage: string;
  gallery: Array<{
    id: string;
    url: string;
    alt: string;
    caption?: string;
    aspect?: 'square' | 'portrait' | 'landscape';
  }>;
  colors: ProductColorVariant[];
  options?: ProductOptionVariant[];
  optionGroupLabel?: string;
  materials: string[];
  highlights: string[];
  specifications: ProductSpecification[];
  storyBlocks: ProductStoryBlock[];
  faqs: ProductFAQ[];
  shippingEstimate: string;
  warrantyYears: number;
  relatedProductIds: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  /** Optional editorial SEO fields; omitted when no distinct page metadata is authored. */
  seoTitle?: string;
  seoDescription?: string;
  canonicalPath?: string;
}

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  shortName: string;
  indexNumber: string; // "01", "02", etc.
  description: string;
  editorialStatement: string;
  heroImage: string;
  thumbnailImage: string;
  productCount: number;
  featuredProductSlug: string;
}

export interface Collection {
  id: string;
  slug: string;
  code: string; // e.g., "EDITION 04 // MONOLITH"
  title: string;
  subtitle: string;
  description: string;
  editorialEssay: string;
  heroImage: string;
  secondaryImage: string;
  season: string;
  productIds: string[];
  featured: boolean;
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  authorLocation: string;
  authorRole?: string; // e.g., "Industrial Architect", "Mastering Engineer"
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  variantPurchased: string;
  createdAt: string;
  helpfulCount: number;
}

export interface JournalArticle {
  id: string;
  slug: string;
  issueNumber: string; // e.g., "ISSUE 14"
  category: 'Material Study' | 'Acoustic Engineering' | 'Architecture' | 'Monograph';
  title: string;
  subtitle: string;
  excerpt: string;
  coverImage: string;
  author: {
    name: string;
    role: string;
  };
  publishedAt: string;
  readingTimeMinutes: number;
  featured: boolean;
  relatedProductIds: string[];
  content: string[];
}

export interface CartItem {
  id: string; // composite key: productId + colorId + optionId
  productId: string;
  slug: string;
  name: string;
  modelNumber: string;
  categoryName: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  selectedColor: {
    id: string;
    name: string;
    hex: string;
  };
  selectedOption?: {
    id: string;
    label: string;
    priceDelta: number;
  };
  quantity: number;
  maxQuantity: number;
  shippingEstimate: string;
}

export interface Address {
  id: string;
  label: string; // "Studio", "Primary Residence"
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface AddressValidationResult {
  valid: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof Address, string>>;
}

export type OrderStatus =
  | 'pending_settlement'
  | 'processing'
  | 'Craft & Calibration'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export interface OrderItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  modelNumber: string;
  sku: string;
  variantName: string;
  selectedFinish?: {
    id: string;
    name: string;
    hex: string;
  };
  selectedOption?: {
    id: string;
    label: string;
    priceDelta: number;
  };
  image: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderTimelineEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
  completed: boolean;
}

export interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  currency: 'USD';
}

export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  carrier: string;
  estimatedWindow: string;
  estimatedDispatch: string;
  baseCost: number;
  freeAboveSubtotal?: number;
  /** Destination/cart-specific quote returned by the shipping service; never recomputed in the checkout view. */
  quotedCost?: number;
  description: string;
}

export type PaymentProvider = 'demo' | 'stripe_elements' | 'apple_pay' | 'studio_wire' | 'manual';

export type PaymentMethodType = 'card' | 'apple_pay' | 'wire_transfer' | 'cash_on_delivery' | 'bank_transfer';

/** Safe, tokenized metadata only. Never contains PAN, CVC, or expiry credentials. */
export interface PaymentMethod {
  id: string;
  provider: PaymentProvider;
  type: PaymentMethodType;
  brand?: string;
  last4?: string;
  cardholderName?: string;
}

export interface PaymentProviderContract {
  provider: PaymentProvider;
  createPaymentIntent: (amount: number) => Promise<PaymentIntent>;
  confirmPayment: (
    intent: PaymentIntent,
    method: PaymentMethod
  ) => Promise<PaymentResult>;
}

export interface PaymentIntent {
  provider: PaymentProvider;
  amount: number;
  currency: 'USD';
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'succeeded'
    | 'failed';
  /** True for this local adapter; no provider intent, token, or secret is created. */
  simulated: true;
  createdAt: string;
}

/** Display metadata only. Never contains PAN, CVC, expiry, tokens, or provider secrets. */
export interface PaymentSummary {
  provider: PaymentProvider;
  methodType: PaymentMethodType;
  brand: string;
  last4: string;
  cardholderName: string;
}

export interface PaymentResult {
  status: 'authorized' | 'declined' | 'provider_required';
  /** True for the frontend demo adapter; it never means funds were authorized or captured. */
  simulated: boolean;
  paymentSummary?: PaymentSummary;
  errorCode?: string;
  errorMessage?: string;
  message?: string;
}

export interface CheckoutCustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface CartValidationIssue {
  itemId: string;
  productId: string;
  productName: string;
  type:
    | 'product_unavailable'
    | 'color_unavailable'
    | 'option_unavailable'
    | 'quantity_adjusted'
    | 'price_updated'
    | 'out_of_stock';
  message: string;
  suggestedQuantity?: number;
  updatedPrice?: number;
}

export interface CartValidationResult {
  valid: boolean;
  issues: CartValidationIssue[];
}

export interface Order {
  id: string;
  orderNumber: string; // e.g., "NR-94820"
  allocationReference?: string; // e.g., "ALLOC-2026-8410"
  customerId: string;
  customer?: CheckoutCustomerInfo;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string; // e.g., "Visa ending in 4242", "Apple Pay"
  paymentSummary?: PaymentSummary;
  shippingMethod?: ShippingMethod;
  totals?: OrderTotals;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  discountCode?: string;
  total: number;
  currency: 'USD';
  shippingAddress: Address;
  billingAddress: Address;
  carrier?: string;
  trackingNumber?: string;
  estimatedDispatch?: string;
  estimatedDelivery?: string;
  timeline: OrderTimelineEvent[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerStatus = 'active' | 'vip' | 'inactive';

export interface CustomerSessionIdentity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  clientCode?: string;
  memberSince?: string;
}

/**
 * Account identity boundary. The current preview resolver returns `guest`;
 * only a future authoritative identity provider may return `authenticated`.
 */
export type CustomerSession =
  | { status: 'guest'; source: 'none' }
  | {
      status: 'authenticated';
      source: 'provider';
      customer: CustomerSessionIdentity;
    };

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  location: string;
  status: CustomerStatus;
  tier: 'Private Client' | 'Collector' | 'Member';
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
  joinedAt: string;
  addresses: Address[];
  wishlistProductIds: string[];
  notes?: string;
  preferences: {
    newsletter: boolean;
    privateReleases: boolean;
    smsUpdates: boolean;
    preferredCurrency: 'USD' | 'EUR' | 'GBP' | 'JPY';
  };
}

export type DiscountStatus =
  | 'active'
  | 'scheduled'
  | 'expired'
  | 'disabled'
  | 'archived';

export interface Discount {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minOrderAmount?: number;
  usageCount: number;
  usageLimit?: number;
  status: DiscountStatus;
  startsAt: string;
  expiresAt?: string;
}

export interface RevenueDataPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface CategoryPerformance {
  category: CategorySlug;
  name: string;
  revenue: number;
  unitsSold: number;
  sharePercentage: number;
  growthPercentage: number;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  modelNumber: string;
  sku: string;
  variantName: string;
  currentStock: number;
  reorderThreshold: number;
  severity: 'critical' | 'warning';
}

export interface ActivityEvent {
  id: string;
  type: 'order_placed' | 'inventory_low' | 'product_updated' | 'vip_joined' | 'review_submitted';
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  referenceId?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueChangePercentage: number;
  totalOrders: number;
  ordersChangePercentage: number;
  totalCustomers: number;
  customersChangePercentage: number;
  conversionRate: number;
  conversionChangePercentage: number;
  averageOrderValue: number;
  aovChangePercentage: number;
  revenueSeries: RevenueDataPoint[];
  categoryPerformance: CategoryPerformance[];
  topProducts: Array<{
    product: Product;
    unitsSold: number;
    revenue: number;
  }>;
  recentOrders: Order[];
  inventoryAlerts: InventoryAlert[];
  activityFeed: ActivityEvent[];
}

export type SortOption =
  | 'featured'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc';

export interface ProductFilterParams {
  query?: string;
  category?: CategorySlug | 'all';
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: StockStatus[];
  colors?: string[];
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SearchSuggestionResult {
  query: string;
  products: Product[];
  categories: Category[];
  collections: Collection[];
  articles: JournalArticle[];
  totalMatches: number;
}
