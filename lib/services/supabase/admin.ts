import 'server-only';

import type {
  ActivityEvent,
  Customer,
  DashboardStats,
  Discount,
  DiscountStatus,
  JournalArticle,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductStatus,
  ShippingMethod,
  StockStatus,
} from '@/types';
import type { Json, Tables } from '@/types/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NoireServiceError, toServiceError } from '@/lib/commerce/errors';
import {
  discountToRow,
  journalArticleToRow,
  mapCustomer,
  mapDiscount,
  mapJournalArticle,
  mapOrder,
  mapProduct,
  mapShippingMethod,
  orderStatusToDb,
  productToRow,
} from './mappers';

/* ------------------------------------------------------------------------- */
/* Products & inventory                                                      */
/* ------------------------------------------------------------------------- */

export async function adminGetProducts(): Promise<Product[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('catalog_products').select('*').order('updated_at', { ascending: false });
  if (error) throw toServiceError(error);
  return (data ?? []).map((row) => mapProduct(row));
}

export async function adminGetProduct(idOrSlug: string): Promise<Product | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('catalog_products')
    .select('*')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .limit(1)
    .maybeSingle();
  if (error) throw toServiceError(error);
  return data ? mapProduct(data) : null;
}

function newProductId(): string {
  return `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Inserts or updates a product (and its collection links) through RLS — staff only. */
export async function adminSaveProduct(product: Product): Promise<Product> {
  const supabase = createSupabaseServerClient();
  const isNew = !product.id || product.id === '__new__';
  const id = isNew ? newProductId() : product.id;
  const now = new Date().toISOString();
  const row = productToRow({ ...product, id, createdAt: isNew ? now : product.createdAt || now, updatedAt: now });

  const { error } = await supabase.from('products').upsert(row, { onConflict: 'id' });
  if (error) throw toServiceError(error);

  const collectionIds = Array.from(new Set(product.collectionIds ?? []));
  const { error: clearError } = await supabase.from('product_collections').delete().eq('product_id', id);
  if (clearError) throw toServiceError(clearError);
  if (collectionIds.length > 0) {
    const { error: linkError } = await supabase
      .from('product_collections')
      .insert(collectionIds.map((collectionId, index) => ({ product_id: id, collection_id: collectionId, sort_order: index })));
    if (linkError) throw toServiceError(linkError);
  }

  const saved = await adminGetProduct(id);
  if (!saved) throw new NoireServiceError('The product was saved but could not be reloaded.', 'INTERNAL_ERROR');
  return saved;
}

export async function adminSetProductStatus(id: string, status: ProductStatus): Promise<Product> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('products').update({ status }).eq('id', id);
  if (error) throw toServiceError(error);
  const product = await adminGetProduct(id);
  if (!product) throw new NoireServiceError('Product not found.', 'NOT_FOUND', 404);
  return product;
}

export async function adminUpdateInventory(
  id: string,
  inventoryCount: number,
  stockStatus: StockStatus,
  reason = 'manual_adjustment'
): Promise<Product> {
  if (!Number.isSafeInteger(inventoryCount) || inventoryCount < 0) {
    throw new NoireServiceError('Quantity must be a non-negative whole number.', 'VALIDATION_ERROR', 422);
  }
  const supabase = createSupabaseServerClient();
  const current = await adminGetProduct(id);
  if (!current) throw new NoireServiceError('Product not found.', 'NOT_FOUND', 404);

  const { error } = await supabase.from('products').update({ inventory_count: inventoryCount, stock_status: stockStatus }).eq('id', id);
  if (error) throw toServiceError(error);

  const delta = inventoryCount - current.inventoryCount;
  if (delta !== 0) {
    const { data: userData } = await supabase.auth.getUser();
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({ product_id: id, delta, reason, actor_id: userData.user?.id ?? null });
    if (movementError) throw toServiceError(movementError);
  }

  const product = await adminGetProduct(id);
  if (!product) throw new NoireServiceError('Product not found.', 'NOT_FOUND', 404);
  return product;
}

export async function adminGetInventoryMovements(limit = 50): Promise<
  Array<{ id: string; productId: string; orderId: string | null; delta: number; reason: string; createdAt: string }>
> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw toServiceError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    orderId: row.order_id,
    delta: row.delta,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

/* ------------------------------------------------------------------------- */
/* Orders                                                                    */
/* ------------------------------------------------------------------------- */

type OrderWithRelations = Tables<'orders'> & { order_items: Tables<'order_items'>[] | null; order_events: Tables<'order_events'>[] | null };

function hydrateOrder(row: OrderWithRelations): Order {
  const { order_items: items, order_events: events, ...order } = row;
  return mapOrder(order, items ?? [], [...(events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)));
}

export async function adminGetOrders(limit = 200): Promise<Order[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_events(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw toServiceError(error);
  return (data ?? []).map(hydrateOrder);
}

export async function adminGetOrder(idOrNumber: string): Promise<Order | null> {
  const supabase = createSupabaseServerClient();
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrNumber);
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_events(*)')
    .eq(isUuid ? ('id' as const) : ('order_number' as const), idOrNumber)
    .limit(1)
    .maybeSingle();
  if (error) throw toServiceError(error);
  return data ? hydrateOrder(data) : null;
}

export async function adminSetOrderStatus(
  orderId: string,
  status: OrderStatus,
  description?: string,
  carrier?: string,
  trackingNumber?: string
): Promise<Order> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.rpc('set_order_status', {
    p_order_id: orderId,
    p_status: orderStatusToDb(status),
    p_description: description ?? null,
    p_carrier: carrier ?? null,
    p_tracking_number: trackingNumber ?? null,
  });
  if (error) throw toServiceError(error);
  const order = await adminGetOrder(orderId);
  if (!order) throw new NoireServiceError('Order not found.', 'NOT_FOUND', 404);
  return order;
}

export async function adminConfirmOrderPayment(orderId: string, reference?: string): Promise<Order> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.rpc('confirm_order_payment', { p_order_id: orderId, p_reference: reference ?? null });
  if (error) throw toServiceError(error);
  const order = await adminGetOrder(orderId);
  if (!order) throw new NoireServiceError('Order not found.', 'NOT_FOUND', 404);
  return order;
}

export async function adminSetPaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<Order> {
  if (paymentStatus === 'paid') return adminConfirmOrderPayment(orderId);
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', orderId);
  if (error) throw toServiceError(error);
  const order = await adminGetOrder(orderId);
  if (!order) throw new NoireServiceError('Order not found.', 'NOT_FOUND', 404);
  return order;
}

/* ------------------------------------------------------------------------- */
/* Customers                                                                 */
/* ------------------------------------------------------------------------- */

export async function adminGetCustomers(): Promise<Customer[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('admin_customers').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) throw toServiceError(error);
  return (data ?? []).map((row) => mapCustomer(row));
}

export async function adminGetCustomer(id: string): Promise<{ customer: Customer; orders: Order[] } | null> {
  const supabase = createSupabaseServerClient();
  const [{ data: profile, error }, { data: addresses }, { data: orderRows }] = await Promise.all([
    supabase.from('admin_customers').select('*').eq('id', id).maybeSingle(),
    supabase.from('addresses').select('*').eq('profile_id', id),
    supabase.from('orders').select('*, order_items(*), order_events(*)').eq('profile_id', id).order('created_at', { ascending: false }),
  ]);
  if (error) throw toServiceError(error);
  if (!profile) return null;
  return { customer: mapCustomer(profile, addresses ?? []), orders: (orderRows ?? []).map(hydrateOrder) };
}

export async function adminUpdateCustomer(
  id: string,
  patch: { status?: Customer['status']; tier?: Customer['tier']; notes?: string | null }
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw toServiceError(error);
}

/* ------------------------------------------------------------------------- */
/* Discounts                                                                 */
/* ------------------------------------------------------------------------- */

export async function adminGetDiscounts(): Promise<Discount[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
  if (error) throw toServiceError(error);
  return (data ?? []).map(mapDiscount);
}

export async function adminSaveDiscount(discount: Discount): Promise<Discount> {
  if (!discount.code.trim()) throw new NoireServiceError('A code is required.', 'VALIDATION_ERROR', 422);
  if (!Number.isFinite(discount.value) || discount.value < 0) {
    throw new NoireServiceError('The discount value must be a positive number.', 'VALIDATION_ERROR', 422);
  }
  if (discount.type === 'percentage' && discount.value > 100) {
    throw new NoireServiceError('A percentage discount cannot exceed 100%.', 'VALIDATION_ERROR', 422);
  }
  const supabase = createSupabaseServerClient();
  const isNew = !discount.id || discount.id.startsWith('__new__') || discount.id.startsWith('disc-local');
  const row = discountToRow({ ...discount, id: isNew ? undefined : discount.id });
  const { data, error } = await supabase.from('discounts').upsert(row, { onConflict: 'id' }).select('*').single();
  if (error) throw toServiceError(error);
  return mapDiscount(data);
}

export async function adminSetDiscountStatus(id: string, status: DiscountStatus): Promise<Discount> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('discounts').update({ status }).eq('id', id).select('*').single();
  if (error) throw toServiceError(error);
  return mapDiscount(data);
}

/* ------------------------------------------------------------------------- */
/* Journal                                                                   */
/* ------------------------------------------------------------------------- */

export async function adminGetJournalArticles(): Promise<JournalArticle[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('journal_articles').select('*').order('published_at', { ascending: false });
  if (error) throw toServiceError(error);
  return (data ?? []).map(mapJournalArticle);
}

export async function adminSaveJournalArticle(article: JournalArticle): Promise<JournalArticle> {
  const supabase = createSupabaseServerClient();
  const id = article.id && article.id !== '__new__' ? article.id : `journal-${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from('journal_articles')
    .upsert(journalArticleToRow({ ...article, id }), { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw toServiceError(error);
  return mapJournalArticle(data);
}

/* ------------------------------------------------------------------------- */
/* Shipping & settings                                                       */
/* ------------------------------------------------------------------------- */

export async function adminGetShippingMethods(): Promise<ShippingMethod[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('shipping_methods').select('*').order('sort_order');
  if (error) throw toServiceError(error);
  return (data ?? []).map(mapShippingMethod);
}

export async function adminGetSettings(): Promise<Record<string, Json>> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) throw toServiceError(error);
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
}

export async function adminSaveSettings(values: Record<string, Json>): Promise<Record<string, Json>> {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const rows = Object.entries(values).map(([key, value]) => ({ key, value, updated_by: userData.user?.id ?? null }));
  if (rows.length === 0) return adminGetSettings();
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) throw toServiceError(error);
  return adminGetSettings();
}

