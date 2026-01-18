import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Supplement } from '@/app/domain/Supplement';

export function useSupplements(): Supplement[] {
  const { t } = useTranslation('supplements');

  return useMemo(() => {
    const result = t('supplements', { returnObjects: true });
    return Array.isArray(result) ? (result as Supplement[]) : [];
  }, [t]);
}

export function useSupplementMap(): Map<string, Supplement> {
  const supplements = useSupplements();

  return useMemo(() => {
    const map = new Map<string, Supplement>();
    supplements.forEach(supplement => {
      if (supplement.id) {
        map.set(supplement.id, supplement);
      }
    });
    return map;
  }, [supplements]);
}
