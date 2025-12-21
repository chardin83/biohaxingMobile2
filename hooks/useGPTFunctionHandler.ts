import { useStorage } from "@/app/context/StorageContext";
import { useCallback } from "react";
import { useSupplementSaver } from "./useSupplementSaver";
import { useSession } from "@/app/context/SessionStorage";
import { t } from "i18next";

export function useGPTFunctionHandler() {
  const { plans, setPlans, shareHealthPlan } = useStorage();
  const { saveSupplementToPlan } = useSupplementSaver();
  const { setForceOpenPopup } = useSession();

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
        setMessages?.((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("chat.sharePlanWarning", "⚠️ Du har inte delat din plan, så jag kan inte lägga till kosttillskottet. Vill du dela din plan först?"),
          },
        ]);
        setForceOpenPopup(true);
        return;
      }

      let matchingPlan = plans.find((plan) => plan.prefferedTime === time);

      // Om planen inte finns, skapa den först
      if (!matchingPlan) {
        matchingPlan = {
          name,
          prefferedTime: time,
          supplements: [],
          notify: false,
        };
        setPlans((prev) => [...prev, matchingPlan!]);
      }

      const alreadyExists = matchingPlan.supplements.some(
        (s) => s.name.toLowerCase() === supplement.toLowerCase()
      );

      if (alreadyExists) {
        setMessages?.((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t(
              "chat.supplementAlreadyExists",
              `⚠️ ${supplement} finns redan i planen för kl. ${time}.`
            ),
          },
        ]);
        return;
      }

      const newSupplement: Supplement = {
        name: supplement,
        quantity,
        unit,
      };

      saveSupplementToPlan(matchingPlan, newSupplement, false);

      setMessages?.((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t(
            "chat.supplementAdded",
            `✅ Jag har lagt till ${supplement} ${quantity}${unit} kl. ${time} i ditt schema.`
          ),
        },
      ]);
    },
    [plans, setPlans, shareHealthPlan]
  );

  return { handleGPTFunctionCall };
}
