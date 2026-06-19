"""Flask API backing the Institutions / Courses / Subjects hierarchy on the
BOME / BOEN board dashboard. Everything else in the EMS frontend stays on
mock data - this API only covers tbl_inst_master, tbl_course_master,
tbl_subject_master and their mapping/lookup tables.
"""

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
import mysql.connector

load_dotenv()

from db import get_connection

app = Flask(__name__)
# Vite picks a different port if 5173 is busy, and may be reached via the
# machine's LAN IP instead of localhost - allow any localhost/127.0.0.1/private
# LAN address on any port for local dev, rather than hardcoding one origin.
# CORS(app, origins=[
#     r"^http://localhost(:\d+)?$",
#     r"^http://127\.0\.0\.1(:\d+)?$",
#     r"^http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$",
# ])
CORS(app)


def status_to_label(status_):
    return "Active" if status_ else "Inactive"


def label_to_status(label):
    return 1 if label == "Active" else 0


def board_column(board):
    """Maps a 'BOME'/'BOEN' board string to its status column name."""
    if board == "BOME":
        return "bome_status"
    if board == "BOEN":
        return "boen_status"
    raise ValueError("board must be 'BOME' or 'BOEN'")


# --------------------------------------------------------------------------
# Lookups
# --------------------------------------------------------------------------


@app.route("/api/regions", methods=["GET"])
def get_regions():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT region_id, region_desc FROM tbl_region_master WHERE status_ = 1"
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


@app.route("/api/years", methods=["GET"])
def get_years():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT year_id, year_desc FROM tbl_year_id WHERE status_ = 1")
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


@app.route("/api/exam-sems", methods=["GET"])
def get_exam_sems():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT sem_id, sem_desc FROM tbl_exam_sem_master WHERE status_ = 1"
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


@app.route("/api/courses", methods=["GET"])
def get_courses():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT course_id, course_desc FROM tbl_course_master WHERE status_ = 1"
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()

@app.route("/api/subjects", methods=["GET"])
def get_all_subjects():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT subject_id, subject_desc FROM tbl_subject_master WHERE status_ = 1"
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


# --------------------------------------------------------------------------
# Institutions
# --------------------------------------------------------------------------


def _institution_row_to_dict(row):
    inst_id, inst_name, status_, region_desc = row
    return {
        "id": inst_id,
        "name": inst_name,
        "region": region_desc,
        "status": status_to_label(status_),
    }


@app.route("/api/institutions", methods=["GET"])
def get_institutions():
    board = request.args.get("board")
    column = board_column(board)

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""
            SELECT i.inst_id, i.inst_name, i.status_, r.region_desc
            FROM tbl_inst_master i
            LEFT JOIN tbl_region_master r ON r.region_id = i.region_id
            WHERE i.{column} > 0
            """
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_institution_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@app.route("/api/institutions", methods=["POST"])
def create_institution():
    body = request.get_json(force=True) or {}
    name = body.get("name")
    region_id = body.get("region_id")
    board = body.get("board")
    status_label = body.get("status", "Active")
    column = board_column(board)
    status_ = label_to_status(status_label)

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(MAX(inst_id), 0) + 1 FROM tbl_inst_master")
        new_id = cursor.fetchone()[0]

        other_column = "boen_status" if column == "bome_status" else "bome_status"
        cursor.execute(
            f"""
            INSERT INTO tbl_inst_master
                (inst_id, inst_name, {column}, {other_column}, region_id,
                 created_by, created_date, status_)
            VALUES (%s, %s, 1, 0, %s, %s, NOW(), %s)
            """,
            (new_id, name, region_id, "system", status_),
        )
        conn.commit()

        cursor.execute(
            """
            SELECT i.inst_id, i.inst_name, i.status_, r.region_desc
            FROM tbl_inst_master i
            LEFT JOIN tbl_region_master r ON r.region_id = i.region_id
            WHERE i.inst_id = %s
            """,
            (new_id,),
        )
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_institution_row_to_dict(row)), 201
    finally:
        conn.close()


@app.route("/api/institutions/<int:institution_id>", methods=["PUT"])
def update_institution(institution_id):
    body = request.get_json(force=True) or {}
    name = body.get("name")
    region_id = body.get("region_id")
    status_ = label_to_status(body.get("status", "Active"))

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE tbl_inst_master
            SET inst_name = %s, region_id = %s, status_ = %s,
                updated_by = %s, updated_date = NOW()
            WHERE inst_id = %s
            """,
            (name, region_id, status_, "system", institution_id),
        )
        conn.commit()

        cursor.execute(
            """
            SELECT i.inst_id, i.inst_name, i.status_, r.region_desc
            FROM tbl_inst_master i
            LEFT JOIN tbl_region_master r ON r.region_id = i.region_id
            WHERE i.inst_id = %s
            """,
            (institution_id,),
        )
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_institution_row_to_dict(row))
    finally:
        conn.close()


@app.route("/api/institutions/<int:institution_id>", methods=["DELETE"])
def delete_institution(institution_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM tbl_inst_course_map WHERE inst_id = %s", (institution_id,)
        )
        cursor.execute(
            "DELETE FROM tbl_inst_master WHERE inst_id = %s", (institution_id,)
        )
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()


