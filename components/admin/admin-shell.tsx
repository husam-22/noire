'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import {
  Archive,
  ArrowUpRight,
  Boxes,
  ChevronRight,
  Command,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Percent,
  Search,
  Settings2,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { Button, Drawer } from '@/components/ui';
import { AdminCommandPalette } from '@/components/admin/admin-command-palette';
import { cn } from '@/lib/utils';

const MAIN_NAVIGATION = [
  { href: '/admin', label: 'Overview', code: '00', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', code: '01', icon: Archive },
  { href: '/admin/products', label: 'Products', code: '02', icon: Boxes },
  { href: '/admin/customers', label: 'Customers', code: '03', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', code: '04', icon: Warehouse },
  { href: '/admin/discounts', label: 'Discounts', code: '05', icon: Percent },
  { href: '/admin/content', label: 'Content', code: '06', icon: FileText },
  { href: '/admin/settings', label: 'Settings', code: '07', icon: Settings2 },
] as const;

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3 px-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-foreground-subtle">Command center</p>
        <Command className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
      </div>
      <nav aria-label="Command Center navigation">
        <ul className="space-y-1">
          {MAIN_NAVIGATION.map((item) => {
            const active = item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex min-h-11 items-center gap-3 border px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
                    active
                      ? 'border-border-inverse bg-surface-inverse-muted text-foreground-inverse'
                      : 'border-transparent text-foreground-muted hover:border-border-inverse hover:bg-surface-inverse-muted hover:text-foreground-inverse'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 font-sans text-[12px] tracking-[0.04em]">{item.label}</span>
                  <span className="font-mono text-[8px] text-foreground-subtle">{item.code}</span>
                  {active && <ChevronRight className="h-3 w-3 text-accent" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-7 border-t border-border-inverse pt-5">
        <p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">Contextual routes</p>
        <ul className="space-y-1">
          {[
            { href: '/', label: 'Storefront' },
            { href: '/account', label: 'My account' },
            { href: '/shop', label: 'Shop' },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="flex min-h-11 items-center justify-between gap-3 border border-transparent px-3 py-2 text-[11px] text-foreground-subtle transition-colors hover:border-border-inverse hover:text-foreground-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {item.label}<ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export interface AdminShellProps {
  children: React.ReactNode;
  /** Signed-in staff member (shown in the sidebar). */
  user?: { email: string; role: string } | null;
}

function SignOutForm({ className }: { className?: string }) {
  return (
    <form action="/api/auth/sign-out" method="post" className={className}>
      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-border-inverse px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle transition-colors hover:border-foreground-inverse hover:text-foreground-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
      </button>
    </form>
  );
}

export function AdminShell({ children, user = null }: AdminShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <a href="#main-content" className="sr-only z-[100] focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:border focus:border-foreground focus:bg-background focus:px-4 focus:py-3 focus:font-mono focus:text-[11px] focus:uppercase">
        Skip to command workspace
      </a>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-e border-border-inverse bg-surface-inverse px-3 py-5 text-foreground-inverse lg:flex">
          <Link href="/admin" className="mb-8 block border-b border-border-inverse px-3 pb-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground">
            <span className="block font-display text-xl tracking-[0.18em]">NOIRÉ</span>
            <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-foreground-subtle">Private operations</span>
          </Link>
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
            <AdminNavigation />
          </div>
          <div className="border-t border-border-inverse pt-4">
            {user && (
              <p className="mb-3 px-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.12em] text-foreground-subtle">
                <span className="block truncate text-foreground-inverse">{user.email}</span>
                <span className="block">{user.role}</span>
              </p>
            )}
            <SignOutForm />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 lg:hidden"
                  aria-label={isNavigationOpen ? 'Close Command Center navigation' : 'Open Command Center navigation'}
                  onClick={() => setIsNavigationOpen(true)}
                >
                  {isNavigationOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
                </Button>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">NOIRÉ // Command Center</p>
                  <p className="hidden truncate font-display text-sm text-foreground sm:block">Operations workspace</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Open command search (Control or Command K)"
                  className="inline-flex min-h-11 items-center gap-2 border border-border bg-surface px-3 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:px-4"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden border border-border px-1.5 py-0.5 text-[8px] text-foreground-subtle md:inline">⌘K</kbd>
                </button>
              </div>
            </div>
          </header>

          <div className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
            <div className="mx-auto w-full max-w-[1560px] min-w-0">{children}</div>
          </div>
          <footer className="border-t border-border bg-surface px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">
              <span>NOIRÉ // Operations</span>
              <span>{user ? `Signed in as ${user.email}` : 'Staff access'}</span>
            </div>
          </footer>
        </div>
      </div>

      <Drawer
        isOpen={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
        title="Command Center"
        subtitle="NOIRÉ // OPERATIONS"
        side="left"
        size="md"
        className="bg-surface-inverse text-foreground-inverse"
      >
        <div className="-mx-1 text-foreground-inverse">
          <Link href="/admin" onClick={() => setIsNavigationOpen(false)} className="mb-6 block border-b border-border-inverse px-3 pb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground">
            <span className="font-display text-xl tracking-[0.18em]">NOIRÉ</span>
            <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-foreground-subtle">Operations</span>
          </Link>
          <AdminNavigation onNavigate={() => setIsNavigationOpen(false)} />
          <SignOutForm className="mt-6 border-t border-border-inverse pt-4" />
        </div>
      </Drawer>
      <AdminCommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
