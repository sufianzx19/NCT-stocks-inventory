"""
Data Upload Module — NCT IFCA ETL Pipeline Integration
Handles validation, comparison, and safe database update for clean Excel data.
"""
import math
import os
import shutil
import tempfile
import json
from datetime import date, datetime
from decimal import Decimal

import pandas as pd

from database import execute_query, get_connection, close_connection

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# NCT IFCA ETL Pipeline System URL
# Reuse existing configuration if available, otherwise use a sensible default.
ETL_SYSTEM_URL = os.environ.get("NCT_ETL_URL", "http://localhost:8001")

# Expected standardized clean data columns (matching units_master schema)
REQUIRED_COLUMNS = [
    "unit_no",
    "project",
    "status",
    "unit_type",
    "list_price",
    "built_up_area",
]

# All mappable columns from clean Excel to units_master
COLUMN_MAP = {
    "unit_no": "unit_no",
    "project": "project",
    "status": "status",
    "unit_type": "unit_type",
    "list_price": "list_price",
    "built_up_area": "built_up_area",
    "land_area": "land_area",
    "phase_name": "phase_name",
    "block_name": "block_name",
    "contract_amt": "contract_amt",
    "spa_date": "spa_date",
    "sale_date": "sale_date",
    "owner_name": "owner_name",
    "name": "owner_name",
    "identity_no": "identity_no",
    "identity_no_foreign": "identity_no_foreign",
    "unit_address": "unit_address",
    "unit_layout": "unit_layout",
    "hsd_hsm_no": "hsd_hsm_no",
    "lot_pt_no": "lot_pt_no",
    "purchaser_name_foreign": "purchaser_name_foreign",
    "vp_billing_date": "vp_billing_date",
    "vp_letter_date": "vp_letter_date",
    "master_title_geran_no": "master_title_geran_no",
    "launch_date": "launch_date",
    "sub_product": "sub_product",
}

# Valid status values
VALID_STATUSES = {"Available", "Signed", "Sold", "Registered", "Not Available"}

# ---------------------------------------------------------------------------
# Updated As Of — Persistent System-Wide Date
# ---------------------------------------------------------------------------

# File used to persist the last successful Clean Data upload date.
# This survives page refreshes and server restarts without requiring
# a new database table.
_SYSTEM_CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "system_config.json")


def get_updated_as_of() -> str:
    """
    Return the last successful Clean Data upload date as a formatted string.
    Returns "Not Available" if no successful upload has been recorded yet.
    """
    try:
        if os.path.exists(_SYSTEM_CONFIG_FILE):
            with open(_SYSTEM_CONFIG_FILE, "r") as f:
                data = json.load(f)
            raw = data.get("updated_as_of")
            if raw:
                # raw is stored as YYYY-MM-DD; format to "DD Month YYYY"
                try:
                    d = datetime.strptime(raw, "%Y-%m-%d")
                    return d.strftime("%d %B %Y")
                except Exception:
                    return raw
        return "N/A"
    except Exception as e:
        print(f"[data_upload] get_updated_as_of error: {e}")
        return "N/A"


def set_updated_as_of(dt: datetime = None) -> str:
    """
    Persist the date of a successful Clean Data upload.
    Only called AFTER the upload has been successfully applied to the database.
    Returns the formatted date string.
    """
    if dt is None:
        dt = datetime.now()
    try:
        data = {}
        if os.path.exists(_SYSTEM_CONFIG_FILE):
            with open(_SYSTEM_CONFIG_FILE, "r") as f:
                data = json.load(f)
        data["updated_as_of"] = dt.strftime("%Y-%m-%d")
        with open(_SYSTEM_CONFIG_FILE, "w") as f:
            json.dump(data, f, indent=2)
        return dt.strftime("%d %B %Y")
    except Exception as e:
        print(f"[data_upload] set_updated_as_of error: {e}")
        return dt.strftime("%d %B %Y")


# ---------------------------------------------------------------------------
# Excel Reading & Validation
# ---------------------------------------------------------------------------

