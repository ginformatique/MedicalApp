from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/medical_db"
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

# Run the application
if __name__ == '__main__':
    app.run(debug=True)