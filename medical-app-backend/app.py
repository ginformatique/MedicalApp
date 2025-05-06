from bson import ObjectId
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from datetime import datetime
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import re
import uuid
import json 

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config["MONGO_URI"] = "mongodb://localhost:27017/medical_db"
mongo = PyMongo(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'}

def parse_json(data):
    if isinstance(data, list):
        return [parse_json(item) for item in data]
    if data and '_id' in data:
        data['_id'] = str(data['_id'])
    return data

def validate_time_format(time_str):
    return bool(re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$', time_str))

def validate_date_format(date_str):
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def generate_rendezvous_id():
    last_appointment = mongo.db.rendezvous.find_one(sort=[("_id", -1)])
    if last_appointment and last_appointment['_id'].startswith('resv'):
        last_num = int(last_appointment['_id'][4:])
        return f"resv{last_num + 1:03d}"
    return "resv001"

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Patients Endpoints
@app.route('/api/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    try:
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "ID patient invalide"}), 400
        patient = mongo.db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return jsonify({"error": "Patient non trouvé"}), 404
        return jsonify(parse_json(patient))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/patients/<patient_id>', methods=['PATCH'])
def update_patient(patient_id):
    try:
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "ID patient invalide"}), 400
        data = request.get_json()
        if not data:
            return jsonify({"error": "Aucune donnée fournie"}), 400
        allowed_fields = ['firstName', 'lastName', 'phone', 'email', 'address']
        update_data = {k: data[k] for k in allowed_fields if k in data}
        if not update_data:
            return jsonify({"error": "Aucun champ valide fourni pour la mise à jour"}), 400
        if 'email' in update_data:
            existing_patient = mongo.db.patients.find_one({"email": update_data['email'], "_id": {"$ne": ObjectId(patient_id)}})
            if existing_patient:
                return jsonify({"error": "Cet email est déjà utilisé"}), 400
        result = mongo.db.patients.update_one({"_id": ObjectId(patient_id)}, {"$set": update_data})
        if result.modified_count == 0:
            return jsonify({"error": "Aucune modification effectuée ou patient non trouvé"}), 404
        updated_patient = mongo.db.patients.find_one({"_id": ObjectId(patient_id)})
        return jsonify({"message": "Profil mis à jour avec succès", "patient": parse_json(updated_patient)}), 200
    except Exception as e:
        app.logger.error(f"Erreur lors de la mise à jour du patient {patient_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patients', methods=['GET'])
def get_patients():
    patients = mongo.db.patients.find()
    response = [parse_json(patient) for patient in patients]
    return jsonify(response)

# Médecins Endpoints
@app.route('/api/medecins', methods=['GET'])
def get_medecins():
    medecins = mongo.db.medecins.find()
    response = [parse_json(medecin) for medecin in medecins]
    return jsonify(response)

@app.route('/api/medecins/<id>', methods=['GET'])
def get_medecin(id):
    try:
        if not ObjectId.is_valid(id):
            return jsonify({"error": "ID invalide"}), 400
        medecin = mongo.db.medecins.find_one({"_id": ObjectId(id)})
        if medecin:
            return jsonify(parse_json(medecin))
        else:
            return jsonify({"error": "Médecin non trouvé"}), 404
    except Exception as e:
        return jsonify({"error": "Erreur serveur", "message": str(e)}), 500

# Update Creneau Status
@app.route('/api/medecins/<medecin_id>/creneaux', methods=['PATCH'])
def update_creneau_status(medecin_id):
    try:
        if not ObjectId.is_valid(medecin_id):
            return jsonify({"error": "ID médecin invalide"}), 400
        data = request.get_json()
        if not data or 'heure' not in data or 'statut' not in data:
            return jsonify({"error": "Missing heure or statut"}), 400
        heure = data['heure'].strip()
        statut = data['statut']
        if not validate_time_format(heure):
            return jsonify({"error": "Invalid time format, expected HH:MM"}), 400
        if statut not in ['libre', 'réservé']:
            return jsonify({"error": "Invalid statut, must be libre or réservé"}), 400
        medecin = mongo.db.medecins.find_one({"_id": ObjectId(medecin_id)})
        if not medecin:
            return jsonify({"error": "Médecin non trouvé"}), 404
        if 'disponibilites' not in medecin:
            medecin['disponibilites'] = {"creneaux": []}
        if 'creneaux' not in medecin['disponibilites']:
            medecin['disponibilites']['creneaux'] = []
        creneaux = medecin['disponibilites']['creneaux']
        creneau_index = next((i for i, c in enumerate(creneaux) if c['heure'].strip() == heure), -1)
        if creneau_index == -1:
            app.logger.warning(f"Creneau for heure {heure} not found for medecin {medecin_id}")
            return jsonify({"error": f"Creneau for heure {heure} not found"}), 404
        if creneaux[creneau_index]['statut'] == statut:
            app.logger.warning(f"Creneau for heure {heure} already has statut {statut}")
            return jsonify({"error": f"Creneau already has statut {statut}"}), 400
        result = mongo.db.medecins.update_one(
            {"_id": ObjectId(medecin_id), "disponibilites.creneaux.heure": heure},
            {"$set": {"disponibilites.creneaux.$.statut": statut}}
        )
        if result.modified_count == 0:
            app.logger.warning(f"Failed to update creneau for medecin {medecin_id}, heure {heure}")
            return jsonify({"error": "Failed to update creneau status, possibly no changes made"}), 400
        app.logger.info(f"Updated creneau for medecin {medecin_id}: {heure} -> {statut}")
        return jsonify({"message": "Creneau updated successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error updating creneau for medecin {medecin_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Rendezvous Endpoints
@app.route('/api/patients/<patient_id>/rendezvous', methods=['GET'])
def get_patient_appointments(patient_id):
    try:
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "Invalid patient ID format"}), 400
        patient = mongo.db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        appointments_cursor = mongo.db.rendezvous.find({"patientId": patient_id})
        appointments = []
        for appt in appointments_cursor:
            try:
                medecin_id = appt['medecinId']
                if not ObjectId.is_valid(medecin_id):
                    medecin_id = "000000000000000000000000"
                appointment = {
                    "id": str(appt['_id']),
                    "date": appt['date'],
                    "time": appt['heure'],
                    "status": appt.get('status', 'confirmé'),
                    "doctorId": medecin_id,
                }
                appointments.append(appointment)
            except KeyError as e:
                app.logger.warning(f"Champ manquant dans le rendez-vous {appt.get('_id')}: {str(e)}")
                continue
        valid_medecin_ids = [ObjectId(id) for id in {a['doctorId'] for a in appointments} if ObjectId.is_valid(id)]
        medecins = {str(m['_id']): m for m in mongo.db.medecins.find({"_id": {"$in": valid_medecin_ids}})}
        result = []
        for appt in appointments:
            medecin = medecins.get(appt['doctorId'], {})
            result.append({
                **appt,
                "doctorName": f"{medecin.get('prenom', '')} {medecin.get('nom', '')}".strip() or "Médecin inconnu",
                "specialite": medecin.get('specialite', 'Non spécifiée')
            })
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error fetching appointments: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/rendezvous', methods=['POST'])
def create_rendezvous():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        required_fields = ['patientId', 'medecinId', 'date', 'heure', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
        if not ObjectId.is_valid(data['patientId']):
            return jsonify({"error": "Invalid patientId format"}), 400
        if not ObjectId.is_valid(data['medecinId']):
            return jsonify({"error": "Invalid medecinId format"}), 400
        if not validate_date_format(data['date']):
            return jsonify({"error": "Invalid date format, expected YYYY-MM-DD"}), 400
        if not validate_time_format(data['heure']):
            return jsonify({"error": "Invalid time format, expected HH:MM"}), 400
        if data['status'] not in ['Confirmé', 'Annulé', 'en attente']:
            return jsonify({"error": "Invalid status, must be Confirmé, Annulé, or en attente"}), 400
        patient = mongo.db.patients.find_one({"_id": ObjectId(data['patientId'])})
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        medecin = mongo.db.medecins.find_one({"_id": ObjectId(data['medecinId'])})
        if not medecin:
            return jsonify({"error": "Médecin not found"}), 404
        heure = data['heure'].strip()
        if 'disponibilites' not in medecin or 'creneaux' not in medecin['disponibilites']:
            return jsonify({"error": "Médecin has no disponibilites or creneaux defined"}), 400
        creneaux = medecin['disponibilites']['creneaux']
        creneau = next((c for c in creneaux if c['heure'].strip() == heure), None)
        if not creneau:
            return jsonify({"error": f"Creneau for heure {heure} not found"}), 404
        if creneau['statut'] != 'libre':
            return jsonify({"error": f"Creneau at {heure} is not available (statut: {creneau['statut']})"}), 400
        existing_rendezvous = mongo.db.rendezvous.find_one({
            "medecinId": data['medecinId'],
            "date": data['date'],
            "heure": heure,
            "status": {"$ne": "Annulé"}
        })
        if existing_rendezvous:
            return jsonify({"error": f"A rendezvous already exists for this medecin at {heure} on {data['date']}"}), 400
        rendezvous = {
            "_id": generate_rendezvous_id(),
            "patientId": data['patientId'],
            "medecinId": data['medecinId'],
            "date": data['date'],
            "heure": heure,
            "status": data['status']
        }
        update_result = mongo.db.medecins.update_one(
            {"_id": ObjectId(data['medecinId']), "disponibilites.creneaux.heure": heure},
            {"$set": {"disponibilites.creneaux.$.statut": "réservé"}}
        )
        if update_result.modified_count == 0:
            app.logger.warning(f"Failed to update creneau for medecin {data['medecinId']}, heure {heure}")
            return jsonify({"error": "Failed to reserve creneau, possibly already reserved"}), 400
        try:
            result = mongo.db.rendezvous.insert_one(rendezvous)
        except Exception as e:
            mongo.db.medecins.update_one(
                {"_id": ObjectId(data['medecinId']), "disponibilites.creneaux.heure": heure},
                {"$set": {"disponibilites.creneaux.$.statut": "libre"}}
            )
            app.logger.error(f"Failed to create rendezvous, rolled back creneau: {str(e)}")
            return jsonify({"error": "Failed to create rendezvous: " + str(e)}), 500
        app.logger.info(f"Rendezvous created: {rendezvous['_id']} and creneau updated to réservé")
        return jsonify({"message": "Rendezvous created successfully", "rendezvous": parse_json(rendezvous)}), 201
    except Exception as e:
        app.logger.error(f"Error creating rendezvous: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/rendezvous/<rendezvous_id>/cancel', methods=['PATCH'])
def cancel_rendezvous(rendezvous_id):
    try:
        if not rendezvous_id.startswith('resv'):
            return jsonify({"error": "Invalid rendezvous ID format"}), 400
        data = request.get_json()
        if not data or 'patientId' not in data:
            return jsonify({"error": "Missing patientId"}), 400
        patient_id = data['patientId']
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "Invalid patientId format"}), 400
        app.logger.info(f"Attempting to cancel rendezvous {rendezvous_id} for patient {patient_id}")
        rendezvous = mongo.db.rendezvous.find_one({"_id": rendezvous_id, "patientId": patient_id})
        if not rendezvous:
            app.logger.warning(f"Rendezvous {rendezvous_id} not found or does not belong to patient {patient_id}")
            return jsonify({"error": "Rendezvous not found or does not belong to this patient"}), 404
        medecin_id = rendezvous['medecinId']
        heure = rendezvous['heure']
        app.logger.info(f"Updating creneau for medecin {medecin_id} at {heure} to libre")
        medecin = mongo.db.medecins.find_one({"_id": ObjectId(medecin_id)})
        if not medecin or 'disponibilites' not in medecin or 'creneaux' not in medecin['disponibilites']:
            app.logger.warning(f"No creneaux found for medecin {medecin_id}")
        else:
            creneau = next((c for c in medecin['disponibilites']['creneaux'] if c['heure'].strip() == heure), None)
            if not creneau:
                app.logger.warning(f"Creneau for heure {heure} not found for medecin {medecin_id}")
            else:
                update_creneau_result = mongo.db.medecins.update_one(
                    {"_id": ObjectId(medecin_id), "disponibilites.creneaux.heure": heure},
                    {"$set": {"disponibilites.creneaux.$.statut": "libre"}}
                )
                if update_creneau_result.modified_count == 0:
                    app.logger.warning(f"Failed to update creneau for medecin {medecin_id}, heure {heure}")
                    return jsonify({"error": "Failed to update creneau status to libre"}), 400
        delete_result = mongo.db.rendezvous.delete_one({"_id": rendezvous_id})
        if delete_result.deleted_count == 0:
            app.logger.warning(f"Failed to delete rendezvous {rendezvous_id}")
            return jsonify({"error": "Failed to delete rendezvous"}), 400
        app.logger.info(f"Rendezvous {rendezvous_id} deleted, creneau for medecin {medecin_id} at {heure} set to libre")
        return jsonify({"message": "Rendezvous deleted successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error deleting rendezvous {rendezvous_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

# NOTIFICATIONS ENDPOINTS
@app.route('/api/notifications', methods=['GET', 'POST'])
def handle_notifications():
    try:
        if request.method == 'POST':
            data = request.json
            if not data or 'patientId' not in data or 'message' not in data:
                return jsonify({'error': 'Les champs patientId et message sont obligatoires'}), 400
            patient_id = str(data['patientId'])
            new_notification = {
                'patientId': patient_id,
                'type': data.get('type', 'Rappel'),
                'message': data['message'],
                'isRead': False,
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            result = mongo.db.notifications.insert_one(new_notification)
            new_notification['_id'] = str(result.inserted_id)
            return jsonify({
                'message': 'Notification créée avec succès',
                'notification': new_notification
            }), 201
        notifications = list(mongo.db.notifications.find())
        return jsonify([parse_json(n) for n in notifications])
    except Exception as e:
        app.logger.error(f"Erreur dans handle_notifications: {str(e)}")
        return jsonify({'error': 'Erreur serveur lors du traitement des notifications'}), 500

@app.route('/api/notifications/patient/<patient_id>', methods=['GET'])
def get_patient_notifications(patient_id):
    try:
        if patient_id == 'undefined' or not patient_id:
            return jsonify({'error': 'ID patient manquant'}), 400
        notifications = list(mongo.db.notifications.find({'patientId': patient_id}).sort('createdAt', -1))
        for notif in notifications:
            notif['createdAt'] = notif.get('createdxt', notif.get('createdAt'))
            notif['updatedAt'] = notif.get('updatedxt', notif.get('updatedAt'))
        return jsonify({
            'count': len(notifications),
            'notifications': [parse_json(n) for n in notifications]
        })
    except Exception as e:
        app.logger.error(f"Erreur dans get_patient_notifications: {str(e)}")
        return jsonify({'error': 'Erreur lors de la récupération des notifications'}), 500

@app.route('/api/notifications/<notification_id>/read', methods=['PATCH'])
def mark_notification_as_read(notification_id):
    try:
        if not ObjectId.is_valid(notification_id):
            return jsonify({'error': 'ID notification invalide'}), 400
        result = mongo.db.notifications.update_one(
            {'_id': ObjectId(notification_id)},
            {'$set': {'isRead': True, 'updatedAt': datetime.utcnow()}}
        )
        if result.modified_count == 0:
            return jsonify({'error': 'Notification non trouvée ou déjà lue'}), 404
        return jsonify({'message': 'Notification marquée comme lue'})
    except Exception as e:
        app.logger.error(f"Erreur dans mark_notification_as_read: {str(e)}")
        return jsonify({'error': 'Erreur lors du marquage de la notification'}), 500

# Document Endpoints
@app.route('/api/patients/<patient_id>/documents', methods=['POST'])
def upload_document(patient_id):
    try:
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "ID patient invalide"}), 400
        patient = mongo.db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return jsonify({"error": "Patient non trouvé"}), 404
        if 'file' not in request.files:
            return jsonify({"error": "Aucun fichier fourni"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Nom de fichier vide"}), 400
        if not file or not allowed_file(file.filename):
            return jsonify({"error": "Type de fichier non autorisé"}), 400
        filename = secure_filename(file.filename)
        upload_dir = app.config['UPLOAD_FOLDER']
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        metadata = request.form.get('metadata')
        if not metadata:
            return jsonify({"error": "Métadonnées manquantes"}), 400
        try:
            metadata = json.loads(metadata)
        except json.JSONDecodeError:
            return jsonify({"error": "Métadonnées invalides (JSON mal formé)"}), 400
        doctor_id = metadata.get("doctorId")
        consultation_id = metadata.get("consultationId")
        if not doctor_id or not ObjectId.is_valid(doctor_id):
            return jsonify({"error": "ID médecin invalide ou manquant"}), 400
        # Validate consultation_id only if provided
        if consultation_id and not ObjectId.is_valid(consultation_id):
            return jsonify({"error": "ID consultation invalide"}), 400
        document = {
            "patientId": patient_id,
            "doctorId": doctor_id,
            "consultationId": consultation_id if consultation_id else None,  # Store as None if not provided
            "name": filename,
            "type": metadata.get("type", "other"),
            "fileType": filename.split('.')[-1].lower(),
            "fileUrl": filepath,
            "uploadDate": datetime.utcnow(),
            "status": "non consulté",
            "size": os.path.getsize(filepath),
            "description": metadata.get("description", ""),
            "tags": metadata.get("tags", []),
            "isUrgent": metadata.get("isUrgent", False),
            "metadata": metadata.get("metadata", {})
        }
        result = mongo.db.documents.insert_one(document)
        document['_id'] = str(result.inserted_id)

        # Update consultation with document ID if consultation_id is provided
        if consultation_id:
            consultation = mongo.db.consultations.find_one({"_id": ObjectId(consultation_id)})
            if not consultation:
                # Clean up uploaded file and document if consultation is invalid
                if os.path.exists(filepath):
                    os.remove(filepath)
                mongo.db.documents.delete_one({"_id": result.inserted_id})
                return jsonify({"error": "Consultation non trouvée"}), 404
            mongo.db.consultations.update_one(
                {"_id": ObjectId(consultation_id)},
                {"$push": {"documents": str(result.inserted_id)}}
            )

        # Send notification to doctor
        notification_message = (
            f"Un nouveau document a été envoyé par le patient {patient.get('firstName', 'Inconnu')} "
            f"{patient.get('lastName', '')} le {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}. "
            f"Description : {document['description']}. "
            f"Consultation ID : {consultation_id if consultation_id else 'Non spécifié'}. "
            f"Vérifiez-le via l'application."
        )
        mongo.db.notifications.insert_one({
            'doctorId': doctor_id,
            'type': 'Nouveau document',
            'message': notification_message,
            'isRead': False,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        })

        return jsonify({"message": "Document enregistré avec succès", "document": parse_json(document)}), 201
    except Exception as e:
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        app.logger.error(f"Erreur lors de l'upload: {str(e)}")
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/patients/<patient_id>/documents', methods=['GET'])
def get_patient_documents(patient_id):
    try:
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "ID patient invalide"}), 400
        query = {"patientId": patient_id}
        consultation_id = request.args.get('consultationId')
        if consultation_id:
            if not ObjectId.is_valid(consultation_id):
                return jsonify({"error": "ID consultation invalide"}), 400
            query["consultationId"] = consultation_id
        documents = mongo.db.documents.find(query)
        documents_list = []
        for doc in documents:
            document_data = {
                "id": str(doc['_id']),
                "filename": doc['name'],
                "fileType": doc['fileType'],
                "description": doc['description'],
                "uploadDate": doc['uploadDate'].isoformat(),
                "isUrgent": doc['isUrgent'],
                "status": doc['status'],
                "consultationId": doc.get('consultationId')
            }
            documents_list.append(document_data)
        return jsonify(documents_list), 200
    except Exception as e:
        app.logger.error(f"Erreur lors de la récupération des documents: {str(e)}")
        return jsonify({"error": "Erreur serveur"}), 500

@app.route('/api/documents/<document_id>', methods=['DELETE'])
def delete_document(document_id):
    try:
        if not ObjectId.is_valid(document_id):
            return jsonify({"error": "ID document invalide"}), 400
        document = mongo.db.documents.find_one({"_id": ObjectId(document_id)})
        if not document:
            return jsonify({"error": "Document non trouvé"}), 404
        # Remove document ID from consultation if associated
        if document.get('consultationId'):
            mongo.db.consultations.update_one(
                {"_id": ObjectId(document['consultationId'])},
                {"$pull": {"documents": str(document['_id'])}}
            )
        if 'fileUrl' in document and os.path.exists(document['fileUrl']):
            try:
                os.remove(document['fileUrl'])
            except Exception as e:
                app.logger.error(f"Erreur suppression fichier {document['fileUrl']}: {str(e)}")
        result = mongo.db.documents.delete_one({"_id": ObjectId(document_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Document non trouvé"}), 404
        return jsonify({"message": "Document supprimé avec succès"}), 200
    except Exception as e:
        app.logger.error(f"Erreur lors de la suppression: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Consultation Endpoints
@app.route('/api/consultations/<consultation_id>', methods=['GET'])
def get_consultation(consultation_id):
    try:
        if not ObjectId.is_valid(consultation_id):
            return jsonify({"error": "ID consultation invalide"}), 400
        consultation = mongo.db.consultations.find_one({"_id": ObjectId(consultation_id)})
        if not consultation:
            return jsonify({"error": "Consultation non trouvée"}), 404
        return jsonify(parse_json(consultation)), 200
    except Exception as e:
        app.logger.error(f"Erreur lors de la récupération de la consultation: {str(e)}")
        return jsonify({"error": "Erreur serveur"}), 500

@app.route('/api/consultations', methods=['POST'])
def create_consultation():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        required_fields = ['rendezvousId', 'medecinId', 'patientId', 'diagnostic', 'prescription']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
        rendezvous_id = data['rendezvousId']
        medecin_id = data['medecinId']
        patient_id = data['patientId']
        if not ObjectId.is_valid(medecin_id):
            return jsonify({"error": "Invalid medecinId format"}), 400
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "Invalid patientId format"}), 400
        if not re.match(r'^resv\d{3}$', rendezvous_id):
            return jsonify({"error": "Invalid rendezvousId format"}), 400
        rendezvous = mongo.db.rendezvous.find_one({"_id": rendezvous_id})
        if not rendezvous:
            return jsonify({"error": "Rendezvous not found"}), 404
        if rendezvous['status'] != 'Confirmé':
            return jsonify({"error": "Rendezvous is not in 'Confirmé' status"}), 400
        if rendezvous['medecinId'] != medecin_id or str(rendezvous['patientId']) != patient_id:
            return jsonify({"error": "Rendezvous does not match the provided doctor or patient"}), 400

        # Gestion des documents uploadés
        document_ids = []
        if 'documents' in data:
            for doc in data['documents']:
                document = {
                    "patientId": patient_id,
                    "doctorId": medecin_id,
                    "name": doc.get("name", ""),
                    "type": doc.get("type", "consultation"),
                    "fileUrl": doc.get("fileUrl", ""),
                    "uploadDate": datetime.utcnow(),
                    "status": "non consulté",
                    "size": doc.get("size", 0),
                    "description": doc.get("description", ""),
                    "tags": doc.get("tags", []),
                    "isUrgent": doc.get("isUrgent", False),
                    "metadata": doc.get("metadata", {})
                }
                result = mongo.db.documents.insert_one(document)
                document_ids.append(str(result.inserted_id))

        # Créer la consultation
        consultation = {
            "rendezvousId": rendezvous_id,
            "medecinId": medecin_id,
            "patientId": patient_id,
            "diagnostic": data['diagnostic'],
            "prescription": data['prescription'],
            "documents": document_ids,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        result = mongo.db.consultations.insert_one(consultation)
        consultation['_id'] = str(result.inserted_id)
        consultation['createdAt'] = consultation['createdAt'].isoformat()
        consultation['updatedAt'] = consultation['updatedAt'].isoformat()

        # Envoyer une notification au patient avec le diagnostic
        diagnostic = data['diagnostic']
        notification_message = (
            f"Votre consultation du {rendezvous['date']} à {rendezvous['heure']} a été enregistrée. "
            f"Le diagnostic est le suivant : {diagnostic}. Veuillez envoyer les documents nécessaires via l'application."
        )
        mongo.db.notifications.insert_one({
            'patientId': patient_id,
            'type': 'Demande de document',
            'message': notification_message,
            'isRead': False,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
            'consultationId': str(consultation['_id'])  # Include consultationId in notification
        })

        return jsonify({"message": "Consultation created successfully", "consultation": parse_json(consultation)}), 201
    except Exception as e:
        app.logger.error(f"Error creating consultation: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/medecins/<medecin_id>/consultations', methods=['GET'])
def get_doctor_consultations(medecin_id):
    try:
        if not ObjectId.is_valid(medecin_id):
            return jsonify({"error": "Invalid doctor ID format"}), 400
        consultations = mongo.db.consultations.find({"medecinId": medecin_id})
        consultation_list = []
        for consultation in consultations:
            patient = mongo.db.patients.find_one({"_id": ObjectId(consultation['patientId'])}) if ObjectId.is_valid(consultation['patientId']) else None
            documents = list(mongo.db.documents.find({"_id": {"$in": [ObjectId(doc_id) for doc_id in consultation['documents']]}})) if consultation['documents'] else []
            consultation_data = {
                "id": str(consultation['_id']),
                "rendezvousId": consultation['rendezvousId'],
                "medecinId": consultation['medecinId'],
                "patientId": str(consultation['patientId']),
                "patientName": f"{patient['firstName']} {patient['lastName']}" if patient else "Unknown Patient",
                "diagnostic": consultation['diagnostic'],
                "prescription": consultation['prescription'],
                "documents": parse_json(documents),
                "createdAt": consultation['createdAt'].isoformat(),
                "updatedAt": consultation['updatedAt'].isoformat()
            }
            consultation_list.append(consultation_data)
        return jsonify(consultation_list), 200
    except Exception as e:
        app.logger.error(f"Error fetching consultations: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Médecins Search Endpoint
@app.route('/api/medecins/search', methods=['GET'])
def search_medecins():
    try:
        query = request.args.get('query', '').strip()
        specialty = request.args.get('specialty', '').strip()
        search_criteria = {}
        if query:
            search_criteria['$or'] = [
                {'nom': {'$regex': query, '$options': 'i'}},
                {'prenom': {'$regex': query, '$options': 'i'}},
                {'specialite': {'$regex': query, '$options': 'i'}},
                {'adresse': {'$regex': query, '$options': 'i'}}
            ]
        if specialty:
            search_criteria['specialite'] = {'$regex': f'^{specialty}$', '$options': 'i'}
        medecins = list(mongo.db.medecins.find(search_criteria))
        response = []
        for medecin in medecins:
            medecin_data = parse_json(medecin)
            if 'notes' in medecin and medecin['notes']:
                avg_rating = sum(n['valeur'] for n in medecin['notes']) / len(medecin['notes'])
                medecin_data['note_moyenne'] = round(avg_rating, 1)
            else:
                medecin_data['note_moyenne'] = None
            response.append(medecin_data)
        return jsonify(response)
    except Exception as e:
        app.logger.error(f"Erreur lors de la recherche: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register_patient():
    try:
        data = request.get_json()
        required_fields = ['firstName', 'lastName', 'email', 'password', 'dateOfBirth', 'address', 'phone']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Le champ {field} est requis'}), 400
        if mongo.db.patients.find_one({'email': data['email']}):
            return jsonify({'error': 'Cet email est déjà utilisé'}), 400
        patient = {
            'firstName': data['firstName'],
            'lastName': data['lastName'],
            'email': data['email'],
            'password': data['password'],
            'role': 'patient',
            'dateOfBirth': data['dateOfBirth'],
            'address': data['address'],
            'phone': data['phone'],
            'createdAt': datetime.utcnow()
        }
        result = mongo.db.patients.insert_one(patient)
        patient['_id'] = str(result.inserted_id)
        return jsonify({
            'message': 'Inscription réussie',
            'patient': {
                'id': patient['_id'],
                'firstName': patient['firstName'],
                'lastName': patient['lastName'],
                'email': patient['email'],
                'role': patient['role'],
                'dateOfBirth': patient['dateOfBirth'],
                'address': patient['address'],
                'phone': patient['phone'],
                'createdAt': patient['createdAt']
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Aucune donnée fournie"}), 400
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        if not email or not password:
            return jsonify({"success": False, "message": "Email et mot de passe requis!"}), 400
        user = mongo.db.patients.find_one({"email": email})
        role = "patient" if user else None
        if not user:
            user = mongo.db.medecins.find_one({"email": email})
            role = "medecin" if user else None
        if not user:
            return jsonify({"success": False, "message": "Utilisateur non trouvé!"}), 404
        if user['password'] != password:
            return jsonify({"success": False, "message": "Identifiants incorrects!"}), 401
        user_data = {
            "id": str(user['_id']),
            "email": user['email'],
            "role": role,
            "firstName": user['firstName'],
            "lastName": user['lastName'],
            "patientId": str(user['_id'])
        }
        if role == "patient":
            user_data["dateOfBirth"] = user.get('dateOfBirth', '')
            user_data["address"] = user.get('address', '')
            user_data["phone"] = user.get('phone', '')
            user_data["createdAt"] = user.get('createdAt', '')
        elif role == "medecin":
            user_data["specialite"] = user.get('specialite', '')
            user_data["note"] = user.get('note', '')
            user_data["propos"] = user.get('propos', '')
            user_data["telephone"] = user.get('telephone', '')
            user_data["image"] = user.get('image', '')
        return jsonify({
            "success": True,
            "message": "Connexion réussie!",
            "user": user_data
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": "Erreur serveur"}), 500

@app.route('/api/medecins/<medecin_id>/rendezvous', methods=['GET'])
def get_doctor_appointments(medecin_id):
    try:
        if not ObjectId.is_valid(medecin_id):
            return jsonify({"error": "Invalid doctor ID format"}), 400
        appointments = mongo.db.rendezvous.find({"medecinId": medecin_id})
        appointments_list = []
        for appt in appointments:
            patient = mongo.db.patients.find_one({"_id": ObjectId(appt['patientId'])}) if ObjectId.is_valid(appt['patientId']) else None
            appointment = {
                "id": appt['_id'],
                "patientId": str(appt['patientId']),
                "patientName": f"{patient['firstName']} {patient['lastName']}" if patient else "Unknown Patient",
                "date": appt['date'],
                "heure": appt['heure'],
                "status": appt['status']
            }
            appointments_list.append(appointment)
        return jsonify(appointments_list), 200
    except Exception as e:
        app.logger.error(f"Error fetching doctor's appointments: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/medecins/<medecin_id>/pending-rendezvous', methods=['GET'])
def get_pending_rendezvous(medecin_id):
    try:
        if not ObjectId.is_valid(medecin_id):
            return jsonify({"error": "Invalid doctor ID format"}), 400
        pending_rendezvous = mongo.db.rendezvous.find({
            "medecinId": medecin_id,
            "status": "en attente"
        })
        rendezvous_list = []
        for rdv in pending_rendezvous:
            patient = mongo.db.patients.find_one({"_id": ObjectId(rdv['patientId'])}) if ObjectId.is_valid(rdv['patientId']) else None
            rendezvous = {
                "id": rdv['_id'],
                "patientId": str(rdv['patientId']),
                "patientName": f"{patient['firstName']} {patient['lastName']}" if patient else "Unknown Patient",
                "date": rdv['date'],
                "heure": rdv['heure'],
                "status": rdv['status']
            }
            rendezvous_list.append(rendezvous)
        return jsonify(rendezvous_list), 200
    except Exception as e:
        app.logger.error(f"Error fetching pending rendezvous: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/medecins/<medecin_id>/rendezvous/<rendezvous_id>/accept', methods=['POST'])
def accept_rendezvous(medecin_id, rendezvous_id):
    try:
        if not ObjectId.is_valid(medecin_id):
            return jsonify({"error": "Invalid doctor ID format"}), 400
        if not re.match(r'^resv\d{3}$', rendezvous_id):
            return jsonify({"error": "Invalid rendezvous ID format"}), 400
        rendezvous = mongo.db.rendezvous.find_one({
            "_id": rendezvous_id,
            "medecinId": medecin_id,
            "status": "en attente"
        })
        if not rendezvous:
            return jsonify({"error": "Rendezvous not found, not in 'en attente' status, or does not belong to this doctor"}), 404
        result = mongo.db.rendezvous.update_one(
            {"_id": rendezvous_id},
            {"$set": {"status": "Confirmé"}}
        )
        if result.modified_count == 0:
            return jsonify({"error": "Failed to update rendezvous status"}), 500
        # Send notification to patient
        patient_id = rendezvous['patientId']
        notification_message = f"Votre rendez-vous du {rendezvous['date']} à {rendezvous['heure']} a été accepté par le médecin."
        mongo.db.notifications.insert_one({
            'patientId': patient_id,
            'type': 'Rappel',
            'message': notification_message,
            'isRead': False,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        })
        return jsonify({
            "message": "Rendezvous accepted successfully",
            "rendezvousId": rendezvous_id
        }), 200
    except Exception as e:
        app.logger.error(f"Error accepting rendezvous: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/medecins/<medecin_id>/rendezvous/<rendezvous_id>/reject', methods=['POST'])
def reject_rendezvous(medecin_id, rendezvous_id):
    try:
        if not ObjectId.is_valid(medecin_id):
            return jsonify({"error": "Invalid doctor ID format"}), 400
        if not re.match(r'^resv\d{3}$', rendezvous_id):
            return jsonify({"error": "Invalid rendezvous ID format"}), 400
        rendezvous = mongo.db.rendezvous.find_one({
            "_id": rendezvous_id,
            "medecinId": medecin_id,
            "status": "en attente"
        })
        if not rendezvous:
            return jsonify({"error": "Rendezvous not found, not in 'en attente' status, or does not belong to this doctor"}), 404
        result = mongo.db.rendezvous.update_one(
            {"_id": rendezvous_id},
            {"$set": {"status": "Rejeté"}}
        )
        if result.modified_count == 0:
            return jsonify({"error": "Failed to update rendezvous status"}), 500
        # Send notification to patient
        patient_id = rendezvous['patientId']
        notification_message = f"Votre rendez-vous du {rendezvous['date']} à {rendezvous['heure']} a été rejeté par le médecin."
        mongo.db.notifications.insert_one({
            'patientId': patient_id,
            'type': 'Avertissement',
            'message': notification_message,
            'isRead': False,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        })
        return jsonify({
            "message": "Rendezvous rejected successfully",
            "rendezvousId": rendezvous_id
        }), 200
    except Exception as e:
        app.logger.error(f"Error rejecting rendezvous: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)