'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CheckoutCustomerInfo, PaymentMethodType } from '@/types';
import { boundedText, isRecord } from '@/lib/utils/persisted-state';

export type CheckoutSection = 'client' | 'delivery' | 'settlement' | 'review';
export type CheckoutPaymentState =
  | 'not_started'
  | 'ready_for_review'
  | 'intent_created'
  | 'provider_required'
  | 'failed';

export interface CheckoutAddressDraft {
  firstName: string;
  lastName: string;
  country: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  company: string;
}

export interface CheckoutDraft {
  customer: CheckoutCustomerInfo;
  shippingAddress: CheckoutAddressDraft;
  billingAddress: CheckoutAddressDraft;
  billingSameAsShipping: boolean;
  selectedShippingMethodId: string;
  paymentMethodType: PaymentMethodType;
  activeSection: CheckoutSection;
  notes: string;
}

const EMPTY_CUSTOMER: CheckoutCustomerInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

const EMPTY_ADDRESS: CheckoutAddressDraft = {
  firstName: '',
  lastName: '',
  country: 'United States',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  company: '',
};

export const DEFAULT_CHECKOUT_DRAFT: CheckoutDraft = {
  customer: EMPTY_CUSTOMER,
  shippingAddress: EMPTY_ADDRESS,
  billingAddress: { ...EMPTY_ADDRESS },
  billingSameAsShipping: true,
  selectedShippingMethodId: '',
  paymentMethodType: 'cash_on_delivery',
  activeSection: 'client',
  notes: '',
};

const STORAGE_KEY = 'noire_checkout_session_v1';

