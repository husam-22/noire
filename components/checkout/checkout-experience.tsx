'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  ChevronRight,
  CreditCard,
  Info,
  Landmark,
  LockKeyhole,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Tag,
  Truck,
} from 'lucide-react';
import type {
  Address,
  CartItem,
  CartValidationIssue,
  OrderTotals,
  PaymentMethodType,
  ShippingMethod,
} from '@/types';
import {
  placeOrderAction,
  quoteShippingAction,
  validateAddressAction,
  validateCartAction,
  validateDiscountAction,
} from '@/lib/actions/commerce';
import { validateOrderTotals } from '@/lib/commerce/totals';
import { useCommerce } from '@/lib/context/commerce-context';
import { useStorefrontContent } from '@/lib/context/storefront-content-context';
import { useCheckout, type CheckoutAddressDraft } from '@/lib/context/checkout-context';
import { Button, EmptyState, Input, PriceDisplay, TechnicalCode } from '@/components/ui';
import { Container } from '@/components/layout';
import { formatPrice } from '@/lib/utils';
import { CheckoutSkeleton } from './checkout-skeleton';

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Switzerland',
  'Japan',
  'Canada',
  'Australia',
  'United Arab Emirates',
  'Saudi Arabia',
  'Yemen',
  'Netherlands',
  'Italy',
  'Spain',
  'Singapore',
  'South Korea',
  'Hong Kong',
  'Sweden',
  'Norway',
  'Denmark',
  'Other / International',
];

type FieldErrors = Record<string, string>;
type AddressField = keyof CheckoutAddressDraft;
type ManualPaymentMethod = Extract<PaymentMethodType, 'cash_on_delivery' | 'bank_transfer'>;

const PAYMENT_OPTIONS: Array<{
  id: ManualPaymentMethod;
  label: string;
  summary: string;
  detail: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}> = [
  {
    id: 'cash_on_delivery',
    label: 'Cash on delivery',
    summary: 'Pay the courier in full when your order arrives.',
    detail: 'Our team confirms the order by phone or email before dispatch. Have the exact amount ready for the courier.',
    icon: Banknote,
  },
  {
    id: 'bank_transfer',
    label: 'Bank transfer',
    summary: 'Transfer the total to our account; we dispatch once the payment is confirmed.',
    detail: 'Bank details are included in your order confirmation. Use your order number as the transfer reference.',
    icon: Landmark,
  },
];

