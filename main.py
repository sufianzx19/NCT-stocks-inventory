import sqlite3
import math
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="NCT Stocks & Inventory V3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount Gallery directory
import os as _os
_GALLERY_MOUNT_DIR = "/home/sufian/dev/NCT_Stocks_Inventory/Gallery"
app.mount("/Gallery", StaticFiles(directory=_GALLERY_MOUNT_DIR), name="gallery")

DB_PATH = "nct_inventory.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ----- Auth bypass -----
class LoginRequest(BaseModel):
    email: str
    password: str


# Password hashing
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# User store: email -> hashed password
_USERS = {
    "m.sufian@nctalliance.com": hash_password("Azrin@0019"),
    "cherrielee@nctalliance.com": hash_password("Nct@9893"),
    "waynelim@nctalliance.com": hash_password("Nct@9893"),
}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    hashed = hash_password(req.password)
    if req.email in _USERS and _USERS[req.email] == hashed:
        return {"success": True, "token": "bypass-token-nct-v3", "user": req.email}
    return JSONResponse(status_code=401, content={"success": False, "message": "Invalid credentials"})


@app.get("/api/auth/verify")
def verify(token: str = Query("")):
    if token == "bypass-token-nct-v3":
        return {"valid": True}
    return JSONResponse(status_code=401, content={"valid": False})


# Columns that should fall back to numeric 0 instead of null/empty
_NUMERIC_FIELDS = {"Built_Up", "Land_Area", "Listing_Price", "SPA_Signed_Price", "Price", "Bank_Charge", "Unit_Type"}
# Columns that should fall back to a placeholder string instead of null/empty
_TEXT_FIELDS = {
    "Unit_No", "Project", "Property_Type", "Property_Ownership",
    "Phase", "Block", "Status", "SaleOrSubSale", "Lot_No",
    "Commercial_Residential",
}


def row_to_dict(row):
    """
    Convert a sqlite3.Row into a plain dict while guaranteeing every known
    field has a safe fallback value (numeric 0 or placeholder string) so the
    frontend never receives null/empty values that could throw JSON parse
    or rendering errors.
    """
    try:
        d = dict(row)
        for key in list(d.keys()):
            val = d[key]
            if val is None or val == "":
                if key in _NUMERIC_FIELDS:
                    d[key] = 0
                elif key in _TEXT_FIELDS:
                    d[key] = "N/A"
                else:
                    d[key] = d[key] if d[key] is not None else ""
        return d
    except Exception:
        return dict(row)



# ----- Data endpoints -----
@app.get("/api/units")
def get_units(
    project: str = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=200),
):
    conn = get_db()
    cur = conn.cursor()
    where_clauses = []
    params = []

    if project and project.strip():
        where_clauses.append("Project = ?")
        params.append(project.strip())

    if search and search.strip():
        s = f"%{search.strip()}%"
        where_clauses.append("(Unit_No LIKE ? OR Property_Type LIKE ? OR Status LIKE ?)")
        params.extend([s, s, s])

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    count_sql = f"SELECT COUNT(*) FROM units {where_sql}"
    cur.execute(count_sql, params)
    total = cur.fetchone()[0]

    offset = (page - 1) * per_page
    data_sql = f"SELECT * FROM units {where_sql} LIMIT ? OFFSET ?"
    cur.execute(data_sql, params + [per_page, offset])
    rows = [row_to_dict(r) for r in cur.fetchall()]
    conn.close()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": math.ceil(total / per_page) if total > 0 else 1,
        "data": rows,
    }


