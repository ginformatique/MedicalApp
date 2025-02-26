from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from werkzeug.security import check_password_hash
from flask_cors import CORS  # Importez CORS

app = Flask(__name__)
CORS(app)  # Active CORS pour toutes les routes

app.config["MONGO_URI"] = "mongodb://localhost:27017/medical_db"
mongo = PyMongo(app)

# Route pour le login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = mongo.db.users.find_one({'email': email})

    if user and check_password_hash(user['password'], password):
        return jsonify({'message': 'Login successful', 'user_id': str(user['_id']), 'role': user['role']}), 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 401

# Route pour récupérer les médecins
@app.route('/api/medecins', methods=['GET'])
def get_medecins():
    medecins = list(mongo.db.medecins.find({}, {'_id': 0}))
    return jsonify(medecins)

# Point d'entrée de l'application
if __name__ == '__main__':
    app.run(debug=True)