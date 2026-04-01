# Messagerie API

Application de messagerie avec Node.js, Express, PostgreSQL et Sequelize.

## Structure du projet

```
backend/
├── config/
│   └── database.js              # Configuration PostgreSQL/Sequelize
├── controllers/
│   ├── authController.js         # Inscription, connexion, déconnexion
│   ├── userController.js         # CRUD utilisateurs
│   ├── conversationController.js # Gestion des conversations
│   ├── messageController.js      # Envoi et gestion des messages
│   └── notificationController.js # Notifications
├── models/
│   ├── User.js                   # Modèle utilisateur
│   ├── Conversation.js           # Modèle conversation
│   ├── ConversationMember.js     # Table de jointure conversation-members
│   ├── Message.js                # Modèle message
│   ├── Notification.js           # Modèle notification
│   └── index.js                  # Export des modèles + associations
├── routes/
│   ├── authRoutes.js             # Routes auth (/api/auth)
│   ├── userRoutes.js             # Routes users (/api/users)
│   ├── conversationRoutes.js     # Routes conversations (/api/conversations)
│   ├── messageRoutes.js          # Routes messages (/api/messages)
│   └── notificationRoutes.js     # Routes notifications (/api/notifications)
├── middleware/
│   └── auth.js                   # Middleware JWT
├── app.js                        # Point d'entrée
├── package.json
└── .env.example                  # Exemple de variables d'environnement
```

## Prérequis

- PostgreSQL installé et en cours d'exécution
- Node.js v16+

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Créer une base de données PostgreSQL :
```sql
CREATE DATABASE messagerie;
```

2. Copier `.env.example` en `.env` et modifier les valeurs :
```bash
cp .env.example .env
```

Variables:
- `PORT` - Port du serveur (défaut: 3000)
- `DB_HOST` - Hôte PostgreSQL (défaut: localhost)
- `DB_PORT` - Port PostgreSQL (défaut: 5432)
- `DB_NAME` - Nom de la base de données
- `DB_USER` - Utilisateur PostgreSQL
- `DB_PASSWORD` - Mot de passe PostgreSQL
- `JWT_SECRET` - Clé secrète JWT

## Démarrage

```bash
# Mode production
npm start

# Mode développement (avec nodemon)
npm run dev
```

Les tables seront créées automatiquement au démarrage grâce à `sequelize.sync()`.

## API Endpoints

### Auth (pas besoin de token)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |

### Auth (token requis)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Profil utilisateur |

### Users (token requis)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/users` | Liste des utilisateurs |
| GET | `/api/users/:id` | Détails utilisateur |
| PUT | `/api/users/:id` | Modifier utilisateur |
| DELETE | `/api/users/:id` | Supprimer utilisateur |

### Conversations (token requis)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/conversations` | Créer conversation |
| GET | `/api/conversations/my` | Mes conversations |
| GET | `/api/conversations/:id` | Détails conversation |
| PUT | `/api/conversations/:id` | Modifier conversation |
| DELETE | `/api/conversations/:id` | Supprimer conversation |

### Messages (token requis)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/messages` | Envoyer message |
| GET | `/api/messages/conversation/:conversationId` | Messages d'une conversation |
| PUT | `/api/messages/:id/read` | Marquer comme lu |
| DELETE | `/api/messages/:id` | Supprimer message |

### Notifications (token requis)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/notifications` | Mes notifications |
| GET | `/api/notifications/unread-count` | Nombre non lues |
| PUT | `/api/notifications/:id/read` | Marquer comme lue |
| PUT | `/api/notifications/read-all` | Tout marquer comme lu |
| DELETE | `/api/notifications/:id` | Supprimer notification |

## Headers requis pour routes protégées

```
Authorization: Bearer <token_jwt>
```

## Exemples de requêtes

### Inscription
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"123456"}'
```

### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
```

### Créer conversation privée
```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"members":["uuid-user-1","uuid-user-2"],"isGroup":false}'
```

### Envoyer message
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"conversationId":"uuid-conv","content":"Hello!","type":"text"}'
```

## Différences avec MongoDB

- **Modèles** : Sequelize ORM à la place de Mongoose
- **Relations** : Table `conversation_members` pour relation many-to-many (PostgreSQL n'a pas de tableaux comme MongoDB)
- **IDs** : UUID (string) au lieu de ObjectId
- **Requêtes** : `findAll()`, `findByPk()`, etc. au lieu de `find()`, `findById()`
