# Daily Growth OS - Frontend

## Overview

HTML/CSS/JS frontend providing a clean distraction-free interface for the Daily Growth OS application.

The frontend delivers:

- Morning check-in form (priority, morning activities, skill activities, confidence slider)
- Evening reflection form (win, mistake, lesson learned, primary source of distraction, mood rating, energy level)
- Skill logging interface (add multiple skills per day along with their activities)
- Dashboard with completion status and streak display
- Weekly insights visualization with charts
- History view with expandable daily entries

## Tech Stack

- **Framework**: React 18+
- **Language**: JavaScript (ES6+) / JSX
- **Runtime**: Node.js >= 22
- **Routing**: React Router
- **Build Tool**: Vite
- **Formatting**: Prettier


## Directory Structure

```bash
/ frontend
├── README.md
├── package.json
├── package-lock.json
├── .prettierrc
├── .prettierignore
├── eslint.config.js
├── vite.config.js
├── index.html
└── src
    ├── main.jsx
    ├── App.jsx
    ├── pages/
    ├── components/
    ├── services/
    ├── styles/
    └── assets/
```

## Page Structure

### Public / Access Pages

- **Login**
- **Signup**
- **Forgot Password**
- **Reset Password**
- **Email Verification**

### First-Time User Flow

- **Onboarding**

### Authenticated Application Pages

- **Dashboard**
- **Morning Check-In**
- **Evening Reflection**
- **Skill Practice**
- **Weekly Insights**
- **History**

## Installation

1. **Clone the repository**

    ```bash
    git clone git@github.com:varunDevrani/Daily-Growth-OS.git
    cd Daily-Growth-OS/frontend
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

## Development

```bash
npm run dev
```

## Available Scripts

- `npm run dev`     - Development server
- `npm run format`  - Format the files using prettier
- `npm run build`   - production build
- `npm run preview` - preview production build

## API Integration

### Example API Calls

### API Endpoints used
