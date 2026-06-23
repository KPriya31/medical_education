"""Login and department-admin user management."""

import mysql.connector
from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_connection

auth_bp = Blueprint("auth", __name__)


def _user_row_to_dict(row):
    return {"id": row[0], "username": row[1], "department": row[2], "role": row[3]}


@auth_bp.route("/api/login", methods=["POST"])
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


@auth_bp.route("/api/users", methods=["GET"])
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


@auth_bp.route("/api/users", methods=["POST"])
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


@auth_bp.route("/api/users/<int:user_id>", methods=["DELETE"])
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
