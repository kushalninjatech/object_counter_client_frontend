# ANPR Frontend v2 - Workflow Guide

## Overview

The new frontend has been redesigned to match the old frontend's UX while working with the new API. The key improvement is the **separation of concerns** between camera management, ROI configuration, and worker control.

---

## Complete User Workflow

### 1️⃣ Create a Camera (Cameras Page)

**Location:** `/cameras`

**Steps:**
1. Click **"Add Camera"** button
2. Fill in the form:
   - **Camera Name**: e.g., "Front Gate Camera"
   - **Stream URL**: RTSP/HTTP URL (e.g., `rtsp://admin:pass@192.168.1.100:554/stream`)
   - **Target FPS**: 1-30 (default: 3)
   - **Confidence**: 0.0-1.0 (default: 0.3)
   - **Organization ID**: Default 1
3. Click **"Create Camera"**

**Note:** ROI polygon and detection line are NOT required at creation. They default to `[[0,0]]` and `[0,0,0,0]`.

**Result:** Camera is created with "ROI Not Configured" status.

---

### 2️⃣ Configure ROI & Detection Line (Camera Detail Page)

**Location:** `/cameras/:id`

**Steps:**
1. From Cameras page, click **"Configure ROI"** button on a camera card
2. Click **"Fetch Snapshot"** to load a frame from the camera stream
3. **Draw ROI Polygon** (Green):
   - Click 4 points on the canvas to define the region of interest
   - Points are numbered 1-4
   - The polygon fills with semi-transparent green
   - Use **"Clear ROI"** to reset
4. **Draw Detection Line** (Red):
   - Click mode switches automatically after ROI is complete
   - Click 2 points to draw the detection line
   - Points are numbered 1-2
   - Use **"Clear Line"** to reset
5. Click **"Save Configuration"**

**Features:**
- Real-time mouse position tracking
- Visual preview of lines/polygons as you draw
- Shows current coordinates as JSON
- Instructions panel guides you
- **"Refresh Frame"** button to reload snapshot
- **"Back to Cameras"** to return without saving

**Result:** Camera ROI and detection line are saved. Status changes to "ROI Configured".

---

### 3️⃣ Start Worker (Workers Page)

**Location:** `/workers`

**Steps:**
1. Navigate to **Workers** page
2. Find the camera in the list
3. Click **"Start Worker"** button (large green gradient button)

**Features:**
- Shows all cameras with their worker status
- Real-time status updates (every 3 seconds)
- Green gradient cards for running workers
- Gray gradient cards for stopped workers
- Displays worker configuration: FPS, confidence, ROI points, detection line
- **Start/Stop/Restart** buttons
- Statistics at top showing total workers, running, and stopped counts

**Result:** Worker starts processing the camera stream. Status updates to "Running" with animated pulse.

---

## Page Breakdown

### 📹 Cameras Page (`/cameras`)

**Purpose:** Basic camera CRUD operations

**Features:**
- Card-based grid layout
- Each card shows:
  - Camera name
  - Stream URL
  - Target FPS and Confidence
  - Active/Inactive status badge
  - ROI configuration status badge
- **Actions per camera:**
  - **Configure ROI**: Navigate to detail page
  - **Edit**: Update camera basic info (name, URL, FPS, confidence)
  - **Delete**: Remove camera (with confirmation)
- Stats bar showing: Total cameras, Active cameras, ROI Configured count
- Toast notifications for all actions

**No Worker Controls Here!** - Workers are managed in the Workers page.

---

### 🎨 Camera Detail Page (`/cameras/:id`)

**Purpose:** Configure ROI polygon and detection line with visual canvas

**Features:**
- **Camera Information Panel:**
  - Stream URL
  - Current FPS and Confidence
  - ROI and Line coordinates (live JSON)
- **Canvas Drawing:**
  - Interactive canvas with mouse tracking
  - Click to place points
  - Real-time visual feedback
  - Numbered points for clarity
- **Drawing Modes:**
  - ROI Polygon (4 points, green, filled)
  - Detection Line (2 points, red, solid)
- **Controls:**
  - Fetch Snapshot
  - Refresh Frame
  - Clear ROI
  - Clear Line
  - Save Configuration
  - Back to Cameras
