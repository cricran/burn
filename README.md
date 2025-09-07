# 🔥 BURN - Better URN

> Une interface moderne et unifiée pour les outils universitaires de l'Université de Rouen Normandie

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

## 📖 À propos

**BURN (Better URN)** est un projet étudiant open-source qui centralise et modernise l'accès aux outils universitaires de l'URN :

- 📅 **ADE Campus** - Emploi du temps synchronisé
- 📚 **UniversiTice/Moodle** - Cours et ressources
- ✉️ **Messagerie SOGo** - Interface mail unifiée
- 📝 **Notes personnelles** - Gestion des tâches par cours

## ✨ Fonctionnalités

### 🏠 Dashboard unifié

- Vue d'ensemble quotidienne avec cours, notes et mails récents
- Interface moderne et responsive
- Navigation intuitive entre les modules

### 📅 Calendrier intelligent

- Synchronisation automatique avec ADE Campus (iCal)
- Codes couleur personnalisables par matière
- Masquage d'événements non pertinents
- Ajout de notes et tâches sur les cours

### 📚 Intégration UniversiTice

- Accès simplifié aux cours Moodle
- Navigation améliorée dans les ressources
- Masquage des cours terminés
- Interface repensée pour une meilleure ergonomie

### ✉️ Messagerie moderne

- Interface épurée pour les mails universitaires
- Connexion sécurisée à SOGo
- Consultation et gestion simplifiées

### 🎨 Personnalisation

- Thèmes clair/sombre/automatique
- Couleurs personnalisées par matière
- Contrôle fin de l'affichage
- Préférences sauvegardées

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- MongoDB

### Configuration

1. **Cloner le projet**

   ```bash
   git clone https://github.com/cricran/burn.git
   cd burn
   ```

2. **Installation des dépendances**

   ```bash
   # Backend
   npm --prefix server install

   # Frontend
   npm --prefix client install
   ```

3. **Configuration environnement**

   ```bash
   cp env.example .env
   # Éditer .env avec vos paramètres
   ```

4. **Base de données**

   ```bash
   # Démarrer MongoDB
   # Créer la base de données 'burn'
   ```

5. **Lancement**

   ```bash
   # Backend (port 3000)
   cd server && npm start

   # Frontend (port 5173)
   cd client && npm run dev
   ```

## 🐳 Docker

Utilisation avec Docker Compose :

```bash
docker-compose up -d
```

## 🔧 Configuration

### Variables d'environnement

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/burn

# JWT
JWT_SECRET=your_jwt_secret

# Ports
PORT=3000
CLIENT_PORT=5173
```

### URLs de services URN

L'application se connecte aux services officiels :

- **ADE Campus** : Emploi du temps via URLs iCal
- **UniversiTice** : API Moodle avec tokens d'authentification
- **SOGo** : Messagerie via protocoles standards

## 📱 Utilisation

1. **Connexion** : Utilisez vos identifiants URN
2. **Configuration** : Ajoutez vos URLs de calendrier ADE
3. **Synchronisation** : Les données se mettent à jour automatiquement
4. **Personnalisation** : Adaptez l'interface à vos préférences

## 🏗️ Architecture

```
burn/
├── client/          # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── routes/
│   │   └── utils/
│   └── public/
├── server/          # Backend Node.js + Express
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── utils/
└── docker-compose.yml
```

### Stack technique

**Frontend :**

- React 18 + Vite
- React Router
- Lucide React (icônes)
- CSS personnalisé avec variables

**Backend :**

- Node.js + Express
- MongoDB + Mongoose
- JWT pour l'authentification
- APIs REST

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Guidelines

- Code en français pour les étudiants français
- Respecter l'architecture existante
- Tester les fonctionnalités
- Documenter les nouveautés

## 🔒 Sécurité

- Vos identifiants restent privés
- Connexions chiffrées aux services URN
- Données stockées localement
- Pas de partage avec des tiers

## ⚖️ Licence et avertissement

**Licence :** MIT - Voir [LICENSE](LICENSE)

**⚠️ Avertissement légal :**
BURN est un projet étudiant **indépendant** non affilié à l'Université de Rouen Normandie.
L'utilisation se fait sous votre responsabilité. Pour tout problème officiel,
référez-vous aux plateformes d'origine (ADE Campus, UniversiTice, SOGo).

## 👥 Contributeurs

Développé avec ❤️ par la communauté étudiante pour la communauté étudiante.

## 📞 Support

- 🐛 **Issues :** [GitHub Issues](https://github.com/cricran/burn/issues)
- 💬 **Discussions :** [GitHub Discussions](https://github.com/cricran/burn/discussions)

---

**BURN** - Parce que les outils universitaires peuvent être modernes ! 🎓✨