interface CheckoutContextValue extends CheckoutDraft {
  isCheckoutHydrated: boolean;
  paymentState: CheckoutPaymentState;
  setCustomer: (customer: CheckoutCustomerInfo) => void;
  setShippingAddress: (address: CheckoutAddressDraft) => void;
  setBillingAddress: (address: CheckoutAddressDraft) => void;
  setBillingSameAsShipping: (same: boolean) => void;
  setSelectedShippingMethodId: (id: string) => void;
  setPaymentMethodType: (type: PaymentMethodType) => void;
  setActiveSection: (section: CheckoutSection) => void;
  setNotes: (notes: string) => void;
  setPaymentState: (state: CheckoutPaymentState) => void;
  prefillCustomerProfile: (profile: {
    customer?: Partial<CheckoutCustomerInfo>;
    shippingAddress?: Partial<CheckoutAddressDraft>;
  }) => void;
  clearCheckoutDraft: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(
  undefined
);

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function safeString(value: unknown, fallback: string, maxLength: number): string {
  return boundedText(value, fallback, maxLength);
}

function mergeAddress(value: unknown): CheckoutAddressDraft {
  const saved = asRecord(value);
  return {
    firstName: safeString(saved.firstName, '', 80),
    lastName: safeString(saved.lastName, '', 80),
    country: safeString(saved.country, EMPTY_ADDRESS.country, 100),
    line1: safeString(saved.line1, '', 160),
    line2: safeString(saved.line2, '', 160),
    city: safeString(saved.city, '', 100),
    state: safeString(saved.state, '', 100),
    postalCode: safeString(saved.postalCode, '', 32),
    phone: safeString(saved.phone, '', 40),
    company: safeString(saved.company, '', 120),
  };
}

export function sanitizeCheckoutDraft(value: unknown): CheckoutDraft {
  const saved = asRecord(value);
  const savedCustomer = asRecord(saved.customer);
  const validSections: CheckoutSection[] = [
    'client',
    'delivery',
    'settlement',
    'review',
  ];
  const savedSection = saved.activeSection;
  const activeSection = validSections.includes(savedSection as CheckoutSection)
    ? (savedSection as CheckoutSection)
    : DEFAULT_CHECKOUT_DRAFT.activeSection;
  const paymentMethodType: PaymentMethodType =
    saved.paymentMethodType === 'bank_transfer' ? 'bank_transfer' : 'cash_on_delivery';

  return {
    customer: {
      firstName: safeString(savedCustomer.firstName, EMPTY_CUSTOMER.firstName, 80),
      lastName: safeString(savedCustomer.lastName, EMPTY_CUSTOMER.lastName, 80),
      email: safeString(savedCustomer.email, EMPTY_CUSTOMER.email, 254),
      phone: safeString(savedCustomer.phone, EMPTY_CUSTOMER.phone, 40),
    },
    shippingAddress: mergeAddress(saved.shippingAddress),
    billingAddress: mergeAddress(saved.billingAddress),
    billingSameAsShipping:
      typeof saved.billingSameAsShipping === 'boolean'
        ? saved.billingSameAsShipping
        : DEFAULT_CHECKOUT_DRAFT.billingSameAsShipping,
    selectedShippingMethodId: /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/.test(
      safeString(saved.selectedShippingMethodId, DEFAULT_CHECKOUT_DRAFT.selectedShippingMethodId, 160)
    )
      ? safeString(saved.selectedShippingMethodId, DEFAULT_CHECKOUT_DRAFT.selectedShippingMethodId, 160)
      : DEFAULT_CHECKOUT_DRAFT.selectedShippingMethodId,
    paymentMethodType,
    activeSection,
    notes: safeString(saved.notes, DEFAULT_CHECKOUT_DRAFT.notes, 500),
  };
}

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<CheckoutDraft>(DEFAULT_CHECKOUT_DRAFT);
  const [isCheckoutHydrated, setIsCheckoutHydrated] = useState(false);
  const [paymentState, setPaymentState] =
    useState<CheckoutPaymentState>('not_started');

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && saved.length <= 65_536) {
        setDraft(sanitizeCheckoutDraft(JSON.parse(saved) as unknown));
      } else if (saved) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Session storage may be unavailable or restricted.
      }
      // Malformed or inaccessible state never blocks checkout.
    } finally {
      setIsCheckoutHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isCheckoutHydrated) return;
    try {
      // Intentionally persist safe contact/address preferences only. PAN, CVC,
      // expiry, provider tokens, and payment-intent secrets never enter this payload.
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeCheckoutDraft(draft)));
    } catch {
      // A restricted storage environment must not block checkout.
    }
  }, [draft, isCheckoutHydrated]);

  const setCustomer = useCallback((customer: CheckoutCustomerInfo) => {
    setDraft((current) => ({
      ...current,
      customer: sanitizeCheckoutDraft({ ...current, customer }).customer,
    }));
  }, []);

  const setShippingAddress = useCallback(
    (shippingAddress: CheckoutAddressDraft) => {
      setDraft((current) => ({ ...current, shippingAddress: mergeAddress(shippingAddress) }));
    },
    []
  );

  const setBillingAddress = useCallback(
    (billingAddress: CheckoutAddressDraft) => {
      setDraft((current) => ({ ...current, billingAddress: mergeAddress(billingAddress) }));
    },
    []
  );

  const setBillingSameAsShipping = useCallback((billingSameAsShipping: boolean) => {
    setDraft((current) => ({ ...current, billingSameAsShipping }));
  }, []);

  const setSelectedShippingMethodId = useCallback(
    (selectedShippingMethodId: string) => {
      const safeId = boundedText(selectedShippingMethodId, '', 160);
      setDraft((current) => ({
        ...current,
        selectedShippingMethodId: /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/.test(safeId)
          ? safeId
          : DEFAULT_CHECKOUT_DRAFT.selectedShippingMethodId,
      }));
    },
    []
  );

  const setPaymentMethodType = useCallback((paymentMethodType: PaymentMethodType) => {
    const safeType = paymentMethodType === 'apple_pay' || paymentMethodType === 'wire_transfer'
      ? paymentMethodType
      : 'card';
    setDraft((current) => ({ ...current, paymentMethodType: safeType }));
  }, []);

  const setActiveSection = useCallback((activeSection: CheckoutSection) => {
    const validSections: CheckoutSection[] = ['client', 'delivery', 'settlement', 'review'];
    setDraft((current) => ({
      ...current,
      activeSection: validSections.includes(activeSection) ? activeSection : 'client',
    }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setDraft((current) => ({ ...current, notes: boundedText(notes, '', 500) }));
  }, []);

  const prefillCustomerProfile = useCallback(
    (profile: {
      customer?: Partial<CheckoutCustomerInfo>;
      shippingAddress?: Partial<CheckoutAddressDraft>;
    }) => {
      setDraft((current) => sanitizeCheckoutDraft({
        ...current,
        customer: { ...current.customer, ...profile.customer },
        shippingAddress: {
          ...current.shippingAddress,
          ...profile.shippingAddress,
        },
      }));
    },
    []
  );

  const clearCheckoutDraft = useCallback(() => {
    setDraft(DEFAULT_CHECKOUT_DRAFT);
    setPaymentState('not_started');
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage is optional.
    }
  }, []);

  const value = useMemo<CheckoutContextValue>(
    () => ({
      ...draft,
      isCheckoutHydrated,
      paymentState,
      setCustomer,
      setShippingAddress,
      setBillingAddress,
      setBillingSameAsShipping,
      setSelectedShippingMethodId,
      setPaymentMethodType,
      setActiveSection,
      setNotes,
      setPaymentState,
      prefillCustomerProfile,
      clearCheckoutDraft,
    }),
    [
      draft,
      isCheckoutHydrated,
      paymentState,
      setCustomer,
      setShippingAddress,
      setBillingAddress,
      setBillingSameAsShipping,
      setSelectedShippingMethodId,
      setPaymentMethodType,
      setActiveSection,
      setNotes,
      prefillCustomerProfile,
      clearCheckoutDraft,
    ]
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
}
