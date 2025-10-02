from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    company = db.Column(db.String(150))
    country = db.Column(db.String(100))
    pledge = db.Column(db.Boolean, default=False)
    sports = db.Column(db.String(300))  # comma-separated sports
    photo_url = db.Column(db.String(300))
