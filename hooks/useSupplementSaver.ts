import { useStorage } from "@/app/context/StorageContext";

export const useSupplementSaver = () => {
  const { plans, setPlans, setErrorMessage } = useStorage();

  const saveSupplementToPlan = (
    selectedPlan: Plan,
    supplement: Supplement,
    isEditingSupplement: boolean,
    setSelectedPlan?: (plan: Plan | null) => void
  ) => {
    try {
      const existingPlan = plans.find((plan) => plan.name === selectedPlan.name);
      let updatedPlans: Plan[];

      if (!existingPlan) {
        const newPlan: Plan = {
          name: selectedPlan.name,
          prefferedTime: selectedPlan.prefferedTime,
          supplements: [supplement],
          notify: selectedPlan.notify,
        };
        updatedPlans = [...plans, newPlan];
        setSelectedPlan?.(newPlan);
      } else if (isEditingSupplement) {
        const updatedPlan = {
          ...existingPlan,
          supplements: existingPlan.supplements.map((existingSupplement) =>
            existingSupplement.name === supplement.name ? supplement : existingSupplement
          ),
        };
        updatedPlans = plans.map((plan) =>
          plan.name === existingPlan.name ? updatedPlan : plan
        );
        setSelectedPlan?.(updatedPlan);
      } else {
        const supplementExists = existingPlan.supplements.some(
          (existingSupplement) => existingSupplement.name === supplement.name
        );
        if (supplementExists) {
          setErrorMessage?.(`Tillskottet "${supplement.name}" finns redan i planen.`);
          setTimeout(() => setErrorMessage?.(null), 5000);
          return;
        }

        const updatedPlan = {
          ...existingPlan,
          supplements: [...existingPlan.supplements, supplement],
        };
        updatedPlans = plans.map((plan) =>
          plan.name === existingPlan.name ? updatedPlan : plan
        );
        setSelectedPlan?.(updatedPlan);
      }

      setPlans(updatedPlans);
    } catch (err) {
      console.error("Kunde inte spara tillskottet:", err);
    }
  };

  return { saveSupplementToPlan };
};
