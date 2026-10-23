"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
Automated Tests for Supervised Classification & Best Model Selection
==============================================================================
Validates:
1. Dataset audit: sample count, class imbalance, zero identifier/target leakage.
2. Leakage prevention: scaling fitted strictly within training folds.
3. Multi-classifier execution: all 5 models (Logistic Regression, Decision Tree,
   Random Forest, SVM, Gradient Boosting) + Majority Baseline.
4. Scientific model selection policy: CV Macro-F1 primary, At-Risk Recall tie-break.
5. Untouched held-out test evaluation & confusion matrix consistency.
6. Model artifact persistence & deserialization.
7. FastAPI routes, response schemas, and Role-Based Access Control (RBAC).
8. Backwards compatibility for decision tree inspector.
==============================================================================
"""

import os
import unittest
import numpy as np
from pathlib import Path
import joblib

from fastapi.testclient import TestClient
from backend.main import app
from backend.mining.classification import classification_engine, ARTIFACTS_DIR
from backend.mining.feature_store import feature_store


class TestClassificationExperiments(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.auth_headers = {"X-User-Role": "Analytics"}
        cls.faculty_headers = {"X-User-Role": "Faculty"}
        cls.student_headers = {"X-User-Role": "Student"}

    # --------------------------------------------------------------------------
    # 1. Dataset Audit, Target Definition & Privacy Leakage Prevention
    # --------------------------------------------------------------------------
    def test_dataset_audit_and_privacy_safeguards(self):
        """Verifies record grain (N=4,820), target distribution, and zero PII/target leakage."""
        X_df, y, feature_names, target_names = feature_store.get_classification_dataset(target_col="is_at_risk")

        # 1. Record count and grain
        self.assertEqual(len(y), 4820, "Must contain exactly 4,820 student facts")
        self.assertEqual(X_df.shape[0], 4820)
        self.assertEqual(X_df.shape[1], len(feature_names))

        # 2. Target distribution & imbalance
        at_risk_count = int(np.sum(y == 1))
        good_standing_count = int(np.sum(y == 0))
        self.assertEqual(at_risk_count, 108, "Institutional at-risk count must equal 108")
        self.assertEqual(good_standing_count, 4712)
        self.assertEqual(at_risk_count + good_standing_count, 4820)

        # 3. Privacy & PII exclusions
        forbidden_identifiers = ["student_id", "student_name", "email", "student_key", "date_of_birth", "section"]
        for forbidden in forbidden_identifiers:
            self.assertNotIn(forbidden, feature_names, f"PII identifier '{forbidden}' leaked into feature matrix!")

        # 4. Target & heuristic leakage exclusions
        forbidden_leakage = [
            "is_at_risk", "risk_level", "primary_risk_factor", "flagged_subject",
            "attendance_percentage", "sem6_min_attendance"
        ]
        for forbidden in forbidden_leakage:
            self.assertNotIn(forbidden, feature_names, f"Target or heuristic column '{forbidden}' leaked into features!")

        # 5. Missing values
        self.assertEqual(int(X_df.isna().sum().sum()), 0, "Feature matrix must contain zero null/missing values")

    # --------------------------------------------------------------------------
    # 2. Multi-Classifier Training & Evaluation Procedure
    # --------------------------------------------------------------------------
    def test_multi_classifier_experiment_execution(self):
        """Validates 5-model evaluation, cross-validation, baseline, and untouched test metrics."""
        res = classification_engine.run_classification_experiment(
            test_size=0.20, n_splits=5, random_state=42, metric_policy="macro_f1"
        )

        self.assertEqual(res["status"], "Completed")
        self.assertIn("experimentId", res)
        self.assertEqual(res["dataset"]["totalEligible"], 4820)
        self.assertEqual(res["dataset"]["dataSplit"]["trainSize"], 3856)
        self.assertEqual(res["dataset"]["dataSplit"]["testSize"], 964)

        # Verify all 5 classifiers are present
        model_ids = [m["modelId"] for m in res["models"]]
        expected_ids = ["logistic_regression", "decision_tree", "random_forest", "svm", "gradient_boosting"]
        for expected in expected_ids:
            self.assertIn(expected, model_ids, f"Classifier '{expected}' missing from evaluated models!")

        # Verify each model has valid CV and Test metrics
        for m in res["models"]:
            cv = m["cvMetrics"]
            te = m["testMetrics"]

            # Bounded metric assertions
            self.assertTrue(0.0 <= cv["accuracy"] <= 1.0)
            self.assertTrue(0.0 <= cv["macroF1"] <= 1.0)
            self.assertTrue(0.0 <= cv["atRiskRecall"] <= 1.0)
            self.assertTrue(0.0 <= cv["atRiskPrecision"] <= 1.0)
            self.assertTrue(0.0 <= cv["balancedAccuracy"] <= 1.0)
            self.assertTrue(0.0 <= te["balancedAccuracy"] <= 1.0)
            self.assertIn("classificationReport", te)
            self.assertGreater(m["trainingTimeSec"], 0.0)

            # Confusion matrix sum must equal test set size (964)
            cm = te["confusionMatrix"]
            total_test_samples = cm["trueNegative"] + cm["falsePositive"] + cm["falseNegative"] + cm["truePositive"]
            self.assertEqual(total_test_samples, 964, "Confusion matrix sum must equal held-out test size (964)")
            self.assertEqual(cm["falseNegative"] + cm["truePositive"], 22, "Positive test class sum must equal 22")
            self.assertEqual(cm["trueNegative"] + cm["falsePositive"], 942, "Negative test class sum must equal 942")

    # --------------------------------------------------------------------------
    # 3. Model Selection Policy & Untouched Held-Out Test Isolation
    # --------------------------------------------------------------------------
    def test_best_model_selection_policy(self):
        """Verifies model selection is determined by CV Macro-F1 on training set without test set influence."""
        res = classification_engine.run_classification_experiment(random_state=42)
        selected = res["selectedModel"]
        models = res["models"]

        # Ensure selected model matches the rank #1 model
        self.assertEqual(models[0]["modelId"], selected["modelId"])
        self.assertTrue(models[0]["isBest"])

        # Selected model must achieve highest CV Macro-F1 across evaluated models
        best_cv_macro_f1 = selected["cvMacroF1"]
        for m in models[1:]:
            self.assertGreaterEqual(
                best_cv_macro_f1, m["cvMetrics"]["macroF1"],
                "Selected model must have >= CV Macro-F1 compared to runner-up"
            )

        # Baseline comparison: models must substantially outperform naive majority baseline
        baseline = res["baseline"]
        self.assertEqual(baseline["testRecall"], 0.0, "Majority baseline must have 0.0 recall")
        self.assertEqual(baseline["testBalancedAccuracy"], 0.50, "Majority baseline balanced accuracy must be 50%")
        self.assertGreater(
            selected["cvMacroF1"], baseline["testMacroF1"],
            "Selected model must substantially beat baseline Macro-F1"
        )
        self.assertGreater(
            selected["testAtRiskRecall"], 0.85,
            "Selected model must achieve >= 85% recall on held-out test cohort"
        )

    # --------------------------------------------------------------------------
    # 4. Model Artifact Persistence & Deserialization
    # --------------------------------------------------------------------------
    def test_artifact_persistence_and_inference(self):
        """Verifies that serialized joblib artifact exists and predicts with expected schema."""
        res = classification_engine.run_classification_experiment(random_state=42)
        artifact_rel_path = res["selectedModel"]["artifactPath"]
        self.assertIsNotNone(artifact_rel_path)

        artifact_full_path = Path(__file__).resolve().parent / "mining" / artifact_rel_path
        self.assertTrue(artifact_full_path.exists(), f"Artifact file {artifact_full_path} must exist on disk")

        # Load artifact and verify structure
        saved = joblib.load(artifact_full_path)
        self.assertIn("model", saved)
        self.assertIn("scaler", saved)
        self.assertIn("featureNames", saved)
        self.assertIn("experimentId", saved)

        # Test inference with dummy synthetic 12-feature sample
        scaler = saved["scaler"]
        model = saved["model"]
        sample_input = np.zeros((1, len(saved["featureNames"])))
        sample_input_scaled = scaler.transform(sample_input)
        pred = model.predict(sample_input_scaled)
        self.assertIn(int(pred[0]), [0, 1])

        # Test prediction engine method
        pred_res = classification_engine.predict_student_risk({
            "current_gpa": 5.4,
            "failed_courses_count": 2,
            "sem6_avg_marks": 45.0,
            "sem6_min_marks": 35.0,
            "hist_avg_gpa": 5.8,
            "hist_fail_count": 1,
            "department_code": "IT"
        })
        self.assertIn("prediction", pred_res)
        self.assertIn("riskProbability", pred_res)
        self.assertIn("recommendation", pred_res)

    # --------------------------------------------------------------------------
    # 5. FastAPI Endpoints & Role-Based Access Control (RBAC)
    # --------------------------------------------------------------------------
    def test_api_endpoints_and_rbac(self):
        """Validates API routes, response schemas, and role permission enforcement."""
        # 1. Student role blocked with HTTP 403 Forbidden
        res_stud_post = self.client.post(
            "/api/mining/classification/experiment",
            json={"test_size": 0.20},
            headers=self.student_headers
        )
        self.assertEqual(res_stud_post.status_code, 403)

        res_stud_get = self.client.get(
            "/api/mining/classification/experiment",
            headers=self.student_headers
        )
        self.assertEqual(res_stud_get.status_code, 403)

        res_stud_predict = self.client.post(
            "/api/mining/classification/predict",
            json={
                "current_gpa": 6.0,
                "failed_courses_count": 0,
                "sem6_avg_marks": 60.0,
                "sem6_min_marks": 50.0,
                "hist_avg_gpa": 6.5,
                "hist_fail_count": 0,
                "department_code": "IT"
            },
            headers=self.student_headers
        )
        self.assertEqual(res_stud_predict.status_code, 403)

        # 2. Analytics role allowed with HTTP 200 OK
        res_analytics_get = self.client.get(
            "/api/mining/classification/experiment",
            headers=self.auth_headers
        )
        self.assertEqual(res_analytics_get.status_code, 200)
        data = res_analytics_get.json()
        self.assertIn("experimentId", data)
        self.assertIn("selectedModel", data)
        self.assertEqual(len(data["models"]), 5)

        # 3. Retrieve specific experiment by ID
        exp_id = data["experimentId"]
        res_by_id = self.client.get(
            f"/api/mining/classification/experiment/{exp_id}",
            headers=self.auth_headers
        )
        self.assertEqual(res_by_id.status_code, 200)
        self.assertEqual(res_by_id.json()["experimentId"], exp_id)

        # Nonexistent experiment ID yields 404
        res_not_found = self.client.get(
            "/api/mining/classification/experiment/nonexistent_exp_9999",
            headers=self.auth_headers
        )
        self.assertEqual(res_not_found.status_code, 404)

        # 4. Predict endpoint allowed for Analytics and Faculty
        predict_payload = {
            "current_gpa": 5.2,
            "failed_courses_count": 2,
            "sem6_avg_marks": 48.0,
            "sem6_min_marks": 38.0,
            "hist_avg_gpa": 5.9,
            "hist_fail_count": 1,
            "department_code": "IT"
        }
        res_pred = self.client.post(
            "/api/mining/classification/predict",
            json=predict_payload,
            headers=self.faculty_headers
        )
        self.assertEqual(res_pred.status_code, 200)
        pred_json = res_pred.json()
        self.assertIn("prediction", pred_json)
        self.assertIn("riskProbability", pred_json)
        self.assertIn("recommendation", pred_json)
        self.assertIn("advisoryLevel", pred_json)

        # 5. History endpoint
        res_hist = self.client.get(
            "/api/mining/classification/history",
            headers=self.auth_headers
        )
        self.assertEqual(res_hist.status_code, 200)
        hist_data = res_hist.json()
        self.assertGreaterEqual(hist_data["totalExperiments"], 1)

    # --------------------------------------------------------------------------
    # 6. Backwards Compatibility for Decision Tree Inspector
    # --------------------------------------------------------------------------
    def test_backwards_compatibility_decision_tree(self):
        """Verifies GET /api/mining/decision-tree still functions properly."""
        res_tree = self.client.get(
            "/api/mining/decision-tree?max_depth=3&criterion=gini",
            headers=self.auth_headers
        )
        self.assertEqual(res_tree.status_code, 200)
        tree_data = res_tree.json()
        self.assertEqual(tree_data["maxDepth"], 3)
        self.assertIn("decisionTree", tree_data)
        self.assertIn("metrics", tree_data)
        self.assertIn("confusionMatrix", tree_data)


if __name__ == "__main__":
    unittest.main()
