import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Play, ArrowDown, ArrowUp, Video, Square, Eye, Maximize, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { cameraApi, workerApi, detectionApi } from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [fullScreenCamera, setFullScreenCamera] = useState<any | null>(null);

  // Fetch cameras
  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      const response = await cameraApi.getAll({ active_only: false });
      return response.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch workers status
  const { data: workersStatus, isLoading: workersLoading } = useQuery({
    queryKey: ['workers-status'],
    queryFn: async () => {
      const response = await workerApi.getAllStatus();
      return response.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch detection statistics
  const { data: detectionStats, isLoading: statsLoading } = useQuery({
    queryKey: ['detection-statistics'],
    queryFn: async () => {
      const response = await detectionApi.getStatistics();
      return response.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch statistics by object class
  const { data: objectClassStats, isLoading: classStatsLoading } = useQuery({
    queryKey: ['detection-class-stats'],
    queryFn: async () => {
      const response = await detectionApi.getStatisticsByClass();
      return response.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch streams status
  const { data: streamsStatus } = useQuery({
    queryKey: ['streams-status'],
    queryFn: async () => {
      const response = await cameraApi.getStreamsStatus();
      return response.data;
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Start stream mutation
  const startStreamMutation = useMutation({
    mutationFn: (cameraId: number) => cameraApi.startStream(cameraId, 30),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams-status'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to start stream');
    },
  });

  // Stop stream mutation
  const stopStreamMutation = useMutation({
    mutationFn: (cameraId: number) => cameraApi.stopStream(cameraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams-status'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to stop stream');
    },
  });

  const isLoading = camerasLoading || workersLoading || statsLoading || classStatsLoading;

  const activeCameras = cameras.filter((c) => c.is_active).length;
  const activeWorkers = workersStatus?.active_workers?.length || 0;
  const inDetections = detectionStats?.in_count || 0;
  const outDetections = detectionStats?.out_count || 0;

  // Helper functions
  const isStreamActive = (cameraId: number) => {
    return streamsStatus?.active_streams?.some((s: any) => s.camera_id === cameraId) || false;
  };

  const handleStartStream = (cameraId: number) => {
    startStreamMutation.mutate(cameraId);
  };

  const handleStopStream = (cameraId: number) => {
    stopStreamMutation.mutate(cameraId);
  };

  const handleStartAll = async () => {
    for (const camera of cameras) {
      if (camera.is_active && !isStreamActive(camera.id)) {
        try {
          await cameraApi.startStream(camera.id, 30);
        } catch (error) {
          console.error(`Failed to start stream for camera ${camera.id}:`, error);
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ['streams-status'] });
  };

  const handleStopAll = async () => {
    for (const camera of cameras) {
      if (isStreamActive(camera.id)) {
        try {
          await cameraApi.stopStream(camera.id);
        } catch (error) {
          console.error(`Failed to stop stream for camera ${camera.id}:`, error);
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ['streams-status'] });
  };

  const handleOpenFullScreen = (camera: any) => {
    setFullScreenCamera(camera);
  };

  const handleCloseFullScreen = () => {
    setFullScreenCamera(null);
  };

  // Prepare chart data
  const cameraDetectionData = (detectionStats?.by_camera || []).map((item) => ({
    name: item.camera_name,
    count: item.count,
  }));

  const objectClassData = (objectClassStats || []).map((item: any) => ({
    name: item.object_class || 'Unknown',
    value: item.total_detections,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of your ANPR system performance and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Cameras"
          value={activeCameras}
          icon={Camera}
          color="blue"
          change={`${cameras.length} total`}
          changeType="neutral"
        />
        <StatCard
          title="Running Workers"
          value={activeWorkers}
          icon={Play}
          color="green"
          change={`${activeCameras - activeWorkers} stopped`}
          changeType={activeWorkers === activeCameras ? 'increase' : 'decrease'}
        />
        <StatCard
          title="Total IN"
          value={inDetections.toLocaleString()}
          icon={ArrowUp}
          color="green"
          change="Objects moving in"
          changeType="neutral"
        />
        <StatCard
          title="Total OUT"
          value={outDetections.toLocaleString()}
          icon={ArrowDown}
          color="yellow"
          change="Objects moving out"
          changeType="neutral"
        />
      </div>

      {/* Camera Streaming Section */}
      <Card title="Live Camera Feeds" subtitle="View live streams from your cameras">
        {cameras.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold">No cameras configured</p>
            <p className="text-gray-600 text-sm mt-1">Add a camera to start streaming</p>
          </div>
        ) : (
          <>
            {/* Stream Control Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleStartAll}
                disabled={startStreamMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                <Video className="h-4 w-4" />
                Start All Streams
              </button>
              <button
                onClick={handleStopAll}
                disabled={stopStreamMutation.isPending}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop All Streams
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cameras.map((camera) => {
              const streamActive = isStreamActive(camera.id);
              const workerRunning = camera.worker_running;

              return (
                <div key={camera.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  {/* Camera Stream Display */}
                  <div className="relative bg-gray-900 aspect-video">
                    {streamActive ? (
                      <img
                        src={cameraApi.getStreamUrl(camera.id)}
                        alt={`${camera.name} stream`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback if stream fails
                          e.currentTarget.src = '';
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Eye className="h-16 w-16 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">Stream not active</p>
                        </div>
                      </div>
                    )}

                    {/* Stream Status Badge */}
                    <div className="absolute top-3 right-3">
                      {streamActive ? (
                        <Badge variant="success">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Live
                          </div>
                        </Badge>
                      ) : (
                        <Badge variant="default">Offline</Badge>
                      )}
                    </div>
                  </div>

                  {/* Camera Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{camera.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Camera ID: {camera.id}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {camera.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="default">Inactive</Badge>
                        )}
                        {workerRunning && (
                          <Badge variant="info">Worker ON</Badge>
                        )}
                      </div>
                    </div>

                    {/* Stream Controls */}
                    <div className="flex gap-2">
                      {!streamActive ? (
                        <button
                          onClick={() => handleStartStream(camera.id)}
                          disabled={!camera.is_active || startStreamMutation.isPending}
                          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          {startStreamMutation.isPending ? 'Starting...' : 'Start Stream'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStopStream(camera.id)}
                            disabled={stopStreamMutation.isPending}
                            className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                          >
                            <Square className="h-4 w-4" />
                            {stopStreamMutation.isPending ? 'Stopping...' : 'Stop Stream'}
                          </button>
                          <button
                            onClick={() => handleOpenFullScreen(camera)}
                            className="btn btn-primary flex items-center justify-center gap-2 px-3"
                            title="View in fullscreen"
                          >
                            <Maximize className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </Card>

      {/* Object Type Statistics Table */}
      <Card title="Detections by Object Type" subtitle="IN/OUT breakdown with capacity and occupancy tracking">
        {objectClassStats && objectClassStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Object Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total IN
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total OUT
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Occupancy
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining Occupancy
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {objectClassStats.map((item: any, index: number) => {
                  const currentOccupancy = item.current_occupancy || 0;
                  const remainingOccupancy = item.remaining_occupancy || 0;
                  const capacity = item.capacity || 5000;
                  const occupancyPercentage = currentOccupancy >= 0 ? (currentOccupancy / capacity) * 100 : 0;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {item.object_class || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {item.in_count?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {item.out_count?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          currentOccupancy < 0
                            ? 'bg-gray-100 text-gray-800'
                            : occupancyPercentage >= 90
                            ? 'bg-red-100 text-red-800'
                            : occupancyPercentage >= 70
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {currentOccupancy.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {capacity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          remainingOccupancy <= capacity * 0.1
                            ? 'bg-red-100 text-red-800'
                            : remainingOccupancy <= capacity * 0.3
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {remainingOccupancy.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No object type data available
          </div>
        )}
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detections by Camera */}
        <Card title="Detections by Camera" subtitle="Total detections per camera">
          {cameraDetectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cameraDetectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-72 text-gray-500">
              No detection data available
            </div>
          )}
        </Card>

        {/* Object Class Distribution */}
        <Card title="Object Class Distribution" subtitle="Breakdown by detected object types">
          {objectClassData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={objectClassData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {objectClassData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-72 text-gray-500">
              No object class data available
            </div>
          )}
        </Card>
      </div>

      {/* Full Screen Stream Modal */}
      {fullScreenCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50">
          <div className="relative w-full h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">{fullScreenCamera.name}</h2>
                <Badge variant="success">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live
                  </div>
                </Badge>
              </div>
              <button
                onClick={handleCloseFullScreen}
                className="btn btn-secondary flex items-center gap-2"
              >
                <X className="h-5 w-5" />
                Close
              </button>
            </div>

            {/* Full Screen Video */}
            <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden">
              <img
                src={cameraApi.getStreamUrl(fullScreenCamera.id)}
                alt={`${fullScreenCamera.name} stream`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  // Fallback if stream fails
                  e.currentTarget.src = '';
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
