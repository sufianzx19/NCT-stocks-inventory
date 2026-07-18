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


# ----- Home KPI repository -----
def get_home_kpi_data() -> list:
    """
    Get KPI data per project: available units and total list price.
    Only counts units where status = 'Available'.
    """
    query = """
        SELECT 
            project,
            COUNT(*) as available_units,
            COALESCE(SUM(list_price), 0) as total_list_price
        FROM units_master
        WHERE status = 'Available'
        GROUP BY project
        ORDER BY project
    """
    return execute_query(query)
