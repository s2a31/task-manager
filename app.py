from flask import Flask, flash, jsonify, redirect, render_template, request, session
from flask_session import Session
from flask_bcrypt import Bcrypt
import sqlite3

# Configure Flask application
app = Flask(__name__)

# Initialize Flask-Bcrypt for password hashing
bcrypt = Bcrypt(app)

# Configure session to use the filesystem instead of signed cookies
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Function to connect to the SQLite database
def get_db_connection():
    conn = sqlite3.connect('tasks.db')
    conn.row_factory = sqlite3.Row
    return conn

# Function to add headers to responses to prevent caching
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Route for the main page
@app.route("/", methods=["GET", "POST"])
def index():
    # Redirect to login if user is not logged in
    if not session.get("user_id"):
        return redirect("/login")

    conn = get_db_connection()
    try:
        if request.method == "POST":
            # Retrieve form data for new task
            tname = request.form.get("tname")
            description = request.form.get("description")
            date = request.form.get("date")
            status = request.form.get("status")

            # Check if all form fields are filled
            if not tname or not description or not date or not status:
                flash("All fields are required.")
                return redirect("/")

            # Check if status is valid
            valid_statuses = ['Pending', 'In Progress', 'Completed']
            if status not in valid_statuses:
                flash("Invalid status.")
                return redirect("/")

            # Insert new task into the database
            conn.execute("INSERT INTO tasks (user_id, tname, description, date, status) VALUES (?, ?, ?, ?, ?)",
                         (session['user_id'], tname, description, date, status))
            conn.commit()
            return redirect("/")
        else:
            is_main_route = True
            # Fetch username for the logged-in user
            user = conn.execute("SELECT username FROM users WHERE id = ?", (session['user_id'],)).fetchone()
            username = user['username'] if user else 'Unknown User'
            # Fetch tasks for the logged-in user
            tasks = conn.execute("SELECT * FROM tasks WHERE user_id = ? ORDER BY CASE status WHEN 'Pending' THEN 1 WHEN 'In Progress' THEN 2 WHEN 'Completed' THEN 3 END", (session['user_id'],)).fetchall()

            return render_template("index.html", tasks=tasks, username=username, is_main_route=is_main_route)
    except sqlite3.DatabaseError as e:
        flash(f"Database error: {e}")
        return redirect("/")
    finally:
        conn.close()

# Route for user registration
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # Retrieve registration form data
        username = request.form.get("username")
        password = request.form.get("password")

        # Hash the user's password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        conn = get_db_connection()
        # Check if the username already exists
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if user:
            flash("Username already taken. Please choose another one.")
            return redirect("/register")

        # Insert new user into the database
        conn.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        conn.close()
        return redirect("/login")
    return render_template("register.html")

# Route for user login
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # Retrieve login form data
        username = request.form.get("username")
        password = request.form.get("password")

        conn = get_db_connection()
        # Fetch the user record from the database
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        conn.close()
        # Check password and set session if valid
        if user and bcrypt.check_password_hash(user['password'], password):
            session["user_id"] = user['id']
            return redirect("/")
        else:
            flash("Invalid username or password")
    return render_template("login.html")

# Route for user logout
@app.route("/logout")
def logout():
    # Clear the user session
    session.clear()
    return redirect("/login")

# Route to update an existing task
@app.route("/update/<int:id>", methods=["GET", "POST"])
def update_task(id):
    if not session.get("user_id"):
        return redirect("/login")

    conn = get_db_connection()
    try:
        if request.method == "POST":
            # Retrieve form data for task update
            tname = request.form.get("tname")
            description = request.form.get("description")
            date = request.form.get("date")
            status = request.form.get("status")

            if not tname or not description or not date or not status:
                flash("All fields are required.")
                return redirect(f"/update/{id}")

            # Update task in the database
            conn.execute("UPDATE tasks SET tname=?, description=?, date=?, status=? WHERE id=? AND user_id=?",
                         (tname, description, date, status, id, session['user_id']))
            conn.commit()
            return redirect("/")
        else:
            is_update_route = True
            # Fetch task details for the given task ID
            task = conn.execute("SELECT * FROM tasks WHERE id=? AND user_id=?", (id, session['user_id'])).fetchone()
            if task is None:
                flash("Task not found or you do not have permission to edit this task.")
                return redirect("/")
            return render_template("update.html", task=task, username=username, is_update_route=is_update_route)
    except sqlite3.DatabaseError as e:
        flash(f"Database error: {e}")
    finally:
        conn.close()
    return redirect("/")

@app.route("/update_task_status", methods=["POST"])
def update_task_status():
    data = request.get_json()
    task_id = data['id']
    new_status = data['status']

    conn = get_db_connection()
    try:
        conn.execute("UPDATE tasks SET status = ? WHERE id = ?", (new_status, task_id))
        conn.commit()
    except sqlite3.DatabaseError as e:
        flash(f"Database error: {e}")
        return jsonify({"status": "error"})
    finally:
        conn.close()
    return jsonify({"status": "success"})

@app.route("/delete/<int:id>", methods=["POST"])
def delete_task(id):
    if not session.get("user_id"):
        return jsonify({"status": "error", "message": "User not logged in"}), 401

    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM tasks WHERE id=? AND user_id=?", (id, session['user_id']))
        conn.commit()
    except sqlite3.DatabaseError as e:
        flash(f"Database error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()
    return jsonify({"status": "success", "message": "Task deleted"})

@app.route("/delete_all_tasks", methods=["POST"])
def delete_all_tasks():
    if not session.get("user_id"):
        return jsonify({"status": "error", "message": "User not logged in"}), 401

    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM tasks WHERE user_id = ?", (session['user_id'],))
        conn.commit()
    except sqlite3.DatabaseError as e:
        conn.close()
        return jsonify({"status": "error", "message": str(e)}), 500

    conn.close()
    return jsonify({"status": "success", "message": "All tasks deleted"})

@app.route("/delete_account", methods=["POST"])
def delete_account():
    if not session.get("user_id"):
        return jsonify({"status": "error", "message": "User not logged in"}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    try:
        # Delete user's tasks
        conn.execute("DELETE FROM tasks WHERE user_id = ?", (user_id,))
        # Delete user account
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
    except sqlite3.DatabaseError as e:
        conn.close()
        return jsonify({"status": "error", "message": str(e)}), 500

    conn.close()
    session.clear()
    return jsonify({"status": "success", "message": "Account deleted"})

@app.route("/about")
def about():
    is_about_route = True
    conn = get_db_connection()
    # Retrieve the username of the logged-in user
    user = conn.execute("SELECT username FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    username = user['username'] if user else 'Unknown User'
    return render_template("about.html", username=username, is_about_route=is_about_route)