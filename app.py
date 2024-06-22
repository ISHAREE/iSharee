import hashlib
from flask import Flask, request, redirect, url_for, render_template, flash, session, make_response, jsonify, send_file, Response
import psycopg2
import time
import os
import uuid
import secrets
import random
import io
import string
import base64
import datetime
import pytz
import zipfile
from io import BytesIO
from datetime import datetime
import mimetypes
import re
import requests
from functools import wraps
from user_agents import parse
# from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.utils import secure_filename
from psycopg2.extensions import AsIs
from datetime import timedelta
from datetime import timedelta
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_mail import Mail, Message
from psycopg2 import OperationalError, DatabaseError, sql
from email.mime.multipart import MIMEMultipart
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)
# socketio = SocketIO(app)
# socketio = SocketIO(app, cors_allowed_origins="*")

# app.secret_key = os.urandom(24)
# app.config['SESSION_TYPE'] = 'filesystem'
# app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)
CORS(app, resources={r"/*": {"origins": "*"}})
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5501"}})

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = (
    os.environ.get('MAIL_DEFAULT_SENDER_NAME'),
    os.environ.get('MAIL_DEFAULT_SENDER_EMAIL')
)

app.config['CORS_HEADERS'] = 'Content-Type'
app.config['CORS_HEADERS'] = 'Access-Control-Allow-Origin'
app.config['CORS_HEADERS'] = 'Access-Control-Allow-Methods'
app.config['CORS_HEADERS'] = 'Access-Control-Allow-Headers'
app.config['CORS_HEADERS'] = 'Access-Control-Allow-Credentials'
app.config['CORS_HEADERS'] = 'Access-Control-Max-Age'
app.config['CORS_HEADERS'] = 'Access-Control-Expose-Headers'
app_link = 'https://www.pmgtech.tech'

mail = Mail(app)
bcrypt = Bcrypt(app)
MAX_TABLE_SIZE = 100 * 1024 * 1024
DATABASE_HOST = os.environ.get("DATABASE_HOST")
DATABASE_PORT = os.environ.get("DATABASE_PORT")
DATABASE_NAME = os.environ.get("DATABASE_NAME")
DATABASE_USER = os.environ.get("DATABASE_USER")
DATABASE_PASSWORD = os.environ.get("DATABASE_PASSWORD")
MAX_LOGIN_ATTEMPTS = 3
LOGIN_COOLDOWN = 60

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DATABASE_HOST,
            port=DATABASE_PORT,
            database=DATABASE_NAME,
            user=DATABASE_USER,
            password=DATABASE_PASSWORD
        )
        print("Database connection established.")
        return conn
    except OperationalError as e:
        print(f"Error connecting to the database: {e}")
        return None
    
def create_tables():
    conn = get_db_connection()
    if conn is None:
        return

    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute('''CREATE TABLE IF NOT EXISTS users_Data (
                                    user_id TEXT PRIMARY KEY,
                                    username TEXT UNIQUE,
                                    email TEXT UNIQUE,
                                    password TEXT,
                                    email_verified BOOLEAN DEFAULT FALSE,
                                    verification_code TEXT,
                                    reset_token TEXT,
                                    users_table TEXT,
                                    email_not BOOLEAN DEFAULT FALSE,
                                    push_not BOOLEAN DEFAULT FALSE,
                                    shdf_not BOOLEAN DEFAULT FALSE,
                                    del_not BOOLEAN DEFAULT FALSE,
                                    profile_picture BYTEA
                                )''')
                print("Table 'users_Data' created or already exists.")
                
                cursor.execute('''CREATE TABLE IF NOT EXISTS shared_files (
                                    id SERIAL PRIMARY KEY,
                                    user_id TEXT NOT NULL,
                                    file_id INTEGER NOT NULL,
                                    token VARCHAR(255) UNIQUE NOT NULL,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    expiration TIMESTAMP,
                                    used BOOLEAN DEFAULT FALSE,
                                    FOREIGN KEY (user_id) REFERENCES users_Data (user_id)
                               )''')
                print("Table 'shared_files' created or already exists.")

                cursor.execute('''CREATE TABLE IF NOT EXISTS user_devices (
                                    user_id TEXT,
                                    device_id TEXT,
                                    status TEXT,
                                    last_login TIMESTAMP,
                                    PRIMARY KEY (user_id, device_id)
                                    )''')
                print("Table 'user_devices' created or already exists.")

                cursor.execute('''CREATE TABLE IF NOT EXISTS notification_settings (
                                    user_id TEXT PRIMARY KEY,
                                    email_not BOOLEAN DEFAULT FALSE,
                                    push_not BOOLEAN DEFAULT FALSE,
                                    shdf_not BOOLEAN DEFAULT FALSE,
                                    del_not BOOLEAN DEFAULT FALSE,
                                    new_browser_sign_in_not BOOLEAN DEFAULT FALSE,
                                    FOREIGN KEY (user_id) REFERENCES users_Data(user_id)
                                    )''')

                print("Table 'notification_settings' created or already exists.")

                cursor.execute('''CREATE TABLE IF NOT EXISTS user_sessions (
                                    session_id TEXT PRIMARY KEY,
                                    user_id TEXT NOT NULL,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    expires_at TIMESTAMP,
                                    FOREIGN KEY (user_id) REFERENCES users_Data (user_id)
                               )''')
                print("Table 'user_sessions' created or already exists.")
                
                
                conn.commit()
                print("Tables creation committed.")
    except DatabaseError as e:
        print(f"Error creating tables: {e}")
    finally:
        conn.close()
        print("Database connection closed.")
create_tables()

@app.before_request
def require_login():
    allowed_routes = ['login', 'register', 'verification_code', 'verify_email','email_verification']
    if request.endpoint not in allowed_routes and 'username' not in session and not request.path.startswith('/static'):
        return redirect(url_for('login'))

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        session_id = request.cookies.get('session_id')
        if session_id:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute('SELECT user_id, expires_at FROM user_sessions WHERE session_id = %s', (session_id,))
                session = cursor.fetchone()
                
                if session and session[1] > datetime.utcnow():
                    cursor.execute('UPDATE user_sessions SET last_activity = %s WHERE session_id = %s', (datetime.utcnow(), session_id))
                    conn.commit()
                    conn.close()
                    return f(*args, **kwargs)
                
                conn.close()
        
        flash('You must be logged in to access this page.', 'error')
        response = make_response(redirect(url_for('login')))
        response.set_cookie('session_id', '', expires=0)  # Clear session cookie
        return response
    return decorated_function

