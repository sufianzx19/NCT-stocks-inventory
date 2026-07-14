"""
NCT Stocks & Inventory V3 — Master Tab Migration Engine
Targets ONLY the consolidated Master_Available_Units tab.
"""
import sqlite3
import pandas as pd
import os

EXCEL_PATH = "NCT_Stocks_Inventory_V3.xlsx"
DB_PATH = "nct_inventory.db"
SHEET = "Master_Available_Units"


def migrate():
    if not os.path.exists(EXCEL_PATH):
        print(f"ERROR: {EXCEL_PATH} not found")
        return False

    # Read master tab directly from row 1
    df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET)
    df.columns = [c.strip() for c in df.columns]

    # Normalize column names: replace spaces with underscores
    df.columns = [c.replace(" ", "_") for c in df.columns]

    print(f"Raw rows read: {len(df)}")
    print(f"Columns: {list(df.columns)}")

    # Clean and normalize
    df['Status'] = df['Status'].astype(str).str.strip()
    df['Unit_No'] = df['Unit_No'].astype(str).str.strip()
    df['Project'] = df['Project'].astype(str).str.strip()
    df['Sale_SubSale'] = df['Sale_SubSale'].astype(str).str.strip()

    # Build unified Price column based on Sale_SubSale
    df['Listing_Price'] = pd.to_numeric(df['Listing_Price'], errors='coerce').fillna(0)
    df['SPA_Signed_Price'] = pd.to_numeric(df['SPA_Signed_Price'], errors='coerce').fillna(0)

    def pick_price(row):
        if row['Sale_SubSale'] == 'Sale' and row['Listing_Price'] > 0:
            return row['Listing_Price']
        elif row['Sale_SubSale'] == 'Sub-Sale' and row['SPA_Signed_Price'] > 0:
            return row['SPA_Signed_Price']
        elif row['Listing_Price'] > 0:
            return row['Listing_Price']
        elif row['SPA_Signed_Price'] > 0:
            return row['SPA_Signed_Price']
        return 0.0

    df['Price'] = df.apply(pick_price, axis=1)

    # Build output DataFrame with ALL columns from V3
    output_df = pd.DataFrame({
        'ID': df.get('ID', ''),
        'Unit_No': df['Unit_No'],
        'Lot_No': df.get('Lot_No', ''),
        'Project': df['Project'],
        'Property_Type': df.get('Property_Type', ''),
        'Property_Ownership': df.get('Property_Ownership', ''),
        'Phase': df.get('Phase', ''),
        'Block': df.get('Block', ''),
        'Built_Up': pd.to_numeric(df.get('Built_Up', 0), errors='coerce').fillna(0),
        'Land_Area': pd.to_numeric(df.get('Land_Area', 0), errors='coerce').fillna(0),
        'Unit_Type': df.get('Unit_Type', ''),
        'Bank_Charge': pd.to_numeric(df.get('Bank_Charge', 0), errors='coerce').fillna(0),
        'Commercial_Residential': df.get('Commercial_Residential', ''),
        'Status': df['Status'],
        'SaleOrSubSale': df['Sale_SubSale'],
        'Listing_Price': df['Listing_Price'],
        'SPA_Signed_Price': df['SPA_Signed_Price'],
        'Price': df['Price'],
    })

    # ---- Data Standardisation: Rename values ----
    OWN_MAP = {
        "INNO": "INNOCERIA SDN BHD",
        "INNO-CLQ": "INNOCERIA SDN BHD",
        "NCTGH": "NCT HARMONY SDN BHD",
        "GT": "GALERI TROPIKA SDN BHD",
        "NCTSQ": "NCT SQUARE DEVELOPMENT SDN BHD",
        "NCTL": "NCT LAND SDN BHD",
        "NCTH": "NCT HARMONY SDN BHD",
    }
    if "Property_Ownership" in output_df.columns:
        output_df["Property_Ownership"] = output_df["Property_Ownership"].replace(OWN_MAP)

    PROJ_MAP = {
        "GIM": "GRAND ION MAJESTIC",
        "ION DELEMEN": "GRAND ION DELEMEN",
        "CLQ BUKIT TAMBUN": "VORTEX BUSINESS PARK",
    }
    if "Project" in output_df.columns:
        output_df["Project"] = output_df["Project"].replace(PROJ_MAP)

    # Write to SQLite
    conn = sqlite3.connect(DB_PATH)
    output_df.to_sql("units", conn, if_exists="replace", index=False)
    cur = conn.cursor()
    try:
        cur.execute("ALTER TABLE units ADD COLUMN ID INTEGER PRIMARY KEY AUTOINCREMENT")
    except:
        pass
    conn.commit()
    conn.close()

    print(f"\n=== MIGRATION COMPLETE ===")
    print(f"Total rows written: {len(output_df)}")
    print(f"Projects: {sorted(df['Project'].dropna().unique().tolist())}")
    print(f"Database: {DB_PATH}")
    return True


if __name__ == "__main__":
    migrate()