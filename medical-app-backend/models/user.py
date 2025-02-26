from werkzeug.security import generate_password_hash

class User:
    def __init__(self, email, password):
        self.email = email
        self.password = generate_password_hash(password)
    

    def to_dict(self):
        return {
            'email': self.email,
            'password': self.password
        }