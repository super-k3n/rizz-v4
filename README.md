# Rizz - Street Game Tracking App

A mobile application for tracking and analyzing street game performance metrics.

## Project Overview

Rizz helps users record and analyze their street game activities with metrics like approach count, contact acquisition, same-day dates, and close rates. The app provides visualization through progress bars and charts with daily/weekly/monthly/yearly analytics.

## Tech Stack

### Frontend
- **Framework**: Expo + React Native
- **Language**: TypeScript
- **UI**: React Native Paper + Expo Vector Icons
- **Navigation**: Expo Router
- **State Management**: Context API + useReducer
- **Forms**: Formik + Yup
- **Charts**: Victory Native

### Backend
- **Supabase**
  - PostgreSQL Database
  - Authentication
  - Storage
  - Row Level Security (RLS)

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or Yarn
- Expo CLI
- Supabase account

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/rizz-v4.git
cd rizz-v4
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment configuration**
Create a `.env` file in the root directory with the following variables:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start development server**
```bash
npm start
```

5. **Run on device/emulator**
- Press `a` to run on Android emulator
- Press `i` to run on iOS simulator
- Scan the QR code with Expo Go app on your physical device

## Database Schema

The app uses three main tables:
- **users**: User authentication and profile data
- **daily_records**: Daily game activity records
- **goals**: User-defined performance targets

## Project Structure

```
rizz-v4/
├── app/                 # Expo Router pages
├── src/
│   ├── components/      # UI components
│   ├── contexts/        # Context providers
│   ├── hooks/           # Custom hooks
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── assets/              # Static assets
└── [configuration files]
```

## Development Commands

```bash
# Start the development server
npm start

# Build for production
eas build --platform all

# Submit to stores
eas submit -p ios
eas submit -p android

# Run tests
npm test
```

## Offline Support

The app implements offline functionality using AsyncStorage and a synchronization queue system that automatically processes pending operations when the device comes back online.
