#!/usr/bin/env python3
"""
NCT Stocks & Inventory System — Database Summary Report Generator
Reads live data from MySQL database and generates a summary report.
"""
from datetime import datetime
import os
import sys

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import database as db
import services as svc

# Project display order (matching frontend)
PROJECT_DISPLAY_ORDER = [
    "NCT SMART INDUSTRIAL PARK PHASE 1",
    "NCT INNOSPHERE",
    "ION BELIAN GARDEN",
    "MAHKOTA KAMPAR",
    "N-CITY",
    "VORTEX BUSINESS PARK",
    "SALAK PERDANA BUSINESS PARK",
    "GRAND ION DELEMEN",
    "GRAND ION MAJESTIC",
]

PROJECT_NAME_MAP = {
    "NCT SMART INDUSTRIAL PARK PHASE 1": "NSIP KM1",
}


def get_display_name(project: str) -> str:
    return PROJECT_NAME_MAP.get(project, project)


def generate_report() -> dict:
    """Generate the database summary report and return metadata."""
    
    db_name = "nct_stocks_inventory"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # --- Query 1: Total records ---
    total_records = db.execute_query("SELECT COUNT(*) as cnt FROM units_master")[0]["cnt"]
    
    # --- Query 2: Available units by project ---
    available_query = """
        SELECT project, COUNT(*) as available_count
        FROM units_master
        WHERE LOWER(TRIM(status)) = 'available'
        GROUP BY project
        ORDER BY project
    """
    available_rows = db.execute_query(available_query)
    available_map = {r["project"]: r["available_count"] for r in available_rows}
    
    # --- Query 3: List price sum by project for available units ---
    price_query = """
        SELECT project, SUM(COALESCE(list_price, 0)) as total_price
        FROM units_master
        WHERE LOWER(TRIM(status)) = 'available'
        GROUP BY project
        ORDER BY project
    """
    price_rows = db.execute_query(price_query)
    price_map = {r["project"]: float(r["total_price"]) for r in price_rows}
    
    # --- Query 4: Get distinct projects ---
    proj_rows = db.execute_query("SELECT DISTINCT project FROM units_master ORDER BY project")
    db_projects = set(r["project"] for r in proj_rows)
    
    # --- Query 5: Check for NULL prices ---
    null_price_rows = db.execute_query("""
        SELECT COUNT(*) as cnt FROM units_master
        WHERE list_price IS NULL
    """)
    null_price_count = null_price_rows[0]["cnt"]
    
    # --- Query 6: Total available count ---
    total_available = db.execute_query("""
        SELECT COUNT(*) as cnt FROM units_master
        WHERE LOWER(TRIM(status)) = 'available'
    """)[0]["cnt"]
    
    # --- Query 7: Grand total list price for available ---
    grand_total_price = db.execute_query("""
        SELECT SUM(COALESCE(list_price, 0)) as total FROM units_master
        WHERE LOWER(TRIM(status)) = 'available'
    """)[0]["total"]
    grand_total_price = float(grand_total_price) if grand_total_price else 0.0
    
    # --- Build sorted project list ---
    all_projects = []
    seen = set()
    
    # First add projects in display order
    for proj in PROJECT_DISPLAY_ORDER:
        normalized = proj.strip().upper()
        for db_proj in sorted(db_projects):
            if db_proj.strip().upper() == normalized and db_proj not in seen:
                all_projects.append(db_proj)
                seen.add(db_proj)
                break
    
    # Then add any remaining projects
    for db_proj in sorted(db_projects):
        if db_proj not in seen:
            all_projects.append(db_proj)
            seen.add(db_proj)
    
    # --- Format price helper ---
    def fmt_price(val):
        if val is None:
            val = 0.0
        return f"RM {float(val):,.2f}"
    
    # --- Build report content ---
    lines = []
    lines.append("# NCT Stocks & Inventory System")
    lines.append("")
    lines.append("## Database Summary Report")
    lines.append("")
    lines.append(f"**Generated On:** {now}")
    lines.append(f"**Database:** {db_name}")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # === Table 1: Available Units by Project ===
    lines.append("### Summary of Total Available Units by Project")
    lines.append("")
    lines.append("| No. | Project | Available Units |")
    lines.append("|-----|---------|----------------|")
    
    total_available_units = 0
    for i, proj in enumerate(all_projects, 1):
        display = get_display_name(proj)
        avail = available_map.get(proj, 0)
        total_available_units += avail
        lines.append(f"| {i} | {display} | {avail} |")
    
    lines.append(f"| | **Total | {total_available_units}** |")
    lines.append("")
    lines.append("")
    
    # === Table 2: Total List Price by Project ===
    lines.append("### Summary of Total List Price by Project")
    lines.append("")
    lines.append("| No. | Project | Total List Price (RM) |")
    lines.append("|-----|---------|----------------------|")
    
    grand_total = 0.0
    for i, proj in enumerate(all_projects, 1):
        display = get_display_name(proj)
        price = price_map.get(proj, 0.0)
        grand_total += price
        lines.append(f"| {i} | {display} | {fmt_price(price)} |")
    
    lines.append(f"| | **Total** | **{fmt_price(grand_total)}** |")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # === Footer ===
    lines.append("### Validation Summary")
    lines.append("")
    lines.append(f"• Total Projects              : {len(all_projects)}")
    lines.append(f"• Total Units                 : {total_records}")
    lines.append(f"• Total Available Units       : {total_available_units}")
    lines.append(f"• Grand Total List Price      : {fmt_price(grand_total)}")
    if null_price_count > 0:
        lines.append(f"• ⚠️ Records with NULL List Price : {null_price_count}")
    else:
        lines.append("• ✅ All List Price values are present")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("*Generated automatically by*")
    lines.append("*NCT Stocks & Inventory System*")
    
    report_content = "\n".join(lines)
    
    return {
        "content": report_content,
        "projects_count": len(all_projects),
        "total_records": total_records,
        "total_available": total_available_units,
        "grand_total_price": grand_total,
        "null_price_count": null_price_count,
        "timestamp": now,
        "projects": all_projects,
    }


def save_report(content: str) -> str:
    """Save report to file and return the file path."""
    reports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"Database_Summary_Report_{timestamp}.md"
    filepath = os.path.join(reports_dir, filename)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    
    return filepath


def main():
    print("=" * 60)
    print("  NCT Stocks & Inventory System")
    print("  Database Summary Report Generator")
    print("=" * 60)
    print()
    
    print("[1/3] Querying live database...")
    result = generate_report()
    
    print(f"  → {result['total_records']} total records found")
    print(f"  → {result['projects_count']} projects processed")
    print(f"  → {result['total_available']} available units")
    print()
    
    print("[2/3] Saving report...")
    filepath = save_report(result["content"])
    filename = os.path.basename(filepath)
    print(f"  → Saved to: {filepath}")
    print()
    
    print("[3/3] Printing report contents:")
    print()
    print("=" * 60)
    print(result["content"])
    print("=" * 60)
    print()
    
    print("✅ Report generated successfully!")
    print(f"   Location  : {os.path.dirname(filepath)}/")
    print(f"   File      : {filename}")
    print(f"   Projects  : {result['projects_count']}")
    print(f"   Records   : {result['total_records']}")
    print(f"   Timestamp : {result['timestamp']}")


if __name__ == "__main__":
    main()