def read_excel_file(file_path: str) -> dict:
    """
    Read an Excel file and validate it follows the expected clean data schema.
    Returns {"success": True, "data": DataFrame} or {"success": False, "errors": [...]}.
    """
    errors = []

    # 1. File format check
    if not file_path or not os.path.exists(file_path):
        return {"success": False, "errors": ["File not found."]}

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in (".xlsx", ".xls"):
        return {"success": False, "errors": ["Invalid file format. Please upload an .xlsx or .xls file."]}

    # 2. Read Excel
    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        return {"success": False, "errors": [f"Failed to read Excel file: {str(e)}"]}

    if df is None or df.empty:
        return {"success": False, "errors": ["The uploaded file is empty."]}

    # 3. Normalize column names
    # The real cleaned Excel file uses display-style headers such as:
    #   "Unit No."  -> unit_no
    #   "Built-up Area" -> built_up_area
    #   "List Price" -> list_price
    #   "HSD/HSM No" -> hsd_hsm_no
    #   "Identity No. (Foreign)" -> identity_no_foreign
    #   "Master Title/Geran No." -> master_title_geran_no
    #   "Sub-Product?" -> sub_product
    # Normalize to lowercase internal names matching REQUIRED_COLUMNS / COLUMN_MAP.
    df.columns = [
        str(c).strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
        .replace(".", "")
        .replace("(", "")
        .replace(")", "")
        .replace("?", "")
        for c in df.columns
    ]

    # 4. Check required columns
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        return {
            "success": False,
            "errors": [
                "Upload failed. The file does not match the required clean data format.",
                f"Missing required columns: {', '.join(missing)}",
            ],
        }

    # 5. Validate data values
    # Unit number
    df["unit_no"] = df["unit_no"].astype(str).str.strip()
    empty_units = df[df["unit_no"] == ""].index.tolist()
    if empty_units:
        errors.append(f"Row(s) {', '.join(str(i + 2) for i in empty_units[:5])} have empty Unit Number.")

    # Project
    df["project"] = df["project"].astype(str).str.strip()
    empty_projects = df[df["project"] == ""].index.tolist()
    if empty_projects:
        errors.append(f"Row(s) {', '.join(str(i + 2) for i in empty_projects[:5])} have empty Project.")

    # Status
    df["status"] = df["status"].astype(str).str.strip()
    invalid_statuses = df[~df["status"].isin(VALID_STATUSES)].index.tolist()
    if invalid_statuses:
        errors.append(f"Row(s) {', '.join(str(i + 2) for i in invalid_statuses[:5])} have invalid Status values.")

    # Unit Type
    df["unit_type"] = df["unit_type"].astype(str).str.strip()
    empty_types = df[df["unit_type"] == ""].index.tolist()
    if empty_types:
        errors.append(f"Row(s) {', '.join(str(i + 2) for i in empty_types[:5])} have empty Unit Type.")

    # SPA Price / List Price
    df["list_price"] = pd.to_numeric(df["list_price"], errors="coerce").fillna(0)
    invalid_prices = df[df["list_price"] < 0].index.tolist()
    if invalid_prices:
        errors.append(f"Row(s) {', '.join(str(i + 2) for i in invalid_prices[:5])} have negative List Price.")

    # Built Up Area
    df["built_up_area"] = pd.to_numeric(df["built_up_area"], errors="coerce").fillna(0)
    invalid_areas = df[df["built_up_area"] < 0].index.tolist()
    if invalid_areas:
        errors.append(f"Row(s) {', '.join(str(i + 2) for i in invalid_areas[:5])} have negative Built Up Area.")

    if errors:
        return {"success": False, "errors": errors}

    return {"success": True, "data": df}


# ---------------------------------------------------------------------------
# Comparison
# ---------------------------------------------------------------------------

