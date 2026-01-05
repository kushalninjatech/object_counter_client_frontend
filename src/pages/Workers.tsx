import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workerApi, cameraApi } from '../services/api';
import {
  Play,
  Square,
  Cpu,
  Video,
  Activity,
  CheckCircle,
  XCircle,
  Zap,
  Gauge,
  Target
} from 'lucide-react';
import type { Camera } from '../types';

export default function Workers() {
  const queryClient = useQueryClient();
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
    refetchInterval: 3000, // Real-time refresh every 3 seconds
  });

  const startMutation = useMutation({
    mutationFn: (cameraId: number) => workerApi.start(cameraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setToast({ message: 'Worker started successfully!', type: 'success' });
    },
    onError: (error: any) => {
      setToast({ message: error.response?.data?.detail || 'Failed to start worker', type: 'error' });
    },
  });

  const stopMutation = useMutation({
    mutationFn: (cameraId: number) => workerApi.stop(cameraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setToast({ message: 'Worker stopped successfully!', type: 'success' });
    },
    onError: (error: any) => {
      setToast({ message: error.response?.data?.detail || 'Failed to stop worker', type: 'error' });
    },
  });

  const runningCount = cameras?.filter(c => c.worker_running).length || 0;
  const totalCameras = cameras?.length || 0;

  const renderWorkerCard = (camera: Camera) => {
    const isRunning = camera.worker_running;

    return (
      <div
        key={camera.id}
        className="group rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-100"
      >
        {/* Card Header with Gradient */}
        <div className={`relative h-24 ${isRunning ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-white/10" />

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              isRunning ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <div className={`h-2 w-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isRunning ? 'Running' : 'Stopped'}
            </div>
          </div>

          {/* Camera Info */}
          <div className="absolute bottom-3 left-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{camera.name}</h3>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4">
          {/* Stream URL */}
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <Video className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate text-xs text-slate-600" title={camera.stream_url}>
              {camera.stream_url}
            </span>
          </div>

          {/* Camera Config Grid */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 rounded-lg bg-blue-50 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-blue-500" />
                <p className="text-xs text-slate-500">FPS</p>
              </div>
              <p className="text-sm font-semibold text-slate-700">{camera.target_fps}</p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-violet-50 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-violet-500" />
                <p className="text-xs text-slate-500">Confidence</p>
              </div>
              <p className="text-sm font-semibold text-slate-700">{(camera.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>

          {/* ROI & Detection Line Info */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 rounded-lg bg-emerald-50 px-3 py-2">
              <p className="text-xs text-slate-500">ROI Polygon</p>
              <p className="text-sm font-semibold text-emerald-700">{camera.roi_polygon?.length || 0} points</p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-blue-50 px-3 py-2">
              <p className="text-xs text-slate-500">Detection Line</p>
              <p className="text-sm font-semibold text-blue-700">
                {camera.detection_line && camera.detection_line.length === 4 ? 'Set' : 'Not Set'}
              </p>
            </div>
          </div>

          {/* Large Action Button */}
          <button
            onClick={() => isRunning ? stopMutation.mutate(camera.id) : startMutation.mutate(camera.id)}
            disabled={startMutation.isPending || stopMutation.isPending}
            className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition-all disabled:opacity-50 ${
              isRunning
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="h-5 w-5" />
                Stop Worker
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Start Worker
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

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
          <h1 className="text-2xl font-bold text-slate-800">Workers</h1>
          <p className="mt-1 text-sm text-slate-500">Manage detection worker processes</p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-sm border border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Cpu className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{totalCameras}</p>
            <p className="text-xs text-slate-500">Total Workers</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-sm border border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Activity className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{runningCount}</p>
            <p className="text-xs text-slate-500">Running</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-sm border border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Square className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-600">{totalCameras - runningCount}</p>
            <p className="text-xs text-slate-500">Stopped</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm text-slate-500">Loading workers...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cameras?.map(renderWorkerCard)}
        </div>
      )}

      {cameras?.length === 0 && !isLoading && (
        <div className="flex h-80 flex-col items-center justify-center rounded-2xl bg-white border border-dashed border-slate-200">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 mb-4">
            <Zap className="h-10 w-10 text-blue-400" />
          </div>
          <p className="text-lg font-semibold text-slate-700">No cameras found</p>
          <p className="mt-1 text-sm text-slate-500">Add cameras first to start workers</p>
        </div>
      )}
    </div>
  );
}
