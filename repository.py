"""
Repository Layer - SQL Queries Only
All SQL queries live here. No business logic, no field mapping.
Uses %s placeholders for parameterized queries (MySQL style).
"""
from database import execute_query


def get_projects() -> list:
    """Get distinct project names."""
    query = """
        SELECT DISTINCT project 
        FROM units_master 
        WHERE project != '' 
        ORDER BY project
    """
    return execute_query(query)


def get_chart_data(project: str) -> list:
    """Get units count grouped by status for a project."""
    query = """
        SELECT status, COUNT(*) as count
        FROM units_master
        WHERE project = %s
        GROUP BY status
    """
    return execute_query(query, (project,))


def get_all_units() -> list:
    """Get all unit records."""
    query = "SELECT * FROM units_master"
    return execute_query(query)


def get_units_paginated(
    project: str = None,
    search: str = None,
    status: str = None,
    unit_type: str = None,
    limit: int = 30,
    offset: int = 0,
) -> tuple:
    """
    Get paginated units with optional project, search, status, and unit_type filters.
    Returns (total_count, rows).
    """
    where_clauses = []
    params = []

    if project and project.strip():
        where_clauses.append("project = %s")
        params.append(project.strip())

    if search and search.strip():
        s = f"%{search.strip()}%"
        where_clauses.append("(unit_no LIKE %s OR unit_type LIKE %s)")
        params.extend([s, s])

    if status and status.strip():
        where_clauses.append("status = %s")
        params.append(status.strip())

    if unit_type and unit_type.strip():
        where_clauses.append("unit_type = %s")
        params.append(unit_type.strip())

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    count_query = f"SELECT COUNT(*) as total FROM units_master {where_sql}"
    count_result = execute_query(count_query, tuple(params) if params else None)
    total = count_result[0]["total"] if count_result else 0

    data_query = f"SELECT * FROM units_master {where_sql} LIMIT %s OFFSET %s"
    rows = execute_query(data_query, tuple(params) + (limit, offset) if params else (limit, offset))

    return total, rows


def get_units_by_project_like(project_pattern: str) -> list:
    """Get units where project name matches a pattern."""
    query = "SELECT * FROM units_master WHERE project LIKE %s"
    return execute_query(query, (project_pattern,))


# ----- User repository -----
def get_user_by_email(email: str) -> list:
    """Get a user by email from the users table."""
    query = "SELECT * FROM users WHERE email = %s AND status = 'active'"
    return execute_query(query, (email,))


# ----- MFA repository -----
def get_user_mfa_status(email: str) -> dict:
    """Get MFA status for a user."""
    query = "SELECT mfa_enabled, mfa_secret, mfa_backup_codes FROM users WHERE email = %s AND status = 'active'"
    result = execute_query(query, (email,))
    if result:
        return result[0]
    return None


def enable_mfa(email: str, secret: str) -> bool:
    """Enable MFA for a user."""
    query = "UPDATE users SET mfa_enabled = 1, mfa_secret = %s WHERE email = %s"
    execute_query(query, (secret, email), fetch=False)
    return True


def disable_mfa(email: str) -> bool:
    """Disable MFA for a user."""
    query = "UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_backup_codes = NULL WHERE email = %s"
    execute_query(query, (email,), fetch=False)
    return True


def verify_mfa_code(email: str) -> dict:
    """Get MFA secret for verification."""
    query = "SELECT mfa_secret FROM users WHERE email = %s AND mfa_enabled = 1 AND status = 'active'"
    result = execute_query(query, (email,))
    if result:
        return result[0]
    return None


# ----- Data Management repository -----
def get_units_master_all() -> list:
    """Get ALL units_master records (raw, no limit)."""
    query = "SELECT * FROM units_master ORDER BY id"
    return execute_query(query)


def update_unit_record(unit_id: int, data: dict) -> bool:
    """Update a unit record by ID with the given field->value map."""
    set_clauses = []
    params = []
    for col, val in data.items():
        if col == "id":
            continue
        set_clauses.append(f"{col} = %s")
        params.append(val)
    if not set_clauses:
        return False
    params.append(unit_id)
    query = f"UPDATE units_master SET {', '.join(set_clauses)} WHERE id = %s"
    execute_query(query, tuple(params), fetch=False)
    return True


