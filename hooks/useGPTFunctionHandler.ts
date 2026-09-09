import { t } from 'i18next';
import { useCallback } from 'react';

import { useSession } from '@/app/context/SessionStorage';
import { useStorage } from '@/app/context/StorageContext';
import { Message } from '@/app/domain/Message';
import { Plan } from '@/app/domain/Plan';
import { Supplement } from '@/app/domain/Supplement';
import { SupplementPlanEntry } from '@/app/domain/SupplementPlanEntry';
import { useSupplements } from '@/locales/supplements';

export function useGPTFunctionHandler() {
  const { plans, setPlans, shareHealthPlan, saveSupplementToPlan } = useStorage();
  const { setForceOpenPopup } = useSession();
  const supplementPlans = plans.supplements;
  const supplementCatalog = useSupplements();

  const handleGPTFunctionCall = useCallback(
    async (
      gptArguments: {
        supplement: string;
        time: string;
        name: string;
        quantity: string;
        unit: string;
      },
      setMessages?: React.Dispatch<React.SetStateAction<Message[]>>
    ) => {
      const { supplement, time, name, quantity, unit } = gptArguments;

      if (!shareHealthPlan) {
        setMessages?.(prev => [
          ...prev,
          {
            role: 'assistant',
            content: t(
              'chat.sharePlanWarning',
              '⚠️ Du har inte delat din plan, så jag kan inte lägga till kosttillskottet. Vill du dela din plan först?'
            ),
          },
        ]);
        setForceOpenPopup(true);
        return;
      }

      let matchingPlan = supplementPlans.find(plan => plan.prefferedTime === time);

      // Om planen inte finns, skapa den först
      if (!matchingPlan) {
        matchingPlan = {
          name,
          prefferedTime: time,
          supplements: [],
          notify: false,
        };
        const createdPlan: Plan = { ...matchingPlan } as Plan;
        setPlans(prev => ({ ...prev, supplements: [...prev.supplements, createdPlan] }));
      }

      const alreadyExists = matchingPlan.supplements.some(s => s.supplement.name.toLowerCase() === supplement.toLowerCase());

      if (alreadyExists) {
        setMessages?.(prev => [
          ...prev,
          {
            role: 'assistant',
            content: t('chat.supplementAlreadyExists', `⚠️ ${supplement} finns redan i planen för kl. ${time}.`),
          },
        ]);
        return;
      }

      const catalogMatch = supplementCatalog.find(s => s.name.toLowerCase() === supplement.toLowerCase());

      if (!catalogMatch) {
        setMessages?.(prev => [
          ...prev,
          {
            role: 'assistant',
            content: t('chat.supplementNotFound', { supplement }),
          },
        ]);
        return;
      }

      const newSupplement: Supplement = {
        id: catalogMatch.id,
        name: supplement,
        quantity,
        unit,
      };

      const newEntry: SupplementPlanEntry = {
        supplement: newSupplement,
        startedAt: new Date().toISOString(),
        createdBy: 'you',
        planName: matchingPlan.name,
        prefferedTime: matchingPlan.prefferedTime,
        notify: matchingPlan.notify,
      };

      saveSupplementToPlan(matchingPlan, newEntry, false);

      setMessages?.(prev => [
        ...prev,
        {
          role: 'assistant',
          content: t(
            'chat.supplementAdded',
            `✅ Jag har lagt till ${supplement} ${quantity}${unit} kl. ${time} i ditt schema.`
          ),
        },
      ]);
    },
    [shareHealthPlan, setForceOpenPopup, setPlans, supplementPlans, supplementCatalog, saveSupplementToPlan]
  );

  return { handleGPTFunctionCall };
}
