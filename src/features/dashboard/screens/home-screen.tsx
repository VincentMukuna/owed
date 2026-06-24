import { ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { Bell, Wallet } from "lucide-react-native";

import { DebtCard } from "@/components/debts/debt-card";
import { SummaryStatCard } from "@/components/debts/summary-stat-card";
import { TabScreen } from "@/components/navigation/tab-screen";
import { FAB_SCROLL_PADDING, FabButton } from "@/components/shared/fab-button";
import { IconButton } from "@/components/shared/icon-button";
import { useDebts } from "@/features/debts/hooks/use-debts";
import type { DebtCardView } from "@/features/debts/view-models";
import { formatCurrency } from "@/lib/utils/formatters";

function Section({
  title,
  titleColor,
  debts,
  onDebtPress,
}: {
  title: string;
  titleColor?: string;
  debts: DebtCardView[];
  onDebtPress: (debt: DebtCardView) => void;
}) {
  if (debts.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, titleColor ? { color: titleColor } : null]}>{title}</Text>
      <View style={styles.sectionList}>
        {debts.map((debt) => (
          <DebtCard key={debt.id} debt={debt} onPress={() => onDebtPress(debt)} />
        ))}
      </View>
    </View>
  );
}

export function HomeScreen() {
  const { data: debts = [] } = useDebts();

  const active = debts.filter((d) => d.status !== "paid");
  const totalOwed = active.reduce((sum, d) => sum + d.remaining, 0);
  const overdue = debts.filter((d) => d.status === "overdue");
  const dueSoon = debts.filter((d) => d.status === "due-soon");
  const paidThisMonth = debts
    .filter((d) => d.status === "paid")
    .reduce((sum, d) => sum + d.amount, 0);
  const activePartial = active.filter((d) => d.status === "active" || d.status === "partial");

  const openDebt = (debt: DebtCardView) => router.push(`/debt/${debt.id}`);
  const openAdd = () => router.push("/add-debt");

  return (
    <TabScreen>
      {debts.length === 0 ? (
        <View style={styles.emptyBody}>
          <View style={styles.emptyHeader}>
            <Text style={styles.kicker}>Owed</Text>
            <Text style={styles.pageTitle}>Home</Text>
          </View>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIcon}>
              <Wallet color="#B8B8B0" size={24} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No money tracked yet.</Text>
            <Text style={styles.emptyCopy}>
              {"Add the first amount someone owes you and we'll help you remember the details."}
            </Text>
          </View>
          <FabButton onPress={openAdd} />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Good morning</Text>
              <Text style={styles.pageTitleLg}>{"Here's what you're owed"}</Text>
            </View>
            <IconButton>
              <Bell color="#4A4A42" size={16} strokeWidth={1.5} />
            </IconButton>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scroll, styles.scrollWithFab]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <View style={[styles.heroOrb, styles.heroOrbTop]} />
              <View style={[styles.heroOrb, styles.heroOrbBottom]} />
              <Text style={styles.heroLabel}>Total owed to you</Text>
              <Text style={styles.heroAmount}>{formatCurrency(totalOwed)}</Text>
              <Text style={styles.heroMeta}>
                Across {active.length} active {active.length === 1 ? "promise" : "promises"}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <SummaryStatCard label="Active" value={String(active.length)} color="#94A3B8" />
              </View>
              <View style={styles.statCell}>
                <SummaryStatCard label="Overdue" value={String(overdue.length)} color="#F87171" />
              </View>
              <View style={styles.statCell}>
                <SummaryStatCard label="Due soon" value={String(dueSoon.length)} color="#F59E0B" />
              </View>
              <View style={styles.statCell}>
                <SummaryStatCard
                  label="Paid this month"
                  value={formatCurrency(paidThisMonth)}
                  color="#10B981"
                />
              </View>
            </View>

            <Section title="Due soon" debts={dueSoon} onDebtPress={openDebt} />
            <Section title="Overdue" titleColor="#F87171" debts={overdue} onDebtPress={openDebt} />
            <Section title="Active" debts={activePartial} onDebtPress={openDebt} />
          </ScrollView>

          <FabButton onPress={openAdd} />
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A18",
    marginTop: 4,
  },
  pageTitleLg: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A18",
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
  },
  scrollWithFab: {
    paddingBottom: FAB_SCROLL_PADDING,
  },
  heroCard: {
    backgroundColor: "#1A3A2A",
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroOrb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroOrbTop: {
    width: 144,
    height: 144,
    top: -40,
    right: -40,
  },
  heroOrbBottom: {
    width: 112,
    height: 112,
    bottom: -40,
    left: -40,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 40,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  heroMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCell: {
    width: "48%",
    flexGrow: 1,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8A8A82",
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  sectionList: {
    gap: 10,
  },
  emptyBody: {
    flex: 1,
  },
  emptyHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: FAB_SCROLL_PADDING,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EFEFEC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A18",
  },
  emptyCopy: {
    fontSize: 14,
    color: "#8A8A82",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 220,
  },
});
