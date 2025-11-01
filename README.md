# Fest Manager

A collaborative, deadline-driven web application for managing Pre-Fest and Post-Fest arrangements with real-time notifications, team management, and task tracking.

## Features

- **User Management**: Role-based access control (Admin, Core Team Member, Team Head, Team Member)
- **Authentication**: Classic login/registration with secure password hashing
- **Advanced Team Management**: Multi-head support, member management, team templates
- **Task Management**: Create, assign, track tasks with dependencies and visibility controls
- **Real-time Notifications**: Socket.IO powered instant updates
- **Analytics & Reporting**: Dashboard analytics, team stats, user performance
- **Audit Log**: Track all changes in the system
- **Responsive UI**: Modern, mobile-friendly interface

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL with Sequelize ORM
- **Real-time**: Socket.IO
- **Authentication**: JWT tokens, bcrypt password hashing
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Scheduling**: node-cron for deadline reminders

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Setup

1. **Clone the repository** (or extract the files)

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure MySQL database**:

   Create a MySQL database and user:

   ```sql
   CREATE DATABASE fest_manager;
   CREATE USER 'festmanager'@'localhost' IDENTIFIED BY 'festmanager123';
   GRANT ALL PRIVILEGES ON fest_manager.* TO 'festmanager'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Configure environment variables**:

   Edit the `.env` file with your settings:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=fest_manager
   DB_USER=festmanager
   DB_PASSWORD=festmanager123
   JWT_SECRET=your_super_secret_jwt_key
   ```

5. **Initialize the database**:

   ```bash
   npm run init-db
   ```

   This will create all necessary tables and a default admin user:

   - Email: `admin@festmanager.com`
   - Username: `admin`
   - Password: `admin123`

6. **Start the server**:

   ```bash
   npm start
   ```

   For development with auto-restart:

   ```bash
   npm run dev
   ```

7. **Access the application**:

   Open your browser and navigate to: `http://localhost:3000`

## Default Credentials

After running `npm run init-db`, you can login with:

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Please change the admin password immediately after first login!**

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `GET /api/users/:id/stats` - Get user statistics

### Teams

- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `POST /api/teams/:id/heads` - Add team heads
- `POST /api/teams/:id/members` - Add team members

### Tasks

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/complete` - Mark task as complete

### Notifications

- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read

### Analytics

- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/team/:id` - Team analytics
- `GET /api/analytics/user/:id` - User analytics

## Project Structure

```
fest-manager/
├── config/              # Configuration files
│   ├── database.js      # Database connection
│   └── jwt.js           # JWT configuration
├── models/              # Database models
│   ├── User.js
│   ├── Team.js
│   ├── Task.js
│   └── ...
├── routes/              # API routes
│   ├── auth.js
│   ├── users.js
│   ├── teams.js
│   ├── tasks.js
│   └── ...
├── middleware/          # Express middleware
│   ├── auth.js
│   └── validation.js
├── services/            # Business logic
│   └── cronJobs.js
├── public/              # Frontend files
│   ├── css/
│   ├── js/
│   ├── index.html
│   └── login.html
├── scripts/             # Utility scripts
│   └── initDatabase.js
├── .env                 # Environment variables
├── .gitignore
├── package.json
├── server.js            # Main server file
└── README.md
```

## Features Detail

### User Roles

1. **Admin**: Full system access, user/team/task management
2. **Core Team Member**: Team management, oversight of all tasks
3. **Team Head**: Manage team members, create/assign tasks
4. **Team Member**: View and complete assigned tasks

### Task Features

- Task creation with title, description, deadline, priority
- Assign tasks to specific users
- Task dependencies (tasks that depend on other tasks)
- Visibility controls (public, team, core, private)
- Task status tracking (Pending, In Progress, Completed, Overdue)
- Priority levels (Low, Medium, High, Critical)
- Comments and threaded discussions
- File attachments support

### Team Features

- Create teams with descriptions and colors
- Assign multiple team heads per team
- Add/remove team members
- Track team statistics and performance
- Team-specific task views

### Notifications

- Real-time task assignment notifications
- Deadline reminders (automatic)
- Task completion alerts
- Comment notifications
- Customizable notification preferences

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic server restart on file changes.

### Database Migrations

To reset the database and recreate all tables:

```bash
npm run init-db
```

⚠️ This will drop all existing data!

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update `JWT_SECRET` and `SESSION_SECRET` with strong random values
3. Configure proper database credentials
4. Set up SSL/HTTPS
5. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name fest-manager
   ```

## Security Notes

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation on all endpoints
- SQL injection protection via Sequelize
- XSS protection with proper escaping

## Support

For issues or questions, please check the code comments or create an issue in the repository.

## License

MIT License - Feel free to use this project for your fest management needs!

---

Built with ❤️ for efficient fest management
