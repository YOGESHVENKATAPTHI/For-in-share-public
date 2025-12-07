# ForInShare - Real-Time Forum Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)

A modern, real-time forum platform with advanced file sharing capabilities, built with React, Express, and WebSocket technology. Features private/public forums, live messaging, partial upload resume, and comprehensive access management.

![ForInShare Preview](https://www.dropbox.com/scl/fi/eidof2kyf0iu2xa5fgm2x/for-in-share-logo.png?rlkey=22qc7oj2q60u9feruupk08sda&st=xjplsrbx&dl=1)

## ✨ Features

### 🔄 Real-Time Communication

- **Live Messaging**: Instant chat with WebSocket-powered real-time updates
- **Forum Events**: Live notifications for forum creation, deletion, and member changes
- **Access Management**: Real-time access request approvals and rejections
- **File Upload Progress**: Live progress tracking for uploads and downloads

### 📁 Advanced File Management

- **Partial Upload Resume**: Continue interrupted uploads from where they left off
- **Distributed Storage**: Integration with Dropbox and Neon Database
- **File Preview**: Support for images, videos, PDFs, and documents
- **Chunked Uploads**: Efficient handling of large files with progress tracking

### 🛡️ Security & Access Control

- **Private Forums**: Invite-only forums with access request system
- **Role-Based Permissions**: Granular control over forum access and features
- **Secure Authentication**: Passport.js local strategy with session management
- **Data Encryption**: Secure transmission and storage of sensitive data

### 🎨 Modern UI/UX

- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark Theme**: Beautiful zinc-based color scheme optimized for long sessions
- **Intuitive Navigation**: Clean, modern interface with smooth animations
- **Accessibility**: WCAG-compliant components with keyboard navigation

### 🏗️ Architecture

- **Microservices Ready**: Modular architecture with separate client/server
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **WebSocket Clusters**: Scalable real-time communication
- **Load Balancing**: Built-in load balancer for high availability

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (Neon recommended)
- **Dropbox** account for file storage
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOGESHVENKATAPTHI/For-in-share-public.git
   cd For-in-share-public
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with:

   ```env
   DATABASE_URL=your_neon_database_url
   DROPBOX_ACCESS_TOKEN=your_dropbox_token
   SESSION_SECRET=your_secure_session_secret
   NODE_ENV=development
   ```

4. **Database Setup**

   ```bash
   npm run db:push
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## 📖 Usage

### Creating Forums

1. Navigate to the home page
2. Click "Create Forum"
3. Set forum name, description, and privacy settings
4. Invite members or set as public

### File Sharing

1. In any forum, click the upload button
2. Select files or drag and drop
3. Monitor upload progress in real-time
4. Share download links with forum members

### Real-Time Messaging

- **Desktop**: Press Enter to send, Shift+Enter for new lines
- **Mobile**: Press Enter for new lines, Ctrl+Enter to send
- Messages appear instantly for all connected users

## 🏗️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Query** - Powerful data fetching and caching
- **Wouter** - Lightweight routing library

### Backend

- **Express.js** - Fast, unopinionated web framework
- **WebSocket (ws)** - Real-time bidirectional communication
- **Passport.js** - Authentication middleware
- **Drizzle ORM** - Type-safe SQL queries
- **PostgreSQL** - Robust relational database

### Infrastructure

- **Neon Database** - Serverless PostgreSQL
- **Dropbox API** - Cloud file storage
- **PM2** - Process manager for production
- **Vite** - Fast build tool and dev server

## 📁 Project Structure

```
forum/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                 # Express backend
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database configuration
│   ├── routes.ts          # API routes
│   └── index.ts           # Server entry point
├── migrations/            # Database migrations
├── scripts/               # Utility scripts
└── package.json           # Dependencies and scripts
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:cluster      # Start with cluster mode
npm run build           # Build for production
npm start               # Start production server

# Database
npm run db:push         # Push schema changes to database
npm run check           # Type checking

# Production Deployment
npm run start:worker    # Start worker processes
npm run workers:4       # Start 4 worker processes
```

### Environment Variables

| Variable               | Description                          | Required |
| ---------------------- | ------------------------------------ | -------- |
| `DATABASE_URL`         | PostgreSQL connection string         | Yes      |
| `DROPBOX_ACCESS_TOKEN` | Dropbox API token                    | Yes      |
| `SESSION_SECRET`       | Session encryption key               | Yes      |
| `NODE_ENV`             | Environment (development/production) | No       |

## 🚀 Deployment

### Production Mode (24/7)

**Using PM2 (Recommended):**

```bash
npm install -g pm2
pm2 start "npx tsx server/index.ts" --name forum-server
pm2 save
pm2 startup
```

**Windows:**

```bash
start-server.bat
```

**Linux/Mac:**

```bash
while true; do npx tsx server/index.ts; echo "Server crashed, restarting in 5 seconds..."; sleep 5; done
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure code passes linting and type checking

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Radix UI** for accessible component primitives
- **Tailwind CSS** for the styling system
- **Drizzle ORM** for type-safe database operations
- **React Query** for efficient data management

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOGESHVENKATAPTHI/forum/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOGESHVENKATAPTHI/forum/discussions)
- **Email**: yogeshvenkatapathy@outlook.com

---

**Built with ❤️ by [Yogesh Venkatapathi](https://github.com/YOGESHVENKATAPTHI)**
