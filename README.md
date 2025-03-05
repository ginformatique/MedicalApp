Backend développée avec Flask et MongoDB.

📌 Prérequis
Avant d'exécuter l'application, assure-toi d'avoir installé :

Python version 3.13.2 

MongoDB 

Postman(pour tester l'application)

🚀 Installation & Exécution

1)Clone le projet
git clone https://github.com/ginformatique/MedicalApp.git
cd medical-app-backend

2) Installation des dépendances
pip install flask flask-pymongo flask-cors bcrypt

3)Lancer le serveur Flask
python app.py

Démarre MongoDB 
crée une base de données nommée: medical_db
table medecins:
Script:
{
    "nom": "Dr. Marie Curie",
    "specialite": "Cardiologue",
    "disponibilite": "Indisponible",
    "statut": "Hors ligne",
    "image": "assets/doctor1.webp",
    "localisation": "Lyon, France",
    "notes": 4.8
  },
  
  {
    "nom": "Dr. Pierre Martin",
    "specialite": "Pédiatre",
    "disponibilite": "Disponible",
    "statut": "En ligne",
    "image": "assets/doctor1.webp",
    "localisation": "Marseille, France",
    "notes": 4.2
  },
  
  {
    "nom": "Dr. Louis Pasteur",
    "specialite": "Infectiologue",
    "disponibilite": "Indisponible",
    "statut": "Hors ligne",
    "image": "assets/doctor1.webp",
    "localisation": "Strasbourg, France",
    "notes": 4.7
  },
  
  {
    "nom": "Dr. Sigmund Freud",
    "specialite": "Psychiatre",
    "disponibilite": "Disponible",
    "statut": "En consultation",
    "image": "assets/doctor1.webp",
    "localisation": "Vienne, Autriche",
    "notes": 4.6
  },
  
  {
    "nom": "Dr. Rosalind Franklin",
    "specialite": "Généticienne",
    "disponibilite": "Disponible",
    "statut": "En ligne",
    "image": "assets/doctor1.webp",
    "localisation": "Londres, Royaume-Uni",
    "notes": 4.8
  }
  
Table users :

Script
  {
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "password": "secure123"
  }

👨‍💻 Équipe
 - Guesmi Yosra
 - Mezzi Eya


