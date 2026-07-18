"""
Services Layer - Business Logic & Field Mapping
This is the ONLY layer that knows both MySQL schema and API response schema.
Handles data transformation, field mapping, derived values, and authentication.
"""
import math
import hashlib
from typing import Optional
import repository as repo


PROJECT_NAME_MAP = {
    "NCT SMART INDUSTRIAL PARK PHASE 1": "NCT SMART INDUSTRIAL PARK KM1",
}

PROJECT_STATUS_MAP = {
    "NCT SMART INDUSTRIAL PARK PHASE 1": "Ongoing",
}

# Unit Type display name mapping - Presentation layer only
UNIT_TYPE_DISPLAY_MAP = {
    "STUDIO": "Studio Unit",
    "1BR": "1-Bedroom Unit",
    "2BR": "2-Bedroom Unit",
    "3BR": "3-Bedroom Unit",
    "PENTHOUSE": "Penthouse Unit",
    "DUPLEX (3R+3B)": "Duplex Unit (3 Bedrooms + 3 Bathrooms)",
    "INTERMEDIATE LOT": "Intermediate Lot",
    "INTERMEDIATE": "Intermediate Lot",
    "CORNER LOT": "Corner Lot",
    "CORNER": "Corner Lot",
    "END LOT": "End Lot",
    "CORPORATE OFFICE TYPE A1": "Corporate Office – Type A1",
    "CORPORATE OFFICE TYPE A2": "Corporate Office – Type A2",
    "CORPORATE OFFICE TYPE B1": "Corporate Office – Type B1",
    "CORPORATE OFFICE TYPE B2": "Corporate Office – Type B2",
    "CORPORATE OFFICE TYPE B3": "Corporate Office – Type B3",
}


def _map_project_name(name: str) -> str:
    """Map MySQL project names to the API response format expected by frontend."""
    return PROJECT_NAME_MAP.get(name, name)


def _reverse_map_project_name(name: str) -> str:
    """Map API project filter names back to MySQL project names."""
    reverse_mapping = {
        "NCT SMART INDUSTRIAL PARK KM1": "NCT SMART INDUSTRIAL PARK PHASE 1",
    }
    return reverse_mapping.get(name, name)


def _get_price_info(row: dict) -> dict:
    """
    Determine price type and value based on unit status.
    
    Available  → List Price (list_price)
    Signed     → Contract Amount (contract_amt)
    Sold       → Contract Amount (contract_amt)
    Registered → Contract Amount (contract_amt)
    """
    status = (row.get("status") or "").strip().lower()
    list_price = float(row["list_price"]) if row.get("list_price") else 0
    contract_amt = float(row["contract_amt"]) if row.get("contract_amt") else 0

    if status == "available":
        return {
            "unit_status": row.get("status"),
            "price_type": "List Price",
            "price": list_price,
        }
    else:
        # Signed, Sold, Registered → Contract_Amt
        return {
            "unit_status": row.get("status"),
            "price_type": "Contract Amount",
            "price": contract_amt,
        }


def _get_unit_type_display(unit_type: str) -> str:
    """
    Get display-friendly Unit Type name.
    Returns mapped value or original if not in mapping.
    """
    if not unit_type:
        return "Unknown"
    # Case-insensitive lookup with fallback to uppercase
    var_upper = unit_type.upper()
    if var_upper in UNIT_TYPE_DISPLAY_MAP:
        return UNIT_TYPE_DISPLAY_MAP[var_upper]
    # Try exact match
    if unit_type in UNIT_TYPE_DISPLAY_MAP:
        return UNIT_TYPE_DISPLAY_MAP[unit_type]
    return unit_type


def _map_unit_row(row: dict) -> dict:
    """
    Map a MySQL units_master row to the API response format.
    Obsolete SQLite fields return None to let frontend handle them.
    """
    price_info = _get_price_info(row)
    unit_type = row.get("unit_type") or "Unknown"

    result = {
        "ID": row.get("id"),
        "Unit_No": row.get("unit_no"),
        "Project": _map_project_name(row.get("project")),
        "Phase": row.get("phase_name"),
        "Block": row.get("block_name"),
        "Status": row.get("status"),
        "Built_Up": float(row["built_up_area"]) if row.get("built_up_area") else 0,
        "Land_Area": float(row["land_area"]) if row.get("land_area") else 0,
        "Unit_Type": unit_type,
        "Unit_Type_Display": _get_unit_type_display(unit_type),
        "Listing_Price": float(row["list_price"]) if row.get("list_price") else 0,
        "Contract_Amt": float(row["contract_amt"]) if row.get("contract_amt") else 0,
        # Expose new MySQL columns
        "Owner_Name": row.get("owner_name"),
        "Identity_No": row.get("identity_no"),
        "Identity_No_Foreign": row.get("identity_no_foreign"),
        "Unit_Address": row.get("unit_address"),
        "Spa_Date": str(row["spa_date"]) if row.get("spa_date") else None,
        "Sale_Date": str(row["sale_date"]) if row.get("sale_date") else None,
        # Obsolete SQLite fields - return None
        "Property_Type": None,
        "Property_Ownership": None,
        "Commercial_Residential": None,
        "Bank_Charge": None,
        "SaleOrSubSale": None,
        "SPA_Signed_Price": None,
        # New status/price fields
        "unit_status": price_info["unit_status"],
        "price_type": price_info["price_type"],
        "price": price_info["price"],
    }
    return result


