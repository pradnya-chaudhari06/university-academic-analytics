"""
==============================================================================
UNIVERSITY ACADEMIC PERFORMANCE DATA WAREHOUSE & MINING SYSTEM (DWM)
System Settings Service & Administrator Settings Router
==============================================================================
Provides persistent institutional configuration for Academic parameters,
Data Warehouse ETL behavior, Data Mining thresholds, and System alerts.
Non-admin access to update settings is strictly rejected with HTTP 403.
==============================================================================
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import datetime

from backend.database import execute_query, execute_dml, get_db_connection

settings_router = APIRouter(prefix="/api/settings", tags=["System Settings"])

DEFAULT_SETTINGS: Dict[str, Dict[str, str]] = {
    "default_academic_year": {"value": "AY 2025–26", "category": "academic"},
    "default_semester": {"value": "Semester VI", "category": "academic"},
    "default_department": {"value": "All Departments", "category": "academic"},
    "default_analytics_measure": {"value": "averageGpa", "category": "academic"},
    "etl_batch_size": {"value": "500", "category": "warehouse"},
    "etl_validation_mode": {"value": "standard", "category": "warehouse"},
    "auto_warehouse_refresh": {"value": "enabled", "category": "warehouse"},
    "kmeans_k": {"value": "3", "category": "mining"},
    "apriori_min_confidence": {"value": "0.60", "category": "mining"},
    "apriori_min_support": {"value": "0.015", "category": "mining"},
    "decision_tree_max_depth": {"value": "3", "category": "mining"},
    "session_timeout_minutes": {"value": "60", "category": "system"},
    "system_notifications": {"value": "enabled", "category": "system"},
    "risk_alerts": {"value": "enabled", "category": "system"},
}

def init_settings_table():
    """Ensure system_settings table exists in database."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            setting_key     TEXT PRIMARY KEY,
            setting_value   TEXT NOT NULL,
            category        TEXT NOT NULL,
            updated_at      TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """)
        conn.commit()
        
        # Seed default settings if not already present
        cursor.execute("SELECT COUNT(*) FROM system_settings;")
        count = cursor.fetchone()[0]
        if count == 0:
            for k, meta in DEFAULT_SETTINGS.items():
                cursor.execute("""
                INSERT OR IGNORE INTO system_settings (setting_key, setting_value, category)
                VALUES (?, ?, ?);
                """, (k, meta["value"], meta["category"]))
            conn.commit()
        cursor.close()
    finally:
        conn.close()

class SettingsUpdatePayload(BaseModel):
    default_academic_year: Optional[str] = Field(None, max_length=50)
    default_semester: Optional[str] = Field(None, max_length=50)
    default_department: Optional[str] = Field(None, max_length=100)
    default_analytics_measure: Optional[str] = Field(None, max_length=50)
    etl_batch_size: Optional[int] = Field(None, ge=50, le=5000)
    etl_validation_mode: Optional[str] = Field(None, pattern="^(standard|strict)$")
    auto_warehouse_refresh: Optional[str] = Field(None, pattern="^(enabled|disabled)$")
    kmeans_k: Optional[int] = Field(None, ge=2, le=10)
    apriori_min_confidence: Optional[float] = Field(None, ge=0.1, le=1.0)
    apriori_min_support: Optional[float] = Field(None, ge=0.001, le=0.5)
    decision_tree_max_depth: Optional[int] = Field(None, ge=1, le=10)
    session_timeout_minutes: Optional[int] = Field(None, ge=5, le=1440)
    system_notifications: Optional[str] = Field(None, pattern="^(enabled|disabled)$")
    risk_alerts: Optional[str] = Field(None, pattern="^(enabled|disabled)$")

@settings_router.get("")
def get_system_settings():
    """
    Returns current active system configuration settings.
    Accessible to authenticated users for client parameterization.
    """
    init_settings_table()
    rows = execute_query("SELECT setting_key, setting_value, category, updated_at FROM system_settings;")
    
    settings_dict = {}
    for r in rows:
        key = r["setting_key"]
        val = r["setting_value"]
        # Parse numbers appropriately
        if key in ("etl_batch_size", "kmeans_k", "decision_tree_max_depth", "session_timeout_minutes"):
            try:
                settings_dict[key] = int(val)
            except ValueError:
                settings_dict[key] = val
        elif key in ("apriori_min_confidence", "apriori_min_support"):
            try:
                settings_dict[key] = float(val)
            except ValueError:
                settings_dict[key] = val
        else:
            settings_dict[key] = val

    # Return grouped and flat views
    return {
        "success": True,
        "settings": settings_dict,
        "academic": {
            "defaultAcademicYear": settings_dict.get("default_academic_year", "AY 2025–26"),
            "defaultSemester": settings_dict.get("default_semester", "Semester VI"),
            "defaultDepartment": settings_dict.get("default_department", "All Departments"),
            "defaultMeasure": settings_dict.get("default_analytics_measure", "averageGpa")
        },
        "warehouse": {
            "etlBatchSize": settings_dict.get("etl_batch_size", 500),
            "validationMode": settings_dict.get("etl_validation_mode", "standard"),
            "autoRefresh": settings_dict.get("auto_warehouse_refresh", "enabled")
        },
        "analytics": {
            "kmeansK": settings_dict.get("kmeans_k", 3),
            "aprioriMinConfidence": settings_dict.get("apriori_min_confidence", 0.60),
            "aprioriMinSupport": settings_dict.get("apriori_min_support", 0.015),
            "decisionTreeMaxDepth": settings_dict.get("decision_tree_max_depth", 3)
        },
        "system": {
            "sessionTimeoutMinutes": settings_dict.get("session_timeout_minutes", 60),
            "systemNotifications": settings_dict.get("system_notifications", "enabled"),
            "riskAlerts": settings_dict.get("risk_alerts", "enabled")
        }
    }

@settings_router.put("")
def update_system_settings(
    payload: SettingsUpdatePayload,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    """
    Updates and persists system settings.
    Strictly enforced: Only Administrators can modify system configuration.
    """
    role = (x_user_role or "").strip()
    if role not in ("System Administrator", "Academic Administrator", "Administrator"):
        raise HTTPException(
            status_code=403,
            detail="Access denied: Administrative privileges required to modify institutional settings."
        )

    init_settings_table()
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Update only fields provided
    data = payload.dict(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No settings fields provided for update.")

    for key, val in data.items():
        if val is not None:
            execute_dml("""
            INSERT INTO system_settings (setting_key, setting_value, category, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(setting_key) DO UPDATE SET
                setting_value = excluded.setting_value,
                updated_at = excluded.updated_at;
            """, (key, str(val), DEFAULT_SETTINGS.get(key, {}).get("category", "system"), now_str))

    return {
        "success": True,
        "message": "Institutional settings updated and persisted successfully.",
        "updatedKeys": list(data.keys())
    }
