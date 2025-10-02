import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from jinja2 import Template
from flask_sqlalchemy import SQLAlchemy
from models import db, User
from dotenv import load_dotenv
from cloudinary.utils import cloudinary_url
from sqlalchemy.exc import IntegrityError
import cloudinary, cloudinary.uploader
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

load_dotenv()

app = Flask(__name__)
CORS(app)

# DB setup (SQLite for dev, can switch to Postgres on Render)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

# --- ROUTES ---

def render_email_template(name):
    with open("templates/thank_you_email.html") as f:
        html = f.read()
    return Template(html).render(name=name)


@app.route("/")
def home():
    return "Backend is running!"

# --- add near your other helpers ---
def upload_b64_datauri(b64_or_datauri: str) -> str:
    # Ensure it's a data URI so Cloudinary treats it as base64 content
    datauri = b64_or_datauri if b64_or_datauri.startswith("data:") \
        else "data:image/png;base64," + b64_or_datauri

    res = cloudinary.uploader.upload(
        datauri,
        folder=os.getenv("CLOUDINARY_UPLOAD_FOLDER", "ess/pledges"),
        resource_type="image",
        eager=_eager_overlay(),
        overwrite=True,
    )
    el = res.get("eager")
    if isinstance(el, list) and el and el[0].get("status") == "failed":
        app.logger.warning("Overlay failed: %s", el[0].get("reason"))
    return _pick_url(res)


# --- SINGLE /api/submit route (replace your current one) ---
@app.route("/api/submit", methods=["POST"])
def submit_form():
    data = request.get_json(force=True) or {}

    name = data.get("name")
    email = data.get("email")
    company = data.get("company")
    country = data.get("country")
    pledge = bool(data.get("pledge", False))
    sports = ",".join(data.get("sports", []))

    # selfie handling
    photo_url = data.get("photo_url")
    if not photo_url and data.get("photo_base64"):
        try:
            photo_url = upload_b64_datauri(data["photo_base64"])
        except Exception as e:
            app.logger.exception("Photo upload during submit failed: %s", e)
            photo_url = None

    # upsert by email
    existing = User.query.filter_by(email=email).first()
    created = False
    if existing:
        # Update existing record
        existing.name = name or existing.name
        existing.company = company or existing.company
        existing.country = country or existing.country
        existing.pledge = pledge
        existing.sports = sports or existing.sports
        if photo_url:
            existing.photo_url = photo_url
        db.session.commit()
        email_ok = False  # avoid sending duplicate emails on updates
        user = existing
    else:
        # Create new record
        user = User(
            name=name, email=email, company=company, country=country,
            pledge=pledge, sports=sports, photo_url=photo_url
        )
        db.session.add(user)
        try:
            db.session.commit()
            created = True
        except IntegrityError:
            db.session.rollback()
            # race-condition fallback: update instead
            user = User.query.filter_by(email=email).first()
            if user:
                user.name = name or user.name
                user.company = company or user.company
                user.country = country or user.country
                user.pledge = pledge
                user.sports = sports or user.sports
                if photo_url:
                    user.photo_url = photo_url
                db.session.commit()
            created = False
        email_ok = send_thank_you_email(email, name) if created else False

    return jsonify({
        "message": "Form processed",
        "created": created,
        "email_sent": email_ok,
        "photo_url": user.photo_url
    }), 201 if created else 200

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
@app.route("/api/admin-stats", methods=["GET"])
def admin_stats():
    auth = request.headers.get("Authorization")
    admin_password = os.getenv("ADMIN_PASSWORD", "secret123")

    if auth != f"Bearer {admin_password}":
        return jsonify({"error": "Unauthorized"}), 401

    users = User.query.all()
    data = []
    for u in users:
        data.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "company": u.company,
            "country": u.country,
            "pledge": u.pledge,
            "sports": u.sports,
            "photo_url": u.photo_url
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

def send_thank_you_email(to_email, name):
    import os, sendgrid
    from sendgrid.helpers.mail import Mail
    from jinja2 import Template

    sg = sendgrid.SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))
    from_addr = os.getenv("SENDGRID_FROM")

    # Load and render external HTML template
    try:
        with open("templates/thank_you_email.html", encoding="utf-8") as f:
            html_template = f.read()
        html_content = Template(html_template).render(name=name)
    except Exception as e:
        app.logger.exception(f"Template load error: {e}")
        # fallback simple message if template fails
        html_content = f"""
            <h2>Hi {name},</h2>
            <p>Thank you for pledging to support green sports at <b>FSB Cologne</b>.</p>
            <p>– The ESS Team</p>
        """

    message = Mail(
        from_email=from_addr,
        to_emails=to_email,
        subject="Thank You for Joining the Green Sports Pledge!",
        html_content=html_content,
    )

    try:
        resp = sg.send(message)
        app.logger.info(f"SendGrid status={resp.status_code}")
        return resp.status_code == 202
    except Exception as e:
        app.logger.exception(f"SendGrid error: {e}")
        return False

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

if __name__ == "__main__":
    app.run(debug=True)
