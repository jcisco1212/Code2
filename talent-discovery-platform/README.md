# TalentVault - AI-Powered Talent Discovery Platform

A comprehensive video sharing platform designed for talent discovery, featuring AI-powered performance scoring, talent ranking, and agent matching capabilities.

## Features

### For Creators
- **Video Upload & Sharing**: Upload videos showcasing your talents
- **Performance Analytics**: Get AI-powered feedback on your performances
- **Talent Categories**: Actor, Singer, Dancer, Comedian, Voice Over, and more
- **Profile Customization**: Personal profile with image upload
- **Engagement Metrics**: Track views, likes, comments, and followers
- **Growth Tracking**: Monitor your talent ranking and engagement velocity

### For Entertainment Agents
- **Advanced Talent Filters**: Search by age, skill type, performance score, region
- **AI-Recommended Talent**: Personalized recommendations based on your preferences
- **Bookmarking System**: Save and organize promising performers
- **Direct Messaging**: Connect with talent through secure messaging
- **Trend Reports**: Access predictive analytics and rising talent reports
- **Talent Lists**: Curated lists like "Top Rising Comedians"

### AI-Powered Features
- **Performance Scoring Models**:
  - Vocal accuracy and quality analysis
  - Facial expression/emotion detection
  - Movement and dance fluidity scoring
  - Timing and delivery assessment
  - Comedy timing analysis
  - On-camera presence evaluation

- **Talent Ranking Algorithm (Discover-Me)**:
  - Views and watch time
  - Comments and likes
  - AI performance score
  - Engagement velocity
  - Upload consistency
  - AI quality score
  - Category auto-tagging

- **Content Analysis**:
  - Sentiment analysis on comments
  - Troll detection
  - Trend prediction
  - Rising talent identification

### Security Features
- TLS/HTTPS everywhere with HSTS
- 2FA (Two-Factor Authentication)
- Email verification
- Rate limiting and abuse detection
- AWS WAF integration
- DDoS protection
- Virus scanning on uploads
- Content moderation (AI + human review)
- Secure video streaming with signed URLs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CloudFront CDN                          │
│                    (TLS termination, WAF)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   React App   │      │  API Server   │      │   S3 Bucket   │
│   (Frontend)  │      │   (Backend)   │      │   (Videos)    │
└───────────────┘      └───────────────┘      └───────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  PostgreSQL   │      │    Redis      │      │  AI Services  │
│   Database    │      │    Cache      │      │   (Python)    │
└───────────────┘      └───────────────┘      └───────────────┘
                               │
                               ▼
                      ┌───────────────┐
                      │Video Workers  │
                      │(Transcoding)  │
                      └───────────────┘
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for AI services)

### Local Development with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/talent-discovery-platform.git
cd talent-discovery-platform

# Copy environment files
cp .env.example .env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec api npm run db:migrate

# Access the application
# Frontend: http://localhost:3001
# API: http://localhost:3000
# API Health: http://localhost:3000/health
# MailHog: http://localhost:8025
# MinIO Console: http://localhost:9001
```

### Complete Installation Guide

See [INSTALL.md](INSTALL.md) for comprehensive installation instructions including:
- Local development setup
- AWS cloud deployment (Terraform & CloudFormation)
- Database configuration
- Security setup
- Monitoring & logging
- Troubleshooting guide

## Project Structure

```
talent-discovery-platform/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── workers/         # Video processing workers
│   │   ├── jobs/            # Background job definitions
│   │   └── utils/           # Helper functions
│   ├── migrations/          # Database migrations
│   └── seeds/               # Seed data
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API clients
│   │   ├── store/           # Redux store
│   │   └── utils/           # Helper functions
│   └── public/              # Static assets
├── ai-services/             # Python AI/ML services
│   ├── src/
│   │   ├── models/          # ML models
│   │   ├── services/        # Analysis services
│   │   └── api/             # FastAPI endpoints
│   └── data/                # Training data
├── infrastructure/          # IaC templates
│   ├── terraform/           # Terraform configs
│   ├── cloudformation/      # AWS CloudFormation
│   └── kubernetes/          # K8s manifests
├── docker/                  # Docker configurations
└── docs/                    # Documentation
```

## API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

## Environment Variables

See [.env.example](.env.example) for all required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.
