from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from app import app
import json

mongo = PyMongo(app)

class Medecin:
    @staticmethod
    def create_indexes():
        mongo.db.medecins.create_index([("disponibilites.creneaux.date", 1)])
        mongo.db.medecins.create_index([("disponibilites.creneaux.heures.heure", 1)])

    @staticmethod
    def generate_default_slots(start_date, end_date):
        slots = []
        current_date = start_date
        while current_date <= end_date:
            if current_date.weekday() < 5:  # Lundi à Vendredi
                slots.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "heures": [
                        {"heure": f"{h}:00", "disponible": True, "patient_id": None, "patient_nom": None}
                        for h in range(8, 18) if h != 12  # 8h-18h sauf 12h
                    ]
                })
            current_date += timedelta(days=1)
        return slots

    @staticmethod
    def get_all():
        return list(mongo.db.medecins.find({}))

    @staticmethod
    def get_by_id(medecin_id):
        return mongo.db.medecins.find_one({"_id": ObjectId(medecin_id)})

    @staticmethod
    def reserver_creneau(medecin_id, date, heure, patient_info):
        return mongo.db.medecins.update_one(
            {
                "_id": ObjectId(medecin_id),
                "disponibilites.creneaux.date": date,
                "disponibilites.creneaux.heures.heure": heure,
                "disponibilites.creneaux.heures.disponible": True
            },
            {
                "$set": {
                    "disponibilites.creneaux.$[].heures.$[heure].disponible": False,
                    "disponibilites.creneaux.$[].heures.$[heure].patient_id": ObjectId(patient_info['id']),
                    "disponibilites.creneaux.$[].heures.$[heure].patient_nom": patient_info['nom']
                }
            },
            array_filters=[{"heure.heure": heure}]
        )