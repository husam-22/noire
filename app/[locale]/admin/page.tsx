import { adminGetDashboardStats, adminGetOrders, adminGetProducts } from '@/lib/services/supabase/admin';
import { AdminOverview } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const [stats, orders, products] = await Promise.all([
    adminGetDashboardStats(),
    adminGetOrders(),
    adminGetProducts(),
  ]);
  return <AdminOverview stats={stats} orders={orders} products={products} />;
}
