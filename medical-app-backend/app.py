from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from flask import send_from_directory


app = Flask(__name__)
CORS(app)

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/eya"
mongo = PyMongo(app)

# Route for user login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    print(f"Received login request: email={email}, password={password}")  # Debugging

    # Find the user in the database
    user = mongo.db.users.find_one({'email': email})

    if user:
        print(f"User found: {user}")  # Debugging
        # Compare the plain-text password directly
        if user['password'] == password:
            return jsonify({'message': 'Login successful', 'user_id': str(user['_id'])}), 200
        else:
            print("Invalid password")  # Debugging
    else:
        print("User not found")  # Debugging

    return jsonify({'message': 'Invalid credentials'}), 401



# Route for user registration
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    nom = data.get('nom')
    prenom = data.get('prenom')
    email = data.get('email')
    password = data.get('password')

    # Check if the user already exists
    if mongo.db.users.find_one({'email': email}):
        return jsonify({'message': 'User already exists'}), 400

    # Insert the new user into the database
    mongo.db.users.insert_one({
        'nom': nom,
        'prenom': prenom,
        'email': email,
        'password': password  # Store the password in plain text (not recommended)
    })

    return jsonify({'message': 'User registered successfully'}), 201




# Route to fetch doctors
@app.route('/api/medecins', methods=['GET'])
def get_medecins():
    medecins = list(mongo.db.medecins.find({}, {'_id': 0}))
    return jsonify(medecins)



# Dossier pour stocker les fichiers
UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
# 📌 Route pour uploader un document médical
@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"message": "Aucun fichier envoyé"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "Nom de fichier vide"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    # Enregistrer le document dans MongoDB
    document = {
        "nom": filename,
        "path": file_path,
        "status": "non consulté"
    }
    mongo.db.documents.insert_one(document)

    return jsonify({"message": "Fichier envoyé avec succès !"}), 201


# 📌 Route pour récupérer la liste des documents envoyés
@app.route("/documents", methods=["GET"])
def get_documents():
    documents = list(mongo.db.documents.find({}, {"_id": 0}))  # Ne pas envoyer l’ID MongoDB
    return jsonify(documents)

# 📌 Route pour télécharger un fichier
@app.route("/download/<filename>", methods=["GET"])
def download_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
    # Run the application
if __name__ == '__main__':
    app.run(debug=True) 