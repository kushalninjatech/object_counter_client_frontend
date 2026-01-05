import axios from 'axios';
import type {
  Camera,
  CameraCreate,
  CameraUpdate,
  CameraStatistics,
  Detection,
  DetectionFilter,
  DetectionStatistics,
  WorkerStatus,
  ApiResponse,
  HealthStatus,
} from '../types';
import { config } from '../config';

// Get API base URL from config
const API_BASE_URL = config.apiUrl;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Camera API
export const cameraApi = {
  // Get all cameras
  getAll: (params?: { skip?: number; limit?: number; active_only?: boolean }) =>
    api.get<Camera[]>('/cameras', { params }),

  // Get camera by ID
  getById: (id: number) =>
    api.get<Camera>(`/cameras/${id}`),

  // Create new camera
  create: (data: CameraCreate) =>
    api.post<ApiResponse>('/cameras', data),

  // Update camera
  update: (id: number, data: CameraUpdate) =>
    api.put<ApiResponse>(`/cameras/${id}`, data),

  // Delete camera
  delete: (id: number, soft_delete: boolean = true) =>
    api.delete<ApiResponse>(`/cameras/${id}`, { params: { soft_delete } }),

  // Get camera statistics
  getStatistics: (id: number) =>
    api.get<CameraStatistics>(`/cameras/${id}/statistics`),

  // Get camera frame
  getFrame: (id: number) =>
    api.get(`/cameras/${id}/frame`, { responseType: 'blob' }),

  // Search cameras by name
  search: (name: string, limit: number = 10) =>
    api.get<Camera[]>('/cameras/search/by-name', { params: { name, limit } }),

  // Start camera stream
  startStream: (cameraId: number, targetFps: number = 15) =>
    api.post<ApiResponse>(`/cameras/${cameraId}/stream/start`, null, { params: { target_fps: targetFps } }),

  // Stop camera stream
  stopStream: (cameraId: number) =>
    api.post<ApiResponse>(`/cameras/${cameraId}/stream/stop`),

  // Get all streams status
  getStreamsStatus: () =>
    api.get<{ total_streams: number; active_streams: any[] }>('/cameras/streams/status'),

  // Get stream URL for a camera
  getStreamUrl: (cameraId: number) =>
    `${api.defaults.baseURL}/cameras/${cameraId}/stream`,
};

// Worker API
export const workerApi = {
  // Start worker
  start: (cameraId: number) =>
    api.post<ApiResponse>(`/workers/cameras/${cameraId}/start`),

  // Stop worker
  stop: (cameraId: number) =>
    api.post<ApiResponse>(`/workers/cameras/${cameraId}/stop`),

  // Restart worker
  restart: (cameraId: number) =>
    api.post<ApiResponse>(`/workers/cameras/${cameraId}/restart`),

  // Get worker status
  getStatus: (cameraId: number) =>
    api.get<WorkerStatus>(`/workers/cameras/${cameraId}/status`),

  // Get all workers status
  getAllStatus: () =>
    api.get<{ active_workers: WorkerStatus[] }>('/workers/status'),

  // Stop all workers
  stopAll: () =>
    api.post<ApiResponse>('/workers/stop-all'),
};

// Detection API
export const detectionApi = {
  // Get all detections with pagination
  getAll: (params?: { skip?: number; limit?: number }) =>
    api.get<Detection[]>('/detections', { params }),

  // Get detection by ID
  getById: (id: number) =>
    api.get<Detection>(`/detections/${id}`),

  // Get detections by camera
  getByCamera: (cameraId: number, params?: { skip?: number; limit?: number }) =>
    api.get<Detection[]>(`/detections/camera/${cameraId}`, { params }),

  // Get detections by object class
  getByClass: (objectClass: string, params?: { skip?: number; limit?: number }) =>
    api.get<Detection[]>(`/detections/object-class/${objectClass}`, { params }),

  // Get detections by track ID
  getByTrackId: (trackId: string) =>
    api.get<Detection[]>(`/detections/track/${trackId}`),

  // Get failed uploads
  getFailedUploads: (maxRetryCount?: number) =>
    api.get<Detection[]>('/detections/failed-uploads', { params: { max_retry_count: maxRetryCount } }),

  // Get uploaded detections
  getUploaded: (params?: { skip?: number; limit?: number }) =>
    api.get<Detection[]>('/detections/uploaded', { params }),

  // Filter detections
  filter: (filters: DetectionFilter) =>
    api.post<Detection[]>('/detections/filter', filters),

  // Count detections
  count: (filters?: DetectionFilter) =>
    api.post<{ total: number }>('/detections/count', filters),

  // Get overall statistics
  getStatistics: () =>
    api.get<DetectionStatistics>('/detections/statistics/overview'),

  // Get statistics by camera
  getStatisticsByCamera: (cameraId: number) =>
    api.get<DetectionStatistics>(`/detections/statistics/by-camera/${cameraId}`),

  // Get statistics by object class
  getStatisticsByClass: () =>
    api.get<Array<{ object_class: string; count: number }>>('/detections/statistics/by-object-class'),

  // Search by track ID
  searchByTrackId: (trackId: string, limit: number = 10) =>
    api.get<Detection[]>('/detections/search/track-id', { params: { track_id: trackId, limit } }),

  // Export detections to CSV
  exportCsv: (params?: {
    from_datetime?: string;
    to_datetime?: string;
    camera_id?: number;
    object_class?: string;
    activity_type?: string;
  }) =>
    api.get('/detections/export/csv', {
      params,
      responseType: 'blob',
    }),
};

// Health check API
export const healthApi = {
  check: () =>
    api.get<HealthStatus>('/health', { baseURL: 'http://localhost:8000' }),

  root: () =>
    api.get<{ name: string; version: string; status: string }>('/', { baseURL: 'http://localhost:8000' }),
};

// Settings API
export const settingsApi = {
  // Get central server configuration
  getCentralServer: () =>
    api.get<{
      central_server_url: string;
      central_server_api_key: string;
      central_server_timeout: number;
      central_server_enabled: boolean;
      organization_id: number;
    }>('/settings/central-server'),

  // Update central server configuration
  updateCentralServer: (data: { central_server_url: string; central_server_api_key: string; central_server_enabled: boolean }) =>
    api.put<{
      message: string;
      central_server_url: string;
      central_server_api_key: string;
      central_server_enabled: boolean;
      note: string;
    }>('/settings/central-server', data),
};

export default api;
