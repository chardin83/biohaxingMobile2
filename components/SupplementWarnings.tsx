import React from 'react';
import { useTranslation } from 'react-i18next';

import type { Supplement } from '@/app/domain/Supplement';
import Notice from '@/components/ui/Notice';
import { getSupplementWarningKeys } from '@/locales/supplementWarnings';

export function SupplementWarnings({ supplement }: Readonly<{ supplement: Supplement | null | undefined }>) {
  const { t } = useTranslation('supplements');
  return (
    <>
      {getSupplementWarningKeys(supplement).map(key => (
        <Notice key={key} variant="warning" title={t(`warnings.${key}.title`)} message={t(`warnings.${key}.message`)} />
      ))}
    </>
  );
}
