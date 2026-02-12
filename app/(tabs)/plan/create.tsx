import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import ShowAllButton from '@/app/(tabs)/dashboard/area/[areaId]/details/ShowAllButton';
import { useStorage } from '@/app/context/StorageContext';
import { Collapsible } from '@/components/Collapsible';
import { GradientText } from '@/components/GradientText';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import Container from '@/components/ui/Container';
import { GoldenGlowButton } from '@/components/ui/GoldenGlowButton';
import { tips } from '@/locales/tips';
import { createPlan } from '@/services/gptServices';

export default function CreatePlanScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation(['common', 'plan']);
    const { plans, tempPlans, setTempPlans, setPlans, myGoals, myLevel } = useStorage();

    const [loading, setLoading] = React.useState(false);
    const [showAllReason, setShowAllReason] = React.useState(false);
    const reasonSummary = tempPlans?.reasonSummary ?? '';
    const reasonTooLong = reasonSummary.length > 300; // Justera om du vill, eller mät rader

    type ApprovalsState = {
        supplements: Record<string, boolean>;
        training: Record<string, boolean>;
        nutrition: Record<string, boolean>;
        other: Record<string, boolean>;
    };

    const buildSupplementKey = (planName: string, preferredTime: string, supName: string) =>
        `supp:${planName}:${preferredTime}:${supName}`;

    const [approvals, setApprovals] = React.useState<ApprovalsState>({
        supplements: {},
        training: {},
        nutrition: {},
        other: {},
    });

    const tipTitleById = React.useCallback(
        (id?: string) => {
            if (!id) return t('createPlan.untitled');
            const tip = tips.find(candidate => candidate.id === id);
            return t(`tips:${id}.title`, { defaultValue: tip?.title ?? id });
        },
        [t]
    );

    const newSupplementItems = useMemo(() => tempPlans
        ? (tempPlans.supplements ?? []).flatMap(plan =>
            (plan.supplements ?? []).map(sup => ({
                key: buildSupplementKey(plan.name, plan.prefferedTime, sup.supplement.name),
                label: `${sup.supplement.name} • ${plan.prefferedTime}`,
            }))
        )
        : [], [tempPlans]);

    const newTrainingItems = useMemo(() => tempPlans
        ? (tempPlans.training ?? []).map(tip => ({
            key: `training:${tip.tipId}`,
            label: tipTitleById(tip.tipId),
        }))
        : [], [tempPlans, tipTitleById]);

    const newNutritionItems = useMemo(() => tempPlans
        ? (tempPlans.nutrition ?? []).map(tip => ({
            key: `nutrition:${tip.tipId}`,
            label: tipTitleById(tip.tipId),
        }))
        : [], [tempPlans, tipTitleById]);

    const newOtherItems = useMemo(() => tempPlans
        ? (tempPlans.other ?? []).map(tip => ({
            key: `other:${tip.tipId}`,
            label: tipTitleById(tip.tipId),
        }))
        : [], [tempPlans, tipTitleById]);

    const existingSupplementItems = useMemo(() => plans
        ? (plans.supplements ?? []).flatMap(plan =>
            (plan.supplements ?? []).map(sup => `${sup.supplement.name} • ${plan.prefferedTime})`)
        )
        : [], [plans]);

    const existingTrainingItems = useMemo(() => plans
        ? (plans.training ?? []).map(tip => tipTitleById(tip.tipId))
        : [], [plans, tipTitleById]);

    const existingNutritionItems = useMemo(() => plans
        ? (plans.nutrition ?? []).map(tip => tipTitleById(tip.tipId))
        : [], [plans, tipTitleById]);

    const existingOtherItems = useMemo(() => plans
        ? (plans.other ?? []).map(tip => tipTitleById(tip.tipId))
        : [], [plans, tipTitleById]);

    const newSupplementCount = newSupplementItems.length;
    const newTrainingCount = newTrainingItems.length;
    const newNutritionCount = newNutritionItems.length;
    const newOtherCount = newOtherItems.length;

    React.useEffect(() => {
        if (!tempPlans) {
            setApprovals({
                supplements: {},
                training: {},
                nutrition: {},
                other: {},
            });
            return;
        }

        const toMap = (items: { key: string }[]) =>
            items.reduce<Record<string, boolean>>((acc, item) => {
                acc[item.key] = true;
                return acc;
            }, {});

        setApprovals({
            supplements: toMap(newSupplementItems),
            training: toMap(newTrainingItems),
            nutrition: toMap(newNutritionItems),
            other: toMap(newOtherItems),
        });
    }, [tempPlans, newSupplementItems, newTrainingItems, newNutritionItems, newOtherItems]);

    const toggleApproval = (category: keyof ApprovalsState, key: string) => {
        setApprovals(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: !prev[category][key],
            },
        }));
    };

    const renderNewList = (
        items: { key: string; label: string }[],
        category: keyof ApprovalsState
    ) =>
        items.length ? (
            items.map((item, idx) => {
                const checked = approvals[category]?.[item.key] ?? true;
                return (
                    <Checkbox
                        key={`${item.key}-${idx}`}
                        checked={checked}
                        onPress={() => toggleApproval(category, item.key)}
                        label={item.label}
                    />
                );
            })
        ) : (
            <ThemedText type="default" style={styles.listItem}>
                {t('createPlan.none')}
            </ThemedText>
        );

    const renderExistingList = (items: string[]) => {
        return items.length ? (
            items.map((item, idx) => (
                <ThemedText
                    key={`${item}-${idx}`}
                    type="explainer"
                    style={styles.listItem}
                >
                    •{item}
                </ThemedText>
            ))
        ) : (
            <ThemedText
                type="explainer"
                style={styles.listItem}
            >
                {t('createPlan.none')}
            </ThemedText>
        );
    };

    const countSelected = React.useCallback(
        (items: { key: string }[], category: keyof ApprovalsState) =>
            items.reduce((acc, item) => {
                const isChecked = approvals[category]?.[item.key] ?? true;
                return acc + (isChecked ? 1 : 0);
            }, 0),
        [approvals]
    );

    const newSupplementSelectedCount = countSelected(newSupplementItems, 'supplements');
    const newTrainingSelectedCount = countSelected(newTrainingItems, 'training');
    const newNutritionSelectedCount = countSelected(newNutritionItems, 'nutrition');
    const newOtherSelectedCount = countSelected(newOtherItems, 'other');

    const handleAccept = () => {
        if (tempPlans) {
            const now = new Date().toISOString();
            const filteredPlans = {
                ...tempPlans,
                supplements: (tempPlans.supplements ?? []).map(plan => ({
                    ...plan,
                    supplements: (plan.supplements ?? []).filter(sup => {
                        const key = buildSupplementKey(plan.name, plan.prefferedTime, sup.supplement.name);
                        const approved = approvals.supplements[key];
                        return approved !== false;
                    }).map(sup => ({
                        ...sup,
                        startedAt: sup.startedAt ?? now,
                    })),
                })),
                training: (tempPlans.training ?? []).filter(tip => {
                    const key = `training:${tip.tipId}`;
                    const approved = approvals.training[key];
                    return approved !== false;
                }).map(tip => ({
                    ...tip,
                    startedAt: tip.startedAt ?? now,
                })),
                nutrition: (tempPlans.nutrition ?? []).filter(tip => {
                    const key = `nutrition:${tip.tipId}`;
                    const approved = approvals.nutrition[key];
                    return approved !== false;
                }).map(tip => ({
                    ...tip,
                    startedAt: tip.startedAt ?? now,
                })),
                other: (tempPlans.other ?? []).filter(tip => {
                    const key = `other:${tip.tipId}`;
                    const approved = approvals.other[key];
                    return approved !== false;
                }).map(tip => ({
                    ...tip,
                    startedAt: tip.startedAt ?? now,
                })),
            };

            setPlans(filteredPlans);
        }
        setTempPlans(null);
        router.push('/(tabs)/plan');
    };

    const handleCancel = () => {
        setTempPlans(null);
        router.push('/(tabs)/plan');
    };

    const handleCreatePlan = () => {
        setLoading(true);
        const locale = i18n.language?.startsWith('sv') ? 'sv' : 'en';
        createPlan(plans, myGoals, myLevel, locale)
            .then(res => setTempPlans(res.plans))
            .finally(() => setLoading(false));
    };

    const buildSectionTitle = React.useCallback(
        (selected: number, total: number, selectedKey: string, defaultKey: string) =>
            selected < total
                ? t(selectedKey, { selected, total })
                : t(defaultKey, { count: total }),
        [t]
    );

    const supplementsTitle = buildSectionTitle(
        newSupplementSelectedCount,
        newSupplementCount,
        'createPlan.aiSupplementsSelected',
        'createPlan.aiSupplements'
    );
    const trainingTitle = buildSectionTitle(
        newTrainingSelectedCount,
        newTrainingCount,
        'createPlan.aiTrainingSelected',
        'createPlan.aiTraining'
    );
    const nutritionTitle = buildSectionTitle(
        newNutritionSelectedCount,
        newNutritionCount,
        'createPlan.aiNutritionSelected',
        'createPlan.aiNutrition'
    );
    const otherTitle = buildSectionTitle(
        newOtherSelectedCount,
        newOtherCount,
        'createPlan.aiOtherSelected',
        'createPlan.aiOther'
    );

    const supplementsSummary = t('createPlan.aiSupplementsSelected', {
        selected: newSupplementSelectedCount,
        total: newSupplementCount,
    });
    const trainingSummary = t('createPlan.aiTrainingSelected', {
        selected: newTrainingSelectedCount,
        total: newTrainingCount,
    });
    const nutritionSummary = t('createPlan.aiNutritionSelected', {
        selected: newNutritionSelectedCount,
        total: newNutritionCount,
    });
    const otherSummary = t('createPlan.aiOtherSelected', {
        selected: newOtherSelectedCount,
        total: newOtherCount,
    });

    return (
        <Container background="gradient" showBackButton onBackPress={() => router.replace('/(tabs)/plan')}>
            <Card style={styles.card}>
                <View style={styles.title}>
                    <GradientText>
                        {t('createPlan.title')}
                    </GradientText>
                </View>
                <GoldenGlowButton
                    style={styles.noMarginBottom}
                    title={t('createPlan.createAIPlan')}
                    onPress={handleCreatePlan}
                    accessibilityLabel={t('createPlan.createAIPlanLabel')}
                    accessibilityRole="button"
                    accessibilityHint={
                        tempPlans
                            ? t('createPlan.createAIPlanHint')
                            : undefined
                    }
                    disabled={!!tempPlans || loading}
                />
                {loading && (
                    <View style={styles.loadingWrapper}>
                        <View style={styles.loadingRow}>
                            <ActivityIndicator size="large" color={colors.gold} />
                            <ThemedText type="caption" style={styles.loadingText}>
                                {t('createPlan.creatingAIPlan')}
                            </ThemedText>
                        </View>
                    </View>
                )}
                {tempPlans && (
                    <ThemedText type="caption" style={styles.captionInfo}>
                        {t('createPlan.createAIPlanHint')}
                    </ThemedText>
                )}
                {!tempPlans && !loading && (
                    <ThemedText type="default" style={styles.introInfo}>
                        {t('createPlan.intro')}
                    </ThemedText>
                )}
                {tempPlans && tempPlans.reasonSummary && (
                    <>
                        <ThemedText type="label">AI-kommentar</ThemedText>
                        <ThemedText
                            type="default"
                            style={styles.reasonText}
                            accessibilityLabel={`AI-planens sammanfattning: ${tempPlans.reasonSummary}`}
                            numberOfLines={showAllReason ? undefined : 5}
                        >
                            {tempPlans.reasonSummary}
                        </ThemedText>
                        {reasonTooLong && (
                            <ShowAllButton
                                showAll={showAllReason}
                                onPress={() => setShowAllReason(v => !v)}
                                accentColor={colors.showAllAccent}
                                style={styles.showAllButton}
                                showAllText={t('createPlan.showAll')}
                            />
                        )}
                    </>
                )}

                {tempPlans && (
                    <>
                        <Card>
                            <Collapsible
                                title={supplementsTitle}
                                contentStyle={styles.collapsibleContent}
                                accessibilityLabel={t('createPlan.aiSupplementsLabel')}
                                initialCollapsed={newSupplementItems.length === 0}
                            >
                                <SectionHeader variant="primary">{t('createPlan.new')}</SectionHeader>
                                {renderNewList(newSupplementItems, 'supplements')}
                                <SectionHeader variant="dimmed">{t('createPlan.existing')}</SectionHeader>
                                {renderExistingList(existingSupplementItems)}
                                <ThemedText
                                    type="caption"
                                    style={[styles.selectionSummary, styles.srOnly]}
                                    accessibilityLiveRegion="polite"
                                >
                                    {supplementsSummary}
                                </ThemedText>
                            </Collapsible>
                        </Card>
                        <Card>
                            <Collapsible
                                title={trainingTitle}
                                contentStyle={styles.collapsibleContent}
                                accessibilityLabel={t('createPlan.aiTrainingLabel')}
                                initialCollapsed={newTrainingItems.length === 0}
                            >
                                <SectionHeader variant="primary">{t('createPlan.new')}</SectionHeader>
                                {renderNewList(newTrainingItems, 'training')}
                                <SectionHeader variant="dimmed">{t('createPlan.existing')}</SectionHeader>
                                {renderExistingList(existingTrainingItems)}
                                <ThemedText
                                    type="caption"
                                    style={[styles.selectionSummary, styles.srOnly]}
                                    accessibilityLiveRegion="polite"
                                >
                                    {trainingSummary}
                                </ThemedText>
                            </Collapsible>
                        </Card>
                        <Card>
                            <Collapsible
                                title={nutritionTitle}
                                contentStyle={styles.collapsibleContent}
                                accessibilityLabel={t('createPlan.aiNutritionLabel')}
                                initialCollapsed={newNutritionItems.length === 0}
                            >
                                <SectionHeader variant="primary">{t('createPlan.new')}</SectionHeader>
                                {renderNewList(newNutritionItems, 'nutrition')}
                                <SectionHeader variant="dimmed">{t('createPlan.existing')}</SectionHeader>
                                {renderExistingList(existingNutritionItems)}
                                <ThemedText
                                    type="caption"
                                    style={[styles.selectionSummary, styles.srOnly]}
                                    accessibilityLiveRegion="polite"
                                >
                                    {nutritionSummary}
                                </ThemedText>
                            </Collapsible>
                        </Card>
                        <Card>
                            <Collapsible
                                title={otherTitle}
                                contentStyle={styles.collapsibleContent}
                                accessibilityLabel={t('createPlan.aiOtherLabel')}
                                initialCollapsed={newOtherItems.length === 0}
                            >
                                <SectionHeader variant="primary">{t('createPlan.new')}</SectionHeader>
                                {renderNewList(newOtherItems, 'other')}
                                <SectionHeader variant="dimmed">{t('createPlan.existing')}</SectionHeader>
                                {renderExistingList(existingOtherItems)}
                                <ThemedText
                                    type="caption"
                                    style={[styles.selectionSummary, styles.srOnly]}
                                    accessibilityLiveRegion="polite"
                                >
                                    {otherSummary}
                                </ThemedText>
                            </Collapsible>
                        </Card>
                        <View style={styles.buttonRow}>
                            <AppButton
                                title={t('createPlan.acceptAIPlan')}
                                onPress={handleAccept}
                                glow
                            />
                            <AppButton
                                title={t('general.cancel')}
                                onPress={handleCancel}
                                variant="secondary"
                            />
                        </View>

                    </>
                )}

            </Card>
        </Container>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 30,
        marginHorizontal: 16,
        padding: 16,
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    title: {
        marginBottom: 30,
    },
    collapsibleContent: {
        marginLeft: 0,
    },
    listItem: {
        marginTop: 4,
    },
    muted: {
        opacity: 0.7,
        marginTop: 4,
    },
    sectionSpacer: {
        marginTop: 12,
    },
    buttonRow: {
        marginTop: 16,
        gap: 10,
    },
    reasonText: {
        opacity: 0.95,
    },
    captionInfo: {
        textAlign: 'center',
        opacity: 0.7,
        marginBottom: 12,
    },
    introInfo: {
        marginTop: 80,      // Mer utrymme över
        marginBottom: 80,   // Mer utrymme under
        textAlign: 'center',
        opacity: 0.7,
        maxWidth: "90%",
        alignSelf: 'center', // Centrerar i Card
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    sectionHeaderLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#bbb',
        marginHorizontal: 8,
    },
    sectionHeaderText: {
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    showAllButton: {
        alignSelf: 'flex-end',
        marginBottom: 8,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        opacity: 0.7,
    },
    loadingWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 80,
        marginBottom: 80,
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    selectionSummary: {
        marginTop: 4,
        marginBottom: 6,
        opacity: 0.7,
    },
    srOnly: {
        position: 'absolute',
        width: 1,
        height: 1,
        margin: -1,
        padding: 0,
        overflow: 'hidden',
        opacity: 0,
    },
});

// Funktion för rubrik:
const SectionHeader = ({
    children,
    variant = 'default', // 'default' | 'primary' | 'dimmed'
}: {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'dimmed';
}) => {
    const { colors } = useTheme();
    const isPrimary = variant === 'primary';
    const isDimmed = variant === 'dimmed';
    return (
        <View style={styles.sectionHeaderRow}>
            <View
                style={[
                    styles.sectionHeaderLine,
                    { backgroundColor: isDimmed ? colors.borderLight : colors.primary },
                ]}
            />
            <ThemedText
                type="defaultSemiBold"
                style={[
                    styles.sectionHeaderText,
                    isPrimary && { color: colors.primary },
                    isDimmed && { color: colors.textMuted },
                ]}
            >
                {children}
            </ThemedText>
            <View style={[styles.sectionHeaderLine, { backgroundColor: colors.borderLight }]} />
        </View>
    );
};