function paymentLabel(method: PaymentMethodType): string {
  return PAYMENT_OPTIONS.find((option) => option.id === method)?.label ?? 'Manual settlement';
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

interface CheckoutExperienceProps {
  initialShippingMethods: ShippingMethod[];
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function getFieldError(errors: FieldErrors, key: string): string | undefined {
  return errors[key];
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  type = 'text',
  autoComplete,
  placeholder,
  required = true,
  disabled,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}) {
  return (
    <Input
      id={id}
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      error={error}
      hint={hint}
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      inputMode={inputMode}
      maxLength={maxLength}
    />
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
  disabled?: boolean;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="w-full space-y-2">
      <label
        htmlFor={id}
        className="block font-mono text-label uppercase tracking-[0.12em] text-foreground"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`h-11 w-full rounded-xs border bg-surface px-3.5 text-body text-foreground transition-colors focus:border-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-danger' : 'border-border'}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="font-mono text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeading({
  number,
  title,
  detail,
  id,
  requiredLabel = 'Required',
}: {
  number: string;
  title: string;
  detail: string;
  id: string;
  requiredLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div className="flex items-start gap-4">
        <span className="pt-1 font-mono text-label tabular-nums text-foreground-subtle">
          {`${number} //`}
        </span>
        <div>
          <h2 id={id} tabIndex={-1} className="font-display text-xl text-foreground outline-none">
            {title}
          </h2>
          <p className="mt-1.5 text-small text-foreground-muted">{detail}</p>
        </div>
      </div>
      <TechnicalCode>{requiredLabel}</TechnicalCode>
    </div>
  );
}

function SectionFrame({
  children,
  id,
  onFocusCapture,
  className = '',
}: {
  children: React.ReactNode;
  id: string;
  onFocusCapture: () => void;
  className?: string;
}) {
  return (
    <section
      id={id}
      tabIndex={-1}
      onFocusCapture={onFocusCapture}
      className={`scroll-mt-28 border border-border bg-surface p-5 sm:p-7 lg:p-8 ${className}`}
    >
      {children}
    </section>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
      {children}
    </p>
  );
}

function AllocationLines({
  items,
  lineTotals,
}: {
  items: CartItem[];
  lineTotals: Record<string, number>;
}) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item, index) => (
        <li key={item.id} className="grid grid-cols-[68px_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-4">
          <Link
            href={`/product/${item.slug}`}
            aria-label={`View ${item.name}`}
            className="relative aspect-[4/5] overflow-hidden bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Image
              src={item.image}
              alt=""
              fill
              sizes="76px"
              className="object-cover"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <div className="min-w-0 flex-1">
                <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">
                  {`${String(index + 1).padStart(2, '0')} // ${item.modelNumber}`}
                </p>
                <Link
                  href={`/product/${item.slug}`}
                  className="block break-words font-display text-sm leading-snug text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {item.name}
                </Link>
              </div>
              <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">
                {formatPrice(lineTotals[item.id] ?? 0)}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-foreground-muted">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full border border-border-strong/40"
                  style={{ backgroundColor: item.selectedColor.hex }}
                />
                {item.selectedColor.name}
              </span>
              {item.selectedOption && (
                <>
                  <span aria-hidden="true">/</span>
                  <span className="break-words">
                    {item.selectedOption.label}
                    {item.selectedOption.priceDelta !== 0 && (
                      <span className="ms-1 font-mono text-[9px]">({item.selectedOption.priceDelta > 0 ? '+' : ''}{formatPrice(item.selectedOption.priceDelta)})</span>
                    )}
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-foreground-subtle">
              <span>QTY {String(item.quantity).padStart(2, '0')}</span>
              <span>{formatPrice(item.price)} / UNIT</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TotalsLedger({
  totals,
  discountCode,
  shippingMethod,
  compact = false,
}: {
  totals: OrderTotals;
  discountCode?: string;
  shippingMethod: ShippingMethod;
  compact?: boolean;
}) {
  return (
    <dl className={`space-y-3 border-t border-border ${compact ? 'pt-4' : 'pt-5'}`}>
      <div className="flex items-center justify-between gap-4 text-small">
        <dt className="text-foreground-muted">Subtotal</dt>
        <dd className="font-mono tabular-nums text-foreground">{formatPrice(totals.subtotal)}</dd>
      </div>
      {totals.discountAmount > 0 && (
        <div className="flex items-center justify-between gap-4 text-small">
          <dt className="min-w-0 text-foreground-muted">
            Discount <span className="font-mono text-[10px]">{discountCode}</span>
          </dt>
          <dd className="shrink-0 font-mono tabular-nums text-success">−{formatPrice(totals.discountAmount)}</dd>
        </div>
      )}
      <div className="flex items-start justify-between gap-4 text-small">
        <dt className="min-w-0 text-foreground-muted">
          <span className="block">Delivery</span>
          <span className="mt-0.5 block text-[10px] leading-relaxed text-foreground-subtle">
            {shippingMethod.name}
          </span>
        </dt>
        <dd className="shrink-0 font-mono tabular-nums text-foreground">
          {totals.shippingCost === 0 ? 'INCLUDED' : formatPrice(totals.shippingCost)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4 text-small">
        <dt className="text-foreground-muted">Tax</dt>
        <dd className="font-mono tabular-nums text-foreground">
          {totals.taxAmount === 0 ? 'INCLUDED' : formatPrice(totals.taxAmount)}
        </dd>
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
        <dt>
          <span className="block font-display text-base text-foreground">Total</span>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">USD // payable on delivery or by transfer</span>
        </dt>
        <dd className="shrink-0 text-end">
          <PriceDisplay price={totals.total} size={compact ? 'lg' : 'xl'} />
        </dd>
      </div>
    </dl>
  );
}

function makeAddress(
  draft: CheckoutAddressDraft,
  id: string,
  label: string,
  isDefaultShipping: boolean,
  isDefaultBilling: boolean,
  fallbackPhone: string
): Address {
  return {
    id,
    label,
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    company: draft.company.trim() || undefined,
    line1: draft.line1.trim(),
    line2: draft.line2.trim() || undefined,
    city: draft.city.trim(),
    state: draft.state.trim(),
    postalCode: draft.postalCode.trim(),
    country: draft.country.trim(),
    phone: draft.phone.trim() || fallbackPhone.trim(),
    isDefaultShipping,
    isDefaultBilling,
  };
}

function validateAddressDraft(
  address: CheckoutAddressDraft,
  prefix: string,
  fallbackPhone: string,
  errors: FieldErrors
) {
  const required: Array<{ field: AddressField; label: string }> = [
    { field: 'firstName', label: 'First name' },
    { field: 'lastName', label: 'Last name' },
    { field: 'country', label: 'Country' },
    { field: 'line1', label: 'Street address' },
    { field: 'city', label: 'City' },
    { field: 'state', label: 'State / Province' },
    { field: 'postalCode', label: 'Postal code' },
  ];
  for (const field of required) {
    if (!address[field.field].trim()) {
      errors[`${prefix}.${field.field}`] = `${field.label} is required.`;
    }
  }
  const phone = address.phone.trim() || fallbackPhone.trim();
  if (!phone) {
    errors[`${prefix}.phone`] = 'A delivery phone number is required.';
  } else if (!validatePhone(phone)) {
    errors[`${prefix}.phone`] = 'Enter an international phone number with 7–15 digits.';
  }
}

function CartIssuePanel({
  issues,
  onRemove,
  onApply,
}: {
  issues: CartValidationIssue[];
  onRemove: (itemId: string) => void;
  onApply: (issue: CartValidationIssue) => void;
}) {
  if (issues.length === 0) return null;
  return (
    <div
      id="cart-integrity"
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="mb-6 scroll-mt-28 border border-danger/40 bg-danger/5 p-5 outline-none sm:p-6"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-mono text-label uppercase tracking-[0.15em] text-danger">
            Bag validation // action required
          </h2>
          <ul className="mt-3 space-y-4">
            {issues.map((issue, index) => (
              <li key={`${issue.itemId}-${issue.type}-${index}`} className="border-t border-danger/15 pt-3">
                <p className="text-small leading-relaxed text-foreground">{issue.message}</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {(issue.type === 'product_unavailable' ||
                    issue.type === 'out_of_stock' ||
                    issue.type === 'color_unavailable' ||
                    issue.type === 'option_unavailable') && issue.itemId !== 'empty' && (
                    <button
                      type="button"
                      onClick={() => onRemove(issue.itemId)}
                      className="min-h-11 border-b border-foreground px-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                      Remove affected line
                    </button>
                  )}
                  {issue.type === 'quantity_adjusted' && issue.suggestedQuantity !== undefined && (
                    <button
                      type="button"
                      onClick={() => onApply(issue)}
                      className="min-h-11 border-b border-foreground px-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                      Apply available quantity
                    </button>
                  )}
                  {issue.type === 'price_updated' && issue.updatedPrice !== undefined && (
                    <button
                      type="button"
                      onClick={() => onApply(issue)}
                      className="min-h-11 border-b border-foreground px-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                      Accept current valuation
                    </button>
                  )}
                  {(issue.type === 'quantity_adjusted' && issue.suggestedQuantity === undefined) && (
                    <Link
                      href="/cart"
                      className="inline-flex min-h-11 items-center border-b border-foreground px-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                      Review quantities in bag
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Link href="/cart" className="mt-4 inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] underline underline-offset-4">
            Return to bag <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CheckoutExperience({
  initialShippingMethods,
}: CheckoutExperienceProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const {
    cart,
    isCartHydrated,
    cartCount,
    cartLineTotals,
    cartSubtotal,
    discountAmount,
    appliedDiscount,
    selectedShippingMethod,
    setSelectedShippingMethod,
    shippingEstimateCost,
    taxAmount,
    cartTotal,
    orderTotals,
    removeFromCart,
    syncCartItemFromValidation,
    applyDiscountCode,
    removeDiscountCode,
    clearCart,
  } = useCommerce();
  const storefront = useStorefrontContent();
  const paymentOptions = useMemo(
    () => PAYMENT_OPTIONS.filter((option) => (option.id === 'cash_on_delivery' ? storefront.cashOnDeliveryEnabled : storefront.bankTransferEnabled)),
    [storefront.cashOnDeliveryEnabled, storefront.bankTransferEnabled]
  );
  const {
    customer,
    shippingAddress,
    billingAddress,
    billingSameAsShipping,
    selectedShippingMethodId,
    paymentMethodType,
    activeSection,
    notes,
    isCheckoutHydrated,
    setCustomer,
    setShippingAddress,
    setBillingAddress,
    setBillingSameAsShipping,
    setSelectedShippingMethodId,
    setPaymentMethodType,
    setActiveSection,
    setNotes,
    paymentState,
    setPaymentState,
    clearCheckoutDraft,
  } = useCheckout();

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(initialShippingMethods);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingServiceError, setShippingServiceError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [cartIssues, setCartIssues] = useState<CartValidationIssue[]>([]);
  const [generalError, setGeneralError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [reviewPaymentMethod, setReviewPaymentMethod] = useState<ManualPaymentMethod | null>(null);
  const [showTaxNote, setShowTaxNote] = useState(false);
  const [orderAttemptStatus, setOrderAttemptStatus] = useState('');

  const reviewRef = useRef<HTMLElement | null>(null);
  const actionLock = useRef(false);
  const idempotencyKeyRef = useRef<string>('');
  if (!idempotencyKeyRef.current) idempotencyKeyRef.current = newIdempotencyKey();

  const selectedShippingOption = useMemo(
    () => shippingMethods.find((method) => method.id === selectedShippingMethodId) ?? null,
    [shippingMethods, selectedShippingMethodId]
  );

  useEffect(() => {
    let active = true;
    setIsLoadingShipping(true);
    setShippingServiceError('');
    void quoteShippingAction(shippingAddress.country, cartSubtotal, appliedDiscount?.type === 'free_shipping')
      .then((response) => {
        if (!active) return;
        if (!response.ok) {
          setShippingServiceError(response.error);
          return;
        }
        const methods = response.data;
        setShippingMethods(methods);
        if (methods.length === 0) {
          setShippingServiceError('No delivery option is available for this destination yet. Check the selected country or contact us.');
          return;
        }
        const contextMethod = methods.find((method) => method.id === selectedShippingMethod.id);
        const chosenMethod = methods.find((method) => method.id === selectedShippingMethodId) ?? contextMethod ?? methods[0];
        if (chosenMethod) {
          setSelectedShippingMethodId(chosenMethod.id);
          if (
            selectedShippingMethod.id !== chosenMethod.id ||
            selectedShippingMethod.baseCost !== chosenMethod.baseCost ||
            selectedShippingMethod.name !== chosenMethod.name ||
            selectedShippingMethod.quotedCost !== chosenMethod.quotedCost
          ) {
            setSelectedShippingMethod(chosenMethod);
          }
        }
      })
      .catch(() => {
        if (!active) return;
        setShippingServiceError('Delivery options could not be loaded. Retry or return to your bag.');
      })
      .finally(() => {
        if (active) setIsLoadingShipping(false);
      });
    return () => {
      active = false;
    };
  }, [
    shippingAddress.country,
    cartSubtotal,
    appliedDiscount?.type,
    selectedShippingMethod.id,
    selectedShippingMethod.name,
    selectedShippingMethod.baseCost,
    selectedShippingMethod.quotedCost,
    selectedShippingMethodId,
    setSelectedShippingMethod,
    setSelectedShippingMethodId,
  ]);

  useEffect(() => {
    if (!isCheckoutHydrated || !shippingMethods.length) return;
    if (shippingMethods.some((method) => method.id === selectedShippingMethod.id)) {
      if (selectedShippingMethodId !== selectedShippingMethod.id) {
        setSelectedShippingMethodId(selectedShippingMethod.id);
      }
    }
  }, [
    isCheckoutHydrated,
    shippingMethods,
    selectedShippingMethod.id,
    selectedShippingMethodId,
    setSelectedShippingMethodId,
  ]);

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const setCustomerField = useCallback(
    (field: keyof typeof customer, value: string) => {
      const nextCustomer = { ...customer, [field]: value };
      setCustomer(nextCustomer);
      if (field === 'firstName' || field === 'lastName') {
        const nextShipping = {
          ...shippingAddress,
          [field]: value,
        };
        setShippingAddress(nextShipping);
        if (billingSameAsShipping) setBillingAddress(nextShipping);
      }
      if (field === 'phone' && !shippingAddress.phone) {
        const nextShipping = { ...shippingAddress, phone: value };
        setShippingAddress(nextShipping);
        if (billingSameAsShipping) setBillingAddress(nextShipping);
      }
      clearFieldError(`customer.${field}`);
    },
    [
      billingSameAsShipping,
      customer,
      shippingAddress,
      setCustomer,
      setShippingAddress,
      setBillingAddress,
      clearFieldError,
    ]
  );

  const setAddressField = useCallback(
    (target: 'shipping' | 'billing', field: AddressField, value: string) => {
      const setter = target === 'shipping' ? setShippingAddress : setBillingAddress;
      const currentAddress = target === 'shipping' ? shippingAddress : billingAddress;
      const nextAddress = { ...currentAddress, [field]: value };
      setter(nextAddress);
      if (target === 'shipping' && billingSameAsShipping) {
        setBillingAddress(nextAddress);
      }
      clearFieldError(`${target}.${field}`);
      if (field === 'country') {
        setGeneralError('');
        setReviewPaymentMethod(null);
      }
    },
    [
      billingAddress,
      billingSameAsShipping,
      shippingAddress,
      setShippingAddress,
      setBillingAddress,
      clearFieldError,
    ]
  );

  const handleShippingSelection = (methodId: string) => {
    const method = shippingMethods.find((candidate) => candidate.id === methodId);
    setSelectedShippingMethodId(methodId);
    if (method) setSelectedShippingMethod(method);
    setReviewPaymentMethod(null);
    setGeneralError('');
  };

  const buildFieldErrors = useCallback((): FieldErrors => {
    const nextErrors: FieldErrors = {};
    const identityFields: Array<keyof typeof customer> = ['firstName', 'lastName', 'email', 'phone'];
    for (const field of identityFields) {
      if (!customer[field].trim()) {
        const label = field === 'firstName' ? 'First name' : field === 'lastName' ? 'Last name' : field === 'email' ? 'Email' : 'Phone';
        nextErrors[`customer.${field}`] = `${label} is required.`;
      }
    }
    if (customer.email.trim() && !validateEmail(customer.email)) {
      nextErrors['customer.email'] = 'Enter a valid email address, such as studio@example.com.';
    }
    if (customer.phone.trim() && !validatePhone(customer.phone)) {
      nextErrors['customer.phone'] = 'Enter an international phone number with 7–15 digits.';
    }

    validateAddressDraft(shippingAddress, 'shipping', customer.phone, nextErrors);
    if (!billingSameAsShipping) {
      validateAddressDraft(billingAddress, 'billing', customer.phone, nextErrors);
    }

    if (!paymentOptions.some((option) => option.id === paymentMethodType)) {
      nextErrors['payment.method'] = 'Choose how you would like to pay.';
    }
    return nextErrors;
  }, [customer, shippingAddress, billingSameAsShipping, billingAddress, paymentMethodType, paymentOptions]);

  const focusFirstError = useCallback((errors: FieldErrors) => {
    const first = Object.keys(errors)[0];
    if (!first) return;
    const fieldId = first === 'payment.method' ? 'payment-method-cash_on_delivery' : first.replaceAll('.', '-');
    window.requestAnimationFrame(() => {
      const element = document.getElementById(fieldId);
      if (element instanceof HTMLElement) {
        element.focus();
        element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }, [reducedMotion]);

  const setValidationError = useCallback((message: string, step: 'client' | 'delivery' | 'settlement' | 'review' = 'review') => {
    setGeneralError(message);
    setActiveSection(step);
    const target = step === 'client' ? 'client-information' : step === 'delivery' ? 'delivery-address' : step === 'settlement' ? 'secure-settlement' : 'checkout-general-error';
    window.requestAnimationFrame(() => {
      const element = document.getElementById(target);
      if (element instanceof HTMLElement) {
        element.focus();
        element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }, [reducedMotion, setActiveSection]);

  const runPreflight = useCallback(async (): Promise<ManualPaymentMethod | null> => {
    setGeneralError('');
    setCartIssues([]);
    setFieldErrors({});

    if (cart.length === 0) {
      setValidationError('Your bag is empty. Add a product before continuing.', 'client');
      return null;
    }

    const errors = buildFieldErrors();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstField = Object.keys(errors)[0];
      const step = firstField.startsWith('customer.') ? 'client' : firstField.startsWith('shipping.') || firstField.startsWith('billing.') ? 'delivery' : 'settlement';
      setActiveSection(step);
      focusFirstError(errors);
      return null;
    }

    if (isLoadingShipping || shippingServiceError || shippingMethods.length === 0 || !selectedShippingOption) {
      setValidationError(shippingServiceError || (isLoadingShipping ? 'Delivery options are still loading for this destination. Wait a moment, then continue.' : 'No delivery option is available for this destination. Retry the lookup.'), 'delivery');
      return null;
    }

    if (selectedShippingMethod.id !== selectedShippingOption.id) {
      setSelectedShippingMethod(selectedShippingOption);
      setValidationError('The delivery option changed. Review the revised total, then continue.', 'delivery');
      return null;
    }

    try {
      const shippingAddressRecord = makeAddress(
        shippingAddress,
        'checkout-shipping',
        'Delivery Address',
        true,
        billingSameAsShipping,
        customer.phone
      );
      const billingAddressRecord = billingSameAsShipping
        ? { ...shippingAddressRecord, id: 'checkout-billing', label: 'Billing Address', isDefaultShipping: false, isDefaultBilling: true }
        : makeAddress(
            billingAddress,
            'checkout-billing',
            'Billing Address',
            false,
            true,
            customer.phone
          );

      const addressResults = await Promise.all([
        validateAddressAction(shippingAddressRecord),
        ...(billingSameAsShipping ? [] : [validateAddressAction(billingAddressRecord)]),
      ]);
      if (!addressResults[0].valid || (addressResults[1] && !addressResults[1].valid)) {
        const addressErrors: FieldErrors = {};
        const mapServiceErrors = (result: (typeof addressResults)[number], prefix: 'shipping' | 'billing') => {
          for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
            const fieldKey = key === 'line1' ? 'line1' : key === 'line2' ? 'line2' : key;
            addressErrors[`${prefix}.${fieldKey}`] = message;
          }
        };
        if (!addressResults[0].valid) mapServiceErrors(addressResults[0], 'shipping');
        if (addressResults[1] && !addressResults[1].valid) mapServiceErrors(addressResults[1], 'billing');
        setFieldErrors(addressErrors);
        setActiveSection('delivery');
        focusFirstError(addressErrors);
        setPaymentState('failed');
        return null;
      }

      const cartResponse = await validateCartAction(cart);
      if (!cartResponse.ok) throw new Error(cartResponse.error);
      const cartValidation = cartResponse.data;
      if (!cartValidation.valid) {
        setCartIssues(cartValidation.issues);
        setPaymentState('failed');
        window.requestAnimationFrame(() => {
          const target = document.getElementById('cart-integrity');
          if (target instanceof HTMLElement) {
            target.focus();
            target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
          }
        });
        return null;
      }

      if (appliedDiscount) {
        const discountResponse = await validateDiscountAction(appliedDiscount.code, cartSubtotal);
        const discountCheck = discountResponse.ok ? discountResponse.data : { valid: false, discountAmount: 0, message: discountResponse.error };
        if (!discountCheck.valid || Math.abs(discountCheck.discountAmount - discountAmount) > 0.01) {
          removeDiscountCode();
          setPromoError(true);
          setPromoMessage(discountCheck.message || 'The discount code changed. It has been removed; review your revised total.');
          setPaymentState('failed');
          setValidationError('The discount code could not be confirmed and has been removed. Review the updated total before continuing.', 'review');
          return null;
        }
      }

      const totalValidation = validateOrderTotals(orderTotals);
      if (
        !totalValidation.valid ||
        orderTotals.subtotal !== cartSubtotal ||
        orderTotals.discountAmount !== discountAmount ||
        orderTotals.shippingCost !== shippingEstimateCost ||
        orderTotals.taxAmount !== taxAmount ||
        orderTotals.total !== cartTotal
      ) {
        setPaymentState('failed');
        setValidationError(totalValidation.message || 'The order total changed. Review the updated summary.', 'review');
        return null;
      }

      const method = paymentOptions.find((option) => option.id === paymentMethodType)?.id ?? paymentOptions[0]?.id ?? 'cash_on_delivery';
      setReviewPaymentMethod(method);
      setPaymentState('ready_for_review');
      return method;
    } catch (error) {
      setPaymentState('failed');
      setValidationError(
        error instanceof Error
          ? `Checkout validation failed: ${error.message}`
          : 'Checkout validation could not be completed. Retry or return to your bag.',
        'review'
      );
      return null;
    }
  }, [
    cart,
    cartSubtotal,
    discountAmount,
    appliedDiscount,
    shippingAddress,
    billingAddress,
    billingSameAsShipping,
    customer,
    selectedShippingOption,
    selectedShippingMethod,
    shippingMethods.length,
    shippingServiceError,
    isLoadingShipping,
    orderTotals,
    shippingEstimateCost,
    taxAmount,
    cartTotal,
    paymentMethodType,
    buildFieldErrors,
    focusFirstError,
    reducedMotion,
    removeDiscountCode,
    setActiveSection,
    setPaymentState,
    setSelectedShippingMethod,
    setValidationError,
      paymentOptions,
  ]);

  const handleReview = async () => {
    if (actionLock.current || isWorking) return;
    actionLock.current = true;
    setIsWorking(true);
    try {
      const safePaymentMethod = await runPreflight();
      if (!safePaymentMethod) return;
      setActiveSection('review');
      window.requestAnimationFrame(() => {
        reviewRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    } finally {
      actionLock.current = false;
      setIsWorking(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (actionLock.current || isWorking) return;
    actionLock.current = true;
    setIsWorking(true);
    setOrderAttemptStatus('Confirming stock, delivery and discount details…');
    try {
      const safePaymentMethod = await runPreflight();
      if (!safePaymentMethod) return;

      const shippingMethod = shippingMethods.find((method) => method.id === selectedShippingMethodId);
      if (!shippingMethod) {
        setValidationError('The selected delivery option could not be resolved. Choose an available option and retry.', 'delivery');
        return;
      }

      const shippingAddressRecord = makeAddress(
        shippingAddress,
        'checkout-shipping',
        'Delivery Address',
        true,
        billingSameAsShipping,
        customer.phone
      );
      const billingAddressRecord = billingSameAsShipping
        ? { ...shippingAddressRecord, id: 'checkout-billing', label: 'Billing Address', isDefaultShipping: false, isDefaultBilling: true }
        : makeAddress(
            billingAddress,
            'checkout-billing',
            'Billing Address',
            false,
            true,
            customer.phone
          );

      setPaymentState('intent_created');
      setOrderAttemptStatus('Placing your order…');
      const result = await placeOrderAction({
        idempotencyKey: idempotencyKeyRef.current,
        customer,
        shippingAddress: shippingAddressRecord,
        billingAddress: billingAddressRecord,
        shippingMethodId: shippingMethod.id,
        items: cart,
        totals: orderTotals,
        discountCode: appliedDiscount?.code,
        paymentMethodType: safePaymentMethod,
        notes: notes.trim() || undefined,
      });

      if (!result.ok) {
        setPaymentState('failed');
        if (result.code === 'CONFLICT') {
          // The order exists but pricing drifted; a fresh key is needed for any new attempt.
          idempotencyKeyRef.current = newIdempotencyKey();
        }
        setValidationError(result.error, result.code === 'VALIDATION_ERROR' ? 'review' : 'review');
        return;
      }

      setPaymentState('provider_required');
      clearCart(true);
      clearCheckoutDraft();
      idempotencyKeyRef.current = newIdempotencyKey();
      router.push(`/order/${encodeURIComponent(result.data.id)}/confirmation`);
    } catch (error) {
      setPaymentState('failed');
      setValidationError(
        error instanceof Error
          ? `${error.message} Your bag has been preserved; review the details and retry.`
          : 'The order service is unavailable. Your bag has been preserved; retry or return to the bag.',
        'review'
      );
    } finally {
      actionLock.current = false;
      setIsWorking(false);
      setOrderAttemptStatus('');
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeSection === 'review') {
      void handlePlaceOrder();
    } else {
      void handleReview();
    }
  };

  const scrollToSection = (section: 'client' | 'delivery' | 'settlement') => {
    const ids = {
      client: 'client-information',
      delivery: 'delivery-address',
      settlement: 'secure-settlement',
    } as const;
    setActiveSection(section);
    window.requestAnimationFrame(() => {
      const target = document.getElementById(ids[section]);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        target.querySelector('h2')?.focus();
      }
    });
  };

  const applyPromo = async () => {
    if (!promoCode.trim() || isApplyingPromo) return;
    setIsApplyingPromo(true);
    setPromoError(false);
    setPromoMessage('');
    try {
      const result = await applyDiscountCode(promoCode);
      setPromoMessage(result.message);
      setPromoError(!result.valid);
      if (result.valid) {
        setPromoCode('');
        setReviewPaymentMethod(null);
      }
    } catch {
      setPromoError(true);
      setPromoMessage('Discount codes cannot be checked right now. Try again shortly.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleCartIssueApply = (issue: CartValidationIssue) => {
    syncCartItemFromValidation(issue.itemId, {
      quantity: issue.suggestedQuantity,
      price: issue.updatedPrice,
    });
    setCartIssues((current) => current.filter((item) => item.itemId !== issue.itemId));
    setGeneralError('Your bag has been updated. Review the refreshed total and continue.');
  };

  const handleCartIssueRemove = (itemId: string) => {
    removeFromCart(itemId);
    setCartIssues((current) => current.filter((item) => item.itemId !== itemId));
  };

  const handlePaymentSelection = (method: ManualPaymentMethod) => {
    setPaymentMethodType(method);
    clearFieldError('payment.method');
    setReviewPaymentMethod(null);
    setPaymentState('not_started');
    setGeneralError('');
  };

  const toggleBillingSame = (same: boolean) => {
    setBillingSameAsShipping(same);
    if (!same && !billingAddress.line1 && !billingAddress.city) {
      setBillingAddress({ ...shippingAddress });
    }
    setReviewPaymentMethod(null);
  };

  const checkoutReady = isCartHydrated && isCheckoutHydrated;

  if (!checkoutReady) return <CheckoutSkeleton />;

  if (cart.length === 0) {
    return (
      <section className="bg-background pb-section-md pt-10 sm:pt-14">
        <Container size="wide">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <TechnicalCode>NOIRÉ // CHECKOUT</TechnicalCode>
            <Link href="/cart" className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] text-foreground-muted hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Return to bag
            </Link>
          </div>
          <EmptyState
            code="CHECKOUT // EMPTY BAG"
            title="Your bag is empty."
            description="Add a product from the shop before starting checkout."
            icon={<CreditCard className="h-6 w-6" aria-hidden="true" />}
            primaryAction={
              <Link href="/shop">
                <Button withArrow="right">Explore the archive</Button>
              </Link>
            }
            secondaryAction={
              <Link href="/cart" className="inline-flex min-h-11 items-center border-b border-foreground font-mono text-[10px] uppercase tracking-[0.13em]">
                Review bag
              </Link>
            }
            className="min-h-[340px]"
          />
        </Container>
      </section>
    );
  }

  const itemCountLabel = `${String(cartCount).padStart(2, '0')} UNIT${cartCount === 1 ? '' : 'S'}`;
  const promoThresholdMessage =
    appliedDiscount?.minOrderAmount && cartSubtotal < appliedDiscount.minOrderAmount
      ? `Minimum order value ${formatPrice(appliedDiscount.minOrderAmount)} required.`
      : '';

  return (
    <main id="main-content" className="bg-background pb-28 text-foreground lg:pb-0">
      <div className="surface-obsidian border-b border-border py-3.5">
        <Container size="wide" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-inverse/70 sm:text-[10px]">
            <span className="shrink-0">Bag</span>
            <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate text-foreground-inverse">Checkout</span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-inverse/60 sm:text-[10px]">
            CHECKOUT // NR-{new Date().getFullYear()} · {itemCountLabel}
          </span>
        </Container>
      </div>

      <Container size="wide" className="py-8 sm:py-12 lg:py-14">
        <header className="mb-8 border-b border-border pb-7 sm:mb-10 sm:pb-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-3 font-mono text-label uppercase tracking-[0.16em] text-foreground-subtle">NOIRÉ // SECURE CHECKOUT</p>
              <h1 className="font-display text-h1 leading-[1.04] text-foreground">Checkout<span className="text-accent">.</span></h1>
              <p className="mt-3 max-w-2xl text-small leading-relaxed text-foreground-muted sm:text-body">
                Enter your contact and delivery details, choose how you would like to pay, and review your order. Pay in cash on delivery or by bank transfer — our team confirms every order before dispatch.
              </p>
            </div>
            <Link href="/cart" className="inline-flex min-h-11 items-center gap-2 border-b border-border-strong/70 font-mono text-[10px] uppercase tracking-[0.13em] text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Edit bag
            </Link>
          </div>

          <nav aria-label="Checkout dossier sections" className="mt-7 grid grid-cols-2 border-y border-border sm:grid-cols-4">
            {([
              ['client', '01', 'Client'],
              ['delivery', '02', 'Delivery'],
              ['settlement', '03', 'Payment'],
              ['review', '04', 'Review'],
            ] as const).map(([section, number, label]) => (
              <button
                key={section}
                type="button"
                onClick={() => section === 'review' ? void handleReview() : scrollToSection(section)}
                aria-current={activeSection === section ? 'step' : undefined}
                className={`flex min-h-12 items-center gap-2 border-b-2 px-2 text-start font-mono text-[9px] uppercase tracking-[0.12em] transition-colors sm:px-4 ${activeSection === section ? 'border-foreground text-foreground' : 'border-transparent text-foreground-subtle hover:text-foreground'}`}
              >
                <span>{`${number} //`}</span><span>{label}</span>
              </button>
            ))}
          </nav>
        </header>

        <CartIssuePanel issues={cartIssues} onRemove={handleCartIssueRemove} onApply={handleCartIssueApply} />

        {generalError && (
          <div
            id="checkout-general-error"
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            className="mb-6 scroll-mt-28 border border-danger/35 bg-danger/5 p-4 outline-none sm:p-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-mono text-label uppercase tracking-[0.13em] text-danger">Checkout needs attention</p>
                <p className="mt-1.5 text-small leading-relaxed text-foreground">{generalError}</p>
                <Link href="/cart" className="mt-2 inline-flex min-h-11 items-center border-b border-foreground font-mono text-[10px] uppercase tracking-[0.12em]">Review bag and continue</Link>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} noValidate>
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
            <div className="min-w-0 space-y-6 lg:col-span-7 xl:col-span-8">
              <SectionFrame
                id="client-information"
                onFocusCapture={() => setActiveSection('client')}
              >
                <SectionHeading
                  number="01"
                  title="Client information"
                  detail="We use these details to confirm your order and coordinate delivery."
                  id="client-heading"
                  requiredLabel="Required"
                />
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                  <Field
                    id="customer-firstName"
                    label="First name"
                    value={customer.firstName}
                    onChange={(value) => setCustomerField('firstName', value)}
                    error={getFieldError(fieldErrors, 'customer.firstName')}
                    autoComplete="given-name"
                    disabled={isWorking}
                  />
                  <Field
                    id="customer-lastName"
                    label="Last name"
                    value={customer.lastName}
                    onChange={(value) => setCustomerField('lastName', value)}
                    error={getFieldError(fieldErrors, 'customer.lastName')}
                    autoComplete="family-name"
                    disabled={isWorking}
                  />
                  <Field
                    id="customer-email"
                    label="Email address"
                    value={customer.email}
                    onChange={(value) => setCustomerField('email', value)}
                    error={getFieldError(fieldErrors, 'customer.email')}
                    hint="Your order confirmation will be sent to this email."
                    type="email"
                    autoComplete="email"
                    disabled={isWorking}
                  />
                  <Field
                    id="customer-phone"
                    label="Phone"
                    value={customer.phone}
                    onChange={(value) => setCustomerField('phone', value)}
                    error={getFieldError(fieldErrors, 'customer.phone')}
                    hint="Include a country code for consistent local record formatting."
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    disabled={isWorking}
                  />
                </div>
                <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[11px] leading-relaxed text-foreground-subtle">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Signed-in customers can track this order from their account. Guests receive every update by email.
                </p>
              </SectionFrame>

              <SectionFrame
                id="delivery-address"
                onFocusCapture={() => setActiveSection('delivery')}
              >
                <SectionHeading
                  number="02"
                  title="Delivery address"
                  detail="Where should we deliver your order?"
                  id="delivery-heading"
                  requiredLabel="Required for local record"
                />
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                  <Field
                    id="shipping-firstName"
                    label="First name"
                    value={shippingAddress.firstName}
                    onChange={(value) => setAddressField('shipping', 'firstName', value)}
                    error={getFieldError(fieldErrors, 'shipping.firstName')}
                    autoComplete="shipping given-name"
                    disabled={isWorking}
                  />
                  <Field
                    id="shipping-lastName"
                    label="Last name"
                    value={shippingAddress.lastName}
                    onChange={(value) => setAddressField('shipping', 'lastName', value)}
                    error={getFieldError(fieldErrors, 'shipping.lastName')}
                    autoComplete="shipping family-name"
                    disabled={isWorking}
                  />
                  <SelectField
                    id="shipping-country"
                    label="Country / Region"
                    value={shippingAddress.country}
                    onChange={(value) => setAddressField('shipping', 'country', value)}
                    options={COUNTRIES.map((country) => ({ value: country, label: country }))}
                    error={getFieldError(fieldErrors, 'shipping.country')}
                    disabled={isWorking}
                  />
                  <Field
                    id="shipping-company"
                    label="Company / Studio"
                    value={shippingAddress.company}
                    onChange={(value) => setAddressField('shipping', 'company', value)}
                    error={getFieldError(fieldErrors, 'shipping.company')}
                    autoComplete="organization"
                    required={false}
                    disabled={isWorking}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      id="shipping-line1"
                      label="Address"
                      value={shippingAddress.line1}
                      onChange={(value) => setAddressField('shipping', 'line1', value)}
                      error={getFieldError(fieldErrors, 'shipping.line1')}
                      autoComplete="shipping address-line1"
                      disabled={isWorking}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      id="shipping-line2"
                      label="Apartment / Suite / Floor"
                      value={shippingAddress.line2}
                      onChange={(value) => setAddressField('shipping', 'line2', value)}
                      error={getFieldError(fieldErrors, 'shipping.line2')}
                      autoComplete="shipping address-line2"
                      required={false}
                      disabled={isWorking}
                    />
                  </div>
                  <Field
                    id="shipping-city"
                    label="City"
                    value={shippingAddress.city}
                    onChange={(value) => setAddressField('shipping', 'city', value)}
                    error={getFieldError(fieldErrors, 'shipping.city')}
                    autoComplete="shipping address-level2"
                    disabled={isWorking}
                  />
                  <Field
                    id="shipping-state"
                    label="State / Province"
                    value={shippingAddress.state}
                    onChange={(value) => setAddressField('shipping', 'state', value)}
                    error={getFieldError(fieldErrors, 'shipping.state')}
                    autoComplete="shipping address-level1"
                    disabled={isWorking}
                  />
                  <Field
                    id="shipping-postalCode"
                    label="Postal code"
                    value={shippingAddress.postalCode}
                    onChange={(value) => setAddressField('shipping', 'postalCode', value)}
                    error={getFieldError(fieldErrors, 'shipping.postalCode')}
                    autoComplete="shipping postal-code"
                    disabled={isWorking}
                  />
                  <Field
                    id="shipping-phone"
                    label="Delivery phone"
                    value={shippingAddress.phone || customer.phone}
                    onChange={(value) => setAddressField('shipping', 'phone', value)}
                    error={getFieldError(fieldErrors, 'shipping.phone')}
                    autoComplete="shipping tel"
                    type="tel"
                    inputMode="tel"
                    hint="The courier may call this number on the day of delivery."
                    disabled={isWorking}
                  />
                </div>

                <div className="mt-7 border-t border-border pt-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <PanelLabel>Delivery option</PanelLabel>
                      <h3 className="mt-1.5 font-display text-base text-foreground">Choose a delivery option</h3>
                    </div>
                    {isLoadingShipping && <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle"><RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />Updating options</span>}
                  </div>

                  {shippingServiceError && (
                    <div role="alert" className="mb-4 border border-danger/30 bg-danger/5 p-4">
                      <p className="text-small text-foreground">{shippingServiceError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShippingServiceError('');
                          void quoteShippingAction(shippingAddress.country, cartSubtotal, appliedDiscount?.type === 'free_shipping')
                            .then((response) => {
                              if (!response.ok) {
                                setShippingServiceError(response.error);
                                return;
                              }
                              setShippingMethods(response.data);
                              if (response.data[0]) handleShippingSelection(response.data[0].id);
                            })
                            .catch(() => setShippingServiceError('Delivery options are still unavailable. Retry later or return to your bag.'));
                        }}
                        className="mt-2 inline-flex min-h-11 items-center gap-2 border-b border-foreground font-mono text-[10px] uppercase tracking-[0.12em]"
                      >
                        Retry <RefreshCw className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  <fieldset disabled={isWorking || isLoadingShipping || shippingMethods.length === 0}>
                    <legend className="sr-only">Select a shipping method</legend>
                    <div className="divide-y divide-border border-y border-border">
                      {shippingMethods.map((method) => {
                        const checked = selectedShippingMethodId === method.id;
                        const methodCost =
                          method.id === selectedShippingMethod.id
                            ? shippingEstimateCost
                            : method.quotedCost ?? method.baseCost;
                        return (
                          <label
                            key={method.id}
                            className={`grid min-h-[82px] cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-3 py-4 transition-colors ${checked ? 'bg-surface-muted/50' : ''}`}
                          >
                            <input
                              type="radio"
                              name="shipping-method"
                              value={method.id}
                              checked={checked}
                              onChange={() => handleShippingSelection(method.id)}
                              className="mt-1 h-4 w-4 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                            />
                            <span className="min-w-0">
                              <span className="block break-words font-mono text-[10px] uppercase tracking-[0.11em] text-foreground">{method.name}</span>
                              <span className="mt-1 block text-[11px] leading-relaxed text-foreground-muted">{method.estimatedWindow}</span>
                              <span className="mt-1 block text-[10px] leading-relaxed text-foreground-subtle">{method.description}</span>
                            </span>
                            <span className="shrink-0 text-end font-mono text-xs tabular-nums text-foreground">
                              {methodCost === 0 ? 'INCLUDED' : formatPrice(methodCost)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                  <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-foreground-subtle">
                    <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Delivery windows are estimates and start once your order is confirmed. You will receive tracking details by email when it ships.
                  </p>
                </div>
              </SectionFrame>

              <SectionFrame
                id="secure-settlement"
                onFocusCapture={() => setActiveSection('settlement')}
              >
                <SectionHeading
                  number="03"
                  title="Payment"
                  detail="Choose how you would like to pay. Nothing is charged online — our team confirms the order with you first."
                  id="settlement-heading"
                  requiredLabel="Required"
                />
                <fieldset disabled={isWorking} aria-describedby={fieldErrors['payment.method'] ? 'payment-method-error' : undefined}>
                  <legend className="sr-only">Payment method</legend>
                  <div className="divide-y divide-border border-y border-border">
                    {paymentOptions.map((option) => {
                      const checked = paymentMethodType === option.id;
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.id}
                          className={`grid min-h-[88px] cursor-pointer grid-cols-[20px_40px_minmax(0,1fr)] items-start gap-3 py-4 transition-colors ${checked ? 'bg-surface-muted/50' : ''}`}
                        >
                          <input
                            id={`payment-method-${option.id}`}
                            type="radio"
                            name="payment-method"
                            value={option.id}
                            checked={checked}
                            onChange={() => handlePaymentSelection(option.id)}
                            className="mt-1 h-4 w-4 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                          />
                          <span className="flex h-10 w-10 items-center justify-center border border-border bg-surface-muted" aria-hidden="true">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 pe-2">
                            <span className="block font-mono text-[10px] uppercase tracking-[0.11em] text-foreground">{option.label}</span>
                            <span className="mt-1 block text-[11px] leading-relaxed text-foreground-muted">{option.summary}</span>
                            {checked && <span className="mt-2 block text-[11px] leading-relaxed text-foreground-subtle">{option.detail}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {fieldErrors['payment.method'] && <p id="payment-method-error" role="alert" className="mt-2 font-mono text-caption text-danger">{fieldErrors['payment.method']}</p>}
                <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-foreground-subtle">
                  <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  No card details are collected on this site. Your order stays reserved while payment is pending and is marked paid once our team confirms it.
                </p>

                <div className="mt-6 border-t border-border pt-5">
                  <label className="flex min-h-12 cursor-pointer items-start gap-3 text-small text-foreground">
                    <input
                      type="checkbox"
                      checked={billingSameAsShipping}
                      onChange={(event) => toggleBillingSame(event.target.checked)}
                      disabled={isWorking}
                      className="mt-0.5 h-4 w-4 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    />
                    <span>Billing address is the same as delivery address</span>
                  </label>
                </div>

                {!billingSameAsShipping && (
                  <div className="mt-5 border-t border-border pt-6">
                    <div className="mb-5">
                      <PanelLabel>Billing // separate destination</PanelLabel>
                      <h3 className="mt-1.5 font-display text-base text-foreground">Billing address</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                      <Field id="billing-firstName" label="First name" value={billingAddress.firstName} onChange={(value) => setAddressField('billing', 'firstName', value)} error={getFieldError(fieldErrors, 'billing.firstName')} autoComplete="billing given-name" disabled={isWorking} />
                      <Field id="billing-lastName" label="Last name" value={billingAddress.lastName} onChange={(value) => setAddressField('billing', 'lastName', value)} error={getFieldError(fieldErrors, 'billing.lastName')} autoComplete="billing family-name" disabled={isWorking} />
                      <SelectField id="billing-country" label="Country / Region" value={billingAddress.country} onChange={(value) => setAddressField('billing', 'country', value)} options={COUNTRIES.map((country) => ({ value: country, label: country }))} error={getFieldError(fieldErrors, 'billing.country')} disabled={isWorking} />
                      <Field id="billing-company" label="Company / Studio" value={billingAddress.company} onChange={(value) => setAddressField('billing', 'company', value)} error={getFieldError(fieldErrors, 'billing.company')} autoComplete="billing organization" required={false} disabled={isWorking} />
                      <div className="sm:col-span-2"><Field id="billing-line1" label="Address" value={billingAddress.line1} onChange={(value) => setAddressField('billing', 'line1', value)} error={getFieldError(fieldErrors, 'billing.line1')} autoComplete="billing address-line1" disabled={isWorking} /></div>
                      <div className="sm:col-span-2"><Field id="billing-line2" label="Apartment / Suite / Floor" value={billingAddress.line2} onChange={(value) => setAddressField('billing', 'line2', value)} error={getFieldError(fieldErrors, 'billing.line2')} autoComplete="billing address-line2" required={false} disabled={isWorking} /></div>
                      <Field id="billing-city" label="City" value={billingAddress.city} onChange={(value) => setAddressField('billing', 'city', value)} error={getFieldError(fieldErrors, 'billing.city')} autoComplete="billing address-level2" disabled={isWorking} />
                      <Field id="billing-state" label="State / Province" value={billingAddress.state} onChange={(value) => setAddressField('billing', 'state', value)} error={getFieldError(fieldErrors, 'billing.state')} autoComplete="billing address-level1" disabled={isWorking} />
                      <Field id="billing-postalCode" label="Postal code" value={billingAddress.postalCode} onChange={(value) => setAddressField('billing', 'postalCode', value)} error={getFieldError(fieldErrors, 'billing.postalCode')} autoComplete="billing postal-code" disabled={isWorking} />
                      <Field id="billing-phone" label="Phone" value={billingAddress.phone || customer.phone} onChange={(value) => setAddressField('billing', 'phone', value)} error={getFieldError(fieldErrors, 'billing.phone')} autoComplete="billing tel" type="tel" inputMode="tel" disabled={isWorking} />
                    </div>
                  </div>
                )}

                <div className="mt-6 border-t border-border pt-5">
                  <label htmlFor="checkout-notes" className="mb-2 block font-mono text-label uppercase tracking-[0.12em] text-foreground">Private dispatch note <span className="text-foreground-subtle">{'// optional'}</span></label>
                  <textarea
                    id="checkout-notes"
                    rows={3}
                    maxLength={500}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    disabled={isWorking}
                    placeholder="Access notes, preferred receiving window, or commissioning detail"
                    className="w-full resize-y border border-border bg-surface px-3.5 py-3 text-small text-foreground placeholder:text-foreground-subtle focus:border-foreground focus:outline-none disabled:opacity-50"
                  />
                  <p className="mt-2 text-[10px] text-foreground-subtle">{notes.length} / 500 characters</p>
                </div>
              </SectionFrame>

              {activeSection === 'review' && (
                <section
                  id="final-review"
                  ref={reviewRef}
                  tabIndex={-1}
                  aria-labelledby="review-heading"
                  className="scroll-mt-28 border border-foreground bg-surface p-5 outline-none sm:p-7 lg:p-8"
                >
                  <SectionHeading
                    number="04"
                    title="Final review"
                    detail="Check your details before placing the order. You can still edit any section."
                    id="review-heading"
                    requiredLabel="Final step"
                  />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <ReviewBlock
                      title="Client"
                      editLabel="Edit client"
                      onEdit={() => scrollToSection('client')}
                    >
                      <p className="text-small font-medium text-foreground">{customer.firstName} {customer.lastName}</p>
                      <p className="mt-1 break-all text-small text-foreground-muted">{customer.email}</p>
                      <p className="mt-1 text-small text-foreground-muted">{customer.phone}</p>
                    </ReviewBlock>
                    <ReviewBlock
                      title="Delivery"
                      editLabel="Edit address"
                      onEdit={() => scrollToSection('delivery')}
                    >
                      <p className="text-small font-medium text-foreground">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                      {shippingAddress.company && <p className="mt-1 text-small text-foreground-muted">{shippingAddress.company}</p>}
                      <p className="mt-1 break-words text-small text-foreground-muted">{shippingAddress.line1}{shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}</p>
                      <p className="mt-1 text-small text-foreground-muted">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                      <p className="mt-1 text-small text-foreground-muted">{shippingAddress.country}</p>
                    </ReviewBlock>
                    {!billingSameAsShipping && (
                      <ReviewBlock
                        title="Billing address"
                        editLabel="Edit billing"
                        onEdit={() => scrollToSection('settlement')}
                      >
                        <p className="text-small font-medium text-foreground">{billingAddress.firstName} {billingAddress.lastName}</p>
                        <p className="mt-1 break-words text-small text-foreground-muted">{billingAddress.line1}{billingAddress.line2 ? `, ${billingAddress.line2}` : ''}</p>
                        <p className="mt-1 text-small text-foreground-muted">{billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}</p>
                        <p className="mt-1 text-small text-foreground-muted">{billingAddress.country}</p>
                      </ReviewBlock>
                    )}
                    <ReviewBlock
                      title="Delivery option"
                      editLabel="Edit delivery"
                      onEdit={() => scrollToSection('delivery')}
                    >
                      <p className="text-small font-medium text-foreground">{selectedShippingOption?.name ?? 'Unavailable'}</p>
                      <p className="mt-1 text-small text-foreground-muted">{selectedShippingOption?.estimatedWindow}</p>
                      <p className="mt-1 text-small text-foreground-muted">{selectedShippingOption?.estimatedDispatch}</p>
                    </ReviewBlock>
                    <ReviewBlock
                      title="Payment method"
                      editLabel="Edit payment"
                      onEdit={() => scrollToSection('settlement')}
                    >
                      <p className="text-small font-medium text-foreground">{paymentLabel(reviewPaymentMethod ?? paymentMethodType)}</p>
                      <p className="mt-1 text-small text-foreground-muted">
                        {(reviewPaymentMethod ?? paymentMethodType) === 'bank_transfer'
                          ? 'Bank details follow in your confirmation; we dispatch once the transfer is confirmed.'
                          : 'Pay the courier when your order arrives.'}
                      </p>
                    </ReviewBlock>
                  </div>

                  <div className="mt-6 border-t border-border pt-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <PanelLabel>Items // {itemCountLabel}</PanelLabel>
                        <h3 className="mt-1.5 font-display text-base text-foreground">In this order</h3>
                      </div>
                      <Link href="/cart" className="inline-flex min-h-11 items-center border-b border-border-strong/70 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted">Edit items</Link>
                    </div>
                    <AllocationLines items={cart} lineTotals={cartLineTotals} />
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-6 border-t border-border pt-5 sm:grid-cols-2">
                    <div>
                      <PanelLabel>Discount</PanelLabel>
                      <p className="mt-2 text-small text-foreground">
                        {appliedDiscount ? `${appliedDiscount.code} — ${appliedDiscount.description}` : 'No discount code applied'}
                      </p>
                    </div>
                    <div className="sm:text-end">
                      <PanelLabel>Tax</PanelLabel>
                      <p className="mt-2 text-small text-foreground">{taxAmount === 0 ? 'Included in the listed prices.' : formatPrice(taxAmount)}</p>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-border pt-5">
                    <TotalsLedger
                      totals={orderTotals}
                      discountCode={appliedDiscount?.code}
                      shippingMethod={selectedShippingMethod}
                      compact
                    />
                  </div>

                  <div className="mt-6 border border-accent/30 bg-accent/5 p-4 text-[11px] leading-relaxed text-foreground-muted">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">What happens next</p>
                    <p className="mt-2">Placing the order reserves your items and sends a confirmation email with your order number. Our team then confirms the order with you and arranges payment on delivery or by bank transfer before dispatch.</p>
                  </div>
                </section>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                <Link href="/cart" className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted hover:text-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to bag
                </Link>
                <p className="flex items-center gap-2 text-[10px] text-foreground-subtle"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Your details are transmitted securely and stored only with your order</p>
              </div>
            </div>

            <aside className="min-w-0 lg:col-span-5 xl:col-span-4">
              <div className="border border-border bg-surface p-5 sm:p-7 lg:sticky lg:top-28 lg:p-8">
                <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
                  <div>
                    <PanelLabel>Order summary</PanelLabel>
                    <h2 className="mt-2 font-display text-h3 text-foreground">Summary</h2>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">{itemCountLabel}</span>
                </div>

                <div className="max-h-[40vh] overflow-y-auto overscroll-contain pe-1">
                  <AllocationLines items={cart} lineTotals={cartLineTotals} />
                </div>

                <div className="border-t border-border pt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-foreground-subtle" aria-hidden="true" />
                    <PanelLabel>Discount code</PanelLabel>
                  </div>
                  {appliedDiscount ? (
                    <div className="border border-success/30 bg-success/5 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs uppercase tracking-[0.12em] text-success">{appliedDiscount.code}</p>
                          <p className="mt-1 text-[10px] leading-relaxed text-foreground-muted">{appliedDiscount.description}</p>
                          {promoThresholdMessage && <p className="mt-2 text-[10px] text-danger">{promoThresholdMessage}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            removeDiscountCode();
                            setPromoMessage('Discount code removed.');
                            setPromoError(false);
                          }}
                          className="min-h-11 shrink-0 border-b border-border-strong font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted hover:text-danger"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <Input
                          id="checkout-promo-code"
                          label="Code"
                          value={promoCode}
                          onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void applyPromo();
                            }
                          }}
                          placeholder="ENTER CODE"
                          autoComplete="off"
                          disabled={isWorking || isApplyingPromo}
                        />
                      </div>
                      <Button type="button" variant="outline" size="md" isLoading={isApplyingPromo} onClick={() => void applyPromo()} disabled={!promoCode.trim() || isWorking} className="h-11 px-3.5">
                        Apply
                      </Button>
                    </div>
                  )}
                  {promoMessage && (
                    <p role={promoError ? 'alert' : 'status'} className={`mt-2 text-[10px] leading-relaxed ${promoError ? 'text-danger' : 'text-success'}`}>{promoMessage}</p>
                  )}
                </div>

                <div className="mt-5">
                  <TotalsLedger
                    totals={orderTotals}
                    discountCode={appliedDiscount?.code}
                    shippingMethod={selectedShippingMethod}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowTaxNote((shown) => !shown)}
                  aria-expanded={showTaxNote}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-start font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-subtle hover:text-foreground"
                >
                  <Info className="h-3 w-3" aria-hidden="true" /> About taxes and duties
                </button>
                {showTaxNote && (
                  <p className="mb-3 border-s border-border-strong ps-3 text-[10px] leading-relaxed text-foreground-subtle">
                    Prices include applicable taxes. Import duties, where they apply, are settled by the recipient on delivery.
                  </p>
                )}

                {orderAttemptStatus && <p role="status" className="mt-3 text-[10px] leading-relaxed text-foreground-muted">{orderAttemptStatus}</p>}
                {paymentState === 'failed' && <p role="status" className="mt-3 text-[10px] leading-relaxed text-danger">The prior attempt did not complete. Your bag remains available; review the flagged section and retry.</p>}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isWorking}
                  disabled={cart.length === 0 || isLoadingShipping || Boolean(shippingServiceError) || !shippingMethods.length}
                  rightIcon={!isWorking ? <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /> : undefined}
                  className="mt-5 min-h-12"
                >
                  {activeSection === 'review' ? 'Place Order' : 'Review & Place Order'}
                </Button>
                <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">
                  {`${paymentLabel(paymentMethodType)} // confirmed by our team before dispatch`}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                  <div className="px-1"><ShieldCheck className="mx-auto h-4 w-4 text-foreground-muted" aria-hidden="true" /><span className="mt-2 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Order<br />confirmation</span></div>
                  <div className="border-x border-border px-1"><MapPin className="mx-auto h-4 w-4 text-foreground-muted" aria-hidden="true" /><span className="mt-2 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Tracked<br />delivery</span></div>
                  <div className="px-1"><LockKeyhole className="mx-auto h-4 w-4 text-foreground-muted" aria-hidden="true" /><span className="mt-2 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">No card<br />details stored</span></div>
                </div>
              </div>
            </aside>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background px-4 pt-3 lg:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="mx-auto flex max-w-xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">{`${itemCountLabel} // EST. TOTAL`}</p>
                <PriceDisplay price={cartTotal} size="md" />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isWorking}
                disabled={cart.length === 0 || isLoadingShipping || Boolean(shippingServiceError) || !shippingMethods.length}
                withArrow={activeSection === 'review' ? undefined : 'right'}
                className="min-h-12 max-w-[58%] px-4 text-[10px] leading-tight"
              >
                {activeSection === 'review' ? 'Place Order' : 'Review & Place Order'}
              </Button>
            </div>
          </div>
        </form>
      </Container>
    </main>
  );
}

function ReviewBlock({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 border-b border-border pb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <PanelLabel>{title}</PanelLabel>
        <button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center gap-1 border-b border-border-strong/70 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
          {editLabel} <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
      {children}
    </section>
  );
}
