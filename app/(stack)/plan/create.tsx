import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import AIInfoPopup from '@/components/AllInfoPopup';
import { Collapsible } from '@/components/Collapsible';
import { GradientText } from '@/components/GradientText';
import ShowAllButton from '@/components/ShowAllButton';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import Container from '@/components/ui/Container';
import { GoldenGlowButton } from '@/components/ui/GoldenGlowButton';
import LabeledInput from '@/components/ui/LabeledInput';
import { tips } from '@/locales/tips';
import { createPlan } from '@/services/gptServices';


export default function CreatePlanScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation(['common', 'plan']);
    const { plans, tempPlans, setTempPlans, setPlans, myGoals, myLevel, shareHealthPlan } = useStorage();

    const [selectedGoals, setSelectedGoals] = React.useState<string[]>([]);
    const [customGoal, setCustomGoal] = React.useState('');
    const [showAIPopup, setShowAIPopup] = React.useState(false);
    const [AIPopUpOpened, setAIPopUpOpened] = React.useState(false);

    const [loading, setLoading] = React.useState(false);
    const [showAllReason, setShowAllReason] = React.useState(false);
    const reasonSummary = tempPlans?.reasonSummary?.text ?? '';
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

    const duplicateSummary = useMemo(() => {
        if (!tempPlans) return null;

        const existingSupplementKeys = new Set(
            (plans.supplements ?? []).flatMap(plan =>
                (plan.supplements ?? []).map(sup =>
                    buildSupplementKey(plan.name, plan.prefferedTime, sup.supplement.name)
                )
            )
        );
        const duplicateSupplements = (tempPlans.supplements ?? []).reduce((acc, plan) => {
            const count = (plan.supplements ?? []).reduce((innerAcc, sup) => {
                const key = buildSupplementKey(plan.name, plan.prefferedTime, sup.supplement.name);
                return innerAcc + (existingSupplementKeys.has(key) ? 1 : 0);
            }, 0);
            return acc + count;
        }, 0);

        const existingTraining = new Set((plans.training ?? []).map(tip => tip.tipId));
        const existingNutrition = new Set((plans.nutrition ?? []).map(tip => tip.tipId));
        const existingOther = new Set((plans.other ?? []).map(tip => tip.tipId));

        const duplicateTraining = (tempPlans.training ?? []).filter(tip => existingTraining.has(tip.tipId)).length;
        const duplicateNutrition = (tempPlans.nutrition ?? []).filter(tip => existingNutrition.has(tip.tipId)).length;
        const duplicateOther = (tempPlans.other ?? []).filter(tip => existingOther.has(tip.tipId)).length;

        const total = duplicateSupplements + duplicateTraining + duplicateNutrition + duplicateOther;
        return total > 0 ? { total, duplicateSupplements, duplicateTraining, duplicateNutrition, duplicateOther } : null;
    }, [tempPlans, plans]);

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

            const mergeTips = (existing: typeof filteredPlans.training, incoming: typeof filteredPlans.training) => {
                const seen = new Set(existing.map(item => item.tipId));
                return [...existing, ...incoming.filter(item => !seen.has(item.tipId))];
            };

            const mergeSupplementPlans = (existing: typeof filteredPlans.supplements, incoming: typeof filteredPlans.supplements) => {
                const planMap = new Map<string, (typeof filteredPlans.supplements)[number]>();

                existing.forEach(plan => {
                    const key = `${plan.name}:${plan.prefferedTime}`;
                    planMap.set(key, { ...plan, supplements: [...(plan.supplements ?? [])] });
                });

                incoming.forEach(plan => {
                    const key = `${plan.name}:${plan.prefferedTime}`;
                    const current = planMap.get(key);

                    if (!current) {
                        planMap.set(key, plan);
                        return;
                    }

                    const existingKeys = new Set(
                        (current.supplements ?? []).map(sup =>
                            buildSupplementKey(plan.name, plan.prefferedTime, sup.supplement.name)
                        )
                    );
                    const mergedSupplements = [...(current.supplements ?? [])];

                    (plan.supplements ?? []).forEach(sup => {
                        const supKey = buildSupplementKey(plan.name, plan.prefferedTime, sup.supplement.name);
                        if (!existingKeys.has(supKey)) {
                            mergedSupplements.push(sup);
                            existingKeys.add(supKey);
                        }
                    });

                    const mergedPlan = {
                        ...current,
                        ...plan,
                        notify: current.notify ?? plan.notify,
                        supplements: mergedSupplements,
                    };

                    planMap.set(key, mergedPlan);
                });

                return Array.from(planMap.values());
            };

            setPlans(prev => ({
                ...prev,
                ...filteredPlans,
                reasonSummary: filteredPlans.reasonSummary?.text ? filteredPlans.reasonSummary : prev.reasonSummary,
                supplements: mergeSupplementPlans(prev.supplements ?? [], filteredPlans.supplements ?? []),
                training: mergeTips(prev.training ?? [], filteredPlans.training ?? []),
                nutrition: mergeTips(prev.nutrition ?? [], filteredPlans.nutrition ?? []),
                other: mergeTips(prev.other ?? [], filteredPlans.other ?? []),
            }));
        }
        setTempPlans(null);
        router.push('/(tabs)/plan');
    };

    const handleCancel = () => {
        setTempPlans(null);
        router.push('/(tabs)/plan');
    };

    const handleCreatePlan = () => {

        if (shareHealthPlan) {
            setLoading(true);
            const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').toLowerCase();
            const locale: 'sv' | 'en' = activeLanguage.startsWith('sv') ? 'sv' : 'en';
            // Kombinera valda mål och fritext (om ej tom och ej redan vald)
            let goals = selectedGoals;
            if (customGoal.trim().length > 0 && !goals.includes(customGoal.trim())) {
                goals = [...goals, customGoal.trim()];
            }

            console.log('[createPlan] goals:', goals);
            // Skicka både goals och myGoals till backend
            createPlan(plans, goals, myLevel, locale, myGoals)
                .then(res => setTempPlans(res.plans))
                .finally(() => setLoading(false));
        }
        else {
            setShowAIPopup(true);
            setAIPopUpOpened(true);
        }
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

                {/* Målval */}

                <ThemedText type="label" style={globalStyles.marginBottom8}>{t('common:createPlan.goals.title')}</ThemedText>
                {(t('common:createPlan.goals.suggestions', { returnObjects: true }) as string[]).map(goal => (
                    <Checkbox
                        key={goal}
                        checked={selectedGoals.includes(goal)}
                        onPress={() => {
                            setSelectedGoals(prev =>
                                prev.includes(goal)
                                    ? prev.filter(g => g !== goal)
                                    : [...prev, goal]
                            );
                        }}
                        label={goal}
                        style={globalStyles.marginBottom8}
                        disabled={!!tempPlans || loading} // Disable checkbox when tempPlans or loading is true
                    />
                ))}
                <LabeledInput
                    containerStyle={globalStyles.marginBottom16}
                    inputStyle={{ backgroundColor: colors.overlayLight, borderColor: colors.cardBorder }}
                    placeholder={t('common:createPlan.goals.customPlaceholder')}
                    placeholderTextColor={colors.text + '99'}
                    value={customGoal}
                    onChangeText={setCustomGoal}
                    onSubmitEditing={() => {
                        if (customGoal.trim().length > 0 && !selectedGoals.includes(customGoal.trim())) {
                            setSelectedGoals(prev => [...prev, customGoal.trim()]);
                            setCustomGoal('');
                        }
                    }}
                    label=""
                    returnKeyType="done"
                    disabled={!!tempPlans || loading} // Disable TextInput when tempPlans or loading is true
                />

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
                <ThemedText type="error" style={styles.sectionSpacer}>
                    {!shareHealthPlan && AIPopUpOpened ? t('createPlan.sharePlanError') : ''}
                </ThemedText>
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
                {tempPlans?.reasonSummary?.text && (
                    <>
                        <ThemedText type="label">{t('createPlan.aiCommentTitle')}</ThemedText>
                        <ThemedText
                            type="default"
                            style={styles.reasonText}
                            numberOfLines={showAllReason ? undefined : 5}
                        >
                            {tempPlans.reasonSummary.text}
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
                {tempPlans && duplicateSummary && (
                    <ThemedText type="caption" style={styles.duplicateWarning}>
                        {t('createPlan.duplicateWarning', { count: duplicateSummary.total })}
                    </ThemedText>
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
            <AIInfoPopup visible={showAIPopup} setVisible={setShowAIPopup} sharePlanText={t('createPlan.sharePlanText')} />
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
    duplicateWarning: {
        textAlign: 'center',
        opacity: 0.75,
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