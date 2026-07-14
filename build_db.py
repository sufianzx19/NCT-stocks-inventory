"""Build SQLite database from NCT_Stocks_Inventory_V3.xlsx"""
import sqlite3
import pandas as pd
import os

EXCEL_PATH = "NCT_Stocks_Inventory_V3.xlsx"
DB_PATH = "nct_inventory.db"
SHEET = "Master_Available_Units"

def build():
    if not os.path.exists(EXCEL_PATH):
        print(f"ERROR: {EXCEL_PATH} not found")
        return False

    df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET)
    df.columns = [c.strip() for c in df.columns]

    # Normalize column names: replace spaces with underscores
    df.columns = [c.replace(" ", "_") for c in df.columns]

    # Clean NaN
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].fillna("")
        else:
            df[col] = df[col].fillna(0)

    # Add SaleOrSubSale column
    df["SaleOrSubSale"] = df["Sale_SubSale"].apply(
        lambda x: "Sub-Sale"
        if "SUB" in str(x).upper() or "SUBSALE" in str(x).upper() or "SUB SALE" in str(x).upper()
        else "Sale"
    )

    # ---- Data Standardisation: Rename values ----
    # Property Ownership
    OWN_MAP = {
        "INNO": "INNOCERIA SDN BHD",
        "INNO-CLQ": "INNOCERIA SDN BHD",
        "NCTGH": "NCT HARMONY SDN BHD",
        "GT": "GALERI TROPIKA SDN BHD",
        "NCTSQ": "NCT SQUARE DEVELOPMENT SDN BHD",
        "NCTL": "NCT LAND SDN BHD",
        "NCTH": "NCT HARMONY SDN BHD",
    }
    if "Property_Ownership" in df.columns:
        df["Property_Ownership"] = df["Property_Ownership"].replace(OWN_MAP)

    # Projects
    PROJ_MAP = {
        "GIM": "GRAND ION MAJESTIC",
        "ION DELEMEN": "GRAND ION DELEMEN",
        "CLQ BUKIT TAMBUN": "VORTEX BUSINESS PARK",
    }
    if "Project" in df.columns:
        df["Project"] = df["Project"].replace(PROJ_MAP)

    conn = sqlite3.connect(DB_PATH)
    df.to_sql("units", conn, if_exists="replace", index=False)
    conn.commit()
    conn.close()
    print(f"Database built: {DB_PATH}")
    print(f"Records inserted: {len(df)}")
    print(f"Projects: {sorted(df['Project'].dropna().unique().tolist())}")
    print(f"Columns imported: {list(df.columns)}")
    return True

if __name__ == "__main__":
    build()