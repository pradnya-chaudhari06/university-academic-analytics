"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
Academic Association Engine: Apriori Frequent Itemset & Rule Mining (Phase 4)
==============================================================================
Discovers co-occurrence patterns, prerequisite dependencies, and risk driver rules
across attendance tiers, GPA brackets, department cohorts, and bottleneck courses.
Calculates Support, Confidence, and Lift metrics directly from student transactions.
==============================================================================
"""

from typing import Dict, Any, List, Set, Tuple
from collections import defaultdict
from itertools import combinations

from backend.mining.feature_store import feature_store

class AcademicAssociationEngine:
    """
    Apriori Association Rule Mining Engine tailored for academic performance analytics.
    Mines patterns like:
      IF [Attendance < 70% ∧ Backlogs >= 1] => [Status: At-Risk] (Lift > 40.0)
    """

    def __init__(self):
        pass

    def run_apriori(
        self,
        min_support: float = 0.02,
        min_confidence: float = 0.60,
        max_length: int = 3
    ) -> Dict[str, Any]:
        """
        Executes Apriori frequent itemset generation and extracts association rules.
        """
        # Clamp parameters to valid ranges
        min_support = max(0.005, min(0.50, float(min_support)))
        min_confidence = max(0.10, min(1.00, float(min_confidence)))
        max_length = max(2, min(4, int(max_length)))

        transactions = feature_store.get_apriori_transactions()
        total_tx = len(transactions)
        if total_tx == 0:
            return {"rules": [], "totalRules": 0, "totalTransactions": 0}

        # ----------------------------------------------------------------------
        # Step 1: Compute 1-itemset frequencies
        # ----------------------------------------------------------------------
        item_counts: Dict[str, int] = defaultdict(int)
        tx_sets = [set(tx) for tx in transactions]

        for tx in tx_sets:
            for item in tx:
                item_counts[item] += 1

        min_support_count = int(min_support * total_tx)

        # L1: Frequent 1-itemsets
        frequent_itemsets: Dict[Tuple[str, ...], int] = {
            (item,): cnt for item, cnt in item_counts.items() if cnt >= min_support_count
        }

        current_L = {tuple(sorted(k)): v for k, v in frequent_itemsets.items()}
        all_frequent: Dict[Tuple[str, ...], int] = dict(current_L)

        # ----------------------------------------------------------------------
        # Step 2: Apriori level-wise candidate generation (L_k -> C_{k+1})
        # ----------------------------------------------------------------------
        for k in range(2, max_length + 1):
            prev_items = list(current_L.keys())
            if not prev_items:
                break

            # Generate candidate k-itemsets from join of L_{k-1}
            candidates: Set[Tuple[str, ...]] = set()
            for i in range(len(prev_items)):
                for j in range(i + 1, len(prev_items)):
                    union_set = set(prev_items[i]).union(set(prev_items[j]))
                    if len(union_set) == k:
                        # Candidate must have distinct categories (e.g., cannot have two attendance tiers)
                        cats = [item.split(":")[0] if ":" in item else item for item in union_set]
                        if len(cats) == len(set(cats)):
                            candidates.add(tuple(sorted(union_set)))

            # Fast support counting using transaction item combinations
            candidate_counts: Dict[Tuple[str, ...], int] = defaultdict(int)
            cand_set = set(candidates)
            for tx in tx_sets:
                for comb in combinations(sorted(tx), k):
                    if comb in cand_set:
                        candidate_counts[comb] += 1

            # Filter by min_support
            current_L = {
                cand: cnt for cand, cnt in candidate_counts.items()
                if cnt >= min_support_count
            }
            all_frequent.update(current_L)

        # ----------------------------------------------------------------------
        # Step 3: Rule Generation & Metric Derivations
        # ----------------------------------------------------------------------
        rules_list = []
        seen_rules = set()

        for itemset, itemset_count in all_frequent.items():
            if len(itemset) < 2:
                continue

            itemset_support = itemset_count / total_tx

            # Consider all possible non-empty antecedent / consequent splits
            for r in range(1, len(itemset)):
                for antecedent_comb in combinations(itemset, r):
                    antecedent = tuple(sorted(antecedent_comb))
                    consequent = tuple(sorted(set(itemset) - set(antecedent)))

                    rule_key = (antecedent, consequent)
                    if rule_key in seen_rules:
                        continue
                    seen_rules.add(rule_key)

                    antecedent_count = all_frequent.get(antecedent, 0)
                    consequent_count = all_frequent.get(consequent, 0)

                    if antecedent_count == 0 or consequent_count == 0:
                        continue

                    antecedent_support = antecedent_count / total_tx
                    consequent_support = consequent_count / total_tx

                    confidence = itemset_count / antecedent_count
                    if confidence < min_confidence:
                        continue

                    lift = confidence / consequent_support if consequent_support > 0 else 0.0

                    # Human-readable plain English interpretation
                    interpretation, category, badge = self._interpret_rule(antecedent, consequent, confidence, lift)

                    rules_list.append({
                        "id": f"rule-{len(rules_list) + 1}",
                        "antecedent": list(antecedent),
                        "consequent": list(consequent),
                        "antecedentStr": " & ".join(antecedent),
                        "consequentStr": " & ".join(consequent),
                        "support": round(itemset_support, 4),
                        "supportPct": f"{round(itemset_support * 100, 1)}%",
                        "confidence": round(confidence, 4),
                        "confidencePct": f"{round(confidence * 100, 1)}%",
                        "lift": round(lift, 2),
                        "category": category,
                        "badge": badge,
                        "interpretation": interpretation
                    })

        # Sort rules primarily by Lift descending, then Confidence descending
        rules_list.sort(key=lambda r: (r["lift"], r["confidence"]), reverse=True)

        return {
            "algorithm": "Apriori Association Rule Mining",
            "minSupport": min_support,
            "minConfidence": min_confidence,
            "totalTransactions": total_tx,
            "frequentItemsetsFound": len(all_frequent),
            "totalRules": len(rules_list),
            "rules": rules_list[:50]  # Cap at top 50 most insightful rules
        }

    @staticmethod
    def _interpret_rule(
        antecedent: Tuple[str, ...],
        consequent: Tuple[str, ...],
        confidence: float,
        lift: float
    ) -> Tuple[str, str, str]:
        """Derives plain-English pedagogical interpretation and classification badge."""
        cons_str = " ".join(consequent)
        ant_str = " & ".join(antecedent)

        if "Status: At-Risk" in cons_str or "Risk: High" in cons_str:
            category = "Critical Risk Driver"
            badge = "rose"
            interpretation = (
                f"Students matching [{ant_str}] exhibit a {round(confidence * 100, 1)}% probability "
                f"of falling into the At-Risk cohort ({round(lift, 1)}x higher than average)."
            )
        elif "GPA >= 8.50" in cons_str or "Status: Good Standing" in cons_str:
            category = "Academic Excellence Pattern"
            badge = "indigo"
            interpretation = (
                f"Cohort with [{ant_str}] reliably transitions to [{cons_str}] "
                f"with {round(confidence * 100, 1)}% consistency."
            )
        elif "Dept:" in cons_str:
            category = "Departmental Trend"
            badge = "slate"
            interpretation = f"Distinct curricular pattern within [{cons_str}] with {round(lift, 2)} lift."
        else:
            category = "Curricular Correlation"
            badge = "amber"
            interpretation = (
                f"Strong correlation between [{ant_str}] and [{cons_str}] "
                f"(Lift: {round(lift, 2)}, Confidence: {round(confidence * 100, 1)}%)."
            )

        return interpretation, category, badge

# Singleton
association_engine = AcademicAssociationEngine()