def create_unit_record(data: dict) -> bool:
    """Create a new unit record from a field->value map."""
    columns = []
    placeholders = []
    params = []
    for col, val in data.items():
        if col == "id":
            continue
        columns.append(col)
        placeholders.append("%s")
        params.append(val)
    if not columns:
        return False
    query = f"INSERT INTO units_master ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
    execute_query(query, tuple(params), fetch=False)
    return True


def delete_unit_record(unit_id: int) -> bool:
    """Delete a unit record by ID."""
    query = "DELETE FROM units_master WHERE id = %s"
    execute_query(query, (unit_id,), fetch=False)
    return True


# ----- User Management repository -----
def get_all_users() -> list:
    """Get ALL users, sorted by user_type ascending."""
    query = "SELECT * FROM users ORDER BY user_type ASC, id ASC"
    return execute_query(query)


def get_user_by_id(user_id: int) -> list:
    """Get a single user by ID."""
    query = "SELECT * FROM users WHERE id = %s"
    return execute_query(query, (user_id,))


def create_user(data: dict) -> bool:
    """Create a new user."""
    columns = []
    placeholders = []
    params = []
    for col in ["name", "user_type", "role", "email", "mobile", "password_hash", "status", "mfa_enabled", "mfa_secret", "mfa_backup_codes"]:
        if col in data:
            columns.append(col)
            placeholders.append("%s")
            params.append(data[col])
    if not columns:
        return False
    query = f"INSERT INTO users ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
    execute_query(query, tuple(params), fetch=False)
    return True


def update_user(user_id: int, data: dict) -> bool:
    """Update a user by ID."""
    set_clauses = []
    params = []
    for col, val in data.items():
        if col == "id":
            continue
        set_clauses.append(f"{col} = %s")
        params.append(val)
    if not set_clauses:
        return False
    params.append(user_id)
    query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = %s"
    execute_query(query, tuple(params), fetch=False)
    return True


def delete_user(user_id: int) -> bool:
    """Delete a user by ID."""
    query = "DELETE FROM users WHERE id = %s"
    execute_query(query, (user_id,), fetch=False)
    return True


# ----- Home KPI repository -----
# Grand Ion Delemen sub-sale is determined by database fields:
#   project == "GRAND ION DELEMEN"
#   AND status == "Sold"
#   AND owner_name is "NCT HARMONY SDN BHD" (punctuation-normalized,
#      because the DB stores it as both "NCT HARMONY SDN BHD" and
#      "NCT HARMONY SDN. BHD.").
# No hardcoded unit-number list is used.
GID_DELIV_OWNER_NORMALIZED = "NCT HARMONY SDN BHD"


def _normalize_owner(name):
    """Normalize an owner name for comparison (strip non-alphanumerics, uppercase)."""
    if not name:
        return ""
    return "".join(ch for ch in str(name).upper() if ch.isalnum())


def is_gid_sub_sale(project, status, owner_name):
    return _normalize_owner(project) == "GRANDIONDELEMEN" and \
           (status or "").strip().lower() == "sold" and \
           _normalize_owner(owner_name) == _normalize_owner(GID_DELIV_OWNER_NORMALIZED)

def get_home_kpi_data() -> list:
    """
    Get KPI data per project: available units and total list price.
    Counts units where status = 'Available' plus Grand Ion Delemen sub-sale units.
    """
    # Get all units and compute in Python for accurate sub-sale handling
    all_units = get_all_units()
    
    # Group by project
    project_stats = {}
    for unit in all_units:
        project = unit.get("project", "").strip()
        if not project:
            continue
        
        status = (unit.get("status") or "").strip().lower()
        unit_no = (unit.get("unit_no") or "").strip().upper()
        list_price = float(unit.get("list_price") or 0)

        # Grand Ion Delemen sub-sale: project==GID AND status==Sold AND
        # owner==NCT HARMONY SDN BHD (normalized). Fully DB-driven.
        is_available = False
        if status == "available":
            is_available = True
        elif is_gid_sub_sale(unit.get("project"), unit.get("status"), unit.get("owner_name")):
            is_available = True
        
        if is_available:
            if project not in project_stats:
                project_stats[project] = {"count": 0, "total_price": 0.0}
            project_stats[project]["count"] += 1
            project_stats[project]["total_price"] += list_price
    
    # Convert to list format matching original API
    result = []
    for project, stats in sorted(project_stats.items()):
        result.append({
            "project": project,
            "available_units": stats["count"],
            "total_list_price": stats["total_price"],
        })
    
    return result
