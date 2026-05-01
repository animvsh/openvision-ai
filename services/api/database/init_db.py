#!/usr/bin/env python3
"""Database initialization script for SecureOS."""

import os
import sys
from pathlib import Path

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def get_db_connection(db_name: str = "secureos"):
    """Create database connection using environment variables."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=db_name,
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def create_database_if_not_exists():
    """Create the database if it doesn't exist."""
    conn = get_db_connection("postgres")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    db_name = os.getenv("DB_NAME", "secureos")
    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
    if not cursor.fetchone():
        cursor.execute(f"CREATE DATABASE {db_name}")
        print(f"Created database: {db_name}")
    else:
        print(f"Database {db_name} already exists")

    cursor.close()
    conn.close()


def run_migration(schema_path: Path, seed: bool = False):
    """Run schema migration from SQL file."""
    conn = get_db_connection()
    cursor = conn.cursor()

    with open(schema_path / "schema.sql", "r") as f:
        schema_sql = f.read()
        cursor.execute(schema_sql)
        print("Schema migration completed")

    if seed:
        with open(schema_path / "seed.sql", "r") as f:
            seed_sql = f.read()
            cursor.execute(seed_sql)
            print("Seed data loaded")

    conn.commit()
    cursor.close()
    conn.close()


def drop_all_tables():
    """Drop all tables (for development/reset)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
    """)
    print("All tables dropped")

    conn.commit()
    cursor.close()
    conn.close()


def main():
    """Main entry point."""
    base_path = Path(__file__).parent

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "init":
            create_database_if_not_exists()
            run_migration(base_path, seed=True)
        elif command == "migrate":
            run_migration(base_path, seed=False)
        elif command == "reset":
            drop_all_tables()
            run_migration(base_path, seed=True)
        elif command == "seed-only":
            run_migration(base_path, seed=True)
        else:
            print(f"Unknown command: {command}")
            print("Usage: init_db.py [init|migrate|reset|seed-only]")
            sys.exit(1)
    else:
        print("Usage: init_db.py [init|migrate|reset|seed-only]")


if __name__ == "__main__":
    main()