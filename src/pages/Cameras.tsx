import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cameraApi } from '../services/api';
import {
  Plus,
  Edit,
  Trash2,
  Video,
  Camera,
  Gauge,
  Target,
  CheckCircle,
  XCircle,
  Activity,
  Settings
} from 'lucide-react';
import type { Camera as CameraType } from '../types';
import CameraModal from '../components/CameraModal';
import ConfirmModal from '../components/ConfirmModal';

export default function Cameras() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; camera: CameraType | null }>({
    isOpen: false,
    camera: null,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const { data: cameras, isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => cameraApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => cameraApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setToast({ message: 'Camera deleted successfully!', type: 'success' });
    },
    onError: () => {
      setToast({ message: 'Failed to delete camera', type: 'error' });
    },
  });

  const handleDeleteClick = (camera: CameraType) => {
    setDeleteConfirm({ isOpen: true, camera });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.camera) {
      try {
        await deleteMutation.mutateAsync(deleteConfirm.camera.id);
        setDeleteConfirm({ isOpen: false, camera: null });
      } catch {
        // Error handled by onError
      }
    }
  };

  const handleEdit = (camera: CameraType) => {
    setEditingCamera(camera);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCamera(null);
    setIsModalOpen(true);
  };

  const activeCount = cameras?.filter(c => c.is_active).length || 0;
  const configuredCount = cameras?.filter(c => c.roi_polygon && c.roi_polygon.length > 1).length || 0;
  const totalCount = cameras?.length || 0;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-white shadow-lg animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cameras</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your camera streams and configurations</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
        >
          <Plus className="h-5 w-5" />
          Add Camera
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-sm border border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Camera className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
            <p className="text-xs text-slate-500">Total Cameras</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-sm border border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Activity className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-xs text-slate-500">Active</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-sm border border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
            <Settings className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-violet-600">{configuredCount}</p>
            <p className="text-xs text-slate-500">ROI Configured</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm text-slate-500">Loading cameras...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {cameras?.map((camera) => (
            <div
              key={camera.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:border-blue-100"
            >
              {/* Card Header with Gradient */}
              <div className={`relative h-28 ${
                camera.is_active
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                  : 'bg-gradient-to-br from-slate-400 to-slate-500'
              }`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute right-0 top-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute right-6 top-6 h-16 w-16 rounded-full bg-white/10" />

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    camera.is_active
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/20 text-white'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${camera.is_active ? 'bg-white animate-pulse' : 'bg-white/60'}`} />
                    {camera.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Camera Icon & Name */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{camera.name}</h3>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                {/* Stream URL */}
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Video className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate text-sm text-slate-600" title={camera.stream_url}>{camera.stream_url}</span>
                </div>

                {/* Settings Grid */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                    <Gauge className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-500">FPS</p>
                      <p className="text-sm font-semibold text-slate-700">{camera.target_fps}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2">
                    <Target className="h-4 w-4 text-violet-500" />
                    <div>
                      <p className="text-xs text-slate-500">Confidence</p>
                      <p className="text-sm font-semibold text-slate-700">{(camera.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>

                {/* ROI Configuration Status */}
                <div className="mb-5">
                  <div className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${camera.roi_polygon && camera.roi_polygon.length > 1 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {camera.roi_polygon && camera.roi_polygon.length > 1 ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={`text-xs font-medium ${camera.roi_polygon && camera.roi_polygon.length > 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {camera.roi_polygon && camera.roi_polygon.length > 1 ? 'ROI Configured' : 'ROI Not Configured'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/cameras/${camera.id}`)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 transition-all hover:bg-violet-100"
                  >
                    <Settings className="h-4 w-4" />
                    Configure ROI
                  </button>
                  <button
                    onClick={() => handleEdit(camera)}
                    className="flex items-center justify-center rounded-xl bg-slate-100 p-2.5 text-slate-600 transition-colors hover:bg-slate-200"
                    title="Edit Camera"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(camera)}
                    className="flex items-center justify-center rounded-xl bg-red-50 p-2.5 text-red-500 transition-colors hover:bg-red-100"
                    title="Delete Camera"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cameras?.length === 0 && !isLoading && (
        <div className="flex h-80 flex-col items-center justify-center rounded-2xl bg-white border border-dashed border-slate-200">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 mb-4">
            <Video className="h-10 w-10 text-blue-400" />
          </div>
          <p className="text-lg font-semibold text-slate-700">No cameras configured</p>
          <p className="mt-1 text-sm text-slate-500">Get started by adding your first camera</p>
          <button
            onClick={handleCreate}
            className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25"
          >
            <Plus className="h-5 w-5" />
            Add Camera
          </button>
        </div>
      )}

      <CameraModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCamera(null);
        }}
        camera={editingCamera}
        onSuccess={(message) => setToast({ message, type: 'success' })}
        onError={(message) => setToast({ message, type: 'error' })}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, camera: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Camera"
        message={`Are you sure you want to delete "${deleteConfirm.camera?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
