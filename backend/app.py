import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from jinja2 import Template
from flask_sqlalchemy import SQLAlchemy
from models import db, User
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError
import sendgrid
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64

# Load env
load_dotenv()

app = Flask(__name__)

# Allow frontend origins
CORS(app, resources={r"/*": {
    "origins": [
        "http://localhost:3000",
        "https://pfs-fsbcologne2025.netlify.app"
    ],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# DB setup (SQLite for dev, can switch to Postgres on Render)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

# --- Helpers ---
def render_email_template(name):
    with open("templates/thank_you_email.html") as f:
        html = f.read()
    return Template(html).render(name=name)

def send_thank_you_email(email, name):
    try:
        sg = sendgrid.SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))

        html_content = render_email_template(name)

        message = Mail(
            from_email=os.getenv("FROM_EMAIL", "noreply@pfs-fsbcologne.com"),
            to_emails=email,
            subject="Thank you for visiting PFS @ FSB Cologne 2025",
            html_content=html_content,
        )

        response = sg.send(message)
        print("📧 SendGrid response:", response.status_code)
        return response.status_code == 202
    except Exception as e:
        print("❌ SendGrid error:", e)
        return False

# --- Routes ---
@app.route("/")
def home():
    return "Backend is running!"

@app.route("/api/submit", methods=["POST"])
def submit_form():
    data = request.get_json(force=True) or {}
    print("📥 Incoming submission:", data)   # DEBUG

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    country = data.get("country")
    pledge = bool(data.get("pledge", False))

    interested = ",".join(data.get("interested", []))
    looking_for = ",".join(data.get("lookingFor", []))

    print(f"📝 Parsed -> name={name}, email={email}, phone={phone}, "
          f"country={country}, pledge={pledge}, "
          f"interested={interested}, looking_for={looking_for}")  # DEBUG

    created = False
    email_ok = False

    try:
        existing = User.query.filter_by(email=email).first()
        if existing:
            print("🔄 Updating existing user with email:", email)
            existing.name = name or existing.name
            existing.phone = phone or existing.phone
            existing.country = country or existing.country
            existing.pledge = pledge
            existing.interested = interested or existing.interested
            existing.looking_for = looking_for or existing.looking_for
            db.session.commit()
            user = existing
        else:
            print("➕ Creating new user with email:", email)
            user = User(
                name=name,
                email=email,
                phone=phone,
                country=country,
                pledge=pledge,
                interested=interested,
                looking_for=looking_for,
            )
            db.session.add(user)
            db.session.commit()
            created = True

        # ✅ Always attempt to send email (new or update)
        email_ok = send_thank_you_email(email, name)
        print("📧 Email send attempted, success:", email_ok)

        print("✅ Submission handled successfully for:", email)
        return jsonify({
            "message": "Form processed",
            "created": created,
            "email_sent": email_ok
        }), 201 if created else 200

    except Exception as e:
        print("❌ Error in /api/submit:", str(e))  # DEBUG
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

# 2. Public pledges wall
@app.route("/api/pledges", methods=["GET"])
def pledges():
    users = User.query.filter_by(pledge=True).all()
    data = [{"name": u.name, "photo_url": u.photo_url} for u in users]
    return jsonify({
        "count": len(data),
        "pledges": data
    })


# 3. Admin stats (password protected)
# 3. Admin stats (password protected)
@app.route("/api/admin-stats", methods=["GET"])
def admin_stats():
    # Get token from header
    token = (request.headers.get("Authorization") or "").replace("Bearer ", "").strip()
    admin_password = os.getenv("ADMIN_PASSWORD", "secret123")

    print("🔑 Provided token:", token)          # DEBUG
    print("🔐 Expected password:", admin_password)  # DEBUG

    if token != admin_password:
        return jsonify({"error": "Unauthorized"}), 401

    users = User.query.all()
    data = []
    for u in users:
        data.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": getattr(u, "phone", None),
            "country": getattr(u, "country", None),
            "pledge": getattr(u, "pledge", False),
            "interested": (u.interested.split(",") if u.interested else []),
            "lookingFor": (u.looking_for.split(",") if u.looking_for else []),
        })
    return jsonify({
        "count": len(data),
        "pledges": data
    })

# --- EMAIL FUNCTION ---
def send_thank_you_email(to_email, name):
    import sendgrid
    from sendgrid.helpers.mail import Mail
    sg = sendgrid.SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))

    message = Mail(
        from_email="noreply@ess.com",
        to_emails=to_email,
        subject="Thank You for Joining the Green Sports Pledge!",
        html_content=f"<p>Hi {name},</p><p>Thank you for pledging to support green sports. See you at FSB Cologne!</p>"
    )
    try:
        sg.send(message)
    except Exception as e:
        print("Email send error:", e)

@app.route("/api/test-email", methods=["POST"])
def test_email():
    data = request.json or {}
    to = data.get("to")
    name = data.get("name", "Friend")
    ok = send_thank_you_email(to, name)
    return (jsonify({"ok": ok}), 200) if ok else (jsonify({"ok": ok}), 500)

