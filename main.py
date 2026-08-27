"""
NCT Stocks & Inventory V3 — FastAPI Backend
Using MySQL via database.py → repository.py → services.py
"""
from fastapi import FastAPI, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import shutil

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


# ----- Auth -----
class LoginRequest(BaseModel):
    email: str
    password: str


class MfaVerifyRequest(BaseModel):
    temporary_token: str
    totp_code: str


class MfaSetupRequest(BaseModel):
    email: str
    secret: str


class MfaDisableRequest(BaseModel):
    email: str


class MfaVerifySetupRequest(BaseModel):
    email: str
    code: str


@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = svc.authenticate_user(req.email, req.password)
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "message": "Invalid credentials"})

    # Check if user has MFA enabled
    if svc.user_requires_mfa(req.email):
        # Create temporary token for MFA verification
        temp_token = svc.create_mfa_temp_token(req.email)
        return {
            "success": True,
            "requires_mfa": True,
            "temporary_token": temp_token,
            "user": req.email,
        }

    # No MFA - complete login normally
    return {
        "success": True,
        "token": "bypass-token-nct-v3",
        "user": req.email,
        "user_type": user.get("user_type"),
        "name": user.get("name"),
        "role": user.get("role"),
    }


@app.post("/api/auth/mfa/verify")
def mfa_verify(req: MfaVerifyRequest):
    """Verify MFA TOTP code after login."""
    # Validate temporary token
    email = svc.validate_mfa_temp_token(req.temporary_token)
    if not email:
        return JSONResponse(status_code=401, content={"success": False, "message": "Session expired. Please log in again."})

    # Verify TOTP code
    if svc.verify_mfa_for_user(email, req.totp_code):
        user = svc.get_user_profile(email)
        return {
            "success": True,
            "token": "bypass-token-nct-v3",
            "user": email,
            "user_type": user.get("user_type_raw") if user else None,
            "name": user.get("name") if user else None,
            "role": user.get("role") if user else None,
        }

    return JSONResponse(status_code=401, content={"success": False, "message": "Invalid verification code."})


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


class ChangePasswordRequest(BaseModel):
    email: str
    new_password: str


@app.post("/api/auth/change-password")
def change_password(req: ChangePasswordRequest):
    """Change user password. User must be authenticated via session."""
    if not req.email:
        return JSONResponse(status_code=400, content={"success": False, "message": "Email required"})
    
    # Validate new password requirements
    pw_errors = svc.validate_password(req.new_password)
    if pw_errors:
        return JSONResponse(status_code=400, content={"success": False, "message": pw_errors[0]})
    
    try:
        new_hash = svc.hash_password(req.new_password)
        success = svc.update_password(req.email, new_hash)
        if success:
            return {"success": True, "message": "Password updated successfully."}
        else:
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to update password."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


class VerifyPasswordRequest(BaseModel):
    email: str
    password: str


