# 🏖️ Beach Booking System

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://beach-app-wine.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2.0-green?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat&logo=postgresql)](https://www.postgresql.org/)

A modern beach lounge booking system with interactive maps, hotel management, and user system.

## 🌟 Features

### For Users:
- 🏖️ View available lounges on interactive maps
- 📅 Select booking dates
- 🔒 Secure booking through Google OAuth
- 📱 Responsive design for all devices

### For Managers:
- 🏗️ Edit beach area maps
- 📊 Manage bookings
- 🔄 Toggle lounge status (free/occupied/maintenance)
- 🖼️ Upload images for maps

### For Administrators:
- 🏨 Manage hotels and zones
- 👥 Assign managers
- 📈 View statistics
- ⚙️ Full system administration rights

## 🛠️ Technologies

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **Maps**: Konva.js, React-Konva
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Image Storage**: AWS S3
- **Deployment**: Vercel
- **Package Manager**: pnpm

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database
- Google OAuth application
- AWS S3 bucket

### 1. Clone the Repository

```bash
git clone <repository-url>
cd beach-booking
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables Setup

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/beach_booking"

# NextAuth.js
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_SECRET="your-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-s3-bucket-name"
AWS_S3_BUCKET_URL="https://your-s3-bucket-name.s3.amazonaws.com"
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed with test data
pnpm prisma db seed
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
beach-booking/
├── app/                    # Next.js App Router
│   ├── actions.ts         # Server actions
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin panel
│   ├── manager/           # Manager panel
│   └── book/              # Booking page
├── components/            # React components
│   ├── booking/           # Booking components
│   ├── manager/           # Manager components
│   ├── map/               # Map components
│   └── ui/                # UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── auth-utils.ts      # Authentication utilities
│   ├── events.ts          # Event manager
│   ├── prisma.ts          # Prisma client
│   └── s3.ts              # AWS S3 utilities
├── prisma/                # Database
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migrations
│   └── seed.ts            # Seeder
├── types/                 # TypeScript types
└── public/                # Static files
```

## 🚀 Deploy to Vercel

### Automatic Deployment

1. **Connect Repository to Vercel**
   - Sign up at [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure Environment Variables**
   Add all variables from `.env.local` in Vercel project settings

3. **Configure Database**
   - Use Vercel Postgres or external PostgreSQL
   - Update `DATABASE_URL` in environment variables

4. **Deploy**
   Vercel will automatically build and deploy

### Manual Deployment

```bash
# Build the project
pnpm build

# Deploy via Vercel CLI
pnpm vercel --prod
```

## 🔧 Scripts

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Database
pnpm prisma generate    # Generate Prisma client
pnpm prisma migrate dev # Run migrations
pnpm prisma db seed     # Seed with test data
pnpm prisma studio      # Open Prisma Studio
```

## 🌐 Live Project

View the live application: **[https://beach-app-wine.vercel.app](https://beach-app-wine.vercel.app)**

## 📄 License

This project is private and intended for demonstration purposes only.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Contact

For questions and suggestions, create Issues in the repository.
