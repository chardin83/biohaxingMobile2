import { useStorage } from '@/app/context/StorageContext';
import { Plan } from '@/app/domain/Plan';
import { SupplementPlanEntry } from '@/app/domain/SupplementPlanEntry';

export const useSupplementSaver = () => {
  const { plans, setPlans, setErrorMessage } = useStorage();
  const supplementPlans = plans.supplements;

  const saveSupplementToPlan = (
    selectedPlan: Plan,
    supplement: SupplementPlanEntry,
    isEditingSupplement: boolean,
    setSelectedPlan?: (plan: Plan | null) => void
  ) => {
    try {
      const existingPlan = supplementPlans.find(plan => plan.name === selectedPlan.name);
      const targetKey = supplement?.supplement?.id ?? supplement?.supplement?.name;

      if (!targetKey) {
        setErrorMessage?.('Ogiltigt tillskott (saknar id/namn).');
        setTimeout(() => setErrorMessage?.(null), 4000);
        return;
      }

      let updatedPlans: Plan[];

      if (!existingPlan) {
        const newPlan: Plan = {
          name: selectedPlan.name,
          prefferedTime: selectedPlan.prefferedTime,
          supplements: [supplement],
          notify: selectedPlan.notify,
        };
        updatedPlans = [...(supplementPlans || []), newPlan];
        setSelectedPlan?.(newPlan);
      } else if (isEditingSupplement) {
        const updatedPlan: Plan = {
          ...existingPlan,
          supplements: (existingPlan.supplements || []).map(existingSupplement => {
            const existingKey =
              existingSupplement?.supplement?.id ?? existingSupplement?.supplement?.name;
            return existingKey === targetKey ? supplement : existingSupplement;
          }),
        };
        updatedPlans = (supplementPlans || []).map(plan =>
          plan.name === existingPlan.name ? updatedPlan : plan
        );
        setSelectedPlan?.(updatedPlan);
      } else {
        const supplementExists = (existingPlan.supplements || []).some(existingSupplement => {
          const existingKey =
            existingSupplement?.supplement?.id ?? existingSupplement?.supplement?.name;
          return existingKey === targetKey;
        });

        if (supplementExists) {
          setErrorMessage?.(`Tillskottet "${supplement.supplement?.name ?? targetKey}" finns redan i planen.`);
          setTimeout(() => setErrorMessage?.(null), 5000);
          return;
        }

        const updatedPlan: Plan = {
          ...existingPlan,
          supplements: [...(existingPlan.supplements || []), supplement],
        };
        updatedPlans = (supplementPlans || []).map(plan =>
          plan.name === existingPlan.name ? updatedPlan : plan
        );
        setSelectedPlan?.(updatedPlan);
      }

      setPlans(prev => ({ ...prev, supplements: updatedPlans }));
    } catch (err) {
      console.error('Kunde inte spara tillskottet:', err);
    }
  };

  return { saveSupplementToPlan };
};
