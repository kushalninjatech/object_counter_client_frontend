# ANPR Client Frontend v2

Modern, responsive web interface for the ANPR (Automatic Number Plate Recognition) Client Backend system. Built with React, TypeScript, and Tailwind CSS.

## Features

### 📊 Dashboard
- Real-time system overview with key metrics
- Active cameras and workers statistics
- Detection analytics with charts
- Object class distribution visualization
- System health monitoring

### 📹 Camera Management
- Complete CRUD operations for cameras
- Live camera stream frame capture
- ROI (Region of Interest) configuration
- Detection line setup
- Start/stop worker controls per camera
- Search and filter cameras
- Real-time worker status updates

### ⚙️ Worker Management
- Monitor all active workers
- Individual worker controls (start/stop/restart)
- Bulk operations (start all/stop all)
- Worker configuration display
- Real-time status updates (every 3 seconds)
- Filter workers by camera

### 🔍 Detection Management
- Advanced filtering system:
  - By camera
  - By object class
  - By upload status
  - By date range
- Paginated table view
- Image preview modal
- Export to CSV functionality
- Statistics summary
- Retry failed uploads

### ⚙️ Settings
- API configuration management
- System health monitoring
- Environment information
- Troubleshooting guide

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM v7
- **State Management**: @tanstack/react-query v5
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns

## Prerequisites

- Node.js 18+ and npm
- ANPR Client Backend running on \`http://localhost:8000\`

## Installation

1. **Clone or navigate to the project directory:**
   \`\`\`bash
   cd anpr-frontend-v2
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment variables:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Edit \`.env\` if needed:
   \`\`\`env
   VITE_API_URL=http://localhost:8000/api/v1
   VITE_ENV=development
   \`\`\`

## Development

Start the development server:

\`\`\`bash
npm run dev
\`\`\`

The application will be available at \`http://localhost:3000\`

### Development Features
- Hot Module Replacement (HMR)
- TypeScript type checking
- ESLint code linting
- Auto-refresh on file changes

## Building for Production

Build the application:

\`\`\`bash
npm run build
\`\`\`

Preview the production build:

\`\`\`bash
npm run preview
\`\`\`

The built files will be in the \`dist\` directory.

## Project Structure

\`\`\`
anpr-frontend-v2/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout with sidebar
│   │   ├── Card.tsx         # Card component
│   │   ├── StatCard.tsx     # Statistics card
│   │   ├── Badge.tsx        # Badge component
│   │   └── LoadingSpinner.tsx # Loading indicator
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Dashboard page
│   │   ├── Cameras.tsx      # Camera management
│   │   ├── Workers.tsx      # Worker management
│   │   ├── Detections.tsx   # Detection viewing & filtering
│   │   └── Settings.tsx     # System settings
│   ├── services/            # API services
│   │   └── api.ts           # API client and endpoints
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Shared types
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .env                     # Environment variables
├── .env.example             # Example environment file
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
\`\`\`

## API Endpoints

The frontend connects to the following backend API endpoints:

### Cameras
- \`GET /api/v1/cameras\` - List all cameras
- \`POST /api/v1/cameras\` - Create camera
- \`GET /api/v1/cameras/{id}\` - Get camera by ID
- \`PUT /api/v1/cameras/{id}\` - Update camera
- \`DELETE /api/v1/cameras/{id}\` - Delete camera
- \`GET /api/v1/cameras/{id}/statistics\` - Get camera statistics
- \`GET /api/v1/cameras/{id}/frame\` - Capture camera frame
- \`GET /api/v1/cameras/search/by-name\` - Search cameras

### Workers
- \`POST /api/v1/workers/cameras/{id}/start\` - Start worker
- \`POST /api/v1/workers/cameras/{id}/stop\` - Stop worker
- \`POST /api/v1/workers/cameras/{id}/restart\` - Restart worker
- \`GET /api/v1/workers/cameras/{id}/status\` - Get worker status
- \`GET /api/v1/workers/status\` - Get all workers status
- \`POST /api/v1/workers/stop-all\` - Stop all workers

### Detections
- \`GET /api/v1/detections\` - List detections
- \`GET /api/v1/detections/{id}\` - Get detection by ID
- \`GET /api/v1/detections/camera/{id}\` - Get detections by camera
- \`POST /api/v1/detections/filter\` - Filter detections
- \`POST /api/v1/detections/count\` - Count detections
- \`GET /api/v1/detections/statistics/overview\` - Get statistics
- \`GET /api/v1/detections/statistics/by-class\` - Get class statistics

### Health
- \`GET /health\` - Health check
- \`GET /\` - Root endpoint

## Troubleshooting

### Cannot connect to backend
1. Ensure the backend is running on \`http://localhost:8000\`
2. Check CORS settings in the backend
3. Verify the \`VITE_API_URL\` in \`.env\`

### Camera frame not loading
1. Verify the camera stream URL is accessible
2. Check network connectivity
3. Ensure camera is active

### Workers not starting
1. Check camera configuration (stream URL, ROI, detection line)
2. Verify YOLO model is installed in backend
3. Check backend logs for errors

## License

Proprietary - ANPR Team 2025

---

**Version**: 2.0.0
**Last Updated**: December 2025
