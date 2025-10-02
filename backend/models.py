from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(50))             # new
    country = db.Column(db.String(100))
    pledge = db.Column(db.Boolean, default=False)
    interested = db.Column(db.String(255))       # stores comma-separated values
    looking_for = db.Column(db.String(255))      # stores comma-separated values

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "country": self.country,
            "pledge": self.pledge,
            "interested": self.interested.split(",") if self.interested else [],
            "lookingFor": self.looking_for.split(",") if self.looking_for else []
        }