def compare_with_database(clean_df: pd.DataFrame) -> dict:
    """
    Compare clean data with current database records.
    Returns a comparison summary dict.
    """
    # Fetch current database records
    db_rows = execute_query("SELECT * FROM units_master")
    db_units = {}
    for row in db_rows:
        key = _unit_key(row.get("unit_no"), row.get("project"))
        db_units[key] = row

    # Build clean data map
    clean_units = {}
    for _, row in clean_df.iterrows():
        key = _unit_key(row.get("unit_no"), row.get("project"))
        clean_units[key] = row

    new_units = []
    removed_units = []
    status_changes = []
    data_changes = []
    unchanged_units = 0
    errors = []

    # Find new units (in clean but not in DB)
    for key, clean_row in clean_units.items():
        if key not in db_units:
            new_units.append(key)

    # Find removed/missing units (in DB but not in clean)
    for key in db_units:
        if key not in clean_units:
            removed_units.append(key)

    # Compare existing units
    for key, clean_row in clean_units.items():
        if key not in db_units:
            continue
        db_row = db_units[key]

        # Status change
        db_status = str(db_row.get("status") or "").strip()
        clean_status = str(clean_row.get("status") or "").strip()
        status_changed = db_status != clean_status
        if status_changed:
            status_changes.append({
                "unit_no": clean_row.get("unit_no"),
                "project": clean_row.get("project"),
                "old_status": db_status,
                "new_status": clean_status,
            })

        # Data changes (excluding status which is tracked separately)
        changed_fields = []
        for col in COLUMN_MAP:
            db_col = COLUMN_MAP[col]
            if db_col in ("status", "unit_no", "project"):
                continue
            db_val = db_row.get(db_col)
            clean_val = clean_row.get(col)

            # Normalize for comparison
            db_norm = _normalize_value(db_val)
            clean_norm = _normalize_value(clean_val)

            if db_norm != clean_norm:
                changed_fields.append(col)

        if changed_fields:
            data_changes.append({
                "unit_no": clean_row.get("unit_no"),
                "project": clean_row.get("project"),
                "changed_fields": changed_fields,
            })

        # Unchanged: exists in both, no status change, no data changes
        if not status_changed and not changed_fields:
            unchanged_units += 1

    # Column counts for the comparison table
    db_column_count = len(db_rows[0]) if db_rows else 0
    clean_column_count = len(clean_df.columns)

    return {
        "current_db_count": len(db_rows),
        "clean_data_count": len(clean_df),
        "new_units": len(new_units),
        "removed_units": len(removed_units),
        "status_changes": len(status_changes),
        "data_changes": len(data_changes),
        "unchanged_units": unchanged_units,
        "errors": len(errors),
        "db_column_count": db_column_count,
        "clean_column_count": clean_column_count,
        "new_unit_list": new_units[:20],
        "removed_unit_list": removed_units[:20],
        "status_change_list": status_changes[:20],
        "data_change_list": data_changes[:20],
    }


def _unit_key(unit_no, project):
    """Create a normalized unique key for a unit."""
    return f"{str(unit_no or '').strip().upper()}|{str(project or '').strip().upper()}"


def _normalize_value(val):
    """
    Normalize a value for comparison between MySQL and Excel sources.

    Rules:
      - None / NULL / NaN / NaT / empty -> "" (empty string)
      - Numeric (int, float, Decimal) -> float (numeric comparison)
      - date / datetime / Timestamp -> "YYYY-MM-DD" string
      - Everything else -> stripped string
    """
    # NULL / NaN / NaT / empty -> empty string
    if val is None:
        return ""
    if isinstance(val, float) and math.isnan(val):
        return ""
    if isinstance(val, pd.Timestamp) and pd.isna(val):
        return ""
    if isinstance(val, (datetime, date)) and str(val).strip() in ("NaT", ""):
        return ""

    # Numeric values -> float for numeric comparison
    if isinstance(val, (int, float, Decimal)):
        return float(val)

    # Dates -> YYYY-MM-DD string
    # datetime.datetime and pd.Timestamp (a subclass of datetime.datetime)
    # both expose .date(); but a plain datetime.date does NOT have a
    # .date() method, so handle it directly to avoid an AttributeError.
    if isinstance(val, datetime):
        return str(val.date())
    if isinstance(val, date):
        return str(val)

    # Strings -> stripped
    return str(val).strip()