/* ------------------------------------------------------------------------- */
/* Dashboard                                                                 */
/* ------------------------------------------------------------------------- */

interface DashboardRpc {
  totalRevenue?: number;
  revenueChangePercentage?: number;
  totalOrders?: number;
  ordersChangePercentage?: number;
  totalCustomers?: number;
  customersChangePercentage?: number;
  averageOrderValue?: number;
  revenueSeries?: Array<{ date: string; revenue: number; orders: number }>;
  categoryPerformance?: Array<{ category: string; name: string; revenue: number; unitsSold: number }>;
  inventoryAlerts?: Array<{
    productId: string;
    productName: string;
    modelNumber: string;
    sku: string;
    currentStock: number;
    reorderThreshold: number;
    severity: 'critical' | 'warning';
  }>;
}

export async function adminGetDashboardStats(days = 30): Promise<DashboardStats> {
  const supabase = createSupabaseServerClient();
  const [{ data, error }, recentOrders, { data: auditRows }] = await Promise.all([
    supabase.rpc('admin_dashboard_stats', { p_days: days }),
    adminGetOrders(8),
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(12),
  ]);
  if (error) throw toServiceError(error);
  const stats = (data ?? {}) as DashboardRpc;

  const totalCategoryRevenue = (stats.categoryPerformance ?? []).reduce((sum, c) => sum + Number(c.revenue), 0);
  const topProductMap = new Map<string, { product: Product; unitsSold: number; revenue: number }>();
  const products = await adminGetProducts();
  const productIndex = new Map(products.map((p) => [p.id, p]));
  for (const order of recentOrders) {
    for (const item of order.items) {
      const product = productIndex.get(item.productId);
      if (!product) continue;
      const entry = topProductMap.get(product.id) ?? { product, unitsSold: 0, revenue: 0 };
      entry.unitsSold += item.quantity;
      entry.revenue += item.totalPrice;
      topProductMap.set(product.id, entry);
    }
  }

  const activityFeed: ActivityEvent[] = (auditRows ?? []).map((row) => ({
    id: String(row.id),
    type: row.entity === 'orders' ? 'order_placed' : 'product_updated',
    title: `${row.action} · ${row.entity}`,
    description: row.entity_id,
    timestamp: row.created_at,
    referenceId: row.entity_id,
  }));

  return {
    totalRevenue: Number(stats.totalRevenue ?? 0),
    revenueChangePercentage: Number(stats.revenueChangePercentage ?? 0),
    totalOrders: Number(stats.totalOrders ?? 0),
    ordersChangePercentage: Number(stats.ordersChangePercentage ?? 0),
    totalCustomers: Number(stats.totalCustomers ?? 0),
    customersChangePercentage: Number(stats.customersChangePercentage ?? 0),
    conversionRate: 0,
    conversionChangePercentage: 0,
    averageOrderValue: Number(stats.averageOrderValue ?? 0),
    aovChangePercentage: 0,
    revenueSeries: (stats.revenueSeries ?? []).map((point) => ({
      date: point.date,
      label: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Number(point.revenue),
      orders: Number(point.orders),
      averageOrderValue: Number(point.orders) > 0 ? Number(point.revenue) / Number(point.orders) : 0,
    })),
    categoryPerformance: (stats.categoryPerformance ?? []).map((c) => ({
      category: c.category as DashboardStats['categoryPerformance'][number]['category'],
      name: c.name,
      revenue: Number(c.revenue),
      unitsSold: Number(c.unitsSold),
      sharePercentage: totalCategoryRevenue > 0 ? Math.round((Number(c.revenue) / totalCategoryRevenue) * 1000) / 10 : 0,
      growthPercentage: 0,
    })),
    topProducts: Array.from(topProductMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    recentOrders,
    inventoryAlerts: (stats.inventoryAlerts ?? []).map((alert) => ({
      id: `alert-${alert.productId}`,
      productId: alert.productId,
      productName: alert.productName,
      modelNumber: alert.modelNumber,
      sku: alert.sku,
      variantName: 'All finishes',
      currentStock: Number(alert.currentStock),
      reorderThreshold: Number(alert.reorderThreshold),
      severity: alert.severity,
    })),
    activityFeed,
  };
}

/* ------------------------------------------------------------------------- */
/* Command palette search                                                    */
/* ------------------------------------------------------------------------- */

export interface AdminSearchHit {
  id: string;
  kind: 'Order' | 'Product' | 'Customer' | 'Discount';
  label: string;
  detail: string;
  href: string;
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`).replace(/[,()]/g, ' ');
}

/** Cross-entity search for the admin command palette (staff only, RLS-scoped). */
export async function adminSearch(query: string, limit = 8): Promise<AdminSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const pattern = `%${escapeLike(trimmed)}%`;
  const supabase = createSupabaseServerClient();

  const [orders, products, customers, discounts] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, customer_first_name, customer_last_name, customer_email, status, total')
      .or(`order_number.ilike.${pattern},customer_email.ilike.${pattern},customer_first_name.ilike.${pattern},customer_last_name.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('products')
      .select('id, name, sku, model_number, status, price')
      .or(`name.ilike.${pattern},sku.ilike.${pattern},model_number.ilike.${pattern},slug.ilike.${pattern}`)
      .limit(limit),
    supabase
      .from('admin_customers')
      .select('id, first_name, last_name, email, orders_count')
      .or(`email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`)
      .limit(limit),
    supabase
      .from('discounts')
      .select('id, code, description, type, status')
      .or(`code.ilike.${pattern},description.ilike.${pattern}`)
      .limit(limit),
  ]);

  const hits: AdminSearchHit[] = [];
  for (const row of orders.data ?? []) {
    hits.push({
      id: `order-${row.id}`,
      kind: 'Order',
      label: row.order_number,
      detail: `${`${row.customer_first_name} ${row.customer_last_name}`.trim() || row.customer_email} · ${Number(row.total).toFixed(2)} USD · ${row.status}`,
      href: `/admin/orders/${encodeURIComponent(row.id)}`,
    });
  }
  for (const row of products.data ?? []) {
    hits.push({
      id: `product-${row.id}`,
      kind: 'Product',
      label: row.name,
      detail: `${row.model_number} · ${row.sku} · ${row.status}`,
      href: `/admin/products/${encodeURIComponent(row.id)}`,
    });
  }
  for (const row of customers.data ?? []) {
    hits.push({
      id: `customer-${row.id}`,
      kind: 'Customer',
      label: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || row.email || 'Customer',
      detail: `${row.email ?? ''} · ${Number(row.orders_count ?? 0)} orders`,
      href: `/admin/customers/${encodeURIComponent(row.id ?? '')}`,
    });
  }
  for (const row of discounts.data ?? []) {
    hits.push({
      id: `discount-${row.id}`,
      kind: 'Discount',
      label: row.code,
      detail: `${row.type.replace('_', ' ')} · ${row.status}`,
      href: '/admin/discounts',
    });
  }
  return hits;
}
