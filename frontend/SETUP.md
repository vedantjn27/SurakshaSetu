# SurakshaSetu Frontend - Setup & Running Guide

## Overview

This is the professional, production-ready frontend for SurakshaSetu—an AI-powered identity verification and fraud detection platform. The frontend is built with Next.js 15, Tailwind CSS, Framer Motion animations, and full multilingual support (English, Hindi, Kannada).

## Prerequisites

- Node.js 18+ 
- npm (or yarn/pnpm)
- Backend API running at `http://localhost:8000`

## Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure API endpoint:**
   Edit `.env.local` and set your backend API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Project Structure

```
frontend/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Redirect page
│   ├── branding/
│   │   └── page.tsx             # Professional branding/landing page
│   ├── login/
│   │   └── page.tsx             # Role-based login page
│   ├── dashboard/
│   │   ├── layout.tsx           # Protected dashboard layout
│   │   ├── page.tsx             # Admin dashboard with KPI metrics
│   │   └── [dynamic routes]     # Child routes
│   └── [other routes]/          # UBID Registry, Data Upload, Review Center, etc.
│
├── components/                   # Reusable React components
│   ├── Navbar.tsx               # Top navigation with language selector
│   ├── Sidebar.tsx              # Role-based sidebar navigation
│   └── [other components]/
│
├── contexts/
│   └── AuthContext.tsx          # Authentication context & hooks
│
├── lib/
│   ├── api.ts                   # Axios instance with interceptors
│   ├── i18n.ts                  # i18next configuration
│   └── utils.ts                 # Utility functions
│
├── locales/
│   ├── en.json                  # English translations
│   ├── hi.json                  # Hindi translations
│   └── kn.json                  # Kannada translations
│
├── public/
│   └── images/
│       ├── hero-bg.jpg          # Generated hero background
│       ├── login-bg.jpg         # Generated login background
│       ├── dashboard-bg.jpg     # Generated dashboard background
│       └── network-bg.jpg       # Generated network graph background
│
├── middleware.ts                # Route protection middleware
├── globals.css                  # Global styles & design tokens
├── tailwind.config.ts          # Tailwind CSS configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## Key Features

### Authentication & Authorization
- Role-based login with selector (Admin, Reviewer, Analyst)
- JWT token management with localStorage
- Protected routes with automatic redirect to login
- Language preference persistence

### Pages & Features

1. **Branding Page** (`/branding`)
   - Professional hero section with parallax effects
   - Features showcase with animated cards
   - How-it-works section with step visualization
   - Call-to-action buttons

2. **Login Page** (`/login`)
   - Role selector dropdown for access level selection
   - Email/password authentication
   - Professional background imagery
   - Error handling with localized messages

3. **Dashboard** (`/dashboard`)
   - KPI cards with animated counters
   - Real-time statistics from backend
   - AI-powered natural language search
   - Recent activity sidebar

4. **UBID Registry** (`/ubid-registry`)
   - Searchable table of identity records
   - Pagination support
   - 360° profile view with linked records
   - Role-based action buttons (Unscramble, Split, Override, etc.)

5. **Data Ingestion** (`/data-upload`)
   - Drag-and-drop CSV file upload
   - Real-time job progress tracking
   - Support for master data and event data
   - Processing status indicator

6. **Review Center** (`/review-center`)
   - Ambiguous match review workflow
   - Orphan event assignment interface
   - AI-suggested matches with confidence scores
   - Approve/Reject/Escalate actions

7. **Audit Logs** (`/audit-logs`)
   - System-wide activity logs
   - Searchable audit trail
   - Action-based color coding
   - Pagination

8. **Privacy Playground** (`/privacy-playground`)
   - PII Scrambler (deterministic encryption)
   - PII Unscrambler (admin-only)
   - Secure data handling demonstration

### Multilingual Support
- Real-time language switching (EN/हिन्दी/ಕನ್ನಡ)
- Accept-Language header sent with all API requests
- Complete UI translation
- Language preference persisted in localStorage

### Design & Animations
- Professional blue color scheme (Primary: #1e40af)
- Smooth Framer Motion animations on all interactions
- Responsive design (mobile-first approach)
- Card hover effects with elevation
- Loading spinners and progress indicators
- Toast notifications for actions

## API Integration

The frontend communicates with the backend via the API client in `lib/api.ts`. All endpoints include:
- Automatic JWT token attachment
- Accept-Language header for multilingual responses
- Error handling with 401 redirect
- Request/response interceptors

### Available API Endpoints
- `/auth/login` - Role-based authentication
- `/admin/stats` - Dashboard statistics
- `/query/ask` - AI-powered queries
- `/ubid/list`, `/ubid/{id}`, `/ubid/{id}/network` - UBID operations
- `/ingest/csv`, `/ingest/events` - Data ingestion
- `/review/queue`, `/review/orphans` - Review workflows
- `/admin/audit` - Audit logs
- `/admin/scramble`, `/admin/unscramble` - PII operations

## Environment Variables

### Required
- `NEXT_PUBLIC_API_URL` - Backend API base URL (e.g., `http://localhost:8000`)

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations
- Next.js Image component for automatic image optimization
- Code splitting with dynamic imports
- Server-side rendering where applicable
- Efficient React Query caching
- Tailwind CSS purging in production

## Troubleshooting

### CORS Issues
If you see CORS errors, ensure your backend is running and `NEXT_PUBLIC_API_URL` is correctly set.

### Login Issues
- Check that the backend is accessible
- Verify role selection is made before login
- Check browser console for detailed error messages

### Image Not Loading
- Ensure image files exist in `/public/images/`
- Check `next.config.js` for image configuration

### Language Not Changing
- Clear localStorage and try again
- Check browser console for i18next errors
- Ensure translations are loaded correctly

## Development Tips

1. **Hot Reload**: Changes to files automatically refresh the browser
2. **Debug**: Use `console.log()` to debug, or use VS Code debugger
3. **React DevTools**: Install React DevTools extension for better component inspection
4. **Network Tab**: Check the Network tab in DevTools to inspect API calls

## Building for Production

```bash
npm run build
npm start
```

The build creates optimized bundles in the `.next` folder. Deploy this to any Node.js hosting (Vercel, AWS, etc.).

## Deployment to Vercel

1. Push code to GitHub
2. Go to vercel.com and import the project
3. Set environment variables in Vercel dashboard
4. Vercel automatically builds and deploys on each push

## Support & Documentation

For more information about the architecture and implementation, see the root `surakshasetu_frontend_blueprint.md` file.

---

**Last Updated**: May 2026
**Version**: 1.0.0
**Status**: Production Ready
