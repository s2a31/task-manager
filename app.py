import sqlite3
from datetime import datetime
from flask_session import Session
from flask import Flask, flash, redirect, render_template, request

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure session
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Connect to the SQLite database file tasks.db
def get_db_connection():
    conn = sqlite3.connect('tasks.db')
    # This enables column access by name: row['column_name']
    conn.row_factory = sqlite3.Row
    return conn


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/", methods=["GET", "POST"])
def index():
    try:
        conn = get_db_connection()
        if request.method == "POST":
            tname = request.form.get("tname")
            description = request.form.get("description")
            date = request.form.get("date")
            status = request.form.get("status")

            if not tname or not description or not date or not status:
                flash("All fields are required.")
                return redirect("/")

            conn.execute("INSERT INTO tasks (tname, description, date, status) VALUES (?, ?, ?, ?)",
                         (tname, description, date, status))
            conn.commit()

            return redirect("/")

        else:
            tasks = conn.execute("SELECT * FROM tasks").fetchall()
            return render_template("index.html", tasks=tasks)
    except sqlite3.DatabaseError as e:
        flash(f"Database error: {e}")
        return redirect("/")
    finally:
        conn.close()


@app.route("/update/<int:id>", methods=["GET", "POST"])
def update_task(id):
    conn = get_db_connection()
    try:
        if request.method == "POST":
            tname = request.form.get("tname")
            description = request.form.get("description")
            date = request.form.get("date")
            status = request.form.get("status")

            if not tname or not description or not date or not status:
                flash("All fields are required.")
                return redirect("/update/" + str(id))

            conn.execute("UPDATE tasks SET tname=?, description=?, date=?, status=? WHERE id=?",
                         (tname, description, date, status, id))
            conn.commit()
            return redirect("/")

        else:
            task = conn.execute(
                "SELECT * FROM tasks WHERE id=?", (id,)).fetchone()
            if task is None:
                flash("Task not found.")
                return redirect("/")
            return render_template("update.html", task=task)
    except sqlite3.DatabaseError as e:
        flash(f"Database error: {e}")
    finally:
        conn.close()
        return redirect("/")


if __name__ == '__main__':
    app.run(debug=True)
