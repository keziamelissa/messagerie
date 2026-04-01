# Messagerie - Application Complète

Application de messagerie temps réel avec Node.js, Express, PostgreSQL, Sequelize, React et Socket.io.

## Architecture

```
messagerie/
├── backend/                 # API REST + WebSocket
│   ├── config/
│   │   └── database.js     # Configuration PostgreSQL
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── app.js              # Point d'entrée + Socket.io
│
└── frontend/               # Application React
    ├── src/
    │   ├── context/        # AuthContext + SocketContext
    │   ├── pages/          # Login, Register, Dashboard, Chat
    │   └── App.jsx
    └── package.json
```

## Prérequis

- **Node.js** v16+
- **PostgreSQL** installé et en cours d'exécution

## Installation & Démarrage

### 1. Base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE messagerie;

# Quitter
\q
```

### 2. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configuration
# Copier .env.example en .env et modifier :
# - DB_PASSWORD (votre mot de passe PostgreSQL)
# - JWT_SECRET (clé aléatoire pour JWT)
cp .env.example .env

# Démarrer le serveur
npm run dev
```

Le backend démarre sur `http://localhost:3000`

### 3. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer l'application
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

## Fonctionnalités

### Authentification
- Inscription / Connexion / Déconnexion
- JWT Token stocké dans localStorage
- Protection des routes

### Conversations
- Chat privé (2 utilisateurs)
- Groupes (nommés, plusieurs membres)
- Liste des conversations
- Création de nouvelles conversations

### Messages (Temps réel)
- Envoi/réception instantanés via WebSocket
- Historique des messages
- Indicateur de lecture
- Typing indicator

### Notifications
- Notifications push pour nouveaux messages
- Compteur de notifications non lues
- Marquage comme lu

## Flow Utilisateur

```
1. Inscription / Connexion
        ↓
2. Dashboard (liste des conversations)
        ↓
3. Créer ou sélectionner une conversation
        ↓
4. Chat temps réel avec l'autre utilisateur
        ↓
5. Notification envoyée à l'autre utilisateur
        ↓
6. L'autre utilisateur reçoit en temps réel (WebSocket)
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

### Users
- `GET /api/users` - Liste des utilisateurs

### Conversations
- `GET /api/conversations/my` - Mes conversations
- `POST /api/conversations` - Créer une conversation

### Messages
- `GET /api/messages/conversation/:id` - Messages d'une conversation
- `POST /api/messages` - Envoyer un message

### Notifications
- `GET /api/notifications` - Mes notifications
- `GET /api/notifications/unread-count` - Nombre non lues

## WebSocket Events (Socket.io)

### Client → Server
- `join_conversation` - Rejoindre une room
- `leave_conversation` - Quitter une room
- `send_message` - Envoyer un message
- `typing` - Indiquer qu'on écrit

### Server → Client
- `new_message` - Nouveau message reçu
- `notification` - Notification reçue
- `user_typing` - Un utilisateur écrit
- `user_status_change` - Changement de statut

## Stack Technique

### Backend
- **Node.js** + **Express**
- **PostgreSQL** + **Sequelize** ORM
- **Socket.io** pour WebSocket
- **JWT** pour authentification
- **bcryptjs** pour hashage mot de passe

### Frontend
- **React 18** + **Vite**
- **React Router** pour navigation
- **Socket.io-client** pour WebSocket
- **Axios** pour HTTP
- **date-fns** pour formatage dates
- **Lucide React** pour icônes

## Développement

### Ports par défaut
- Backend: `3000`
- Frontend: `5173`

### Proxy Vite (déjà configuré)
Les requêtes API sont automatiquement proxy vers le backend en développement.

## Structure des Tables (PostgreSQL)

- **users** - Utilisateurs
- **conversations** - Conversations (groupes ou privées)
- **conversation_members** - Liaison many-to-many
- **messages** - Messages
- **notifications** - Notifications

## Production

Pour un déploiement en production :

1. Modifier `JWT_SECRET` avec une valeur aléatoire forte
2. Configurer `DATABASE_URL` pour PostgreSQL distant
3. Builder le frontend : `npm run build`
4. Servir le frontend buildé via le backend ou un CDN
5. Utiliser HTTPS pour WebSocket
