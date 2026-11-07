import { useTranslations } from 'next-intl';
import { AdminLoadingState } from '@/components/admin/admin-primitives';

export default function AdminLoading() {
  const t = useTranslations('admin');
  return (
    <main id="main-content" className="min-w-0">
      <AdminLoadingState label={t('loading')} rows={7} />
    </main>
  );
}
