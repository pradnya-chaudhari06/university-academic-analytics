"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
Academic Feature Store (Phase 4)
==============================================================================
Extracts, validates, cleans, and pre-processes student-level analytical features
directly from conformed Star Schema fact and dimension tables.
Supports both remote Supabase PostgreSQL and local SQLite warehouse fallback.
==============================================================================
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from sklearn.preprocessing import StandardScaler

from backend.database import execute_query, is_remote_postgres

class FeatureStore:
    """
    Centralized repository for mining feature extraction and transformation.
    Extracts complete cohort (N = 4,820) directly from conformed warehouse facts.
    """

    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._scaler: Optional[StandardScaler] = None

    def load_data(self, force_reload: bool = False) -> pd.DataFrame:
        """
        Extracts student fact records across DimStudent, FactStudentRiskStatus,
        FactAcademicPerformance, and FactAttendance.
        Caches in-memory for subsequent mining algorithm queries.
        """
        if self._df is not None and not force_reload:
            return self._df

        query = """
        WITH sem6_stats AS (
            SELECT 
                f.student_key,
                ROUND(AVG(f.marks), 2) as sem6_avg_marks,
                ROUND(MIN(f.marks), 2) as sem6_min_marks,
                ROUND(MAX(f.marks), 2) as sem6_max_marks,
                SUM(CASE WHEN f.result_status = 'Fail' THEN 1 ELSE 0 END) as sem6_fail_count
            FROM fact_academic_performance f
            WHERE f.time_key = 20260630
            GROUP BY f.student_key
        ),
        hist_stats AS (
            SELECT 
                f.student_key,
                ROUND(AVG(f.grade_point), 2) as hist_avg_gpa,
                SUM(CASE WHEN f.result_status = 'Fail' THEN 1 ELSE 0 END) as hist_fail_count
            FROM fact_academic_performance f
            WHERE f.time_key < 20260630
            GROUP BY f.student_key
        ),
        att_stats AS (
            SELECT 
                a.student_key,
                ROUND(MIN(a.attendance_percentage), 1) as sem6_min_attendance
            FROM fact_attendance a
            WHERE a.time_key = 20260630
            GROUP BY a.student_key
        )
        SELECT 
            s.student_key,
            s.student_id,
            s.student_name,
            s.gender,
            d.department_code,
            d.department_name,
            s.semester,
            r.current_gpa,
            r.attendance_percentage,
            r.failed_courses_count,
            r.is_at_risk,
            r.risk_level,
            r.primary_risk_factor,
            r.flagged_subject,
            COALESCE(sem.sem6_avg_marks, 0.0) as sem6_avg_marks,
            COALESCE(sem.sem6_min_marks, 0.0) as sem6_min_marks,
            COALESCE(sem.sem6_max_marks, 0.0) as sem6_max_marks,
            COALESCE(sem.sem6_fail_count, 0) as sem6_fail_count,
            COALESCE(h.hist_avg_gpa, r.current_gpa) as hist_avg_gpa,
            COALESCE(h.hist_fail_count, 0) as hist_fail_count,
            COALESCE(att.sem6_min_attendance, r.attendance_percentage) as sem6_min_attendance
        FROM dim_student s
        JOIN dim_department d ON s.department_key = d.department_key
        JOIN fact_student_risk_status r ON s.student_key = r.student_key AND r.time_key = 20260630
        LEFT JOIN sem6_stats sem ON s.student_key = sem.student_key
        LEFT JOIN hist_stats h ON s.student_key = h.student_key
        LEFT JOIN att_stats att ON s.student_key = att.student_key
        ORDER BY s.student_key ASC;
        """

        raw_rows = execute_query(query)
        if not raw_rows:
            raise RuntimeError("FeatureStore failed: 0 student fact rows retrieved from warehouse.")

        df = pd.DataFrame(raw_rows)

        # ----------------------------------------------------------------------
        # Data Cleaning & Type Harmonization (PostgreSQL Decimal -> Float / Int)
        # ----------------------------------------------------------------------
        numeric_cols = [
            "current_gpa", "attendance_percentage", "sem6_avg_marks",
            "sem6_min_marks", "sem6_max_marks", "hist_avg_gpa", "sem6_min_attendance"
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0).astype(float)

        int_cols = ["failed_courses_count", "sem6_fail_count", "hist_fail_count"]
        for col in int_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

        # Boolean harmonization
        df["is_at_risk"] = df["is_at_risk"].apply(lambda x: True if str(x).lower() in ("true", "1", "t") else False)
        df["risk_level"] = df["risk_level"].fillna("None").astype(str)
        df["primary_risk_factor"] = df["primary_risk_factor"].fillna("None").astype(str)
        df["flagged_subject"] = df["flagged_subject"].fillna("None").astype(str)

        # Longitudinal Trajectory (GPA Drift / Momentum)
        df["gpa_momentum"] = (df["current_gpa"] - df["hist_avg_gpa"]).round(2)

        # ----------------------------------------------------------------------
        # Categorical Discretization for Pattern & Apriori Mining
        # ----------------------------------------------------------------------
        df["attendance_tier"] = df["attendance_percentage"].apply(self._discretize_attendance)
        df["gpa_tier"] = df["current_gpa"].apply(self._discretize_gpa)
        df["backlog_tier"] = df["failed_courses_count"].apply(self._discretize_backlogs)
        df["status_label"] = df["is_at_risk"].apply(lambda r: "At-Risk" if r else "Good Standing")

        self._df = df
        return self._df

    @staticmethod
    def _discretize_attendance(att: float) -> str:
        if att < 70.0:
            return "Attendance < 70%"
        elif att < 75.0:
            return "Attendance 70-74.9%"
        elif att < 85.0:
            return "Attendance 75-84.9%"
        else:
            return "Attendance >= 85%"

    @staticmethod
    def _discretize_gpa(gpa: float) -> str:
        if gpa < 6.00:
            return "GPA < 6.00"
        elif gpa < 7.00:
            return "GPA 6.00-6.99"
        elif gpa < 8.50:
            return "GPA 7.00-8.49"
        else:
            return "GPA >= 8.50"

    @staticmethod
    def _discretize_backlogs(backlogs: int) -> str:
        if backlogs == 0:
            return "Backlogs = 0"
        elif backlogs == 1:
            return "Backlogs = 1"
        else:
            return "Backlogs > 1"

    def get_summary(self) -> Dict[str, Any]:
        """Returns statistical overview of the loaded feature matrix."""
        df = self.load_data()
        return {
            "total_students": len(df),
            "engine": "PostgreSQL / Supabase" if is_remote_postgres() else "SQLite Conformed Warehouse",
            "at_risk_count": int(df["is_at_risk"].sum()),
            "at_risk_percentage": round(float(df["is_at_risk"].mean() * 100), 2),
            "mean_gpa": round(float(df["current_gpa"].mean()), 2),
            "mean_attendance": round(float(df["attendance_percentage"].mean()), 2),
            "features_extracted": list(df.columns),
            "missing_values": {col: int(df[col].isna().sum()) for col in df.columns if df[col].isna().sum() > 0},
            "departments": df["department_code"].value_counts().to_dict(),
            "risk_levels": df["risk_level"].value_counts().to_dict(),
        }

    def get_clustering_features(
        self,
        features: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, np.ndarray, List[str], List[str], StandardScaler]:
        """
        Prepares continuous normalized feature vector for K-Means clustering.
        Default features: [current_gpa, attendance_percentage, failed_courses_count, hist_avg_gpa, sem6_avg_marks]
        Returns: (X_scaled, X_raw, feature_names, student_ids, scaler)
        """
        df = self.load_data()
        if features is None:
            features = [
                "current_gpa",
                "attendance_percentage",
                "failed_courses_count",
                "hist_avg_gpa",
                "sem6_avg_marks"
            ]

        X_raw = df[features].to_numpy(dtype=float)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_raw)
        student_ids = df["student_id"].tolist()

        self._scaler = scaler
        return X_scaled, X_raw, features, student_ids, scaler

    def get_apriori_transactions(self) -> List[List[str]]:
        """
        Constructs discrete itemset baskets per student for Apriori association mining.
        Each student transaction contains:
        [Attendance Tier, GPA Tier, Department, Backlog Tier, Academic Status, Bottleneck Subject (if any)]
        """
        df = self.load_data()
        transactions: List[List[str]] = []

        for _, row in df.iterrows():
            itemset = [
                row["attendance_tier"],
                row["gpa_tier"],
                f"Dept: {row['department_code']}",
                row["backlog_tier"],
                f"Status: {row['status_label']}",
            ]
            if row["is_at_risk"] and row["flagged_subject"] and row["flagged_subject"] != "None":
                itemset.append(f"Bottleneck: {row['flagged_subject']}")
            if row["risk_level"] in ("High", "Medium"):
                itemset.append(f"Risk: {row['risk_level']}")

            transactions.append(itemset)

        return transactions

    def get_classification_dataset(
        self,
        target_col: str = "is_at_risk"
    ) -> Tuple[pd.DataFrame, np.ndarray, List[str], List[str]]:
        """
        Builds feature matrix X and target y for Supervised Classification.
        Features include academic, progression, historical backlogs, and one-hot department encodings.
        Excludes identifiers (student_id, student_name, email, student_key, section),
        direct target duplicates (risk_level, primary_risk_factor, flagged_subject),
        and attendance metrics (attendance_percentage, sem6_min_attendance) to prevent target leakage.
        """
        df = self.load_data().copy()

        # Feature selection - legitimate academic performance predictors
        base_num_features = [
            "current_gpa",
            "failed_courses_count",
            "sem6_avg_marks",
            "sem6_min_marks",
            "hist_avg_gpa",
            "hist_fail_count",
            "gpa_momentum"
        ]

        # One-hot encode department
        dept_dummies = pd.get_dummies(df["department_code"], prefix="dept", dtype=float)
        X = pd.concat([df[base_num_features], dept_dummies], axis=1)
        feature_names = list(X.columns)

        if target_col == "is_at_risk":
            y = df["is_at_risk"].astype(int).to_numpy()
            target_names = ["Good Standing (0)", "At-Risk (1)"]
        elif target_col == "risk_level":
            # Multi-class
            level_map = {"None": 0, "Medium": 1, "High": 2}
            y = df["risk_level"].map(level_map).fillna(0).astype(int).to_numpy()
            target_names = ["None", "Medium", "High"]
        else:
            raise ValueError(f"Unsupported target_col: {target_col}")

        return X, y, feature_names, target_names

# Singleton instance for backend reuse
feature_store = FeatureStore()
