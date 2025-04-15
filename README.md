# Rizz - Street Game Performance Tracking App

A mobile application for efficiently recording and analyzing street game performance. Track and analyze key metrics like approach count, contact acquisition, same-day dates, and closes (sex) with daily/weekly/monthly/yearly detailed analytics.

## 📱 Key Features

### MVP Features

1. **Basic Counters**
   - One-tap approach count recording
   - One-tap contact acquisition recording
   - One-tap same-day date recording
   - One-tap close (sex) recording

2. **Goal Setting**
   - Period-based goals (daily, weekly, monthly, yearly)
   - Visual progress tracking on home screen (progress bars)

3. **Detailed Information**
   - Location, time, and result recording
   - Edit capabilities for past entries

4. **Analytics**
   - Daily/weekly/monthly/yearly performance aggregation
   - Visual data representation through graphs
   - Automatic calculation of contact acquisition rate, close rate, etc.

5. **Authentication & Settings**
   - Email & password authentication
   - Profile settings (username, profile picture)
   - Social media integration (X/Twitter)

### Premium Features (Planned for Future)

1. **Advanced Analytics**
   - Success rate analysis by time and location
   - Pattern recognition and improvement suggestions

2. **Community Features**
   - Overall statistics display
   - Ranking functionality
   - Anonymous information sharing

3. **Data Management**
   - Cloud backup
   - CSV export
   - Automatic GPS location recording

## 🔧 Technology Stack

### Frontend
- **Framework**: [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React Native Paper](https://reactnativepaper.com/)
- **Icons**: [Expo Vector Icons](https://docs.expo.dev/guides/icons/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **State Management**: Context API + useReducer
- **Form Management**: [Formik](https://formik.org/) + [Yup](https://github.com/jquense/yup)
- **Charts**: [Victory Native](https://formidable.com/open-source/victory/docs/native/)

### Backend
- **Supabase**: [PostgreSQL](https://www.postgresql.org/)-based backend service
  - **Authentication**: Supabase Auth
  - **Database**: PostgreSQL
  - **Storage**: Supabase Storage
  - **Security**: Row Level Security (RLS)

### Deployment
- **Build**: [Expo EAS Build](https://docs.expo.dev/eas/)
- **Distribution**:
  - iOS: App Store Connect
  - Android: Google Play Console
- **Updates**: [Expo Updates](https://docs.expo.dev/eas-update/introduction/) (OTA)

## 📂 Project Structure

```
rizz-v4/
├── .expo/               # Expo configuration files
├── app/                 # Expo Router (pages)
│   ├── _layout.tsx      # Layout configuration
│   ├── index.tsx        # Home screen (counters)
│   ├── goal/            # Goal setting screen
│   ├── data/            # Statistics data screen
│   └── setting/         # Settings screen
├── src/                 # Source code
│   ├── components/      # Common components
│   ├── contexts/        # Context providers
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Common libraries
│   ├── services/        # API integration services
│   ├── types/           # Type definitions
│   └── utils/           # Utility functions
├── assets/              # Images, fonts, and other static files
├── app.json             # Expo app configuration
├── eas.json             # EAS build configuration
├── package.json         # Dependency package configuration
└── tsconfig.json        # TypeScript configuration
```

## 🚀 Development Environment Setup

### Prerequisites
- Node.js 16.x or higher
- Latest version of npm/Yarn
- Expo CLI
- Supabase account

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/rizz-v4.git
cd rizz-v4
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Copy the `.env.example` file to create `.env` and configure Supabase authentication credentials.

4. **Start the development server**
```bash
npm start
```

5. **Test with Expo client**
Scan the generated QR code using the Expo Go app.

## 🔖 API Design

The application uses the following main API endpoints:

### Authentication API
- User registration
- Login/Logout
- Password reset

### User API
- Profile retrieval/update

### Records API
- Daily record creation/update
- Quick count update
- Period-specific record retrieval

### Goals API
- Goal setting/update
- Goal retrieval

### Statistics API
- Daily/weekly/monthly/yearly statistics retrieval

For detailed API specifications, see the [API Design Document](./docs/api-spec.md).

## 📈 Performance Optimization

- Re-rendering optimization using React Native memoization (useMemo, useCallback)
- Local caching and synchronization strategy with AsyncStorage
- Efficient Supabase query design

## 🔒 Security Measures

- Data access control using Supabase RLS
- Secure authentication based on JWT
- Input validation through data validation

## 🌐 Offline Support

- Offline data storage with AsyncStorage
- Synchronization queue for offline changes
- Network status monitoring and automatic synchronization

## 🏗️ Development Roadmap

### Phase 1: MVP Implementation (4 weeks)
- Authentication system
- Basic counter functionality
- Goal setting and statistics display

### Phase 2: Testing and Bug Fixing (2 weeks)
- User testing
- Bug fixes and performance adjustments

### Phase 3: Performance Optimization (2 weeks)
- Rendering optimization
- API request optimization
- UI refinement

### Phase 4: Store Submission Preparation (1 week)
- Preparation of materials for App Store/Google Play submission
- Build and submission

### Phase 5: Continuous Development
- Improvements based on user feedback
- Implementation of premium features

## 👥 Contributors

- [super-k3n](https://github.com/super-k3n) - Main Developer
