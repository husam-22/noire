'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types';
import type { AuthenticatedCustomerSession, CustomerAccountSnapshot } from '@/lib/account/contracts';
import { AccountAddresses } from '@/components/account/account-addresses';
import { AccountHeader } from '@/components/account/account-header';
import { AccountNavigation, type AccountSectionId } from '@/components/account/account-navigation';
import { AccountOrders } from '@/components/account/account-orders';
import { AccountOverview } from '@/components/account/account-overview';
import { AccountPreferences } from '@/components/account/account-preferences';
import { AccountProfile } from '@/components/account/account-profile';
import { Container } from '@/components/layout';
import { useCommerce } from '@/lib/context/commerce-context';

const ACCOUNT_SECTIONS: AccountSectionId[] = [
  'overview',
  'order-archive',
  'delivery-register',
  'client-profile',
  'private-dispatch',
];

interface AccountExperienceProps {
  session: AuthenticatedCustomerSession;
  snapshot: CustomerAccountSnapshot;
  allProducts: Product[];
}

export function AccountExperience({ session, snapshot, allProducts }: AccountExperienceProps) {
  const { cartCount, isCartHydrated, pruneWishlistIds, wishlistIds } = useCommerce();
  const [activeSection, setActiveSection] = useState<AccountSectionId>('overview');

  const productsById = useMemo(
    () => new Map(allProducts.map((product) => [product.id, product])),
    [allProducts]
  );

  const savedProducts = useMemo(() => {
    const seen = new Set<string>();
    const resolved: Product[] = [];
    for (const id of wishlistIds) {
      const product = productsById.get(id);
      if (!product || seen.has(id)) continue;
      seen.add(id);
      resolved.push(product);
    }
    return resolved;
  }, [productsById, wishlistIds]);

  const orders = snapshot.orders;

  const orderedInstrumentCount = useMemo(
    () =>
      orders.reduce(
        (total, order) =>
          total + order.items.reduce((itemsTotal, item) => itemsTotal + item.quantity, 0),
        0
      ),
    [orders]
  );

  useEffect(() => {
    if (!isCartHydrated) return;
    pruneWishlistIds(allProducts.map((product) => product.id));
  }, [allProducts, isCartHydrated, pruneWishlistIds, wishlistIds]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const sections = ACCOUNT_SECTIONS.map((id) => document.getElementById(id)).filter(
      (section): section is HTMLElement => section !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (!visible) return;
        const sectionId = visible.target.id;
        if (ACCOUNT_SECTIONS.includes(sectionId as AccountSectionId)) {
          setActiveSection(sectionId as AccountSectionId);
        }
      },
      { rootMargin: '-22% 0px -62% 0px', threshold: [0, 0.15, 0.35, 0.6] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const profile = snapshot.profile ?? {
    ...session.customer,
  };

  return (
    <>
      <AccountHeader session={session} profile={profile} />
      <main id="main-content" className="bg-background py-7 text-foreground sm:py-10 lg:py-12">
        <Container size="wide">
          <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-8">
            <div className="min-w-0 lg:col-span-3">
              <AccountNavigation activeSection={activeSection} />
            </div>
            <div className="min-w-0 space-y-12 lg:col-span-9 lg:space-y-16">
              <AccountOverview
                profile={profile}
                isHydrated={isCartHydrated}
                activeAllocationCount={cartCount}
                savedProducts={savedProducts}
                orders={orders}
                orderedInstrumentCount={orderedInstrumentCount}
              />
              <AccountOrders orders={orders} />
              <AccountAddresses addresses={snapshot.addresses} profile={profile} />
              <AccountProfile profile={profile} />
              <AccountPreferences email={profile.email} preferences={snapshot.preferences} />
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
