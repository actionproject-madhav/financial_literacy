#!/usr/bin/env python3
"""
Database management script for Flask-Migrate
"""
import os
from flask import Flask
from config.database import init_app, db
import models

# Create a minimal Flask app for database management
app = Flask(__name__)
init_app(app)

if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage: python manage_db.py [init|migrate|upgrade|downgrade]")
        print("  init     - Initialize migrations directory")
        print("  migrate  - Create a new migration")
        print("  upgrade  - Apply migrations to database")
        print("  downgrade - Revert migrations")
        sys.exit(1)

    command = sys.argv[1]

    with app.app_context():
        if command == 'init':
            from flask_migrate import init
            init()
            print("✓ Migrations directory initialized")

        elif command == 'migrate':
            from flask_migrate import migrate
            message = sys.argv[2] if len(sys.argv) > 2 else "Auto migration"
            migrate(message=message)
            print(f"✓ Migration created: {message}")

        elif command == 'upgrade':
            from flask_migrate import upgrade
            upgrade()
            print("✓ Database upgraded to latest migration")

        elif command == 'downgrade':
            from flask_migrate import downgrade
            downgrade()
            print("✓ Database downgraded by one migration")

        else:
            print(f"Unknown command: {command}")
            sys.exit(1)