# ---------------------------------------------------------------------------
# Safe Database Update
# ---------------------------------------------------------------------------

def backup_database() -> str:
    """
    Create a backup of the units_master table before applying changes.
    Returns backup table name.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_table = f"units_master_backup_{timestamp}"

    try:
        execute_query(
            f"CREATE TABLE {backup_table} AS SELECT * FROM units_master",
            fetch=False,
        )
        return backup_table
    except Exception as e:
        print(f"[data_upload] Backup failed: {e}")
        raise


def apply_clean_data(clean_df: pd.DataFrame) -> dict:
    """
    Apply clean data to the database safely.
    - Creates a backup first
    - Inserts new units
    - Updates existing units
    - Does NOT delete existing units (preserves data)
    """
    # 1. Create backup
    backup_table = backup_database()

    # 2. Fetch current DB records
    db_rows = execute_query("SELECT * FROM units_master")
    db_units = {}
    for row in db_rows:
        key = _unit_key(row.get("unit_no"), row.get("project"))
        db_units[key] = row

    new_count = 0
    updated_count = 0
    status_change_count = 0

    conn = get_connection()
    cursor = conn.cursor()

    try:
        for _, row in clean_df.iterrows():
            key = _unit_key(row.get("unit_no"), row.get("project"))

            # Build data dict from mapped columns
            data = {}
            for col in COLUMN_MAP:
                db_col = COLUMN_MAP[col]
                val = row.get(col)
                if pd.isna(val):
                    val = None
                data[db_col] = val

            if key in db_units:
                # Update existing unit
                db_row = db_units[key]

                # Check status change
                db_status = str(db_row.get("status") or "").strip()
                clean_status = str(data.get("status") or "").strip()
                if db_status != clean_status:
                    status_change_count += 1

                # Build SET clause
                set_clauses = []
                params = []
                for col, val in data.items():
                    if col in ("id", "created_at"):
                        continue
                    set_clauses.append(f"{col} = %s")
                    params.append(val)

                if set_clauses:
                    params.append(db_row.get("id"))
                    query = f"UPDATE units_master SET {', '.join(set_clauses)} WHERE id = %s"
                    cursor.execute(query, params)
                    updated_count += 1
            else:
                # Insert new unit
                columns = []
                placeholders = []
                params = []
                for col, val in data.items():
                    if col in ("id", "created_at"):
                        continue
                    columns.append(col)
                    placeholders.append("%s")
                    params.append(val)

                if columns:
                    query = f"INSERT INTO units_master ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
                    cursor.execute(query, params)
                    new_count += 1

        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[data_upload] Apply failed, rolling back: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        close_connection(conn)

    return {
        "backup_table": backup_table,
        "records_processed": len(clean_df),
        "new_units": new_count,
        "updated_units": updated_count,
        "status_changes": status_change_count,
    }


# ---------------------------------------------------------------------------
# Post-Upload Verification
# ---------------------------------------------------------------------------

def verify_upload() -> dict:
    """
    Verify the database after upload.
    Checks record count and data integrity.
    """
    results = {}

    # Record count
    count_result = execute_query("SELECT COUNT(*) as total FROM units_master")
    results["record_count"] = count_result[0]["total"] if count_result else 0

    # Invalid status check
    status_result = execute_query(
        """
        SELECT DISTINCT status FROM units_master
        WHERE status NOT IN ('Available', 'Signed', 'Sold', 'Registered', 'Not Available')
        """
    )
    results["invalid_statuses"] = status_result

    # Project count
    project_result = execute_query(
        "SELECT project, COUNT(*) as cnt FROM units_master GROUP BY project ORDER BY project"
    )
    results["projects"] = project_result

    return results