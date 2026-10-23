"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
Backend Data Mining Package (Phase 4)
==============================================================================
Provides institutional data mining engines operating on conformed warehouse facts:
1. FeatureStore: Extracts, preprocesses, and vectors 4,820 student facts.
2. AcademicClusteringEngine: K-Means clustering, silhouette & elbow evaluation.
3. AcademicAssociationEngine: Apriori frequent itemsets & association rule mining.
4. AcademicClassificationEngine: Decision Tree risk classifier & feature importance.
==============================================================================
"""

from backend.mining.feature_store import FeatureStore
from backend.mining.clustering import AcademicClusteringEngine
from backend.mining.association import AcademicAssociationEngine
from backend.mining.classification import AcademicClassificationEngine
from backend.mining.router import mining_router

__all__ = [
    "FeatureStore",
    "AcademicClusteringEngine",
    "AcademicAssociationEngine",
    "AcademicClassificationEngine",
    "mining_router",
]