def get_project_status(mysql_name: str) -> str:
    """
    Determine project status (Ongoing/Completed) based on project name.
    Projects with active sales/data pipeline are Ongoing.
    """
    status_map = {
        "NCT SMART INDUSTRIAL PARK PHASE 1": "Ongoing",
        "NCT INNOSPHERE": "Ongoing",
    }
    return status_map.get(mysql_name, "Completed")


def get_home_kpi() -> list:
    """
    Get KPI data for the home dashboard.
    Returns list of {project_name, project_status, available_units, total_list_price, project_slug}
    """
    import re
    rows = repo.get_home_kpi_data()
    result = []
    for row in rows:
        mysql_name = row["project"]
        api_name = _map_project_name(mysql_name) if mysql_name else "Unknown"
        status = get_project_status(mysql_name)
        # Compute slug matching frontend logic
        slug = re.sub(r'[^a-z0-9]+', '-', api_name.lower()).strip('-') if api_name else ""
        # Override slug for NSIP to match frontend navigation
        if api_name and "NCT SMART INDUSTRIAL PARK" in api_name.upper():
            slug = "nsip"
        result.append({
            "project_name": api_name,
            "project_status": status,
            "available_units": row["available_units"],
            "total_list_price": float(row["total_list_price"]),
            "project_slug": slug,
        })
    return result


def get_projects() -> list:
    """Get distinct projects."""
    rows = repo.get_projects()
    return [{"label": _map_project_name(r["project"]) if r["project"] else "Unknown", "value": _map_project_name(r["project"])} for r in rows]


def get_chart_data() -> list:
    """Get chart data grouped by project."""
    projects = repo.get_projects()
    result = []
    for row in projects:
        proj_name = row["project"]
        chart_rows = repo.get_chart_data(proj_name)
        total = sum(r["count"] for r in chart_rows)
        result.append({
            "project": _map_project_name(proj_name) if proj_name else "Unknown",
            "sale": total,
            "sub_sale": 0,
        })
    return result


def get_all_units() -> list:
    """Get all units with mapped fields."""
    rows = repo.get_all_units()
    return [_map_unit_row(r) for r in rows]


def get_units_paginated(
    project: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 30,
) -> dict:
    """Get paginated units with mapped fields."""
    offset = (page - 1) * per_page
    # Reverse map project name for compatibility with MySQL
    mysql_project = _reverse_map_project_name(project) if project else None
    total, rows = repo.get_units_paginated(
        project=mysql_project,
        search=search,
        status=status,
        limit=per_page,
        offset=offset,
    )
    mapped = [_map_unit_row(r) for r in rows]
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": math.ceil(total / per_page) if total > 0 else 1,
        "data": mapped,
    }


def get_units_by_project_like(project_pattern: str) -> list:
    """Get units for a project pattern (e.g., '%NSIP%')."""
    clean = project_pattern.replace("%", "")
    mysql_pattern = _reverse_map_project_name(clean)
    rows = repo.get_units_by_project_like(f"%{mysql_pattern}%")
    return [_map_unit_row(r) for r in rows]


# ----- Authentication services -----
def hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def authenticate_user(email: str, password: str) -> dict:
    """
    Authenticate a user against the MySQL users table.
    Returns user dict on success, None on failure.
    """
    users = repo.get_user_by_email(email)
    if not users:
        return None
    user = users[0]
    stored_hash = user.get("password_hash")
    provided_hash = hash_password(password)
    if stored_hash == provided_hash:
        return user
    return None


def get_user_profile(email: str) -> dict:
    """
    Get user profile information.
    Returns user dict with mapped display values.
    """
    users = repo.get_user_by_email(email)
    if not users:
        return None
    user = users[0]
    
    # Map user_type to display value
    user_type = user.get("user_type", "")
    user_type_display = "Internal" if user_type == "nct_user" else "External" if user_type == "agent" else user_type
    
    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "mobile": user.get("mobile"),
        "role": user.get("role"),
        "user_type": user_type_display,
        "user_type_raw": user_type,
        "status": user.get("status", "Active"),
    }