@app.post("/api/auth/verify-password")
def verify_password(req: VerifyPasswordRequest):
    """Verify current password for security page."""
    if not req.email or not req.password:
        return JSONResponse(status_code=400, content={"success": False, "message": "Email and password required"})
    
    try:
        user = svc.authenticate_user(req.email, req.password)
        if user:
            return {"success": True, "message": "Password verified."}
        else:
            return JSONResponse(status_code=400, content={"success": False, "message": "Current password is incorrect."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


class AdminResetPasswordRequest(BaseModel):
    email: str
    user_id: int
    new_password: str


@app.post("/api/admin/reset-password")
def admin_reset_password(req: AdminResetPasswordRequest):
    """Admin reset user password. nct_admin only."""
    if not req.email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(req.email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})
    
    # Validate password requirements
    pw_errors = svc.validate_password(req.new_password)
    if pw_errors:
        return JSONResponse(status_code=400, content={"success": False, "message": pw_errors[0]})
    
    try:
        new_hash = svc.hash_password(req.new_password)
        success = svc.update_password_by_id(req.user_id, new_hash)
        if success:
            return {"success": True, "message": "Password reset successfully."}
        else:
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to reset password."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


# ----- MFA Management endpoints -----
@app.get("/api/auth/mfa/status")
def mfa_status(email: str = Query("")):
    """Get MFA status for a user."""
    if not email:
        return JSONResponse(status_code=400, content={"error": "Email required"})
    status = svc.get_mfa_status(email)
    # Never expose the actual secret to the frontend
    return {
        "mfa_enabled": status["mfa_enabled"],
    }


@app.post("/api/auth/mfa/setup")
def mfa_setup(req: MfaSetupRequest):
    """Save MFA secret and enable MFA for a user."""
    svc.enable_mfa_for_user(req.email, req.secret)
    return {"success": True, "message": "MFA enabled successfully."}


@app.post("/api/auth/mfa/verify-setup")
def mfa_verify_setup(req: MfaVerifySetupRequest):
    """Verify TOTP code during MFA setup."""
    # Get the user's current MFA secret from DB
    mfa_data = svc.get_mfa_status(req.email)
    if not mfa_data or not mfa_data["mfa_secret"]:
        return JSONResponse(status_code=400, content={"success": False, "message": "MFA not set up yet."})
    
    if svc.verify_totp_code(mfa_data["mfa_secret"], req.code):
        return {"success": True, "message": "Verification successful."}
    
    return JSONResponse(status_code=400, content={"success": False, "message": "Invalid code. Please try again."})


@app.post("/api/auth/mfa/disable")
def mfa_disable(req: MfaDisableRequest):
    """Disable MFA for a user."""
    svc.disable_mfa_for_user(req.email)
    return {"success": True, "message": "MFA disabled successfully."}


@app.get("/api/auth/mfa/generate-secret")
def mfa_generate_secret(email: str = Query("")):
    """Generate a new MFA secret and return it with the TOTP URI."""
    if not email:
        return JSONResponse(status_code=400, content={"error": "Email required"})
    secret = svc.generate_mfa_secret()
    uri = svc.get_totp_uri(secret, email)
    return {
        "success": True,
        "secret": secret,
        "uri": uri,
    }


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


@app.get("/api/layout/ncity")
def get_ncity_layout_data():
    try:
        data = svc.get_units_by_project_like("%N-CITY%")
        return {"success": True, "data": data}
    except Exception as e:
        print(f"[main] /api/layout/ncity error: {e}")
        return {"success": False, "error": str(e), "data": []}


@app.get("/api/layout/ibe")
def get_ibe_layout_data():
    try:
        data = svc.get_units_by_project_like("%ION BELIAN GARDEN%")
        return {"success": True, "data": data}
    except Exception as e:
        print(f"[main] /api/layout/ibe error: {e}")
        return {"success": False, "error": str(e), "data": []}


@app.get("/api/layout/ibb")
def get_ibb_layout_data():
    try:
        data = svc.get_units_by_project_like("%ION BELIAN GARDEN%")
        return {"success": True, "data": data}
    except Exception as e:
        print(f"[main] /api/layout/ibb error: {e}")
        return {"success": False, "error": str(e), "data": []}


@app.get("/api/layout/mahkota")
def get_mahkota_layout_data():
    try:
        data = svc.get_units_by_project_like("%MAHKOTA KAMPAR%")
        return {"success": True, "data": data}
    except Exception as e:
        print(f"[main] /api/layout/mahkota error: {e}")
        return {"success": False, "error": str(e), "data": []}


@app.get("/api/chart/projects")
def get_chart_data():
    try:
        return svc.get_chart_data()
    except Exception as e:
        print(f"[main] /api/chart/projects error: {e}")
        return {"error": str(e), "data": []}


# ----- Data Management endpoints (nct_admin only) -----
class UpdateUnitRequest(BaseModel):
    email: str
    data: dict


class DeleteUnitRequest(BaseModel):
    email: str
    unit_id: int


class CreateUnitRequest(BaseModel):
    email: str
    data: dict


@app.get("/api/admin/units")
def admin_get_units(email: str = Query("")):
    """Get ALL units raw. nct_admin only."""
    if not email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})
    try:
        data = svc.get_all_units_raw()
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}


