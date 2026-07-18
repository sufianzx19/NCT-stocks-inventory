"""
NCT Stocks & Inventory V3 — FastAPI Backend
Using MySQL via database.py → repository.py → services.py
"""
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import services as svc

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
_GALLERY_MOUNT_DIR = "/home/sufian/dev/NCT_Stocks_Inventory/PROJ INF"
app.mount("/Gallery", StaticFiles(directory=_GALLERY_MOUNT_DIR), name="gallery")


# ----- Auth bypass -----
class LoginRequest(BaseModel):
    email: str
    password: str


# Password hashing
@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = svc.authenticate_user(req.email, req.password)
    if user:
        return {
            "success": True,
            "token": "bypass-token-nct-v3",
            "user": req.email,
            "user_type": user.get("user_type"),
            "name": user.get("name"),
            "role": user.get("role"),
        }
    return JSONResponse(status_code=401, content={"success": False, "message": "Invalid credentials"})


@app.get("/api/auth/verify")
def verify(token: str = Query("")):
    if token == "bypass-token-nct-v3":
        return {"valid": True}
    return JSONResponse(status_code=401, content={"valid": False})


@app.get("/api/auth/me")
def get_current_user(email: str = Query("")):
    """Get current user profile information."""
    if not email:
        return JSONResponse(status_code=400, content={"error": "Email required"})
    user = svc.get_user_profile(email)
    if user:
        return user
    return JSONResponse(status_code=404, content={"error": "User not found"})


# ----- Data endpoints -----
@app.get("/api/units")
def get_units(
    project: str = Query(None),
    search: str = Query(None),
    status: str = Query(None),
    unit_type: str = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=200),
):
    try:
        return svc.get_units_paginated(
            project=project,
            search=search,
            status=status,
            unit_type=unit_type,
            page=page,
            per_page=per_page,
        )
    except Exception as e:
        print(f"[main] /api/units error: {e}")
        return {"total": 0, "page": page, "per_page": per_page, "total_pages": 1, "data": []}


# Alias for asset-list filter compatibility
@app.get("/api/assets")
def get_assets(
    project: str = Query(None),
    search: str = Query(None),
    status: str = Query(None),
    unit_type: str = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=200),
):
    try:
        return svc.get_units_paginated(
            project=project,
            search=search,
            status=status,
            unit_type=unit_type,
            page=page,
            per_page=per_page,
        )
    except Exception as e:
        print(f"[main] /api/assets error: {e}")
        return {"total": 0, "page": page, "per_page": per_page, "total_pages": 1, "data": []}


@app.get("/api/units/all")
def get_all_units():
    try:
        return svc.get_all_units()
    except Exception as e:
        print(f"[main] /api/units/all error: {e}")
        return {"error": str(e), "data": []}


@app.get("/api/units/nsip")
def get_nsip_units():
    try:
        return svc.get_units_by_project_like("%NCT SMART INDUSTRIAL PARK%")
    except Exception as e:
        print(f"[main] /api/units/nsip error: {e}")
        return {"error": str(e), "data": []}


@app.get("/api/layout/nsip")
def get_nsip_layout_data():
    try:
        data = svc.get_units_by_project_like("%NCT SMART INDUSTRIAL PARK%")
        return {"success": True, "data": data}
    except Exception as e:
        print(f"[main] /api/layout/nsip error: {e}")
        return {"success": False, "error": str(e), "data": []}


@app.get("/api/chart/projects")
def get_chart_data():
    try:
        return svc.get_chart_data()
    except Exception as e:
        print(f"[main] /api/chart/projects error: {e}")
        return {"error": str(e), "data": []}


@app.get("/api/home/kpi")
def get_home_kpi():
    try:
        return svc.get_home_kpi()
    except Exception as e:
        print(f"[main] /api/home/kpi error: {e}")
        return {"error": str(e), "data": []}


@app.get("/api/projects")
def get_projects():
    try:
        return svc.get_projects()
    except Exception as e:
        print(f"[main] /api/projects error: {e}")
        return {"error": str(e), "data": []}


# ----- Media Gallery API -----
import os as _os2
import glob

# Explicit absolute path for Gallery
GALLERY_ROOT = "/home/sufian/dev/NCT_Stocks_Inventory/PROJ INF"

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
    project_dir = _os2.path.join(GALLERY_ROOT, canonical_name)
    if _os2.path.isdir(project_dir):
        return canonical_name
    # Try case-insensitive match
    if _os2.path.isdir(GALLERY_ROOT):
        for entry in _os2.listdir(GALLERY_ROOT):
            if entry.upper().strip() == canonical_name.upper().strip() and _os2.path.isdir(_os2.path.join(GALLERY_ROOT, entry)):
                return entry
    return canonical_name

def ensure_gallery_structure():
    """Ensure every project folder contains Project Photos and Site Photos subfolders."""
    try:
        for project in ALL_PROJECTS:
            disk_name = resolve_project_disk_name(project)
            project_dir = _os2.path.join(GALLERY_ROOT, disk_name)
            _os2.makedirs(_os2.path.join(project_dir, "Project Photos"), exist_ok=True)
            _os2.makedirs(_os2.path.join(project_dir, "Site Photos"), exist_ok=True)
    except Exception as e:
        print(f"Gallery structure creation error: {e}")

@app.get("/api/gallery/folders")
def get_gallery_folders():
    try:
        folders = []
        for name in ALL_PROJECTS:
            disk_name = resolve_project_disk_name(name)
            project_dir = _os2.path.join(GALLERY_ROOT, disk_name)
            if _os2.path.isdir(project_dir):
                _os2.makedirs(_os2.path.join(project_dir, "Project Photos"), exist_ok=True)
                _os2.makedirs(_os2.path.join(project_dir, "Site Photos"), exist_ok=True)
                folders.append({"name": name.strip(), "path": disk_name.strip()})
            else:
                _os2.makedirs(_os2.path.join(project_dir, "Project Photos"), exist_ok=True)
                _os2.makedirs(_os2.path.join(project_dir, "Site Photos"), exist_ok=True)
                folders.append({"name": name.strip(), "path": name.strip()})
        return folders
    except Exception as e:
        return {"error": str(e), "data": []}

@app.get("/api/gallery/images")
def get_gallery_images(path: str = Query(""), subfolder: str = Query("")):
    try:
        from urllib.parse import unquote
        decoded_path = unquote(path) if path else ""
        base_folder = _os2.path.join(GALLERY_ROOT, decoded_path) if decoded_path else GALLERY_ROOT

        if not _os2.path.isdir(base_folder):
            return []

        if subfolder and subfolder.strip():
            target_folder = _os2.path.join(base_folder, subfolder.strip())
            if not _os2.path.isdir(target_folder):
                return []
        else:
            target_folder = base_folder

        exts = ["*.png", "*.jpg", "*.jpeg", "*.webp"]
        images = []
        for ext in exts:
            images.extend(glob.glob(_os2.path.join(target_folder, ext)))
            images.extend(glob.glob(_os2.path.join(target_folder, ext.upper())))
        images = sorted(set(images))
        result = []
        for img in images:
            rel = _os2.path.relpath(img, GALLERY_ROOT)
            url = "/Gallery/" + rel.replace("\\", "/")
            result.append({
                "filename": _os2.path.basename(img),
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