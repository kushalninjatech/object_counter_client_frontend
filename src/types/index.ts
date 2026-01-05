// API Response Types matching backend schemas

export type StreamType = 'upside-down' | 'downside-up';

export type DetectionType = 0 | 2 | 3 | 5 | 7; // 0=person, 2=car, 3=motorcycle, 5=bus, 7=truck

export type ActivityType = 'in' | 'out';

export interface Camera {
  id: number;
  name: string;
  stream_url: string;
  stream_type: StreamType;
  roi_polygon: number[][];
  detection_line: number[];
  target_fps: number;
  confidence: number;
  detection_types: number[];
  organization_id: number;
  is_active: boolean;
  worker_running: boolean;
  created_at: string;
  updated_at: string;
}

export interface CameraCreate {
  name: string;
  stream_url: string;
  stream_type?: StreamType;
  roi_polygon: number[][];
  detection_line: number[];
  target_fps?: number;
  confidence?: number;
  detection_types?: number[];
  organization_id?: number;
}

export interface CameraUpdate {
  name?: string;
  stream_url?: string;
  stream_type?: StreamType;
  roi_polygon?: number[][];
  detection_line?: number[];
  target_fps?: number;
  confidence?: number;
  detection_types?: number[];
  is_active?: boolean;
}

export interface Detection {
  id: number;
  camera_id: number;
  camera_name: string;
  object_track_id: string;
  object_class: string | null;
  activity_type: ActivityType | null;
  image_url: string;
  detected_at: string;
  uploaded: boolean;
  upload_retry_count: number;
  central_detection_id: number | null;
  created_at: string;
}

export interface DetectionFilter {
  camera_id?: number;
  tracker_id?: string;
  object_class?: string;
  activity_type?: string;
  uploaded?: boolean;
  min_retry_count?: number;
  max_retry_count?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface WorkerStatus {
  camera_id: number;
  camera_name: string;
  running: boolean;
  configuration?: {
    target_fps: number;
    confidence: number;
    roi_polygon: number[][];
    detection_line: number[];
  };
}

export interface CameraStatistics {
  camera_id: number;
  camera_name: string;
  total_detections: number;
  worker_running: boolean;
  is_active: boolean;
  created_at: string;
}

export interface DetectionStatistics {
  total_detections: number;
  in_count: number;
  out_count: number;
  uploaded_count: number;
  pending_count: number;
  failed_count: number;
  upload_success_rate: number;
  average_retry_count: number;
  by_camera: Array<{
    camera_id: number;
    camera_name: string;
    count: number;
  }>;
  by_class: Array<{
    object_class: string;
    count: number;
  }>;
}

export interface ApiResponse {
  id?: number;
  message: string;
  worker_was_running?: boolean;
}

export interface HealthStatus {
  status: string;
  version: string;
  active_workers: number;
}
