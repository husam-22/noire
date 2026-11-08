'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useTranslations } from 'next-intl';
import type {
  Product,
  ProductColorVariant,
  ProductOptionVariant,
  CartItem,
  Discount,
  ShippingMethod,
  OrderTotals,
} from '@/types';
import { validateDiscountAction } from '@/lib/actions/commerce';
import { roundMoney } from '@/lib/commerce/totals';
import { useToast } from '@/components/ui/toast';
import {
  sanitizeCartState,
  sanitizeDiscountState,
  sanitizeIdentifierList,
  sanitizeShippingMethodState,
} from '@/lib/utils/persisted-state';

export const FREE_SHIPPING_THRESHOLD = 500;
export const STANDARD_COURIER_RATE = 35;

interface CommerceContextValue {
  // Shipping methods available for this store (loaded from the database on the server)
  shippingMethods: ShippingMethod[];
  // Cart state
  cart: CartItem[];
  isCartHydrated: boolean;
  cartCount: number;
  cartLineTotals: Record<string, number>;
  cartSubtotal: number;
  discountAmount: number;
  appliedDiscount: Discount | null;
  selectedShippingMethod: ShippingMethod;
  setSelectedShippingMethod: (method: ShippingMethod) => void;
  shippingEstimateCost: number;
  taxAmount: number;
  cartTotal: number;
  orderTotals: OrderTotals;
  freeShippingProgress: number;
  amountUntilFreeShipping: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  addToCart: (params: {
    product: Product;
    color?: ProductColorVariant;
    option?: ProductOptionVariant;
    quantity?: number;
    openDrawer?: boolean;
  }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  syncCartItemFromValidation: (
    cartItemId: string,
    updates: { quantity?: number; price?: number }
  ) => void;
  moveToWishlist: (cartItemId: string) => void;
  clearCart: (silent?: boolean) => void;

  // Discount / Allocation privilege codes
  applyDiscountCode: (
    code: string
  ) => Promise<{ valid: boolean; message: string }>;
  removeDiscountCode: () => void;

  // Wishlist state
  wishlistIds: string[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeWishlistItem: (product: Product) => void;
  clearWishlist: () => void;
  pruneWishlistIds: (validProductIds: string[]) => void;

  // Recently viewed
  recentlyViewedIds: string[];
  recordProductView: (productId: string) => void;

  // Global overlays
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
}

const CommerceContext = createContext<CommerceContextValue | undefined>(
  undefined
);

const STORAGE_KEYS = {
  CART: 'noire_cart_v1',
  WISHLIST: 'noire_wishlist_v1',
  RECENT: 'noire_recent_v1',
  DISCOUNT: 'noire_discount_v1',
  SHIPPING_METHOD: 'noire_shipping_method_v1',
};
/** Legacy key from the pre-database build; removed on first load. */
const LEGACY_ORDERS_KEY = 'noire_orders_v1';

/** Safe default when the database has no active shipping method yet. */
function fallbackShippingMethod(t: (key: string) => string): ShippingMethod {
  return {
    id: 'standard',
    code: 'standard',
    name: t('fallbackShipping'),
    carrier: t('fallbackCarrier'),
    estimatedWindow: t('fallbackWindow'),
    estimatedDispatch: t('fallbackDispatch'),
    baseCost: STANDARD_COURIER_RATE,
    freeAboveSubtotal: FREE_SHIPPING_THRESHOLD,
    description: '',
  };
}
const MAX_PERSISTED_STATE_CHARS = 2 * 1024 * 1024;

export function CommerceProvider({
  children,
  shippingMethods: shippingMethodsProp,
}: {
  children: React.ReactNode;
  shippingMethods?: ShippingMethod[];
}) {
  const { addToast } = useToast();
  const t = useTranslations('commerceToasts');
  const shippingMethods = useMemo<ShippingMethod[]>(
    () => (shippingMethodsProp && shippingMethodsProp.length > 0 ? shippingMethodsProp : [fallbackShippingMethod(t)]),
    [shippingMethodsProp, t]
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [selectedShippingMethod, setSelectedShippingMethodState] =
    useState<ShippingMethod>(shippingMethods[0]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null
  );

  // Persisted browser state is untrusted: parse each key independently, then whitelist and bound it.
  useEffect(() => {
    const readStoredValue = (key: string): unknown => {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return undefined;
        if (raw.length > MAX_PERSISTED_STATE_CHARS) {
          localStorage.removeItem(key);
          return undefined;
        }
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    };
    const parseEventValue = (raw: string | null): unknown => {
      if (raw === null || raw.length > MAX_PERSISTED_STATE_CHARS) return undefined;
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    };
    const resetStoredState = () => {
      setCart([]);
      setWishlistIds([]);
      setRecentlyViewedIds([]);
      setAppliedDiscount(null);
      setSelectedShippingMethodState(shippingMethods[0]);
    };

    try {
      localStorage.removeItem(LEGACY_ORDERS_KEY);
    } catch {
      // Ignore
    }

    setCart(sanitizeCartState(readStoredValue(STORAGE_KEYS.CART)));
    setWishlistIds(sanitizeIdentifierList(readStoredValue(STORAGE_KEYS.WISHLIST)));
    setRecentlyViewedIds(sanitizeIdentifierList(readStoredValue(STORAGE_KEYS.RECENT), 6));
    setAppliedDiscount(sanitizeDiscountState(readStoredValue(STORAGE_KEYS.DISCOUNT)));
    setSelectedShippingMethodState(
      sanitizeShippingMethodState(readStoredValue(STORAGE_KEYS.SHIPPING_METHOD), shippingMethods)
    );
    setIsHydrated(true);

    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === null) {
        resetStoredState();
        return;
      }
      const value = parseEventValue(event.newValue);
      if (event.key === STORAGE_KEYS.CART) {
        setCart(sanitizeCartState(value));
      } else if (event.key === STORAGE_KEYS.WISHLIST) {
        setWishlistIds(sanitizeIdentifierList(value));
      } else if (event.key === STORAGE_KEYS.RECENT) {
        setRecentlyViewedIds(sanitizeIdentifierList(value, 6));
      } else if (event.key === STORAGE_KEYS.DISCOUNT) {
        setAppliedDiscount(sanitizeDiscountState(value));
      } else if (event.key === STORAGE_KEYS.SHIPPING_METHOD) {
        setSelectedShippingMethodState(sanitizeShippingMethodState(value, shippingMethods));
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once; shipping methods are static per page load
  }, []);

  // Persist changes to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlistIds));
    } catch {
      // Ignore
    }
  }, [wishlistIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.RECENT,
        JSON.stringify(recentlyViewedIds)
      );
    } catch {
      // Ignore
    }
  }, [recentlyViewedIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (appliedDiscount) {
        localStorage.setItem(
          STORAGE_KEYS.DISCOUNT,
          JSON.stringify(appliedDiscount)
        );
      } else {
        localStorage.removeItem(STORAGE_KEYS.DISCOUNT);
      }
    } catch {
      // Ignore
    }
  }, [appliedDiscount, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.SHIPPING_METHOD,
        JSON.stringify(selectedShippingMethod)
      );
    } catch {
      // Ignore
    }
  }, [selectedShippingMethod, isHydrated]);

  const setSelectedShippingMethod = useCallback((method: ShippingMethod) => {
    setSelectedShippingMethodState(
      sanitizeShippingMethodState(method, shippingMethods)
    );
  }, [shippingMethods]);

  const addToCart = useCallback(
    ({
      product,
      color,
      option,
      quantity = 1,
      openDrawer = false,
    }: {
      product: Product;
      color?: ProductColorVariant;
      option?: ProductOptionVariant;
      quantity?: number;
      openDrawer?: boolean;
    }) => {
      if (!Number.isSafeInteger(quantity) || quantity < 1) return;
      if (
        product.status !== 'active' ||
        product.stockStatus === 'out_of_stock' ||
        (product.stockStatus !== 'pre_order' && product.inventoryCount <= 0)
      ) return;
      const selectedColor = color ?? product.colors[0];
      if (!selectedColor || !Number.isFinite(product.price) || product.price < 0) return;
      const safeQuantity = Math.min(10, quantity);
      const selectedOption = option ?? product.options?.[0];
      const compositeId = `${product.id}__${selectedColor.id}__${
        selectedOption?.id ?? 'default'
      }`;
      const unitPrice = product.price + (selectedOption?.priceDelta ?? 0);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return;

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === compositeId);
        if (existingIndex > -1) {
          const updated = [...prev];
          const existing = updated[existingIndex];
          updated[existingIndex] = {
            ...existing,
            quantity: Math.min(
              existing.maxQuantity,
              existing.quantity + safeQuantity
            ),
          };
          return updated;
        }

        const newItem: CartItem = {
          id: compositeId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          modelNumber: product.modelNumber,
          categoryName: product.categoryName,
          price: unitPrice,
          compareAtPrice: product.compareAtPrice
            ? product.compareAtPrice + (selectedOption?.priceDelta ?? 0)
            : undefined,
          image: selectedColor.image || product.primaryImage,
          selectedColor: {
            id: selectedColor.id,
            name: selectedColor.name,
            hex: selectedColor.hex,
          },
          selectedOption: selectedOption
            ? {
                id: selectedOption.id,
                label: selectedOption.label,
                priceDelta: selectedOption.priceDelta,
              }
            : undefined,
          quantity: Math.min(
            safeQuantity,
            product.stockStatus === 'pre_order'
              ? 10
              : Math.max(1, Math.min(10, product.inventoryCount))
          ),
          maxQuantity:
            product.stockStatus === 'pre_order'
              ? 10
              : Math.max(1, Math.min(10, product.inventoryCount)),
          shippingEstimate: product.shippingEstimate,
        };
        return [...prev, newItem];
      });

      if (openDrawer) {
        setIsCartDrawerOpen(true);
      } else {
        addToast({
          type: 'cart',
          title: t('addedToBag', { name: product.name }),
          description: `${selectedColor.name}${
            selectedOption ? ` — ${selectedOption.label}` : ''
          } × ${safeQuantity}`,
          actionLabel: t('openBag'),
          onAction: () => setIsCartDrawerOpen(true),
        });
      }
    },
    [addToast, t]
  );

  const removeFromCart = useCallback(
    (cartItemId: string) => {
      const removed = cart.find((i) => i.id === cartItemId);
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
      if (removed) {
        addToast({
          type: 'info',
          title: t('removed', { name: removed.name }),
          description: t('removedFromBag', {
            variant: `${removed.selectedColor.name}${removed.selectedOption ? ` · ${removed.selectedOption.label}` : ''}`,
          }),
          actionLabel: t('undo'),
          onAction: () => {
            setCart((prev) => {
              if (prev.some((i) => i.id === removed.id)) return prev;
              return [...prev, removed];
            });
          },
        });
      }
    },
    [cart, addToast, t]
  );

  const updateCartQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (!Number.isSafeInteger(quantity)) return;
      if (quantity <= 0) {
        removeFromCart(cartItemId);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: Math.min(item.maxQuantity, quantity) }
            : item
        )
      );
    },
    [removeFromCart]
  );

  const syncCartItemFromValidation = useCallback(
    (cartItemId: string, updates: { quantity?: number; price?: number }) => {
      const quantity = Number.isSafeInteger(updates.quantity) && (updates.quantity ?? 0) > 0
        ? updates.quantity
        : undefined;
      const price = Number.isFinite(updates.price) && (updates.price ?? -1) >= 0
        ? updates.price
        : undefined;
      if (quantity === undefined && price === undefined) return;
      setCart((prev) =>
        prev.map((item) =>
          item.id === cartItemId
            ? {
                ...item,
                ...(quantity === undefined ? {} : { quantity: Math.min(item.maxQuantity, quantity) }),
                ...(price === undefined ? {} : { price }),
              }
            : item
        )
      );
    },
    []
  );

  const moveToWishlist = useCallback(
    (cartItemId: string) => {
      const target = cart.find((i) => i.id === cartItemId);
      if (!target) return;

      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
      setWishlistIds((prev) =>
        prev.includes(target.productId) ? prev : [target.productId, ...prev]
      );

      addToast({
        type: 'wishlist',
        title: t('savedForLater', { name: target.name }),
        description: t('savedForLaterBody'),
      });
    },
    [cart, addToast, t]
  );

  const clearCart = useCallback(
    (silent = false) => {
      setCart([]);
      setAppliedDiscount(null);
      if (!silent) {
        addToast({
          type: 'info',
          title: t('bagCleared'),
          description: t('bagClearedBody'),
        });
      }
    },
    [addToast, t]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      const exists = wishlistIds.includes(product.id);
      setWishlistIds((prev) =>
        exists ? prev.filter((id) => id !== product.id) : [product.id, ...prev]
      );

      addToast({
        type: 'wishlist',
        title: exists
          ? t('wishlistRemoved', { name: product.name })
          : t('wishlistAdded', { name: product.name }),
        description: product.modelNumber,
      });
    },
    [wishlistIds, addToast, t]
  );

  const removeWishlistItem = useCallback(
    (product: Product) => {
      if (!wishlistIds.includes(product.id)) return;
      setWishlistIds((prev) => prev.filter((id) => id !== product.id));
      addToast({
        type: 'wishlist',
        title: t('wishlistRemoved', { name: product.name }),
        description: t('wishlistRemovedBody'),
        actionLabel: t('undo'),
        onAction: () => {
          setWishlistIds((prev) =>
            prev.includes(product.id) ? prev : [product.id, ...prev]
          );
        },
      });
    },
    [wishlistIds, addToast, t]
  );

  const clearWishlist = useCallback(() => {
    if (wishlistIds.length === 0) return;
    const removedIds = [...wishlistIds];
    setWishlistIds([]);
    addToast({
      type: 'info',
      title: t('wishlistCleared'),
      description: t('wishlistClearedBody', { count: removedIds.length }),
      actionLabel: t('undo'),
      onAction: () => {
        setWishlistIds((prev) => {
          const present = new Set(prev);
          const restored = removedIds.filter((id) => !present.has(id));
          return [...restored, ...prev];
        });
      },
    });
  }, [wishlistIds, addToast, t]);

  const pruneWishlistIds = useCallback((validProductIds: string[]) => {
    const validIds = new Set(validProductIds);
    setWishlistIds((prev) => {
      const retained = prev.filter((id, index) =>
        validIds.has(id) && prev.indexOf(id) === index
      );
      return retained.length === prev.length ? prev : retained;
    });
  }, []);

  const recordProductView = useCallback((productId: string) => {
    const safeProductId = sanitizeIdentifierList([productId], 1)[0];
    if (!safeProductId) return;
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== safeProductId);
      return [safeProductId, ...filtered].slice(0, 6);
    });
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartLineTotals = useMemo<Record<string, number>>(
    () =>
      Object.fromEntries(
        cart.map((item) => [item.id, item.price * item.quantity])
      ),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => Object.values(cartLineTotals).reduce((sum, lineTotal) => sum + lineTotal, 0),
    [cartLineTotals]
  );

  // Dynamically compute discountAmount against current cartSubtotal
  const discountAmount = useMemo(() => {
    if (!appliedDiscount || cartSubtotal <= 0) return 0;
    if (
      appliedDiscount.minOrderAmount &&
      cartSubtotal < appliedDiscount.minOrderAmount
    ) {
      return 0;
    }
    if (appliedDiscount.type === 'percentage') {
      return roundMoney((cartSubtotal * appliedDiscount.value) / 100);
    }
    if (appliedDiscount.type === 'fixed_amount') {
      return Math.min(cartSubtotal, appliedDiscount.value);
    }
    return 0;
  }, [appliedDiscount, cartSubtotal]);

  const applyDiscountCode = useCallback(
    async (code: string): Promise<{ valid: boolean; message: string }> => {
      const response = await validateDiscountAction(code, cartSubtotal);
      if (!response.ok) {
        return { valid: false, message: response.error };
      }
      const result = response.data;
      const safeDiscount = sanitizeDiscountState(result.discount);
      if (result.valid && safeDiscount) {
        setAppliedDiscount(safeDiscount);
        addToast({
          type: 'success',
          title: t('codeApplied', { code: safeDiscount.code }),
          description: safeDiscount.description,
        });
        return { valid: true, message: result.message };
      }
      return { valid: false, message: result.message };
    },
    [cartSubtotal, addToast, t]
  );

  const removeDiscountCode = useCallback(() => {
    if (!appliedDiscount) return;
    const codeName = appliedDiscount.code;
    setAppliedDiscount(null);
    addToast({
      type: 'info',
      title: t('codeRemoved', { code: codeName }),
      description: t('codeRemovedBody'),
    });
  }, [appliedDiscount, addToast, t]);

  // Single authoritative source of truth for shipping cost based on selectedShippingMethod
  const shippingEstimateCost = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    if (appliedDiscount?.type === 'free_shipping') return 0;
    if (
      selectedShippingMethod.freeAboveSubtotal &&
      cartSubtotal >= selectedShippingMethod.freeAboveSubtotal
    ) {
      return 0;
    }
    return selectedShippingMethod.baseCost;
  }, [cartSubtotal, appliedDiscount, selectedShippingMethod]);

  // Tax placeholder architecture ready for backend tax engine (0 until external tax calculation is enabled)
  const taxAmount = useMemo(() => 0, []);

  // Single authoritative source of truth for cartTotal
  const cartTotal = useMemo(
    () =>
      Math.max(
        0,
        cartSubtotal - discountAmount + shippingEstimateCost + taxAmount
      ),
    [cartSubtotal, discountAmount, shippingEstimateCost, taxAmount]
  );

  const orderTotals = useMemo<OrderTotals>(
    () => ({
      subtotal: cartSubtotal,
      discountAmount,
      shippingCost: shippingEstimateCost,
      taxAmount,
      total: cartTotal,
      currency: 'USD',
    }),
    [cartSubtotal, discountAmount, shippingEstimateCost, taxAmount, cartTotal]
  );

  const freeShippingProgress = useMemo(
    () =>
      Math.min(100, Math.round((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100)),
    [cartSubtotal]
  );

  const amountUntilFreeShipping = useMemo(
    () => Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal),
    [cartSubtotal]
  );

  const value = useMemo(
    () => ({
      shippingMethods,
      cart,
      isCartHydrated: isHydrated,
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
      freeShippingProgress,
      amountUntilFreeShipping,
      isCartDrawerOpen,
      setIsCartDrawerOpen,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      syncCartItemFromValidation,
      moveToWishlist,
      clearCart,
      applyDiscountCode,
      removeDiscountCode,
      wishlistIds,
      wishlistCount: wishlistIds.length,
      isInWishlist,
      toggleWishlist,
      removeWishlistItem,
      clearWishlist,
      pruneWishlistIds,
      recentlyViewedIds,
      recordProductView,
      isSearchOpen,
      setIsSearchOpen,
      quickViewProduct,
      setQuickViewProduct,
    }),
    [
      shippingMethods,
      cart,
      isHydrated,
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
      freeShippingProgress,
      amountUntilFreeShipping,
      isCartDrawerOpen,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      syncCartItemFromValidation,
      moveToWishlist,
      clearCart,
      applyDiscountCode,
      removeDiscountCode,
      wishlistIds,
      isInWishlist,
      toggleWishlist,
      removeWishlistItem,
      clearWishlist,
      pruneWishlistIds,
      recentlyViewedIds,
      recordProductView,
      isSearchOpen,
      quickViewProduct,
    ]
  );

  return (
    <CommerceContext.Provider value={value}>
      {children}
    </CommerceContext.Provider>
  );
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) {
    throw new Error('useCommerce must be used within a CommerceProvider');
  }
  return context;
}
