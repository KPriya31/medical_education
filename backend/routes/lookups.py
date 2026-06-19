"""Read-only lookup tables (regions, years, exam sems, course/subject masters)."""

from flask import Blueprint, jsonify

from db import get_connection

lookups_bp = Blueprint("lookups", __name__)


@lookups_bp.route("/api/regions", methods=["GET"])
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


@lookups_bp.route("/api/years", methods=["GET"])
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


@lookups_bp.route("/api/exam-sems", methods=["GET"])
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


@lookups_bp.route("/api/courses", methods=["GET"])
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


@lookups_bp.route("/api/subjects", methods=["GET"])
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