# --------------------------------------------------------------------------
# Courses
# --------------------------------------------------------------------------


def _course_row_to_dict(row):
    course_id, course_desc, status_ = row
    return {"id": course_id, "name": course_desc, "status": status_to_label(status_)}


@app.route("/api/institutions/<int:institution_id>/courses", methods=["GET"])
def get_courses_for_institution(institution_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT c.course_id, c.course_desc, c.status_
            FROM tbl_inst_course_map m
            JOIN tbl_course_master c ON c.course_id = m.course_id
            WHERE m.inst_id = %s
            """,
            (institution_id,),
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_course_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@app.route("/api/institutions/<int:institution_id>/courses", methods=["POST"])
def create_course_for_institution(institution_id):
    body = request.get_json(force=True) or {}
    name = body.get("name")
    status_ = label_to_status(body.get("status", "Active"))

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT bome_status, boen_status FROM tbl_inst_master WHERE inst_id = %s",
            (institution_id,),
        )
        inst_row = cursor.fetchone()
        if inst_row is None:
            cursor.close()
            return jsonify({"error": "institution not found"}), 404
        bome_status, boen_status = inst_row
        column = "bome_status" if bome_status and bome_status > 0 else "boen_status"
        other_column = "boen_status" if column == "bome_status" else "bome_status"

        cursor.execute("SELECT COALESCE(MAX(course_id), 0) + 1 FROM tbl_course_master")
        new_course_id = cursor.fetchone()[0]
        cursor.execute(
            f"""
            INSERT INTO tbl_course_master
                (course_id, course_desc, {column}, {other_column},
                 created_by, created_date, status_)
            VALUES (%s, %s, 1, 0, %s, NOW(), %s)
            """,
            (new_course_id, name, "system", status_),
        )

        cursor.execute(
            "SELECT COALESCE(MAX(inst_course_id), 0) + 1 FROM tbl_inst_course_map"
        )
        new_map_id = cursor.fetchone()[0]
        cursor.execute(
            """
            INSERT INTO tbl_inst_course_map
                (inst_course_id, inst_id, course_id, created_by, created_date, status_)
            VALUES (%s, %s, %s, %s, NOW(), 1)
            """,
            (new_map_id, institution_id, new_course_id, "system"),
        )
        conn.commit()

        cursor.execute(
            "SELECT course_id, course_desc, status_ FROM tbl_course_master WHERE course_id = %s",
            (new_course_id,),
        )
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_course_row_to_dict(row)), 201
    finally:
        conn.close()


@app.route("/api/courses/<int:course_id>", methods=["PUT"])
def update_course(course_id):
    body = request.get_json(force=True) or {}
    name = body.get("name")
    status_ = label_to_status(body.get("status", "Active"))

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE tbl_course_master
            SET course_desc = %s, status_ = %s, updated_by = %s, updated_date = NOW()
            WHERE course_id = %s
            """,
            (name, status_, "system", course_id),
        )
        conn.commit()

        cursor.execute(
            "SELECT course_id, course_desc, status_ FROM tbl_course_master WHERE course_id = %s",
            (course_id,),
        )
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_course_row_to_dict(row))
    finally:
        conn.close()


@app.route("/api/courses/<int:course_id>", methods=["DELETE"])
def delete_course(course_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM tbl_course_subject_map WHERE course_id = %s", (course_id,)
        )
        cursor.execute(
            "DELETE FROM tbl_inst_course_map WHERE course_id = %s", (course_id,)
        )
        cursor.execute("DELETE FROM tbl_course_master WHERE course_id = %s", (course_id,))
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()


# --------------------------------------------------------------------------
# Subjects
# --------------------------------------------------------------------------


def _subject_row_to_dict(row):
    course_subject_id, subject_desc, year_desc, sem_desc, priority_id, status_ = row
    return {
        "id": course_subject_id,
        "subject": subject_desc,
        "year": year_desc,
        "semester": sem_desc,
        "priority": priority_id,
        "status": status_to_label(status_),
    }


SUBJECT_SELECT_SQL = """
    SELECT m.course_subject_id, s.subject_desc, y.year_desc, e.sem_desc,
           m.priority_id, m.status_
    FROM tbl_course_subject_map m
    JOIN tbl_subject_master s ON s.subject_id = m.subject_id
    JOIN tbl_year_id y ON y.year_id = m.year_id
    JOIN tbl_exam_sem_master e ON e.sem_id = m.sem_id
"""


