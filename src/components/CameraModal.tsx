import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { cameraApi } from '../services/api';
import type { Camera, StreamType } from '../types';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: Camera | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function CameraModal({ isOpen, onClose, camera, onSuccess, onError }: CameraModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    stream_url: '',
    stream_type: 'downside-up' as StreamType,
    target_fps: 3,
    confidence: 0.3,
    detection_types: [0, 2, 3, 5, 7],
    organization_id: 1,
  });

  // Reset form when modal opens/closes or camera changes
  useEffect(() => {
    if (isOpen) {
      if (camera) {
        // For editing, only allow changing basic info
        setFormData({
          name: camera.name,
          stream_url: camera.stream_url,
          stream_type: camera.stream_type || 'downside-up',
          target_fps: camera.target_fps,
          confidence: camera.confidence,
          detection_types: camera.detection_types || [0, 2, 3, 5, 7],
          organization_id: camera.organization_id,
        });
      } else {
        // For new cameras, use defaults
        setFormData({
          name: '',
          stream_url: '',
          stream_type: 'downside-up',
          target_fps: 3,
          confidence: 0.3,
          detection_types: [0, 2, 3, 5, 7],
          organization_id: 1,
        });
      }
    } else {
      // Clear form when modal is closed
      setFormData({
        name: '',
        stream_url: '',
        stream_type: 'downside-up',
        target_fps: 3,
        confidence: 0.3,
        detection_types: [0, 2, 3, 5, 7],
        organization_id: 1,
      });
    }
  }, [camera, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: any) => cameraApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      onSuccess('Camera created successfully!');
      onClose();
    },
    onError: (error: any) => {
      onError(error.response?.data?.detail || 'Failed to create camera');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => cameraApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      onSuccess('Camera updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      onError(error.response?.data?.detail || 'Failed to update camera');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (camera) {
        // For editing, only update basic info (not ROI/line - those are edited in detail page)
        const data = {
          name: formData.name,
          stream_url: formData.stream_url,
          stream_type: formData.stream_type,
          target_fps: formData.target_fps,
          confidence: formData.confidence,
          detection_types: formData.detection_types,
        };
        await updateMutation.mutateAsync({ id: camera.id, data });
      } else {
        // For new cameras, set default ROI and line (will be configured in detail page)
        const data = {
          name: formData.name,
          stream_url: formData.stream_url,
          stream_type: formData.stream_type,
          roi_polygon: [[0, 0], [100, 0], [100, 100], [0, 100]], // Default square polygon
          detection_line: [0, 50, 100, 50], // Default horizontal line
          target_fps: formData.target_fps,
          confidence: formData.confidence,
          detection_types: formData.detection_types,
          organization_id: formData.organization_id,
        };
        await createMutation.mutateAsync(data);
      }
    } catch (error: any) {
      // Error handled by onError callback
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {camera ? 'Edit Camera' : 'Add New Camera'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Camera Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Front Gate Camera"
              required
            />
          </div>

          <div>
            <label className="label">Stream URL</label>
            <input
              type="text"
              value={formData.stream_url}
              onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              className="input"
              placeholder="rtsp://username:password@ip:port/stream"
              required
            />
          </div>

          <div>
            <label className="label">Stream Orientation</label>
            <select
              value={formData.stream_type}
              onChange={(e) => setFormData({ ...formData, stream_type: e.target.value as StreamType })}
              className="input"
              required
            >
              <option value="downside-up">Normal (Downside-Up)</option>
              <option value="upside-down">Inverted (Upside-Down)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Select camera mounting orientation
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target FPS</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.target_fps}
                onChange={(e) => setFormData({ ...formData, target_fps: parseInt(e.target.value) })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Confidence</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.confidence}
                onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Detection Types</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.detection_types.includes(0)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...formData.detection_types, 0]
                      : formData.detection_types.filter(t => t !== 0);
                    setFormData({ ...formData, detection_types: newTypes });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Person</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.detection_types.includes(2)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...formData.detection_types, 2]
                      : formData.detection_types.filter(t => t !== 2);
                    setFormData({ ...formData, detection_types: newTypes });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Car</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.detection_types.includes(3)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...formData.detection_types, 3]
                      : formData.detection_types.filter(t => t !== 3);
                    setFormData({ ...formData, detection_types: newTypes });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Motorcycle</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.detection_types.includes(5)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...formData.detection_types, 5]
                      : formData.detection_types.filter(t => t !== 5);
                    setFormData({ ...formData, detection_types: newTypes });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Bus</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.detection_types.includes(7)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...formData.detection_types, 7]
                      : formData.detection_types.filter(t => t !== 7);
                    setFormData({ ...formData, detection_types: newTypes });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Truck</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Select which object types to detect
            </p>
          </div>

          {!camera && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> After creating the camera, you'll be able to configure the ROI polygon and detection line in the camera detail page.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary flex-1"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : camera ? 'Update Camera' : 'Create Camera'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
