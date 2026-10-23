import sys, os
sys.path.insert(0, os.path.abspath('.'))
import urllib.request
import urllib.error
import json
import time

BASE = "http://127.0.0.1:8000"

def fetch_api(endpoint, headers=None, method="GET", data=None):
    headers = headers or {}
    url = f"{BASE}{endpoint}"
    req = urllib.request.Request(url, headers=headers, method=method, data=data)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = None
        try:
            body = json.loads(e.read().decode())
        except:
            pass
        return e.code, body

print("=" * 80)
print("COMPREHENSIVE DATA MINING & ALGORITHM VERIFICATION SUITE")
print("=" * 80)

results = []

# ------------------------------------------------------------------------------
# 1. Feature Store Overview
# ------------------------------------------------------------------------------
print("[1/5] Testing GET /api/mining/overview...")
t0 = time.time()
st, ov = fetch_api("/api/mining/overview", headers={"X-User-Role": "Analytics"})
t_ov = round(time.time() - t0, 3)

ov_pass = (
    st == 200 and
    ov.get("status") == "Ready" and
    ov.get("totalStudents") == 4820 and
    ov.get("atRiskStudents") > 0 and
    ov.get("featureCount") >= 10 and
    len(ov.get("supportedAlgorithms", [])) == 3
)
results.append({
    "test": "Data Mining Feature Store Overview",
    "endpoint": "GET /api/mining/overview",
    "latency": f"{t_ov}s",
    "details": f"Total Students: {ov.get('totalStudents')}, At-Risk: {ov.get('atRiskStudents')} ({ov.get('atRiskPercentage')}%), Features: {ov.get('featureCount')}",
    "pass": ov_pass
})

# ------------------------------------------------------------------------------
# 2. K-Means Clustering (k=3)
# ------------------------------------------------------------------------------
print("[2/5] Testing K-Means Clustering (GET /api/mining/clusters?k=3)...")
t0 = time.time()
st, km = fetch_api("/api/mining/clusters?k=3", headers={"X-User-Role": "Analytics"})
t_km = round(time.time() - t0, 3)

clusters = km.get("clusters", []) if km else []
total_clustered = sum(c.get("studentCount", 0) for c in clusters)
elbow = km.get("elbowCurve", []) if km else []
silhouette = km.get("silhouetteScore", 0)

km_pass = (
    st == 200 and
    km.get("algorithm") == "K-Means Clustering" and
    len(clusters) == 3 and
    total_clustered == 4820 and
    len(elbow) >= 4 and
    silhouette > 0.2
)
results.append({
    "test": "K-Means Clustering Engine (k=3)",
    "endpoint": "GET /api/mining/clusters?k=3",
    "latency": f"{t_km}s",
    "details": f"Clusters: {len(clusters)}, Evaluated: {total_clustered}/4820, Silhouette Score: {silhouette:.3f}, Inertia: {km.get('inertia', 0):.1f}",
    "pass": km_pass
})

# ------------------------------------------------------------------------------
# 3. Apriori Association Rule Mining
# ------------------------------------------------------------------------------
print("[3/5] Testing Apriori Association Rule Mining (GET /api/mining/rules)...")
t0 = time.time()
st, ap = fetch_api("/api/mining/rules?min_support=0.015&min_confidence=0.60&max_length=3", headers={"X-User-Role": "Analytics"})
t_ap = round(time.time() - t0, 3)

rules = ap.get("rules", []) if ap else []
max_lift = max([r.get("lift", 0) for r in rules]) if rules else 0

ap_pass = (
    st == 200 and
    ap.get("algorithm") == "Apriori Association Rule Mining" and
    len(rules) > 0 and
    max_lift > 1.0
)
results.append({
    "test": "Apriori Association Rule Mining",
    "endpoint": "GET /api/mining/rules",
    "latency": f"{t_ap}s",
    "details": f"Rules Discovered: {len(rules)}, Max Lift: {max_lift:.2f}x, Transactions Mined: {ap.get('totalTransactions')}",
    "pass": ap_pass
})

# ------------------------------------------------------------------------------
# 4. Decision Tree Classification
# ------------------------------------------------------------------------------
print("[4/5] Testing Decision Tree Classification (GET /api/mining/decision-tree)...")
t0 = time.time()
st, dt = fetch_api("/api/mining/decision-tree?max_depth=3&criterion=gini", headers={"X-User-Role": "Analytics"})
t_dt = round(time.time() - t0, 3)

metrics = dt.get("metrics", {}) if dt else {}
cm = dt.get("confusionMatrix", {}) if dt else {}
tree_node = dt.get("decisionTree") if dt else None
accuracy = metrics.get("accuracy", 0)
roc_auc = metrics.get("rocAuc", 0)

dt_pass = (
    st == 200 and
    dt.get("algorithm") == "Decision Tree Classifier" and
    accuracy > 0.90 and
    roc_auc > 0.90 and
    tree_node is not None
)
results.append({
    "test": "Decision Tree Classifier & Risk Prediction",
    "endpoint": "GET /api/mining/decision-tree?max_depth=3",
    "latency": f"{t_dt}s",
    "details": f"Accuracy: {accuracy:.1%}, ROC-AUC: {roc_auc:.1%}, Test Split: {dt.get('testSetSize')}, Training Split: {dt.get('trainingSetSize')}",
    "pass": dt_pass
})

# ------------------------------------------------------------------------------
# 5. Feature Importance & Correlation Matrix
# ------------------------------------------------------------------------------
print("[5/5] Testing Feature Importance (GET /api/mining/feature-importance)...")
t0 = time.time()
st, fi = fetch_api("/api/mining/feature-importance", headers={"X-User-Role": "Analytics"})
t_fi = round(time.time() - t0, 3)

importances = fi.get("featureImportances", []) if fi else []
corr = fi.get("correlationMatrix", {}) if fi else {}
primary = fi.get("primaryPredictor", {}) if fi else {}

fi_pass = (
    st == 200 and
    len(importances) >= 3 and
    len(corr) >= 5 and
    primary.get("feature") is not None
)
results.append({
    "test": "Gini Feature Importance & Correlation Matrix",
    "endpoint": "GET /api/mining/feature-importance",
    "latency": f"{t_fi}s",
    "details": f"Primary Predictor: {primary.get('displayName', primary.get('feature'))} (Weight: {primary.get('importance', 0):.1%}), Correlated Measures: {len(corr)}",
    "pass": fi_pass
})

print("\n" + "=" * 80)
print("DATA MINING AUDIT SUMMARY")
print("=" * 80)
all_pass = True
for r in results:
    status_str = "PASS" if r["pass"] else "FAIL"
    if not r["pass"]:
        all_pass = False
    print(f"[{status_str}] {r['test']:<45} | Latency: {r['latency']:<7} | {r['details']}")

print("=" * 80)
print(f"STATUS: {'ALL DATA MINING ALGORITHMS VALIDATED (100%)' if all_pass else 'FAILURES DETECTED'}")
print("=" * 80)
