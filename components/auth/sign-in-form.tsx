'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Mail, ShieldAlert } from 'lucide-react';
import { requestMagicLink, type SignInState } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';

const INITIAL: SignInState = { status: 'idle' };

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('auth');
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 border border-foreground bg-foreground px-6 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <Mail className="h-4 w-4" aria-hidden="true" />
      {pending ? t('sending') : t('submit')}
    </button>
  );
}

export function SignInForm({
  next,
  configured,
  callbackError = false,
}: {
  next?: string;
  configured: boolean;
  callbackError?: boolean;
}) {
  const t = useTranslations('auth');
  const [state, action] = useFormState(requestMagicLink, INITIAL);

  if (!configured) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 border border-border bg-surface-muted/60 p-5 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground-muted"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <p>{t('notConfigured')}</p>
      </div>
    );
  }

  if (state.status === 'sent') {
    return (
      <div role="status" className="space-y-2 border border-border bg-surface p-6">
        <p className="font-display text-lg">{t('sentTitle')}</p>
        <p className="text-small text-foreground-muted">{t('sentDescription')}</p>
      </div>
    );
  }

  const errorMessage =
    state.status === 'error' && state.message ? t(`errors.${state.message}`) : callbackError ? t('errors.callback') : null;

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ''} />
      <div className="space-y-2">
        <label htmlFor="sign-in-email" className="block font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-muted">
          {t('emailLabel')}
        </label>
        <input
          id="sign-in-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          dir="ltr"
          placeholder={t('emailPlaceholder')}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? 'sign-in-error' : undefined}
          className={cn(
            'h-11 w-full border bg-surface px-4 text-start text-body outline-none transition-colors focus:border-foreground',
            errorMessage ? 'border-danger' : 'border-border'
          )}
        />
        {errorMessage && (
          <p id="sign-in-error" role="alert" className="text-small text-danger">
            {errorMessage}
          </p>
        )}
      </div>
      <SubmitButton />
      <p className="text-caption text-foreground-subtle">{t('legal')}</p>
    </form>
  );
}