@app.put("/api/admin/units/{unit_id}")
def admin_update_unit(unit_id: int, req: UpdateUnitRequest):
    """Update a unit record. nct_admin only."""
    if not req.email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(req.email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})
    try:
        svc.update_unit(unit_id, req.data)
        return {"success": True, "message": "Record updated successfully."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/admin/units")
def admin_create_unit(req: CreateUnitRequest):
    """Create a new unit record. nct_admin only."""
    if not req.email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(req.email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})
    try:
        data = req.data or {}
        unit_no = (data.get("unit_no") or "").strip()
        status = (data.get("status") or "").strip()
        if not unit_no or not status:
            return JSONResponse(status_code=400, content={"success": False, "error": "unit_no and status are required."})
        svc.create_unit(data)
        return {"success": True, "message": "Record created successfully."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/admin/units/{unit_id}")
def admin_delete_unit(unit_id: int, req: DeleteUnitRequest):
    """Delete a unit record. nct_admin only."""
    if not req.email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(req.email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})
    try:
        svc.delete_unit(unit_id)
        return {"success": True, "message": "Record deleted successfully."}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ----- Data Upload endpoints (nct_admin only) -----
import data_upload as du
import tempfile
import os as _os_upload


def _check_admin(email: str):
    """Check if the given email belongs to an nct_admin user."""
    if not email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})
    return None


@app.get("/api/data-upload/etl-url")
def get_etl_url(email: str = Query("")):
    """Get the NCT IFCA ETL Pipeline System URL. nct_admin only."""
    auth_error = _check_admin(email)
    if auth_error:
        return auth_error
    return {"success": True, "url": du.ETL_SYSTEM_URL}


@app.post("/api/data-upload/validate-file")
async def validate_upload_file(
    email: str = Query(""),
    file: UploadFile = File(...),
):
    """Validate an uploaded clean Excel file. nct_admin only."""
    auth_error = _check_admin(email)
    if auth_error:
        return auth_error

    # Save uploaded file to temp
    suffix = _os_upload.path.splitext(file.filename or "")[1] or ".xlsx"
    tmp_path = _os_upload.path.join(tempfile.gettempdir(), f"nct_upload_{_os_upload.getpid()}_{suffix}")
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        result = du.read_excel_file(tmp_path)
        if not result["success"]:
            return {"success": False, "errors": result["errors"]}

        # Compare with database
        comparison = du.compare_with_database(result["data"])
        return {
            "success": True,
            "comparison": comparison,
            "filename": file.filename,
        }
    except Exception as e:
        print(f"[main] /api/data-upload/validate-file error: {e}")
        return {"success": False, "errors": [f"Validation failed: {str(e)}"]}
    finally:
        if _os_upload.path.exists(tmp_path):
            _os_upload.remove(tmp_path)


@app.post("/api/data-upload/confirm")
async def confirm_upload(
    email: str = Query(""),
    file: UploadFile = File(...),
):
    """Confirm and apply the clean data upload. nct_admin only."""
    auth_error = _check_admin(email)
    if auth_error:
        return auth_error

    # Save uploaded file to temp
    suffix = _os_upload.path.splitext(file.filename or "")[1] or ".xlsx"
    tmp_path = _os_upload.path.join(tempfile.gettempdir(), f"nct_confirm_{_os_upload.getpid()}_{suffix}")
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Validate first
        result = du.read_excel_file(tmp_path)
        if not result["success"]:
            return {"success": False, "errors": result["errors"]}

        # Apply clean data safely
        apply_result = du.apply_clean_data(result["data"])

        # Verify after upload
        verify_result = du.verify_upload()

        # Capture the upload date as the system-wide "Updated As Of" date.
        # This is ONLY called after the upload has been successfully applied.
        updated_as_of = du.set_updated_as_of()

        return {
            "success": True,
            "message": "Data uploaded successfully.",
            "summary": {
                "records_processed": apply_result["records_processed"],
                "new_units": apply_result["new_units"],
                "updated_units": apply_result["updated_units"],
                "status_changes": apply_result["status_changes"],
                "backup_table": apply_result["backup_table"],
            },
            "verification": verify_result,
            "updated_as_of": updated_as_of,
        }
    except Exception as e:
        print(f"[main] /api/data-upload/confirm error: {e}")
        return {"success": False, "errors": [f"Upload failed: {str(e)}"]}
    finally:
        if _os_upload.path.exists(tmp_path):
            _os_upload.remove(tmp_path)


