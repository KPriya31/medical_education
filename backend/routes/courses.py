"""CRUD for tbl_course_master and tbl_inst_course_map (Courses table)."""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import label_to_status, status_to_label

courses_bp = Blueprint("courses", __name__)


def _course_row_to_dict(row):
    course_id, course_desc, status_ = row
    return {"id": course_id, "name": course_desc, "status": status_to_label(status_)}


@courses_bp.route("/api/institutions/<int:institution_id>/courses", methods=["GET"])
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


@courses_bp.route("/api/institutions/<int:institution_id>/courses", methods=["POST"])
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


@courses_bp.route("/api/courses/<int:course_id>", methods=["PUT"])
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


@courses_bp.route("/api/courses/<int:course_id>", methods=["DELETE"])
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