@app.get("/api/units/all")
def get_all_units():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM units")
        rows = [row_to_dict(r) for r in cur.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        return {"error": str(e), "data": []}


@app.get("/api/units/nsip")
def get_nsip_units():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM units WHERE Project LIKE '%NSIP%'")
        rows = [row_to_dict(r) for r in cur.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        return {"error": str(e), "data": []}


@app.get("/api/layout/nsip")
def get_nsip_layout_data():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM units WHERE Project LIKE '%NSIP%'")
        rows = [row_to_dict(r) for r in cur.fetchall()]
        conn.close()
        return {"success": True, "data": rows}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}


@app.get("/api/chart/projects")
def get_chart_data():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT Project FROM units WHERE Project != ''")
        projects = [r[0] for r in cur.fetchall()]
        result = []
        for proj in projects:
            cur.execute("SELECT COUNT(*) FROM units WHERE Project = ? AND SaleOrSubSale = 'Sale'", (proj,))
            sale = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM units WHERE Project = ? AND SaleOrSubSale = 'Sub-Sale'", (proj,))
            subsale = cur.fetchone()[0]
            result.append({
                "project": proj if proj else "Unknown",
                "sale": sale,
                "sub_sale": subsale,
            })
        conn.close()
        return result
    except Exception as e:
        return {"error": str(e), "data": []}


@app.get("/api/projects")
def get_projects():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT Project FROM units WHERE Project != '' ORDER BY Project")
        projects = [r[0] for r in cur.fetchall()]
        conn.close()
        return [{"label": p if p else "Unknown", "value": p} for p in projects]
    except Exception as e:
        return {"error": str(e), "data": []}


# ----- Media Gallery API -----
import os
import glob

# Explicit absolute path for Gallery
GALLERY_ROOT = "/home/sufian/dev/NCT_Stocks_Inventory/Gallery"

# All known projects (must always appear in gallery)
ALL_PROJECTS = [
    "GRAND ION MAJESTIC",
    "GRAND ION DELEMEN",
    "ION BELIAN GARDEN",
    "MAHKOTA KAMPAR",
    "N-CITY",
    "NSIP",
    "VORTEX BUSINESS PARK",
    "NCT INNOSPHERE",
    "SALAK PERDANA BUSINESS PARK",
]

def resolve_project_disk_name(canonical_name):
    """Map canonical project name to actual disk folder name."""
    project_dir = os.path.join(GALLERY_ROOT, canonical_name)
    if os.path.isdir(project_dir):
        return canonical_name
    # Try case-insensitive match
    if os.path.isdir(GALLERY_ROOT):
        for entry in os.listdir(GALLERY_ROOT):
            if entry.upper().strip() == canonical_name.upper().strip() and os.path.isdir(os.path.join(GALLERY_ROOT, entry)):
                return entry
    return canonical_name

def ensure_gallery_structure():
    """Ensure every project folder contains Project Photos and Site Photos subfolders."""
    try:
        for project in ALL_PROJECTS:
            disk_name = resolve_project_disk_name(project)
            project_dir = os.path.join(GALLERY_ROOT, disk_name)
            os.makedirs(os.path.join(project_dir, "Project Photos"), exist_ok=True)
            os.makedirs(os.path.join(project_dir, "Site Photos"), exist_ok=True)
    except Exception as e:
        print(f"Gallery structure creation error: {e}")

@app.get("/api/gallery/folders")
def get_gallery_folders():
    try:
        # Always return all projects regardless of whether they have images
        folders = []
        for name in ALL_PROJECTS:
            disk_name = resolve_project_disk_name(name)
            project_dir = os.path.join(GALLERY_ROOT, disk_name)
            if os.path.isdir(project_dir):
                # Ensure subfolders exist
                os.makedirs(os.path.join(project_dir, "Project Photos"), exist_ok=True)
                os.makedirs(os.path.join(project_dir, "Site Photos"), exist_ok=True)
                folders.append({"name": name.strip(), "path": disk_name.strip()})
            else:
                # Create missing folder structure on the fly
                os.makedirs(os.path.join(project_dir, "Project Photos"), exist_ok=True)
                os.makedirs(os.path.join(project_dir, "Site Photos"), exist_ok=True)
                folders.append({"name": name.strip(), "path": name.strip()})
        return folders
    except Exception as e:
        return {"error": str(e), "data": []}

@app.get("/api/gallery/images")
def get_gallery_images(path: str = Query(""), subfolder: str = Query("")):
    try:
        from urllib.parse import unquote
        decoded_path = unquote(path) if path else ""
        # Determine base project folder
        base_folder = os.path.join(GALLERY_ROOT, decoded_path) if decoded_path else GALLERY_ROOT

        if not os.path.isdir(base_folder):
            return []

        # Scan ONLY the requested subfolder; do NOT fall back to parent or other subfolders
        if subfolder and subfolder.strip():
            target_folder = os.path.join(base_folder, subfolder.strip())
            if not os.path.isdir(target_folder):
                return []
        else:
            # No subfolder requested: scan base_folder only (legacy behavior)
            target_folder = base_folder

        exts = ["*.png", "*.jpg", "*.jpeg", "*.webp"]
        images = []
        for ext in exts:
            images.extend(glob.glob(os.path.join(target_folder, ext)))
            images.extend(glob.glob(os.path.join(target_folder, ext.upper())))
        images = sorted(set(images))
        result = []
        for img in images:
            rel = os.path.relpath(img, GALLERY_ROOT)
            url = "/Gallery/" + rel.replace("\\", "/")
            result.append({
                "filename": os.path.basename(img),
                "url": url,
            })
        return result
    except Exception as e:
        print(f"Gallery images error: {e}")
        return {"error": str(e), "data": []}

@app.get("/")
def serve_index():
    return FileResponse("index.html")


if __name__ == "__main__":
    ensure_gallery_structure()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
