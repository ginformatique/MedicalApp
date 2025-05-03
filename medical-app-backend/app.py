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

        heure = data['heure'].strip()  # Remove whitespace
        statut = data['statut']

        if not validate_time_format(heure):
            return jsonify({"error": "Invalid time format, expected HH:MM"}), 400
        if statut not in ['libre', 'réservé']:
            return jsonify({"error": "Invalid statut, must be libre or réservé"}), 400

        medecin = mongo.db.medecins.find_one({"_id": ObjectId(medecin_id)})
        if not medecin:
            return jsonify({"error": "Médecin non trouvé"}), 404

        # Ensure disponibilites structure exists
        if 'disponibilites' not in medecin:
            medecin['disponibilites'] = {"creneaux": []}
        if 'creneaux' not in medecin['disponibilites']:
            medecin['disponibilites']['creneaux'] = []

        # Find and update creneau
        creneaux = medecin['disponibilites']['creneaux']
        app.logger.info(f"Before update - Creneaux for medecin {medecin_id}: {creneaux}")

        # Find creneau index
        creneau_index = next((i for i, c in enumerate(creneaux) if c['heure'].strip() == heure), -1)

        if creneau_index == -1:
            app.logger.warning(f"Creneau for heure {heure} not found for medecin {medecin_id}")
            return jsonify({"error": f"Creneau for heure {heure} not found"}), 404

        # Check if the status is already the same
        if creneaux[creneau_index]['statut'] == statut:
            app.logger.warning(f"Creneau for heure {heure} already has statut {statut}")
            return jsonify({"error": f"Creneau already has statut {statut}"}), 400

        # Update the specific creneau using MongoDB's array update
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
        # Validation de l'ID patient
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "Invalid patient ID format"}), 400

        # Vérification que le patient existe
        patient = mongo.db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        # Récupération des rendez-vous avec conversion des IDs médecins
        appointments_cursor = mongo.db.rendezvous.find({"patientId": patient_id})
        appointments = []
        
        for appt in appointments_cursor:
            try:
                # Gestion des IDs médecins non-ObjectId
                medecin_id = appt['medecinId']
                if not ObjectId.is_valid(medecin_id):
                    medecin_id = "000000000000000000000000"  # ID par défaut ou gestion spéciale
                
                # Création de l'objet rendez-vous avec conversion
                appointment = {
                    "id": str(appt['_id']),
                    "date": appt['date'],
                    "time": appt['heure'],
                    "status": appt.get('status', 'confirmé'),
                    "doctorId": medecin_id,
                    # autres champs...
                }
                appointments.append(appointment)
            
            except KeyError as e:
                app.logger.warning(f"Champ manquant dans le rendez-vous {appt.get('_id')}: {str(e)}")
                continue

        # Récupération des médecins (seulement les IDs valides)
        valid_medecin_ids = [ObjectId(id) for id in {a['doctorId'] for a in appointments} 
                          if ObjectId.is_valid(id)]
        medecins = {str(m['_id']): m for m in mongo.db.medecins.find(
            {"_id": {"$in": valid_medecin_ids}}
        )}

        # Enrichissement des données
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
        # Get data from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        required_fields = ['patientId', 'medecinId', 'date', 'heure', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Validate field formats
        if not ObjectId.is_valid(data['patientId']):
            return jsonify({"error": "Invalid patientId format"}), 400
        if not ObjectId.is_valid(data['medecinId']):
            return jsonify({"error": "Invalid medecinId format"}), 400
        if not validate_date_format(data['date']):
            return jsonify({"error": "Invalid date format, expected YYYY-MM-DD"}), 400
        if not validate_time_format(data['heure']):
            return jsonify({"error": "Invalid time format, expected HH:MM"}), 400
        if data['status'] not in ['Confirmé', 'Annulé', 'En attente']:
            return jsonify({"error": "Invalid status, must be Confirmé, Annulé, or En attente"}), 400

        # Check if patient and medecin exist
        patient = mongo.db.patients.find_one({"_id": ObjectId(data['patientId'])})
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        medecin = mongo.db.medecins.find_one({"_id": ObjectId(data['medecinId'])})
        if not medecin:
            return jsonify({"error": "Médecin not found"}), 404

        # Check creneau availability
        heure = data['heure'].strip()
        if 'disponibilites' not in medecin or 'creneaux' not in medecin['disponibilites']:
            return jsonify({"error": "Médecin has no disponibilites or creneaux defined"}), 400

        creneaux = medecin['disponibilites']['creneaux']
        creneau = next((c for c in creneaux if c['heure'].strip() == heure), None)
        if not creneau:
            return jsonify({"error": f"Creneau for heure {heure} not found"}), 404
        if creneau['statut'] != 'libre':
            return jsonify({"error": f"Creneau at {heure} is not available (statut: {creneau['statut']})"}), 400

        # Check for existing rendezvous for the same medecin, date, and heure
        existing_rendezvous = mongo.db.rendezvous.find_one({
            "medecinId": data['medecinId'],
            "date": data['date'],
            "heure": heure,
            "status": {"$ne": "Annulé"}
        })
        if existing_rendezvous:
            return jsonify({"error": f"A rendezvous already exists for this medecin at {heure} on {data['date']}"}), 400

        # Prepare rendezvous document
        rendezvous = {
            "_id": generate_rendezvous_id(),
            "patientId": data['patientId'],
            "medecinId": data['medecinId'],
            "date": data['date'],
            "heure": heure,
            "status": data['status']
        }

        # Update creneau status to réservé
        update_result = mongo.db.medecins.update_one(
            {"_id": ObjectId(data['medecinId']), "disponibilites.creneaux.heure": heure},
            {"$set": {"disponibilites.creneaux.$.statut": "réservé"}}
        )

        if update_result.modified_count == 0:
            app.logger.warning(f"Failed to update creneau for medecin {data['medecinId']}, heure {heure}")
            return jsonify({"error": "Failed to reserve creneau, possibly already reserved"}), 400

        # Insert rendezvous into MongoDB
        try:
            result = mongo.db.rendezvous.insert_one(rendezvous)
        except Exception as e:
            # Rollback creneau update if rendezvous insertion fails
            mongo.db.medecins.update_one(
                {"_id": ObjectId(data['medecinId']), "disponibilites.creneaux.heure": heure},
                {"$set": {"disponibilites.creneaux.$.statut": "libre"}}
            )
            app.logger.error(f"Failed to create rendezvous, rolled back creneau: {str(e)}")
            return jsonify({"error": "Failed to create rendezvous: " + str(e)}), 500

        app.logger.info(f"Rendezvous created: {rendezvous['_id']} and creneau updated to réservé")
        return jsonify({
            "message": "Rendezvous created successfully",
            "rendezvous": parse_json(rendezvous)
        }), 201

    except Exception as e:
        app.logger.error(f"Error creating rendezvous: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Updated Cancel Rendezvous Endpoint
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

        rendezvous = mongo.db.rendezvous.find_one({
            "_id": rendezvous_id,
            "patientId": patient_id
        })
        if not rendezvous:
            app.logger.warning(f"Rendezvous {rendezvous_id} not found or does not belong to patient {patient_id}")
            return jsonify({"error": "Rendezvous not found or does not belong to this patient"}), 404

        # Update the creneau status to libre
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

        # Delete the rendezvous instead of updating its status
        delete_result = mongo.db.rendezvous.delete_one({"_id": rendezvous_id})
        if delete_result.deleted_count == 0:
            app.logger.warning(f"Failed to delete rendezvous {rendezvous_id}")
            return jsonify({"error": "Failed to delete rendezvous"}), 400
        app.logger.info(f"Rendezvous {rendezvous_id} deleted, creneau for medecin {medecin_id} at {heure} set to libre")
        return jsonify({"message": "Rendezvous deleted successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error deleting rendezvous {rendezvous_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

######################################################################################
# NOTIFICATIONS ENDPOINTS
######################################################################################
######################################################################################
# NOTIFICATIONS ENDPOINTS
######################################################################################

@app.route('/api/notifications', methods=['GET', 'POST'])
def handle_notifications():
    try:
        if request.method == 'POST':
            # Validation des données requises
            data = request.json
            if not data or 'patientId' not in data or 'message' not in data:
                return jsonify({'error': 'Les champs patientId et message sont obligatoires'}), 400
            
            # Convertir patientId en string pour cohérence
            patient_id = str(data['patientId'])
            
            # Création de la notification
            new_notification = {
                'patientId': patient_id,  # Stocké comme string
                'type': data.get('type', 'Rappel'),
                'message': data['message'],
                'isRead': False,
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            # Insertion dans MongoDB
            result = mongo.db.notifications.insert_one(new_notification)
            new_notification['_id'] = str(result.inserted_id)
            
            return jsonify({
                'message': 'Notification créée avec succès',
                'notification': new_notification
            }), 201
        
        # GET - Liste toutes les notifications (pour admin)
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
            
        # Recherche par patientId string
        notifications = list(mongo.db.notifications.find(
            {'patientId': patient_id}
        ).sort('createdAt', -1))
        
        # Corriger les documents avant de les renvoyer
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
            {'$set': {
                'isRead': True,
                'updatedAt': datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Notification non trouvée ou déjà lue'}), 404
        
        return jsonify({'message': 'Notification marquée comme lue'})
    
    except Exception as e:
        app.logger.error(f"Erreur dans mark_notification_as_read: {str(e)}")
        return jsonify({'error': 'Erreur lors du marquage de la notification'}), 500
    
####################################################################################
# Configuration des documents
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def parse_json(data):
    """Convertit les ObjectId en strings et nettoie les données pour le JSON"""
    if isinstance(data, list):
        return [parse_json(item) for item in data]
    if isinstance(data, dict):
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'doctorId' in data and isinstance(data['doctorId'], ObjectId):
            data['doctorId'] = str(data['doctorId'])
        if 'patientId' in data and isinstance(data['patientId'], ObjectId):
            data['patientId'] = str(data['patientId'])
    return data

def allowed_file(filename):
    """Vérifie si l'extension du fichier est autorisée"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# DOCUMENTS ENDPOINTS
@app.route('/api/patients/<patient_id>/documents', methods=['POST'])
def upload_document(patient_id):
    """Endpoint pour uploader un document pour un patient"""
    try:
        # Vérification de l'ID patient
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "ID patient invalide"}), 400

        # Vérification que le patient existe
        patient = mongo.db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return jsonify({"error": "Patient non trouvé"}), 404

        # Vérification du fichier
        if 'file' not in request.files:
            return jsonify({"error": "Aucun fichier fourni"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Nom de fichier vide"}), 400

        if not file or not allowed_file(file.filename):
            return jsonify({"error": "Type de fichier non autorisé"}), 400

        # Sécurisation du nom de fichier
        filename = secure_filename(file.filename)
        upload_dir = app.config['UPLOAD_FOLDER']
        
        # Création du dossier d'upload si inexistant
        os.makedirs(upload_dir, exist_ok=True)
        
        # Sauvegarde du fichier
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)

        # Récupération des métadonnées
        metadata = request.form.get('metadata')
        if not metadata:
            return jsonify({"error": "Métadonnées manquantes"}), 400
            
        try:
            metadata = json.loads(metadata)
        except json.JSONDecodeError:
            return jsonify({"error": "Métadonnées invalides (JSON mal formé)"}), 400

        # Vérification du doctorId
        doctor_id = metadata.get("doctorId", "67eee6a6685dac2701866e1b")
        if doctor_id and not ObjectId.is_valid(doctor_id):
            return jsonify({"error": "ID médecin invalide"}), 400

        # Création du document
        document = {
            "patientId": patient_id,
            "doctorId": doctor_id,
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

        # Insertion dans MongoDB
        result = mongo.db.documents.insert_one(document)
        document['_id'] = str(result.inserted_id)

        return jsonify({
            "message": "Document enregistré avec succès",
            "document": parse_json(document)
        }), 201

    except Exception as e:
        # Nettoyage en cas d'erreur
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        app.logger.error(f"Erreur lors de l'upload: {str(e)}")
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/patients/<patient_id>/documents', methods=['GET'])
def get_patient_documents(patient_id):
    """Endpoint pour récupérer les documents d'un patient"""
    try:
        # Validation de l'ID patient
        if not ObjectId.is_valid(patient_id):
            return jsonify({"error": "ID patient invalide"}), 400

        # Récupération des documents
        documents = list(mongo.db.documents.find({"patientId": patient_id}))
        
        # Conversion des ObjectId et enrichissement des données
        result = []
        for doc in documents:
            doc = parse_json(doc)
            
            # Récupération des infos du médecin si disponible
            if doc.get('doctorId'):
                doctor = mongo.db.medecins.find_one({"_id": ObjectId(doc['doctorId'])})
                if doctor:
                    doc['doctorName'] = f"{doctor.get('prenom', '')} {doctor.get('nom', '')}".strip()
                    doc['doctorSpecialite'] = doctor.get('specialite', '')
            
            result.append(doc)

        return jsonify(result), 200

    except Exception as e:
        app.logger.error(f"Erreur lors de la récupération des documents: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/documents/<document_id>', methods=['DELETE'])
def delete_document(document_id):
    """Endpoint pour supprimer un document"""
    try:
        # Validation de l'ID document
        if not ObjectId.is_valid(document_id):
            return jsonify({"error": "ID document invalide"}), 400

        # Récupération du document avant suppression
        document = mongo.db.documents.find_one({"_id": ObjectId(document_id)})
        if not document:
            return jsonify({"error": "Document non trouvé"}), 404

        # Suppression du fichier physique
        if 'fileUrl' in document and os.path.exists(document['fileUrl']):
            try:
                os.remove(document['fileUrl'])
            except Exception as e:
                app.logger.error(f"Erreur suppression fichier {document['fileUrl']}: {str(e)}")

        # Suppression dans MongoDB
        result = mongo.db.documents.delete_one({"_id": ObjectId(document_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Document non trouvé"}), 404
            
        return jsonify({"message": "Document supprimé avec succès"}), 200

    except Exception as e:
        app.logger.error(f"Erreur lors de la suppression: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Médecins Search Endpoint
@app.route('/api/medecins/search', methods=['GET'])
def search_medecins():
    try:
        # Récupérer les paramètres de recherche
        query = request.args.get('query', '').strip()
        specialty = request.args.get('specialty', '').strip()
        
        # Construire la requête MongoDB
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
        
        # Exécuter la recherche
        medecins = list(mongo.db.medecins.find(search_criteria))
        
        # Convertir les ObjectId et préparer la réponse
        response = []
        for medecin in medecins:
            medecin_data = parse_json(medecin)
            # Calculer la note moyenne si disponible
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
    
###########################################
def parse_json(data):
    """Convert ObjectIds to strings for JSON serialization."""
    if isinstance(data, list):
        return [parse_json(item) for item in data]
    if isinstance(data, dict):
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'userId' in data and isinstance(data['userId'], ObjectId):
            data['userId'] = str(data['userId'])
    return data

# Nouvelle implémentation utilisant patients
@app.route('/api/register', methods=['POST'])
def register_patient():
    try:
        data = request.get_json()
        
        # Validation des données
        required_fields = ['firstName', 'lastName', 'email', 'password', 
                         'dateOfBirth', 'address', 'phone']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Le champ {field} est requis'}), 400
        
        # Vérifier si l'email existe déjà
        if mongo.db.patients.find_one({'email': data['email']}):
            return jsonify({'error': 'Cet email est déjà utilisé'}), 400
        
        # Créer le patient
        patient = {
            'firstName': data['firstName'],
            'lastName': data['lastName'],
            'email': data['email'],
            'password': data['password'],  # Mot de passe en clair (à hasher en production)
            'role': 'patient',  # Toujours patient pour cette collection
            'dateOfBirth': data['dateOfBirth'],
            'address': data['address'],
            'phone': data['phone'],
            'createdAt': datetime.utcnow()
        }
        
        # Insérer dans la base de données
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

######################################################

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

        # Check patients collection
        user = mongo.db.patients.find_one({"email": email})
        role = "patient" if user else None

        # If not found in patients, check medecins collection
        if not user:
            user = mongo.db.medecins.find_one({"email": email})
            role = "medecin" if user else None  # Return "medecin" instead of "doctor"

        if not user:
            return jsonify({"success": False, "message": "Utilisateur non trouvé!"}), 404

        # Compare password in plain text (not recommended for production)
        if user['password'] != password:
            return jsonify({"success": False, "message": "Identifiants incorrects!"}), 401

        # Prepare user data based on role
        user_data = {
            "id": str(user['_id']),
            "email": user['email'],
            "role": role,
            "firstName": user['firstName'],
            "lastName": user['lastName'],
            "patientId": str(user['_id'])  # Ajouté pour cohérence avec le front
        }

        # Add role-specific fields
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

    
if __name__ == '__main__':
    app.run(debug=True, port=5000)


