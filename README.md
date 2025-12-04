# Nova Adult Hockey

A cross-platform application for managing Nova Adult Hockey league check-ins, team assignments, player management, and skate pass purchases across multiple cities.

## Features

### Player Features

- User authentication with Firebase Auth (Email/Password)
- Player profiles with position, skill level, and regular night preferences
- Game check-in/check-out functionality with time restrictions (8 AM - 6 PM)
- Automatic waitlist management for non-regular players
- Real-time team rosters with balanced skill levels
- Live waitlist with check-in times and order numbers
- **Multi-city support** - Switch between Halifax, Bridgewater, and other locations
- **Stripe payment integration** - Purchase skate passes with credit cards or Apple Pay
- Skate pass options: 1-game ($18), 5-game ($85), 10-game ($160), and full-season ($600)
- Profile page with Overview, My Passes, Purchase, Schedule, and History tabs
- Next game date display when no game is scheduled

### Admin Features

- Comprehensive admin dashboard with Games, Users, Schedules, and History tabs
- Real-time game management with live player lists
- Drag-and-drop team assignment (desktop) and tap-to-move (mobile)
- Auto-balance teams by skill level and position
- Move players between waitlist and active roster
- Remove players from games with confirmation dialogs
- Mark games as completed and automatically update player statistics
- User management with search functionality
- Edit user profiles including regulars, admin status, and skate passes
- **Dynamic game schedule management** - add, edit, activate/deactivate, and delete schedules
- View game history and completed games

### Platform Support

- Responsive design for iOS, Android, and Desktop
- Native mobile interactions with action sheets
- Touch-friendly interfaces for all mobile operations
- Cross-platform authentication with Capacitor Firebase

## Tech Stack

- Vue 3 (Composition API)
- Ionic Framework 8
- Firebase Authentication
- Cloud Firestore (real-time database)
- Firebase Cloud Functions (payment processing)
- Stripe (payment gateway)
- Capacitor 7 (iOS/Android)
- Vite (build tool)
- Pinia (state management)

## Game Schedule

Game schedules are stored in Firebase Firestore per city and can be managed dynamically through the admin dashboard. Each city has its own set of schedules. Schedules can be added, edited, activated/deactivated, or deleted in real-time. Changes automatically update across all connected clients.

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd HalifaxPickupHockey
```

2. Install dependencies:

```bash
npm install
```

3. Create a Firebase project:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Create a Firestore database

4. Configure Firebase:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

5. Deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

6. Set up Cloud Functions for payments:

```bash
cd functions
npm install
```

Create `functions/.env` with your Stripe keys:

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_secret
```

Deploy Cloud Functions:

```bash
firebase deploy --only functions
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:8100`

### Building for Production

```bash
npm run build
```

### Mobile Development

Build and sync to iOS:

```bash
npm run ios
```

Or manually:

```bash
npm run build
npx cap sync ios
npx cap open ios
```

For Android:

```bash
npm run build
npx cap sync android
npx cap open android
```

## Data Models

### User Profile

```javascript
{
  email: string,
  name: string,
  position: 'Forward' | 'Defense' | 'Goalie',
  skillLevel: 1 | 2 | 3,
  regulars: {
    [cityId]: {
      [scheduleId]: boolean
    }
  },
  gamesPlayed: {
    [cityId]: number
  },
  isAdmin: boolean,
  gameHistory: array,
  passes: [{
    id: string,
    type: '1-game' | '5-game' | '10-game' | 'full-season',
    gamesRemaining: number,
    gamesTotal: number,
    purchaseDate: string (ISO date),
    status: 'active' | 'exhausted',
    stripeSessionId: string,
    usageHistory: [{
      date: string,
      venue: string,
      cityId: string
    }]
  }],
  createdAt: string (ISO date)
}
```

### Game

```javascript
{
  date: string (YYYY-MM-DD),
  cityId: string,
  scheduleKey: string,
  venue: string,
  time: string (HH:MM),
  players: [{
    uid: string,
    name: string,
    position: string,
    skillLevel: number,
    checkedInAt: string (ISO date)
  }],
  waitlist: [{
    uid: string,
    name: string,
    position: string,
    skillLevel: number,
    checkedInAt: string (ISO date)
  }],
  teamAssignments: {
    dark: array,
    light: array
  },
  status: 'active' | 'completed',
  completedAt: string (ISO date),
  createdAt: string (ISO date)
}
```

### Game Schedule

```javascript
{
  id: string,                    // e.g., 'monday_11pm_forum'
  cityId: string,                // e.g., 'halifax'
  dayOfWeek: number,             // 0 (Sunday) - 6 (Saturday)
  dayName: string,               // e.g., 'Monday'
  time: string,                  // 24h format, e.g., '23:00'
  displayTime: string,           // e.g., '11:00 PM'
  venue: string,                 // e.g., 'Forum'
  isActive: boolean,             // Whether this schedule is currently active
  order: number,                 // Sort order (typically same as dayOfWeek)
  createdAt: string (ISO date),
  updatedAt: string (ISO date)
}
```

## Skill Levels

- **Level 1**: Basic skating ability but struggles with backward skating and crossovers
- **Level 2**: A good mix of basic skills, decent knowledge of the game, and athletic ability
- **Level 3**: Advanced skills, strong physical shape, and a high understanding of the game

## Security Features

- Authentication required for check-in/check-out
- Users can only modify their own profile
- Users can only check themselves in/out
- Admin-only routes protected by route guards
- Time-based restrictions for check-ins (8 AM - 6 PM)
- Firestore security rules enforce data access controls
- Confirmation dialogs for critical admin actions

## User Interface Features

- Clean, Apple-inspired light theme design
- Dark mode support (toggleable)
- Compact, information-dense layouts
- Primary color highlights for important information
- Real-time updates without page refreshes
- Inline formatting for efficient space usage
- Mobile-optimized touch interactions
- Desktop drag-and-drop functionality
- Responsive grid layouts for admin panels
- Tabbed profile page for organized user experience

## Future Enhancements

- Push notifications for:
  - Game reminders at 8:00 AM
  - Check-in closing at 6:00 PM for checked-in players
  - Waitlist to roster promotions
- Player statistics and analytics dashboard
- Email notifications for game updates
- Historical performance tracking
- Team formation history
- Google Pay support for Android

## License

Proprietary - All rights reserved

## Contact

For questions or support, email: halifaxpickuphockey@gmail.com