- **Instructions:**
  - Step-by-step guide
  - Color-coded hints
  - Current step indicator

**Canvas Details:**
- Green polygon for ROI (semi-transparent fill)
- Red line for detection boundary
- Points numbered 1-4 (ROI) and 1-2 (Line)
- Mouse cursor shows preview of next point
- Exact pixel coordinates

---

### ⚙️ Workers Page (`/workers`)

**Purpose:** Start, stop, and monitor workers

**Features:**
- **Statistics Dashboard:**
  - Total Workers count
  - Running Workers count
  - Stopped Workers count
- **Worker Cards:**
  - Gradient header (green=running, gray=stopped)
  - Camera name and stream URL
  - Worker configuration display
  - Status badge with animated pulse
  - FPS and Confidence indicators
  - ROI polygon points count
  - Detection line status
  - Large Start/Stop button
- **Auto-Refresh:**
  - Updates every 3 seconds
  - Real-time worker status
- Toast notifications for all actions

---

### 🔍 Detections Page (`/detections`)

**Purpose:** View and filter detections

**Features:**
- Advanced filtering:
  - By camera
  - By object class
  - By upload status
  - By date range
- Statistics cards showing counts
- Paginated table (20 items per page)
- Image preview modal
- Export to CSV
- Real-time updates (every 5 seconds)

---

### 📊 Dashboard Page (`/dashboard`)

**Purpose:** System overview and analytics

**Features:**
- Key metrics cards:
  - Active Cameras
  - Running Workers
  - Total Detections
  - Upload Success Rate
- Charts:
  - Detections by Camera (Bar chart)
  - Object Class Distribution (Pie chart)
- System health alerts
- Auto-refresh statistics

---

### ⚙️ Settings Page (`/settings`)

**Purpose:** System configuration and health monitoring

**Features:**
- API URL configuration
- Health check status
- System information
- Environment details
- Troubleshooting guide

---

## Key Differences from Old Frontend

### API Changes
| Old Field | New Field |
|-----------|-----------|
| `rtsp_url` | `stream_url` |
| `vehicle_track_id` | `object_track_id` |
| `vehicle_class` | `object_class` |
| `/cameras/{id}/worker` | `/workers/cameras/{id}/start` or `/stop` |

### Endpoint Changes
- Base URL: `http://localhost:8000` → `http://localhost:8000/api/v1`
- Worker control: Single endpoint → Separate start/stop/restart endpoints
- Added: Statistics endpoints, search endpoints, advanced filtering

---

## Technical Details

### State Management
- **React Query** for server state (caching, auto-refresh)
- **useState** for local UI state
- Optimistic updates for better UX

### Canvas Implementation
- Uses HTML5 Canvas API
- Stores background image reference for redrawing
- Mouse tracking for real-time preview
- Coordinate precision maintained
- Responsive to canvas size

### Real-time Updates
- Dashboard: 30 seconds
- Workers: 3 seconds
- Detections: 5 seconds
- Settings health: 10 seconds

---

## Troubleshooting

### Camera snapshot not loading
1. Verify stream URL is correct
2. Check camera is accessible from backend server
3. Ensure backend is running on `http://localhost:8000`
4. Try "Refresh Frame" button

### Worker won't start
1. Ensure ROI is configured (polygon must have 4 points)
2. Ensure detection line is configured (must have 2 points)
3. Check stream URL is accessible
4. Check backend logs for errors
5. Verify YOLO model is installed in backend

### Cannot draw ROI
1. Click "Fetch Snapshot" first
2. Make sure snapshot loads successfully
3. Click exactly 4 points for ROI
4. Use "Clear ROI" if you make a mistake

---

## Development

### Start Dev Server
```bash
cd anpr-frontend-v2
npm run dev
```
Opens at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

### Environment Variables
Edit `.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Summary

The new frontend provides a clean, intuitive workflow:
1. **Cameras Page** → Basic camera management
2. **Camera Detail Page** → Visual ROI/Line configuration
3. **Workers Page** → Worker control and monitoring
4. **Detections Page** → View and analyze results
5. **Dashboard** → System overview

Each page has a specific purpose, making the system easier to use and maintain.
