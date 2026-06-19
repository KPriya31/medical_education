"""CRUD for tbl_subject_master and tbl_course_subject_map (Subjects table)."""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import label_to_status, status_to_label

subjects_bp = Blueprint("subjects", __name__)


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


@subjects_bp.route("/api/courses/<int:course_id>/subjects", methods=["GET"])
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


@subjects_bp.route("/api/courses/<int:course_id>/subjects", methods=["POST"])
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


@subjects_bp.route("/api/subjects/<int:course_subject_id>", methods=["PUT"])
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


@subjects_bp.route("/api/subjects/<int:course_subject_id>", methods=["DELETE"])
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
