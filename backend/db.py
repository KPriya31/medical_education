"""MySQL connection helper.

Reads connection parameters from environment variables, falling back to
sensible local-dev defaults so the app works out of the box against a
freshly seeded `ems_dev` database.
"""

import os

import mysql.connector


def get_connection():
    """Returns a new mysql.connector connection using env-configured credentials."""
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", "3306")),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "nanda"),
        database=os.environ.get("DB_NAME", "ems_dev"),
    )
