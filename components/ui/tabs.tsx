'use client';

import React, { useState, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { NOIRE_MOTION_TOKENS } from '@/lib/design-system/tokens';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

export function Tabs({
  items,
  defaultTabId,
  onChange,
  ariaLabel,
  className,
}: {
  items: TabItem[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const tCommon = useTranslations('common');
  const instanceId = useId();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeId, setActiveId] = useState<string>(
    defaultTabId ?? items[0]?.id ?? ''
  );

  const handleTabSelect = (id: string) => {
    setActiveId(id);
    onChange?.(id);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (items.length <= 1) return;

    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextIndex = (index + 1) % items.length;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = items.length - 1;
    }

    if (nextIndex !== null) {
      const nextTab = items[nextIndex];
      handleTabSelect(nextTab.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const activeTab = items.find((t) => t.id === activeId) ?? items[0];

  return (
    <div className={cn('w-full', className)}>
      <div
        role="tablist"
        aria-label={ariaLabel ?? tCommon('tabs')}
        aria-orientation="horizontal"
        className="flex items-center gap-5 overflow-x-auto border-b border-border sm:gap-6 no-scrollbar"
      >
        {items.map((tab, idx) => {
          const isActive = tab.id === activeTab?.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              aria-controls={`${instanceId}-tabpanel-${tab.id}`}
              id={`${instanceId}-tab-${tab.id}`}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onClick={() => handleTabSelect(tab.id)}
              className={cn(
                'relative flex items-center gap-2 whitespace-nowrap py-3.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors',
                isActive
                  ? 'font-medium text-foreground'
                  : 'text-foreground-subtle hover:text-foreground'
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="font-mono text-[10px] text-foreground-subtle">
                  [{tab.count}]
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId={
                    prefersReducedMotion
                      ? undefined
                      : `noire-tab-indicator-${instanceId}`
                  }
                  transition={{
                    duration: prefersReducedMotion
                      ? 0
                      : NOIRE_MOTION_TOKENS.duration.fast,
                    ease: NOIRE_MOTION_TOKENS.easing.outExpo,
                  }}
                  className="absolute bottom-0 start-0 end-0 h-[1.5px] bg-foreground"
                />
              )}
            </button>
          );
        })}
      </div>

      {activeTab && (
        <div
          key={activeTab.id}
          role="tabpanel"
          tabIndex={0}
          id={`${instanceId}-tabpanel-${activeTab.id}`}
          aria-labelledby={`${instanceId}-tab-${activeTab.id}`}
          className="pt-6 focus:outline-none"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