def upload_branded_image_base64(photo_base64: str) -> str:
    folder = os.getenv("CLOUDINARY_UPLOAD_FOLDER", "ess/pledges")
    logo_id = os.getenv("CLOUDINARY_LOGO_PUBLIC_ID")
    transformations = [{"quality": "auto:good", "fetch_format": "auto"}]
    if logo_id:
        transformations.append({
            "overlay": logo_id,
            "gravity": "south_east",
            "width": 250, "opacity": 80, "x": 30, "y": 30, "crop": "scale"
        })
    res = cloudinary.uploader.upload(photo_base64, folder=folder, overwrite=True, transformation=transformations)
    return res.get("secure_url")

def _eager_overlay():
    logo_id = os.getenv("CLOUDINARY_LOGO_PUBLIC_ID")
    if not logo_id:
        return []
    return [{
        "overlay": {"public_id": logo_id, "resource_type": "image", "type": "upload"},
        "gravity": "south_east",
        "width": 250,
        "opacity": 80,
        "x": 30,
        "y": 30,
        "crop": "scale",
    }]

def _pick_url(res: dict) -> str | None:
    # try eager first (branded), then original
    if isinstance(res.get("eager"), list) and res["eager"]:
        first = res["eager"][0]
        return first.get("secure_url") or first.get("url")
    return res.get("secure_url") or res.get("url")

@app.route("/api/upload-photo", methods=["POST"])
def upload_photo():
    try:
        data = request.get_json(silent=True) or {}
        folder = os.getenv("CLOUDINARY_UPLOAD_FOLDER", "ess/pledges")
        eager = _eager_overlay()

        if data.get("photo_base64"):
            b64 = data["photo_base64"].split(",", 1)[-1]
            res = cloudinary.uploader.upload(
                b64,
                folder=folder,
                resource_type="image",
                eager=eager,
                overwrite=True,
            )
            app.logger.info("Cloudinary response (base64): %s", res)
            url = _pick_url(res)
            if not url:
                return jsonify({"error": "upload_failed", "details": "No URL in response", "res": res}), 500
            return jsonify({"url": url}), 201

        if "file" in request.files:
            res = cloudinary.uploader.upload(
                request.files["file"],
                folder=folder,
                resource_type="image",
                eager=eager,
                overwrite=True,
            )
            app.logger.info("Cloudinary response (file): %s", res)
            url = _pick_url(res)
            if not url:
                return jsonify({"error": "upload_failed", "details": "No URL in response", "res": res}), 500
            return jsonify({"url": url}), 201

        return jsonify({"error": "No photo provided"}), 400
    except Exception as e:
        app.logger.exception("Upload failed: %s", e)
        return jsonify({"error": "upload_failed", "details": str(e)}), 500
    
@app.route("/api/_cloudinary_debug")
def _cloudinary_debug():
    return jsonify({
        "cloud": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "has_key": bool(os.getenv("CLOUDINARY_API_KEY")),
        "has_secret": bool(os.getenv("CLOUDINARY_API_SECRET")),
        "folder": os.getenv("CLOUDINARY_UPLOAD_FOLDER"),
        "logo_id": os.getenv("CLOUDINARY_LOGO_PUBLIC_ID")
    })

def attach_file(message, path, filename):
    """Attach a local PDF file to the SendGrid email."""
    with open(path, "rb") as f:
        data = f.read()
        encoded = base64.b64encode(data).decode()
        attachment = Attachment(
            FileContent(encoded),
            FileName(filename),
            FileType("application/pdf"),
            Disposition("attachment")
        )
        message.add_attachment(attachment)

def send_thank_you_email(to_email, name, interested=None, looking_for=None):
    sg = sendgrid.SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))
    from_addr = os.getenv("SENDGRID_FROM")

    # Load and render HTML template
    with open("templates/thank_you_email.html", encoding="utf-8") as f:
        html_template = f.read()

    html_content = Template(html_template).render(
        name=name,
        interested=interested.split(",") if interested else [],
        looking_for=looking_for.split(",") if looking_for else []
    )

    message = Mail(
        from_email=from_addr,
        to_emails=to_email,
        subject="Thank You for Visiting PFS @ FSB Cologne 2025",
        html_content=html_content,
    )

    # Attach all six brochures from static/
    brochures = [
        ("static/POLSPAS CATALOGUE.pdf", "POLSPAS CATALOGUE.pdf"),
        ("static/PFS CATALOGUE.pdf", "PFS CATALOGUE.pdf"),
    ]

    for path, fname in brochures:
        attach_file(message, path, fname)

    try:
        resp = sg.send(message)
        app.logger.info(f"SendGrid status={resp.status_code}")
        return resp.status_code == 202
    except Exception as e:
        app.logger.exception(f"SendGrid error: {e}")
        return False

if __name__ == "__main__":
    app.run(debug=True)
