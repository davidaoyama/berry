# BERRY - LAUSD Resource Management System

BERRY is a Next.js 14 + TypeScript application designed for LAUSD educators to request and manage educational resources. The system features Firebase authentication restricted to @lausd.net email addresses, comprehensive resource management, and an admin dashboard.

## Features

### 🔐 Authentication
- Firebase Authentication with @lausd.net email restriction
- Google OAuth integration with domain restriction
- Email verification flow
- Role-based access control (Teacher/Admin)

### 📚 Resource Management
- Browse all educational resources with filtering and search
- Detailed resource view with modal display
- Category-based organization (Technology, Books, Supplies, Equipment, Other)
- Priority levels (High, Medium, Low)
- Status tracking (Pending, Approved, Denied)

### 📝 Resource Application
- Comprehensive form for requesting new resources
- Form validation with Zod schema
- File upload support (extensible)
- Real-time form feedback

### ⚙️ Admin Dashboard
- Approve/deny resource requests
- System statistics and analytics
- Batch operations support
- Audit trail for all actions

### 🎨 User Interface
- Responsive design with Tailwind CSS
- Mobile-friendly navigation
- Dark mode support (extensible)
- Accessible components

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Placeholder service (easily replaceable)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **State Management**: React Context

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BERRY
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Firebase project credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

4. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication with Email/Password and Google providers
   - Configure OAuth domain restrictions for @lausd.net
   - Set up Firestore Database (when ready to replace placeholder)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to http://localhost:3000

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Authentication page
│   ├── resources/         # Resource list and details
│   ├── apply/             # Resource application form
│   ├── admin/             # Admin dashboard
│   └── layout.tsx         # Root layout with providers
├── components/            # Reusable UI components
│   ├── Navigation.tsx     # Main navigation
│   └── ui.tsx            # UI component library
├── hooks/                 # Custom React hooks
│   └── useAuth.tsx       # Authentication context
├── lib/                   # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   └── database.ts       # Database service layer
├── types/                 # TypeScript type definitions
│   └── index.ts          # Shared interfaces
└── middleware.ts          # Next.js middleware for auth
```

## Database Layer

The application currently uses a placeholder database service in `src/lib/database.ts`. This can be easily replaced with:

### Firebase Firestore
```typescript
// Replace imports in database.ts
import { db } from './firebase';
import { collection, doc, addDoc, getDoc, updateDoc } from 'firebase/firestore';
```

### Supabase
```typescript
// Install: npm install @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';
```

### Prisma + PostgreSQL
```typescript
// Install: npm install prisma @prisma/client
import { PrismaClient } from '@prisma/client';
```

## Configuration

### Admin Users
To grant admin access to a user:
1. User must first sign up and verify their email
2. Manually update their role in the database to 'admin'
3. Admin will have access to `/admin` dashboard

### Email Domain Restriction
The system is configured to only allow @lausd.net email addresses. To modify:
1. Update `isValidLausdEmail` function in `src/lib/firebase.ts`
2. Update Google OAuth domain hint in `src/hooks/useAuth.tsx`

## Extension Points

The application is designed for easy extension:

### 🔧 Database Migration
- Replace `src/lib/database.ts` with your preferred database
- Update type imports as needed
- Implement the `DatabaseService` interface

### 📁 File Uploads
- Add file upload to resource application form
- Integrate with Firebase Storage, AWS S3, or Cloudinary
- Update resource types to include attachments

### 🔔 Notifications
- Email notifications for status changes
- In-app notification system
- SMS alerts for critical updates

### 📊 Analytics
- Resource usage analytics
- User activity tracking
- Budget planning tools

### 🎯 Advanced Features
- Workflow automation
- Approval chains
- Budget tracking
- Inventory management
- Procurement integration

## API Routes

The application is ready for API routes to be added:

```typescript
// src/app/api/resources/route.ts
export async function GET() {
  // Fetch resources from database
}

export async function POST() {
  // Create new resource
}
```

## Testing

The application structure supports easy testing:

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Add test scripts to package.json
"test": "jest",
"test:watch": "jest --watch"
```

## Security

- Authentication required for all protected routes
- Role-based access control for admin features
- Email domain restriction prevents unauthorized access
- CSRF protection via Next.js middleware
- Input validation with Zod schemas

## Contributing

1. Follow the existing code style and TypeScript patterns
2. Add comments for complex logic
3. Include extension points for future features
4. Test your changes thoroughly
5. Update this README for significant changes

## License

This project is for LAUSD internal use. All rights reserved.

## Support

For technical support or feature requests, please contact the development team or create an issue in the repository.
