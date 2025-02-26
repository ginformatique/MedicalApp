from flask import Flask, request, jsonify
from flask_pymongo import PyMongo

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/medical_db"
mongo = PyMongo(app)

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = mongo.db.users.find_one({'email': email})

    if user and user['password'] == password:
        return jsonify({'message': 'Login successful', 'user_id': str(user['_id'])}), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401

if __name__ == '__main__':
    app.run(debug=True)