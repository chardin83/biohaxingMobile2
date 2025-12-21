
import { Supplement } from "@/app/domain/Supplement";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";



export function useSupplements(): Supplement[] {
    const { t } = useTranslation("supplements");

    return useMemo(() => {
        const result = t("supplements", { returnObjects: true });
        return Array.isArray(result) ? (result as Supplement[]) : [];
    }, [t]);
}