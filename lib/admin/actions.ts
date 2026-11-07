'use server';

import { revalidatePath } from 'next/cache';
import type { Customer, Discount, DiscountStatus, JournalArticle, Order, OrderStatus, PaymentStatus, Product, ProductStatus, StockStatus } from '@/types';
import type { Json } from '@/types/supabase';
import { requireStaff } from '@/lib/supabase/auth';
import * as admin from '@/lib/services/supabase/admin';
import type { AdminSearchHit } from '@/lib/services/supabase/admin';
import { runAction, type ActionResult } from '@/lib/actions/result';

/**
 * Admin server actions. Every action re-checks the staff role on the server
 * (RLS enforces it again in Postgres) and revalidates the affected routes.
 */
function revalidateAdmin(...paths: string[]) {
  for (const path of ['/[locale]/admin', ...paths]) revalidatePath(path, 'layout');
}

/* Products ----------------------------------------------------------------- */

export async function saveAdminProduct(product: Product): Promise<ActionResult<Product>> {
  return runAction(async () => {
    await requireStaff();
    const saved = await admin.adminSaveProduct(product);
    revalidateAdmin('/[locale]/shop', '/[locale]/product/[slug]', '/[locale]');
    return saved;
  });
}

export async function setAdminProductStatus(id: string, status: ProductStatus): Promise<ActionResult<Product>> {
  return runAction(async () => {
    await requireStaff();
    const saved = await admin.adminSetProductStatus(id, status);
    revalidateAdmin('/[locale]/shop', '/[locale]/product/[slug]');
    return saved;
  });
}

export async function updateAdminInventory(id: string, inventoryCount: number, stockStatus: StockStatus): Promise<ActionResult<Product>> {
  return runAction(async () => {
    await requireStaff();
    const saved = await admin.adminUpdateInventory(id, inventoryCount, stockStatus);
    revalidateAdmin('/[locale]/shop', '/[locale]/product/[slug]');
    return saved;
  });
}

export async function loadAdminProducts(): Promise<ActionResult<Product[]>> {
  return runAction(async () => {
    await requireStaff();
    return admin.adminGetProducts();
  });
}

/* Orders ------------------------------------------------------------------- */

export async function setAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  description?: string,
  carrier?: string,
  trackingNumber?: string
): Promise<ActionResult<Order>> {
  return runAction(async () => {
    await requireStaff();
    const order = await admin.adminSetOrderStatus(orderId, status, description, carrier, trackingNumber);
    revalidateAdmin('/[locale]/account', '/[locale]/order/[orderId]/confirmation');
    return order;
  });
}

export async function confirmAdminOrderPayment(orderId: string, reference?: string): Promise<ActionResult<Order>> {
  return runAction(async () => {
    await requireStaff();
    const order = await admin.adminConfirmOrderPayment(orderId, reference);
    revalidateAdmin('/[locale]/account', '/[locale]/order/[orderId]/confirmation');
    return order;
  });
}

export async function setAdminPaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<ActionResult<Order>> {
  return runAction(async () => {
    await requireStaff();
    const order = await admin.adminSetPaymentStatus(orderId, paymentStatus);
    revalidateAdmin('/[locale]/account');
    return order;
  });
}

/* Customers ---------------------------------------------------------------- */

export async function updateAdminCustomer(
  id: string,
  patch: { status?: Customer['status']; tier?: Customer['tier']; notes?: string | null }
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireStaff();
    await admin.adminUpdateCustomer(id, patch);
    revalidateAdmin();
    return { id };
  });
}

/* Discounts ---------------------------------------------------------------- */

export async function saveAdminDiscount(discount: Discount): Promise<ActionResult<Discount>> {
  return runAction(async () => {
    await requireStaff();
    const saved = await admin.adminSaveDiscount(discount);
    revalidateAdmin();
    return saved;
  });
}

export async function setAdminDiscountStatus(id: string, status: DiscountStatus): Promise<ActionResult<Discount>> {
  return runAction(async () => {
    await requireStaff();
    const saved = await admin.adminSetDiscountStatus(id, status);
    revalidateAdmin();
    return saved;
  });
}

/* Journal, content & settings --------------------------------------------- */

export async function saveAdminJournalArticle(article: JournalArticle): Promise<ActionResult<JournalArticle>> {
  return runAction(async () => {
    await requireStaff();
    const saved = await admin.adminSaveJournalArticle(article);
    revalidateAdmin('/[locale]');
    return saved;
  });
}

export async function saveAdminSettings(values: Record<string, Json>): Promise<ActionResult<Record<string, Json>>> {
  return runAction(async () => {
    await requireStaff();
    const saved = await admin.adminSaveSettings(values);
    revalidateAdmin('/[locale]', '/[locale]/shop', '/[locale]/checkout');
    return saved;
  });
}

/** Content page: featured flags on products + storefront settings in one call. */
export async function saveAdminContent(input: {
  announcement: string;
  featuredCollectionId: string | null;
  featuredProductIds: string[];
}): Promise<ActionResult<{ featuredProductIds: string[] }>> {
  return runAction(async () => {
    await requireStaff();
    const products = await admin.adminGetProducts();
    const featured = new Set(input.featuredProductIds);
    await Promise.all(
      products
        .filter((product) => product.featured !== featured.has(product.id))
        .map((product) => admin.adminSaveProduct({ ...product, featured: featured.has(product.id) }))
    );
    await admin.adminSaveSettings({
      'content.announcement': input.announcement.slice(0, 200),
      'content.featured_collection_id': input.featuredCollectionId,
    });
    revalidateAdmin('/[locale]', '/[locale]/shop');
    return { featuredProductIds: Array.from(featured) };
  });
}

/* Command palette ---------------------------------------------------------- */

export async function searchAdminRecords(query: string): Promise<ActionResult<AdminSearchHit[]>> {
  return runAction(async () => {
    await requireStaff();
    return admin.adminSearch(query);
  });
}
