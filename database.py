"""
MySQL Database Connection Pool Module
Provides connection pooling for MySQL using mysql-connector-python.
"""
import mysql.connector
from mysql.connector import pooling
import os
from typing import Optional

# Database configuration (temporary hardcoded, will move to .env later)
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "database": "nct_stocks_inventory",
    "user": "nctuser",
    "password": "Azrin@0019",
}

_pool: Optional[pooling.MySQLConnectionPool] = None


def get_pool() -> pooling.MySQLConnectionPool:
    """Return the singleton MySQL connection pool."""
    global _pool
    if _pool is None:
        try:
            _pool = pooling.MySQLConnectionPool(
                pool_name="nct_pool",
                pool_size=5,
                pool_reset_session=True,
                **DB_CONFIG,
            )
        except mysql.connector.Error as e:
            print(f"[database] Failed to create connection pool: {e}")
            raise
    return _pool


def get_connection():
    """Get a connection from the pool."""
    try:
        pool = get_pool()
        conn = pool.get_connection()
        return conn
    except mysql.connector.Error as e:
        print(f"[database] Failed to get connection from pool: {e}")
        raise


def close_connection(conn) -> None:
    """Return a connection to the pool (close it)."""
    try:
        if conn and conn.is_connected():
            conn.close()
    except mysql.connector.Error as e:
        print(f"[database] Error closing connection: {e}")


def execute_query(query: str, params: tuple = None, fetch: bool = True):
    """
    Execute a query with automatic connection management.
    
    Args:
        query: SQL query string with %s placeholders
        params: Parameters for the query
        fetch: If True, fetch and return all results. If False, commit and return cursor.
    
    Returns:
        List of rows if fetch=True, cursor rowcount if fetch=False
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        if fetch:
            result = cursor.fetchall()
            return result
        else:
            conn.commit()
            return cursor.rowcount
    except mysql.connector.Error as e:
        print(f"[database] Query error: {e}")
        print(f"[database] Query: {query}")
        if params:
            print(f"[database] Params: {params}")
        if conn and conn.is_connected():
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            close_connection(conn)


def test_connection() -> bool:
    """Test database connectivity."""
    try:
        conn = get_connection()
        cursor = conn.cursor(buffered=True)
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        close_connection(conn)
        print("[database] MySQL connection successful")
        return True
    except Exception as e:
        print(f"[database] MySQL connection failed: {e}")
        return False
