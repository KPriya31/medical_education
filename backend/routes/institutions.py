"""CRUD for tbl_inst_master (the Institutions table on the board dashboard)."""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import board_column, label_to_status, status_to_label

institutions_bp = Blueprint("institutions", __name__)


def _institution_row_to_dict(row):
    inst_id, inst_name, status_, region_desc = row
    return {
        "id": inst_id,
        "name": inst_name,
        "region": region_desc,
        "status": status_to_label(status_),
    }


@institutions_bp.route("/api/institutions", methods=["GET"])
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


@institutions_bp.route("/api/institutions", methods=["POST"])
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


@institutions_bp.route("/api/institutions/<int:institution_id>", methods=["PUT"])
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


@institutions_bp.route("/api/institutions/<int:institution_id>", methods=["DELETE"])
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
