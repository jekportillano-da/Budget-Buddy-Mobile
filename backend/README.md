# Budget Buddy Mobile - FastAPI Backend

A secure FastAPI backend for Budget Buddy Mobile app providing authentication, AI proxy services, and user management.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 🛡️ Secure password hashing with bcrypt
- 🤖 AI service proxy (Grok AI integration)
- 📊 User tier and preference management
- 🔄 Token refresh and validation
- 💾 SQLite database with SQLAlchemy ORM
- 🚀 Production-ready with proper error handling

## Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Run the development server:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/validate` - Validate token
- `POST /auth/logout` - Logout user

### AI Services
- `POST /ai/chat` - AI chatbot with tier gating
- `POST /ai/insights` - Financial insights (premium)
- `POST /ai/recommendations` - Budget recommendations

### User Management
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `GET /user/tier` - Get user savings tier

## Security Features

- JWT tokens with configurable expiration
- Refresh token rotation
- Password hashing with bcrypt
- Rate limiting on auth endpoints
- CORS protection
- Input validation with Pydantic
- SQL injection protection with SQLAlchemy ORM

## Development

The backend is designed to work seamlessly with the React Native frontend, providing secure authentication and AI services while keeping API keys server-side only.