# ----- User Management endpoints (nct_admin only) -----
class CreateUserRequest(BaseModel):
    admin_email: str
    email: str
    name: str
    user_type: str
    role: str
    mobile: str = ""
    password: str
    status: str = "active"
    mfa_enabled: int = 0
    mfa_secret: str = ""
    mfa_backup_codes: str = ""


class UpdateUserRequest(BaseModel):
    email: str
    data: dict


class DeleteUserRequest(BaseModel):
    email: str
    user_id: int


@app.get("/api/admin/users")
def admin_get_users(email: str = Query("")):
    """Get ALL users. nct_admin only."""
    if not email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})
    try:
        data = svc.get_all_users()
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}


@app.post("/api/admin/users")
def admin_create_user(req: CreateUserRequest):
    """Create a new user. nct_admin only."""
    if not req.admin_email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(req.admin_email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})

    # Validate the new user's password follows the same policy as reset/change.
    pw_errors = svc.validate_password(req.password)
    if pw_errors:
        return JSONResponse(status_code=400, content={"success": False, "error": pw_errors[0]})

    try:
        password_hash = svc.hash_password(req.password)
        data = {
            "name": req.name,
            "user_type": req.user_type,
            "role": req.role,
            "email": req.email,
            "mobile": req.mobile or None,
            "password_hash": password_hash,
            "status": req.status,
            "mfa_enabled": req.mfa_enabled,
            "mfa_secret": req.mfa_secret or None,
            "mfa_backup_codes": req.mfa_backup_codes or None,
        }
        svc.create_user(data)
        return {"success": True, "message": "User created successfully."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.put("/api/admin/users/{user_id}")
def admin_update_user(user_id: int, req: UpdateUserRequest):
    """Update a user. nct_admin only."""
    if not req.email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(req.email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})
    try:
        svc.update_user(user_id, req.data)
        return {"success": True, "message": "User updated successfully."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, req: DeleteUserRequest):
    """Delete a user. nct_admin only."""
    if not req.email:
        return JSONResponse(status_code=401, content={"success": False, "error": "Email required"})
    user = svc.get_user_by_email_raw(req.email)
    if not user or user.get("user_type") != "nct_admin":
        return JSONResponse(status_code=403, content={"success": False, "error": "Access denied"})
    try:
        svc.delete_user_by_id(user_id)
        return {"success": True, "message": "User deleted successfully."}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ----- User Management API aliases (/api/users) -----
@app.get("/api/users")
def api_users_get(email: str = Query("")):
    """Alias for /api/admin/users — list all users."""
    return admin_get_users(email)


@app.post("/api/users")
def api_users_create(req: CreateUserRequest):
    """Alias for /api/admin/users — create user."""
    return admin_create_user(req)


@app.put("/api/users/{user_id}")
def api_users_update(user_id: int, req: UpdateUserRequest):
    """Alias for /api/admin/users/{id} — update user."""
    return admin_update_user(user_id, req)


@app.delete("/api/users/{user_id}")
def api_users_delete(user_id: int, req: DeleteUserRequest):
    """Alias for /api/admin/users/{id} — delete user."""
    return admin_delete_user(user_id, req)


@app.get("/api/home/kpi")
def get_home_kpi():
    try:
        return svc.get_home_kpi()
    except Exception as e:
        print(f"[main] /api/home/kpi error: {e}")
        return {"error": str(e), "data": []}


@app.get("/api/system/updated-as-of")
def get_updated_as_of():
    """Get the system-wide Updated As Of date (last successful Clean Data upload)."""
    try:
        return {"success": True, "updated_as_of": du.get_updated_as_of()}
    except Exception as e:
        print(f"[main] /api/system/updated-as-of error: {e}")
        return {"success": False, "updated_as_of": "N/A"}


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