@app.route("/api/courses/<int:course_id>/subjects", methods=["GET"])
def get_subjects_for_course(course_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            SUBJECT_SELECT_SQL + " WHERE m.course_id = %s", (course_id,)
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_subject_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@app.route("/api/courses/<int:course_id>/subjects", methods=["POST"])
def create_subject_for_course(course_id):
    body = request.get_json(force=True) or {}
    subject = body.get("subject")
    year_id = body.get("year_id")
    sem_id = body.get("sem_id")
    priority = body.get("priority")
    status_ = label_to_status(body.get("status", "Active"))

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT bome_status, boen_status FROM tbl_course_master WHERE course_id = %s",
            (course_id,),
        )
        course_row = cursor.fetchone()
        if course_row is None:
            cursor.close()
            return jsonify({"error": "course not found"}), 404
        bome_status, boen_status = course_row
        column = "bome_status" if bome_status and bome_status > 0 else "boen_status"
        other_column = "boen_status" if column == "bome_status" else "bome_status"

        cursor.execute("SELECT COALESCE(MAX(subject_id), 0) + 1 FROM tbl_subject_master")
        new_subject_id = cursor.fetchone()[0]
        cursor.execute(
            f"""
            INSERT INTO tbl_subject_master
                (subject_id, subject_desc, {column}, {other_column},
                 created_by, created_date, status_)
            VALUES (%s, %s, 1, 0, %s, NOW(), %s)
            """,
            (new_subject_id, subject, "system", status_),
        )

        cursor.execute(
            "SELECT COALESCE(MAX(course_subject_id), 0) + 1 FROM tbl_course_subject_map"
        )
        new_map_id = cursor.fetchone()[0]
        cursor.execute(
            """
            INSERT INTO tbl_course_subject_map
                (course_subject_id, course_id, subject_id, year_id, sem_id,
                 priority_id, created_by, created_date, status_)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s)
            """,
            (new_map_id, course_id, new_subject_id, year_id, sem_id, priority, "system", status_),
        )
        conn.commit()

        cursor.execute(
            SUBJECT_SELECT_SQL + " WHERE m.course_subject_id = %s", (new_map_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_subject_row_to_dict(row)), 201
    finally:
        conn.close()


@app.route("/api/subjects/<int:course_subject_id>", methods=["PUT"])
def update_subject(course_subject_id):
    body = request.get_json(force=True) or {}
    subject = body.get("subject")
    year_id = body.get("year_id")
    sem_id = body.get("sem_id")
    priority = body.get("priority")
    status_ = label_to_status(body.get("status", "Active"))

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT subject_id FROM tbl_course_subject_map WHERE course_subject_id = %s",
            (course_subject_id,),
        )
        map_row = cursor.fetchone()
        if map_row is None:
            cursor.close()
            return jsonify({"error": "subject mapping not found"}), 404
        subject_id = map_row[0]

        cursor.execute(
            """
            UPDATE tbl_subject_master
            SET subject_desc = %s, updated_by = %s, updated_date = NOW()
            WHERE subject_id = %s
            """,
            (subject, "system", subject_id),
        )
        cursor.execute(
            """
            UPDATE tbl_course_subject_map
            SET year_id = %s, sem_id = %s, priority_id = %s, status_ = %s,
                updated_by = %s, updated_date = NOW()
            WHERE course_subject_id = %s
            """,
            (year_id, sem_id, priority, status_, "system", course_subject_id),
        )
        conn.commit()

        cursor.execute(
            SUBJECT_SELECT_SQL + " WHERE m.course_subject_id = %s", (course_subject_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_subject_row_to_dict(row))
    finally:
        conn.close()


@app.route("/api/subjects/<int:course_subject_id>", methods=["DELETE"])
def delete_subject(course_subject_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT subject_id FROM tbl_course_subject_map WHERE course_subject_id = %s",
            (course_subject_id,),
        )
        map_row = cursor.fetchone()
        subject_id = map_row[0] if map_row else None

        cursor.execute(
            "DELETE FROM tbl_course_subject_map WHERE course_subject_id = %s",
            (course_subject_id,),
        )
        if subject_id is not None:
            cursor.execute(
                "DELETE FROM tbl_subject_master WHERE subject_id = %s", (subject_id,)
            )
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()


# --------------------------------------------------------------------------
# Auth / department admins
# --------------------------------------------------------------------------


def _user_row_to_dict(row):
    return {"id": row[0], "username": row[1], "department": row[2], "role": row[3]}


@app.route("/api/login", methods=["POST"])
def login():
    body = request.get_json(force=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, username, department, role, password FROM users WHERE username = %s",
            (username,),
        )
        row = cursor.fetchone()
        cursor.close()
        if row is None or not row[4] or not check_password_hash(row[4], password):
            return jsonify({"error": "Invalid username or password"}), 401
        return jsonify(_user_row_to_dict(row[:4]))
    finally:
        conn.close()


@app.route("/api/users", methods=["GET"])
def list_department_admins():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, username, department, role FROM users WHERE role = %s ORDER BY id",
            ("department-admin",),
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_user_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@app.route("/api/users", methods=["POST"])
def create_department_admin():
    body = request.get_json(force=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    department = body.get("department") or ""
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (username, password, department, created_by, role)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (username, generate_password_hash(password), department, "superadmin", "department-admin"),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute(
            "SELECT id, username, department, role FROM users WHERE id = %s", (new_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_user_row_to_dict(row)), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409
    finally:
        conn.close()


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_department_admin(user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s AND role = %s", (user_id, "department-admin"))
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