# Helper Functions
def can_send_email_notification(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email_not FROM notification_settings WHERE user_id = %s", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result and result[0]

def can_send_push_notification(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT push_not FROM notification_settings WHERE user_id = %s", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result and result[0]

def can_send_shared_file_notification(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT shdf_not FROM notification_settings WHERE user_id = %s", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result and result[0]

def can_send_deleted_file_notification(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT del_not FROM notification_settings WHERE user_id = %s", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result and result[0]

def can_send_new_browser_sign_in_notification(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT new_browser_sign_in_not FROM notification_settings WHERE user_id = %s", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result and result[0]

# End of Helper Functions

def send_login_attempt_email(username, recipient_email, device_info, success):
    user = get_user_by_email(recipient_email)
    if not user:
        print(f"User not found for email {recipient_email}. Notification not sent.")
        return

    if not can_send_email_notification(user['user_id']):
        print(f"Email notifications disabled for {username}. Notification not sent.")
        return

    status = "successful" if success else "failed"
    reset_password_link = "https://www.pmgtech.tech/reset_password"
    customer_support_link = "https://www.pmgtech.tech/contact_support"
    login_link = "https://www.pmgtech.tech/login"
    message_body = f"""
        <html>
            <head>
                <style>
                    /* Inline CSS styles */
                    * {{
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }}
                    body {{
                        font-family: Arial, sans-serif;
                        font-size: 16px;
                        line-height: 1.6;
                        color: #333;
                    }}
                    .container {{
                        max-width: 680px;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ccc;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                        color: #000000;
                    }}

                    p{{
                    color: #000000;
                    }}

                    .container h2 {{
                        padding-bottom: 20px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        color: #000000;
                    }}

                    .dev-info {{
                        margin: 15px 0;
                        justify-content: center;
                        padding-right: 10px;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 0 10px;
                        background-color: #425e7c2d;
                        color: #001aff;
                        text-decoration: none;
                        border-radius: 5px;
                    }}

                    .btn-lnk {{
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }}

                    .btn-lnk a {{
                        text-decoration: none;
                        color: #001aff;
                        width: fit-content;
                        padding: 15px;
                        margin: 20px 0;
                        font-size: 20px;
                        font-weight: 500;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        border: none;
                        border-radius: 8px;
                        transition: 0.5s ease;
                    }}

                    .btn-lnk a:hover {{
                        background-color: #2e335d43;
                        transition: 0.5s ease;
                    }}

                    .no-r {{
                        padding: 20px 0;
                        color: #000000;
                    }}
                    </style>
            </head>
            <body>
        <div class="container">
            <h2>Did you login from a New Device or Location?</h2>
            <p>Dear {username},</p>
            <p>
                There was a {status} login attempt on your account from a new device:
            </p>
            <div class="dev-info">
                <p><strong>Device:</strong> {device_info['device']}</p>
                <p><strong>Browser:</strong> {device_info['browser']} {device_info['browser_version']}</p>
                <p><strong>Operating System:</strong> {device_info['os']} {device_info['os_version']}</p>
                <p><strong>IP Address:</strong> {device_info['ip_address']}</p>
                <p><strong>Location:</strong> {device_info['location']}</p>
                <p><strong>Time:</strong> {device_info['time']}</p>
            </div>
            <div class="btn-lnk">
                <a class="button" href="{login_link}">Visit your Account</a>
            </div>

            <p>
                If this was not you, please reset your password immediately by clicking
                <a class="button" href="{reset_password_link}">reset password</a> and
                contact customer support
                <a class="button" href="{customer_support_link}">customer support</a>.
            </p>
            <p class="no-r">This is an automated message. Please do not reply.</p>
        </div>
            </body>
        </html>
    """
    
    msg = Message(
        "Login Attempt Notification",
        recipients=[recipient_email],
        html=message_body
    )
    mail.send(msg)

def get_device_info(request):
    user_agent_string = request.headers.get('User-Agent', '')
    user_agent = parse(user_agent_string)
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    if ',' in ip_address:
        ip_address = ip_address.split(',')[0].strip()
    
    # Getting location info based on IP address
    try:
        response = requests.get(f'http://ip-api.com/json/{ip_address}')
        location_data = response.json()
        location = f"{location_data.get('city')}, {location_data.get('regionName')}, {location_data.get('country')}"
    except Exception as e:
        location = "Unknown location"
    
    device_info = {
        'device': user_agent.device.family,
        'browser': user_agent.browser.family,
        'browser_version': user_agent.browser.version_string,
        'os': user_agent.os.family,
        'os_version': user_agent.os.version_string,
        'ip_address': ip_address,
        'location': location,
        'time': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    }
    
    return device_info

def get_device_id(request):
    user_agent_string = request.headers.get('User-Agent', '')
    ip_address = request.remote_addr
    return hashlib.sha256((user_agent_string + ip_address).encode()).hexdigest()

def store_device_info(user_id, device_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Delete other devices logged in for this user
    cursor.execute("DELETE FROM user_devices WHERE user_id = %s AND device_id != %s", (user_id, device_id))

    # Store the current device info
    cursor.execute("""
        INSERT INTO user_devices (user_id, device_id, last_login) 
        VALUES (%s, %s, %s) 
        ON CONFLICT (user_id, device_id) 
        DO UPDATE SET last_login = EXCLUDED.last_login
    """, (user_id, device_id, datetime.now()))

    conn.commit()
    cursor.close()
    conn.close()

def is_device_recognized(user_id, device_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM user_devices WHERE user_id = %s AND device_id = %s", (user_id, device_id))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result is not None

def generate_verification_code():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=8))

def check_login_attempts(username):
    if 'login_attempts' not in session:
        session['login_attempts'] = {}

    if username in session['login_attempts']:
        attempts, last_attempt_time = session['login_attempts'][username]
        if time.time() - last_attempt_time < LOGIN_COOLDOWN:
            return attempts, last_attempt_time

    return 0, 0

def list_folder_contents(folder_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename FROM files WHERE parent_folder_id = %s", (folder_id,))
    files = cursor.fetchall()
    conn.close()
    return files

def check_file_ownership(file_id, files_table_name):
    print(files_table_name)
    if not files_table_name:
        return jsonify({"error": "User's files table not found"}), 400
    print(file_id)
    print(files_table_name)

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) FROM {files_table_name} WHERE id = %s", (file_id,))
            count = cursor.fetchone()[0]
    return count > 0

def get_user_timezone():
    # Check if the timezone is provided in the request headers
    user_timezone = request.headers.get('Timezone')
    
    # If the timezone is not provided in the header, you could default to a fallback timezone
    if not user_timezone:
        user_timezone = 'UTC'  # Default to UTC
    
    return user_timezone

def convert_to_user_timezone(timestamp, recipient_timezone):
    desired_timezone = pytz.timezone(recipient_timezone)
    # Convert string timestamp to datetime object
    dt_object = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
    # Convert to recipient's timezone
    dt_object = pytz.utc.localize(dt_object).astimezone(desired_timezone)
    # Format datetime as string
    formatted_time = dt_object.strftime("%Y-%m-%d %H:%M:%S")
    return formatted_time

def username_exists(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT EXISTS(SELECT 1 FROM users_Data WHERE username = %s)", (username,))
    result = cursor.fetchone()[0]
    conn.close()
    return result

def email_exists(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT EXISTS(SELECT 1 FROM users_Data WHERE email = %s)", (email,))
    result = cursor.fetchone()[0]
    conn.close()
    return result

def get_user_by_id(user_id):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users_Data WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            if user:
                return {
                    "user_id": user["user_id"],
                    "username": user["username"],
                    "email": user["email"],
                    "files_table": user["files_table"]
                }
    return None

def get_user_by_username(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users_Data WHERE username = %s", (username,))
    columns = [column[0] for column in cursor.description]
    user_data = cursor.fetchone()
    conn.close()
    return dict(zip(columns, user_data)) if user_data else None

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users_Data WHERE email = %s", (email,))
    columns = [column[0] for column in cursor.description]  # Extract column names
    user_data = cursor.fetchone()
    conn.close()
    return dict(zip(columns, user_data)) if user_data else None

def get_filename_by_id(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT filename FROM files WHERE id = %s", (file_id,))
    filename = cursor.fetchone()
    conn.close()
    return filename[0] if filename else None

def get_files_table_name(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT users_table FROM users_Data WHERE user_id = %s", (user_id,))
    files_table_name = cursor.fetchone()
    conn.close()
    return files_table_name[0] if files_table_name else None

def validate_username_and_email(username, email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users_Data WHERE username = %s", (username,))
    username_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM users_Data WHERE email = %s", (email,))
    email_count = cursor.fetchone()[0]
    conn.close()
    return username_count, email_count

def generate_random_id(length=8):
    characters = string.ascii_letters + string.digits
    random_id = ''.join(secrets.choice(characters) for _ in range(length))
    return random_id
random_id = generate_random_id()

# Login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'username' in session:
        return redirect(url_for('main'))

    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        device_info = get_device_info(request)
        device_id = get_device_id(request)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users_data WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if user:
            if user[4]:  # Assuming email_verified is the fifth column
                hashed_password = user[3]
                if bcrypt.check_password_hash(hashed_password, password):
                    session_id = str(uuid.uuid4())
                    expires_at = datetime.utcnow() + timedelta(hours=1)
                    
                    cursor.execute('''INSERT INTO user_sessions (session_id, user_id, expires_at)
                                      VALUES (%s, %s, %s)''', (session_id, user[0], expires_at))
                    conn.commit()

                    session.pop('login_attempts', None)
                    session['user_id'] = user[0]
                    session['username'] = username
                    session['users_table'] = user[7]

                    store_device_info(user[0], device_id)

                    flash('Logged in successfully.', 'login_success')
                    send_login_attempt_email(username, user[2], device_info, success=True)

                    response = make_response(redirect(url_for('main')))
                    response.set_cookie('session_id', session_id, max_age=3600, httponly=True, secure=True)
                    return response
                else:
                    attempts, last_attempt_time = check_login_attempts(username)
                    session['login_attempts'][username] = (attempts + 1, time.time())
                    if attempts + 1 >= MAX_LOGIN_ATTEMPTS:
                        remaining_time = max(0, LOGIN_COOLDOWN - (time.time() - last_attempt_time))
                        flash(f'You have reached the maximum number of login attempts. Please try again after {int(remaining_time)} seconds.', 'login_error')
                    else:
                        flash('Invalid username or password. Please try again.', 'login_error')

                    send_login_attempt_email(username, user[2], device_info, success=False)
                    return redirect(url_for('login'))
            else:
                flash('Please verify your email address before logging in.', 'login_error')
        else:
            flash('Invalid username or password. Please try again.', 'login_error')

    response = make_response(render_template('login.html'))
    response.headers['Cache-Control'] = 'no-store'
    return response

@app.route('/update_notifications', methods=['POST'])
def update_notifications():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'You are not logged in.'}), 401

    user_id = session['user_id']
    settings = request.json

    email_notifications = settings.get('emailNotifications', False)
    push_notifications = settings.get('pushNotifications', False)
    shared_files_notifications = settings.get('sharedFilesNotifications', False)
    deleted_files_notifications = settings.get('deletedFilesNotifications', False)
    new_browser_sign_in_notifications = settings.get('newBrowserSignInNotifications', False)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO notification_settings (user_id, email_not, push_not, shdf_not, del_not, new_browser_sign_in_not)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (user_id) 
        DO UPDATE SET email_not = EXCLUDED.email_not, push_not = EXCLUDED.push_not,
                      shdf_not = EXCLUDED.shdf_not, del_not = EXCLUDED.del_not,
                      new_browser_sign_in_not = EXCLUDED.new_browser_sign_in_not
    """, (user_id, email_notifications, push_notifications, shared_files_notifications, deleted_files_notifications, new_browser_sign_in_notifications))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Notification settings updated successfully.'})

@app.route('/get_notifications', methods=['GET'])
def get_notifications():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'You are not logged in.'}), 401

    user_id = session['user_id']

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT email_not, push_not, shdf_not, del_not, new_browser_sign_in_not 
        FROM notification_settings 
        WHERE user_id = %s
    """, (user_id,))
    settings = cursor.fetchone()
    conn.close()

    if settings:
        return jsonify({
            'success': True,
            'emailNotifications': settings[0],
            'pushNotifications': settings[1],
            'sharedFilesNotifications': settings[2],
            'deletedFilesNotifications': settings[3],
            'newBrowserSignInNotifications': settings[4]
        })
    else:
        return jsonify({'success': False, 'message': 'Settings not found.'}), 404

def send_login_attempt_notification(user_email, username):
    try:
        msg = Message(
            subject='Login Attempt Notification',
            sender=app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user_email],
            body=f'Dear {username},\n\nThere was a recent attempt to log into your account. If this was not you, please secure your account immediately.\n\nBest regards,\nYour Application Team'
        )
        mail.send(msg)
        print("Login attempt notification email sent successfully.")
    except Exception as e:
        print(f"Failed to send login attempt notification email: {e}")

def send_share_notification_email(recipient_email, sender_username, file_details):
    user = get_user_by_email(recipient_email)
    if not user:
        print(f"User not found for email {recipient_email}. Notification not sent.")
        return

    if not can_send_shared_file_notification(user['user_id']):
        print(f"Shared file notifications disabled for {user['username']}. Notification not sent.")
        return

    msg = Message('Files Shared with You', recipients=[recipient_email])
    app_url = app_link
    recipient_timezone = get_user_timezone()
    files_info_html = ''.join(f'''
    <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">{filename}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">{convert_to_user_timezone(date_sent, recipient_timezone)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">{file_size}</td>
    </tr>
    ''' for filename, date_sent, file_size in file_details)

    msg.html = f'''
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fff;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                }}
                .header {{
                    background-color: #007bff;
                    color: #fff;
                    padding: 10px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }}
                .c-p {{
                    font-size: 20px;
                    font-weight: 500;
                }}
                .content {{
                    padding: 20px;
                }}
                .table {{
                    width: 100%;
                    border-collapse: collapse;
                }}
                .table th {{
                    background-color: #007bff;
                    color: #fff;
                    padding: 8px;
                    border: 1px solid #ddd;
                }}
                .table td {{
                    padding: 8px;
                    border: 1px solid #ddd;
                }}
                .footer {{
                    padding: 10px;
                    text-align: center;
                    font-size: 12px;
                    color: #777;
                    border-top: 1px solid #ddd;
                    margin-top: 20px;
                }}
                .button {{
                    display: inline-block;
                    padding: 10px 20px;
                    font-size: 16px;
                    color: #fff;
                    background-color: #007bff;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                    text-align: center;
                }}
                .button:hover{{
                    background-color: #0069d9;
                    color: #fff;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Files Shared with You</h1>
                </div>
                <div class="content">
                    <p class="c-p">You have received files from {sender_username}</p>
                    <table class="table">
                        <tr>
                            <th>File Name</th>
                            <th>Date Sent</th>
                            <th>File Size</th>
                        </tr>
                        {files_info_html}
                    </table>
                    <p>Please click the link below to download the files:</p>
                    <p><a href="{app_url}" class="button">Visit the app</a></p>
                    <p>If you have any questions or concerns, please contact the sender.</p>
                </div>
                <div class="footer">
                    <p>Regards,<br>The iSharee Team</p>
                </div>
            </div>
        </body>
        </html>
        '''
    mail.send(msg)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users_data WHERE username = %s OR email = %s", (username, email))
        existing_user = cursor.fetchone()
        
        if existing_user:
            flash('Username or email already exists. Please choose another.', 'register_error')
            conn.close()
            return redirect(url_for('register'))
        
        # Generate a random table name using UUID
        files_table_name = f"UDB_{uuid.uuid4().hex}"
        print("user table name:\n", files_table_name)
        user_id = generate_random_id()
        print("user id:\n", user_id)
        

        cursor.execute(f'''CREATE TABLE IF NOT EXISTS {files_table_name} (
                            id SERIAL PRIMARY KEY,
                            filename TEXT,
                            is_folder INTEGER DEFAULT 0,
                            content BYTEA,
                            mimetype TEXT,
                            icon_data BYTEA,
                            parent_folder_id INTEGER,
                            shared_with TEXT,
                            FOREIGN KEY (parent_folder_id) REFERENCES {files_table_name}(id)
                        )''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS recently_added_files (
                            id SERIAL PRIMARY KEY,
                            filename TEXT,
                            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )''')
        conn.commit()

        # Hash the password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        print("Hashed password:\n", hashed_password)
        
        verification_code = generate_verification_code()
        print("Verification code:\n", verification_code)
        
        cursor.execute("INSERT INTO users_data (user_id, username, email, password, verification_code, users_table) VALUES (%s, %s, %s, %s, %s, %s)", 
                       (user_id, username, email, hashed_password, verification_code, files_table_name))
        conn.commit()

        # Print the inserted values
        cursor.execute("SELECT * FROM users_data WHERE user_id = %s", (user_id,))
        inserted_user = cursor.fetchone()
        print("Inserted user information:\n", inserted_user)

        conn.close()

        # Send verification email
        send_verification_email(email, verification_code)
        
        flash('Account created successfully. Please check your email for verification.', 'register_success')
        
        # Debug statement
        print("Redirecting to verification code page")
        
        return redirect(url_for('verification_code', email=email))

    return render_template('register.html')

def send_verification_email(email, verification_code):
    verification_link = url_for('verify_email', verification_code=verification_code, _external=True)
    print("Verification link:\n", verification_link)
    
    msg = Message('Email Verification - iSharee', recipients=[email])
    msg.html = f'''
    <html>
    <body>
        <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 600px;">
            <h2 style="color: #4CAF50;">Verify Your Email Address</h2>
            <p>Dear User,</p>
            <p>To verify your new email address, please click the link below:</p>
            <p style="text-align: center;">
                <a href="{verification_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
            </p>
            <p>If the button above does not work, you can also verify your email by clicking the following link:</p>
            <p><a href="{verification_link}">{verification_link}</a></p>
            <p>If you did not request this change, please ignore this email.</p>
            <p>Best regards,<br>The iSharee Team</p>
            <footer style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 0.8em; color: #555;">
                <p>iSharee Inc.</p>
                <p>1234 Sharing Lane, File City, FC 12345</p>
                <p><a href="https://www.isharee.com" style="color: #4CAF50;">www.isharee.com</a></p>
            </footer>
        </div>
    </body>
    </html>
    '''
    
    mail.send(msg)

@app.route('/verify_email/<verification_code>')
def verify_email(verification_code):
    conn = get_db_connection()
    cursor = conn.cursor()

    print(f"Verification code received:\n {verification_code}")

    # Check if there's a user with the provided verification code
    cursor.execute("SELECT * FROM users_data WHERE verification_code = %s", (verification_code,))
    user = cursor.fetchone()

    if user:
        print(f"User found: {user}")
        cursor.execute("UPDATE users_data SET email_verified = TRUE WHERE verification_code = %s", (verification_code,))
        conn.commit()
        conn.close()
        flash('Email verified successfully.', 'success')
        return redirect(url_for('email_verification'))
    else:
        print("Invalid verification code.")
        flash('Invalid verification code.', 'error')

    conn.close()
    return redirect(url_for('email_verification'))

def get_user_by_id(user_id):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users_Data WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            if user:
                return {
                    "user_id": user["user_id"],
                    "username": user["username"],
                    "email": user["email"],
                    "files_table": user["files_table"]
                }
    return None

def get_user_by_username(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users_Data WHERE username = %s", (username,))
    columns = [column[0] for column in cursor.description]
    user_data = cursor.fetchone()
    conn.close()
    return dict(zip(columns, user_data)) if user_data else None

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users_Data WHERE email = %s", (email,))
    columns = [column[0] for column in cursor.description]  # Extract column names
    user_data = cursor.fetchone()
    conn.close()
    return dict(zip(columns, user_data)) if user_data else None

@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if request.method == 'POST':
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']
        
        if new_password != confirm_password:
            flash('Passwords do not match. Please try again.', 'resetpassword_error')
            return redirect(url_for('reset_password', token=token))

        # Hash the new password
        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        
        # Update the password in the database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users_data SET password = %s, reset_token = NULL WHERE reset_token = %s", 
                       (hashed_password, token))
        conn.commit()
        conn.close()
        
        flash('Password has been reset successfully. You can now log in.', 'resetpassword_success')
        return redirect(url_for('login'))  # Redirect to the login page
    
    return render_template('reset_password.html', token=token)

@app.route('/profile')
def profile():
    if 'username' in session:
        username = session['username']
        user_data = get_user_by_username(username)
        if user_data:
            email = user_data['email']
            print(f"Fetched email: {email}")  # Debug print
            return render_template('iSharee.html', username=username, email=email)
        else:
            flash('User not found.', 'login_error')
            return redirect(url_for('login'))
    else:
        flash('You are not logged in.', 'login_error')
        return redirect(url_for('login'))

@app.route('/update_profile_picture', methods=['POST'])
def update_profile_picture():
    if 'username' not in session:
        return jsonify({'status': 'error', 'message': 'You are not logged in.'}), 400

    if 'profile_picture' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part.'}), 400

    file = request.files['profile_picture']

    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file.'}), 400

    if file:
        filename = secure_filename(file.filename)
        file_data = file.read()

        # Update the database with the file data
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users_Data SET profile_picture = %s WHERE username = %s", (file_data, session['username']))
        conn.commit()
        conn.close()

        return jsonify({'status': 'success', 'message': 'Profile picture updated successfully.'}), 200

    return jsonify({'status': 'error', 'message': 'File type not allowed.'}), 400

@app.route('/remove_profile_picture', methods=['POST'])
def remove_profile_picture():
    if 'username' not in session:
        return jsonify({'status': 'error', 'message': 'You are not logged in.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users_Data SET profile_picture = NULL WHERE username = %s", (session['username'],))
    conn.commit()
    conn.close()

    return jsonify({'status': 'success', 'message': 'Profile picture removed successfully.'}), 200

@app.route('/change_email', methods=['POST'])
def change_email():
    if 'username' in session:
        username = session['username']
        new_email = request.form['newEmail']
        
        # Check if email format is valid
        if not re.match(r"[^@]+@[^@]+\.[^@]+", new_email):
            return jsonify({'status': 'error', 'message': 'Invalid email address format.'}), 400

        # Check if the new email is already in use
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users_Data WHERE email = %s", (new_email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Email address is already in use.'}), 400

        # Update the email in the database and set email_verified to FALSE
        cursor.execute("UPDATE users_Data SET email = %s, email_verified = FALSE, verification_code = NULL WHERE username = %s", (new_email, username))
        
        # Generate new verification code
        verification_code = generate_verification_code()
        
        # Update the new verification code in the database
        cursor.execute("UPDATE users_Data SET verification_code = %s WHERE username = %s", (verification_code, username))
        
        conn.commit()
        conn.close()

        # Send verification email to the new email address
        send_verification_email(new_email, verification_code)
        
        return jsonify({'status': 'success', 'message': 'Email updated successfully. Please verify your new email address.'}), 200
    
    else:
        return jsonify({'status': 'error', 'message': 'You are not logged in.'}), 400

@app.route('/change_password', methods=['POST'])
def change_password():
    if 'username' not in session:
        return jsonify(success=False, message='You need to log in to change your password.')

    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    # Check if new passwords match
    if new_password != confirm_password:
        return jsonify(success=False, message='New passwords do not match. Please try again.')

    username = session['username']
    user = get_user_by_username(username)
    
    # Verify current password
    if not bcrypt.check_password_hash(user['password'], current_password):
        return jsonify(success=False, message='Current password is incorrect. Please try again.')
    
    # Hash the new password
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    
    # Update the password in the database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users_Data SET password = %s WHERE username = %s", (hashed_password, username))
    conn.commit()
    conn.close()
    
    return jsonify(success=True, message='Password has been changed successfully.')

@app.route('/change_username', methods=['POST'])
def change_username():
    if 'username' not in session:
        return jsonify({"success": False, "message": "You need to log in to change your username."}), 401
    
    data = request.get_json()
    new_username = data.get('new_username')
    
    if not new_username:
        return jsonify({"success": False, "message": "New username is required."}), 400
    
    username = session['username']
    user = get_user_by_username(username)
    
    if user:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users_Data SET username = %s WHERE username = %s", (new_username, username))
        conn.commit()
        conn.close()
        
        session['username'] = new_username
        return jsonify({"success": True, "message": "Username has been changed successfully."})
    else:
        return jsonify({"success": False, "message": "User not found."}), 404

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email']
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users_Data WHERE email = %s", (email,))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            reset_token = generate_verification_code()
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE users_Data SET reset_token = %s WHERE email = %s", (reset_token, email))
            conn.commit()
            conn.close()
            send_reset_email(email, reset_token)
            flash('Password reset link has been sent to your email.', 'forgotpassword_info')
            return redirect(url_for('reset_password', token=reset_token))  # Redirect to the reset password page
        else:
            flash('No account associated with this email address.', 'forgotpassword_error')
    
    return render_template('forgot_password.html')

def send_reset_email(email, reset_token):
    reset_link = url_for('reset_password', token=reset_token, _external=True)

    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container {{
                font-family: Arial, sans-serif;
                margin: 20px;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 10px;
                max-width: 600px;
                background-color: #f9f9f9;
            }}
            .header {{
                text-align: center;
                color: #333;
            }}
            .content {{
                margin-top: 20px;
            }}
            .button {{
                display: block;
                width: 200px;
                margin: 20px auto;
                padding: 10px;
                text-align: center;
                background-color: #007BFF;
                color: white;
                text-decoration: none;
                border-radius: 5px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2 class="header">Password Reset Request</h2>
            <p class="content">Hello,</p>
            <p class="content">We received a request to reset your password for your iSharee account. Click the button below to reset your password.</p>
            <a href="{reset_link}" class="button">Reset Password</a>
            <p class="content">If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
            <p class="content">Thank you,<br>The iSharee Team</p>
        </div>
    </body>
    </html>
    """

    # Create the email message
    msg = Message(subject='Password Reset Request',
                  recipients=[email])
    msg.body = f'Please click the following link to reset your password: {reset_link}'
    msg.html = html_body

    # Send the email
    mail.send(msg)

@app.route('/delete_account', methods=['POST'])
def delete_account():
    user_id = session.get('user_id')
    if user_id:
        delete_user_data(user_id)
        session.clear()
        flash('Your account has been deleted successfully.', 'success')
        return redirect(url_for('register'))
    else:
        flash('You need to be logged in to delete your account.', 'error')
        return redirect(url_for('login'))

##################################################

##################################################
def delete_user_data(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Delete from user_devices
        cursor.execute("DELETE FROM user_devices WHERE user_id = %s", (user_id,))

        # Delete from shared_files
        cursor.execute("DELETE FROM shared_files WHERE user_id = %s", (user_id,))

        # Get the user's table name
        cursor.execute("SELECT users_table FROM users_Data WHERE user_id = %s", (user_id,))
        user_table = cursor.fetchone()[0]

        # Drop the user's files table
        cursor.execute(sql.SQL("DROP TABLE IF EXISTS {}").format(sql.Identifier(user_table)))

        # Delete from users_Data
        cursor.execute("DELETE FROM users_Data WHERE user_id = %s", (user_id,))

        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error deleting user data: {e}")
    finally:
        cursor.close()
        conn.close()

########----operational logics------#############
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'username' not in session:
        return jsonify({"error": "User not logged in"}), 401

    files_table_name = session.get('users_table')
    if not files_table_name:
        return jsonify({"error": "User's files table not found"}), 400

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    files = request.files.getlist('file')
    if len(files) == 0:
        return jsonify({"error": "No files selected"}), 400

    total_uploaded_size = sum(file.content_length for file in files)
    if total_uploaded_size > MAX_TABLE_SIZE:
        return jsonify({"error": "Uploading files would exceed the maximum table size"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        for file in files:
            if file.filename == '':
                continue

            file_data = file.read()
            cursor.execute(f"INSERT INTO {files_table_name} (filename, content, mimetype) VALUES (%s, %s, %s) RETURNING id",
                           (file.filename, file_data, file.mimetype))
            file_id_record = cursor.fetchone()
            if file_id_record is None:
                return jsonify({"error": f"Failed to insert file '{file.filename}' into '{files_table_name}'"}), 500

            file_id = file_id_record[0]
            cursor.execute("INSERT INTO recently_added_files (filename) VALUES (%s)", (file.filename,))

        conn.commit()
        return jsonify({"message": "Files uploaded successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/save-image', methods=['POST'])
def save_image():
    if 'username' not in session:
        return jsonify({"error": "User not logged in"}), 401

    data = request.json
    image_data = data.get('image')
    filename = data.get('filename')
    action = data.get('action', 'copy')
    mimetype = data.get('mimetype', 'image/png')  # Default to 'image/png' if not provided

    if not image_data or not filename:
        return jsonify({"error": "Missing image data or filename"}), 400

    base64_image = image_data.split(",")[1]

    try:
        # Decode the image data
        image_bytes = base64.b64decode(base64_image)

        # Get the current user
        username = session['username']
        user_data = get_user_by_username(username)
        if not user_data:
            return jsonify({"error": "User not found"}), 404

        user_id = user_data['user_id']
        files_table_name = get_files_table_name(user_id)
        if not files_table_name:
            return jsonify({"error": "User's files table not found"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        if action == 'replace':
            cursor.execute(f'''
                UPDATE {files_table_name}
                SET content = %s, mimetype = %s
                WHERE filename = %s
            ''', (psycopg2.Binary(image_bytes), mimetype, filename))
            message = "Image replaced successfully!"
        else:
            cursor.execute(f'''
                INSERT INTO {files_table_name} (filename, content, mimetype)
                VALUES (%s, %s, %s)
                RETURNING id
            ''', (filename, psycopg2.Binary(image_bytes), mimetype))
            inserted_id = cursor.fetchone()[0]
            message = "Image saved as a copy successfully!"

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": message}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error occurred."}), 500



#######---------function to handle file----------#######
@app.route('/files/<int:file_id>')
def get_file(file_id):
    files_table_name = session.get('users_table')
    if not files_table_name:
        return jsonify({"error": "User's files table not found"}), 400

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT filename, content FROM {files_table_name} WHERE id = %s", (file_id,))
            file_data = cursor.fetchone()

    if file_data:
        filename, content = file_data
        return send_file(
            io.BytesIO(content),
            mimetype='application/octet-stream',
            as_attachment=True,
            download_name=filename
        )
    return jsonify({"error": "File not found"}), 404

#######---------function to handle file list----------#######
@app.route('/files')
def list_files():
    files_table_name = session.get('users_table')
    if not files_table_name:
        return jsonify({"error": "User's files table not found"}), 400

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT id, filename, is_folder, parent_folder_id, content, icon_data, mimetype FROM {files_table_name}")
            files = cursor.fetchall()

    folders = []
    files_list = []
    for file_id, filename, is_folder, parent_folder_id, content, icon_data, mimetype in files:
        icon_data_base64 = None
        file_type, _ = mimetypes.guess_type(filename)
        if file_type:
            # icon_data = get_file_icon(file_type)
            icon_data_base64 = base64.b64encode(icon_data).decode('utf-8') if icon_data else None
        if is_folder:
            folder_contents = list_folder_contents(file_id)
            folders.append({
                "id": file_id,
                "filename": filename,
                "is_folder": True,
                "icon_data": icon_data_base64,
                "contents": [{"id": file[0], "filename": file[1]} for file in folder_contents],
            })
        else:
            if file_type and (file_type.startswith('image/') or file_type.startswith('video/')):
                content_base64 = base64.b64encode(content).decode('utf-8')
                content_type = f'{file_type};base64'
            else:
                content_base64 = None
                content_type = url_for('serve_file_content', file_id=file_id)
            files_list.append({
                "id": file_id,
                "filename": filename,
                "is_folder": False,
                "icon_data": icon_data_base64,
                "content": content_base64,
                "content_type": content_type,
                # "download_link": download_link
            })

    return jsonify({"folders": folders, "files": files_list})

#######---------function to handle file----------#######
@app.route('/files/<int:file_id>/content')
def serve_file_content(file_id):
    files_table_name = session.get('users_table')
    if not files_table_name:
        return jsonify({"error": "User's files table not found"}), 400

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT content FROM {files_table_name} WHERE id = %s", (file_id,))
            content = cursor.fetchone()[0]

    response = Response(content, mimetype='application/octet-stream')
    response.headers['Content-Disposition'] = 'attachment; filename="file"'
    return response

#######---------function to handle file deletion----------#######
@app.route('/delete/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    files_table_name = session.get('users_table')
    if not files_table_name:
        return jsonify({"error": "User's files table not found"}), 400

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Check if the file exists
            cursor.execute(f"SELECT filename FROM {files_table_name} WHERE id = %s", (file_id,))
            file_data = cursor.fetchone()
            if not file_data:
                return jsonify({"error": "File not found"}), 404

            # Delete the file from the database
            cursor.execute(f"DELETE FROM {files_table_name} WHERE id = %s", (file_id,))
            conn.commit()

    # Return a success message
    return jsonify({"message": "File deleted successfully"}), 200

########------------download function-----------------##########
@app.route('/download/<int:file_id>')
def download_file(file_id):
    if not check_file_ownership(file_id, session.get('users_table')):
        return jsonify({"error": "You don't have permission to access this file"}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    files_table_name = session.get('users_table')
    cursor.execute(f"SELECT filename, content FROM {files_table_name} WHERE id = %s", (file_id,))
    file_data = cursor.fetchone()
    conn.close()
    
    if not file_data:
        return jsonify({"error": "File not found"}), 404
    
    filename, content = file_data
    response = make_response(content.tobytes())
    response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response

########----function to handle file rename-----########
@app.route('/rename', methods=['POST'])
def rename_file():
    try:
        data = request.json
        file_id = data.get('file_id')
        new_filename = data.get('new_filename')
        
        if not file_id or not new_filename:
            return jsonify({"error": "Missing file ID or new filename"}), 400
        
        files_table_name = session.get('users_table')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the file exists and user has permission
        cursor.execute(f"SELECT filename FROM {files_table_name} WHERE id = %s", (file_id,))
        file_data = cursor.fetchone()
        
        if not file_data:
            conn.close()
            return jsonify({"error": "File not found"}), 404
        
        # Rename the file
        cursor.execute(f"UPDATE {files_table_name} SET filename = %s WHERE id = %s", (new_filename, file_id))
        conn.commit()
        conn.close()
        
        return jsonify({"message": "File renamed successfully"}), 200
    except Exception as e:
        # Log the exception and return a JSON error response
        app.logger.error(f"Error renaming file: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
##########-----function to validate user email & username------##########
@app.route('/validate_user', methods=['POST'])
def validate_user():
    data = request.json
    recipient_identifier = data.get('recipient_identifier')
    recipient = get_user_by_username(recipient_identifier)
    if not recipient:
        recipient = get_user_by_email(recipient_identifier)
    return jsonify({"exists": recipient is not None})

@app.route('/share', methods=['POST'])
def share_file():
    data = request.json
    app.logger.debug(f'Received data: {data}')
    file_ids = data.get('file_ids')
    recipient_identifier = data.get('recipient_identifier')
    timezone_offset = data.get('timezone_offset', 0)  # Default to 0 if not provided

    if not (file_ids and recipient_identifier):
        app.logger.error(f'Missing file IDs or recipient identifier')
        return jsonify({"error": "Missing file IDs or recipient identifier"}), 400
    
    for file_id in file_ids:
        file_exists = check_file_ownership(file_id, session.get('users_table'))
        if not file_exists:
            return jsonify({"error": f"File with ID {file_id} not found or you don't have permission to share it"}), 404
    
    recipient = get_user_by_username(recipient_identifier)
    if not recipient:
        recipient = get_user_by_email(recipient_identifier)
    if not recipient:
        return jsonify({"error": "Recipient not found"}), 404

    for file_id in file_ids:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO %s (filename, content, shared_with) SELECT filename, content, %s FROM %s WHERE id = %s",
                       (AsIs(recipient['users_table']), recipient['user_id'], AsIs(session.get('users_table')), file_id))
        conn.commit()
        conn.close()

    sender_username = session.get('username')
    recipient_email = recipient['email']
    recipient_name = recipient.get('name', 'User')

    file_details = []
    for file_id in file_ids:
        filename = get_file_description(file_id, session.get('users_table'))
        date_sent = datetime.now(pytz.utc) + timedelta(hours=timezone_offset)  # Adjust date based on timezone offset
        date_sent_str = date_sent.strftime("%Y-%m-%d %H:%M:%S")
        file_size = format_file_size(get_file_size(file_id, session.get('users_table')))
        file_details.append((filename, date_sent_str, file_size))

    send_share_notification_email(recipient_email, sender_username, file_details)

    return jsonify({"message": "Files shared successfully"}), 200

@app.route('/generate_link', methods=['POST'])
def generate_link():
    if 'username' not in session:
        return jsonify({"error": "User not logged in"}), 401

    data = request.json
    file_ids = data.get('file_ids')

    if not file_ids or not isinstance(file_ids, list):
        return jsonify({"error": "No file IDs provided"}), 400

    files_table_name = session.get('users_table')
    if not files_table_name:
        return jsonify({"error": "User's files table not found"}), 400

    for file_id in file_ids:
        if not check_file_ownership(file_id, files_table_name):
            return jsonify({"error": f"File with ID {file_id} not found or you don't have permission to share it"}), 404

    token = secrets.token_urlsafe(16)
    expiration = datetime.now() + timedelta(hours=24)  # Link expires in 24 hours

    conn = get_db_connection()
    cursor = conn.cursor()
    for file_id in file_ids:
        cursor.execute("INSERT INTO shared_files (user_id, file_id, token, expiration, used) VALUES (%s, %s, %s, %s, %s)",
                       (session.get('user_id'), file_id, token, expiration, False))
    conn.commit()
    cursor.close()
    conn.close()

    shareable_link = url_for('access_shared_file', token=token, _external=True)
    print(shareable_link)  # Consider removing or securing this log
    return jsonify({"shareable_link": shareable_link})

@app.route('/shared/<token>', methods=['GET'])
def access_shared_file(token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_id, user_id, expiration, used FROM shared_files WHERE token = %s", (token,))
    records = cursor.fetchall()

    if not records:
        return jsonify({"error": "Invalid or expired link"}), 404

    expiration = records[0][2]
    used = records[0][3]

    if datetime.now() > expiration:
        return jsonify({"error": "Link has expired"}), 404

    if used:
        return jsonify({"error": "Link has already been used"}), 403

    file_ids = [record[0] for record in records]
    user_id = records[0][1]

    # Mark the token as used
    cursor.execute("UPDATE shared_files SET used = TRUE WHERE token = %s", (token,))
    conn.commit()

    # Get the user's table
    cursor.execute("SELECT users_table FROM users_data WHERE user_id = %s", (user_id,))
    user_record = cursor.fetchone()
    if not user_record:
        return jsonify({"error": "User not found"}), 404

    files_table_name = user_record[0]

    # Fetch all files
    files = []
    for file_id in file_ids:
        cursor.execute(f"SELECT filename, content FROM {files_table_name} WHERE id = %s", (file_id,))
        file_data = cursor.fetchone()
        if file_data:
            files.append(file_data)
    conn.close()

    # Assuming you want to zip multiple files for download
    if files:
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            for filename, content in files:
                zip_file.writestr(filename, content)
        zip_buffer.seek(0)

        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name='shared_files.zip'
        )

    return jsonify({"error": "Files not found"}), 404

def get_file_size(file_id, files_table_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT content FROM {files_table_name} WHERE id = %s", (file_id,))
        file_content = cursor.fetchone()[0]
        file_size = len(file_content) if file_content else 0
        return file_size
    except Exception as e:
        print(f"Error fetching file size: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def get_file_description(file_id, files_table_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT filename FROM {files_table_name} WHERE id = %s", (file_id,))
        filename = cursor.fetchone()[0]
        return filename
    except Exception as e:
        print(f"Error fetching file description: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def format_file_size(size):
    for unit in ['bytes', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024

####-----route definitions-----#######
# @app.route('/main')
# @app.route('/main/<path:path>')
# def main(path=None):
#     if 'username' in session:
#         username = session['username']
#         user_data = get_user_by_username(username)
#         if user_data:
#             email = user_data['email']
#             profile_picture = user_data['profile_picture']
#             if profile_picture:
#                 profile_picture = base64.b64encode(profile_picture).decode('utf-8')
#             return render_template('iSharee.html', username=username, email=email, profile_picture=profile_picture)
#         else:
#             flash('User not found.', 'login_error')
#             return redirect(url_for('login'))
#     else:
#         flash('You must be logged in to access this page.', 'error')
#         return redirect(url_for('login'))

@app.route('/main')
@app.route('/main/<path:path>')
@login_required
def main(path=None):

    session_id = request.cookies.get('session_id')
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute('SELECT user_id FROM user_sessions WHERE session_id = %s', (session_id,))
        session = cursor.fetchone()
        
        if session:
            cursor.execute('SELECT * FROM users_data WHERE user_id = %s', (session[0],))
            user_data = cursor.fetchone()
            conn.close()

            if user_data:
                email = user_data[2]
                profile_picture = user_data[-1]  # Assuming profile_picture is the last column
                if profile_picture:
                    profile_picture = base64.b64encode(profile_picture).decode('utf-8')
                return render_template('iSharee.html', username=user_data[1], email=email, profile_picture=profile_picture)
            else:
                flash('User not found.', 'login_error')
                return redirect(url_for('login'))
        else:
            flash('Invalid session.', 'login_error')
            return redirect(url_for('login'))


@app.route('/')
def index():
    print(session)
    return redirect(url_for('login'))

@app.route('/email_verified', methods=['GET'])
def email_verification():
    print("Email verification route accessed")
    return render_template('email_verified.html')

@app.route('/reset_password_success', methods=['GET'])
def reset_password_success():
    return render_template('reset_password_success.html')

@app.route('/verification_code')
def verification_code():
    email = request.args.get('email')
    return render_template('verification_code.html', email=email)

@app.route('/success', methods=['GET'])
def success():
    return render_template('message.html')

# @app.route('/logout')
# def logout():
#     # Clear the session data
#     session.pop('username', None)
#     session.pop('session', None)
#     flash('You have been logged out.', 'login_error')
#     return redirect(url_for('login'))

# @app.route('/logout')
# def logout():
#     # Clear cookies related to session
#     session.pop('username', None)
#     response = make_response(redirect(url_for('login')))
#     response.set_cookie('is_logged_in', '', expires=0)
#     
#     flash('You have been logged out.', 'success')
#     return response

# @app.route('/logout')
# def logout():
#     session_id = request.cookies.get('session_id', 'session')
#     session.pop('session', None)
#     response = make_response(redirect(url_for('login')))

#     if session_id:
#         conn = get_db_connection()
#         with conn.cursor() as cursor:
#             cursor.execute('''DELETE FROM user_sessions WHERE session_id = %s''', (session_id,))
#             conn.commit()
#         conn.close()
    
#     response = make_response(redirect(url_for('login')))
#     # Clear the session_id cookie by setting its expiry in the past
#     session.pop('session', None)
#     response.set_cookie('session', '', expires=0)
#     response.set_cookie('session_id', '', expires=0, path='/', domain=None, secure=None, httponly=False)
#     flash('You have been logged out.', 'success')
#     return response

@app.route('/logout', methods=['GET', 'POST'])
def logout():
    if request.method == 'POST':
        # Retrieve session_id from cookies
        session_id = request.cookies.get('session_id', 'session')
        session.pop('session', None)
        session.pop('session_id, None')
        response = make_response(redirect(url_for('login')))

        response.set_cookie('session', '', max_age=0)

        # Clear session data
        session.clear()

        # Delete session from database
        if session_id:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute('''DELETE FROM user_sessions WHERE session_id = %s''', (session_id,))
                conn.commit()
            conn.close()

        # Redirect to login page
        flash('You have been logged out.', 'success')
        return redirect(url_for('login'))
    else:
        # Handle GET request (optional, if needed)
        return redirect(url_for('login'))


if __name__ == '__main__':
    app.run(debug=True)