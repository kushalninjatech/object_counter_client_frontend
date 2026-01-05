import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cameraApi } from '../services/api';
import {
  ArrowLeft,
  Save,
  Video,
  Hexagon,
  Minus,
  Info,
  RotateCcw,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

export default function CameraDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const [roiPoints, setRoiPoints] = useState<number[][]>([]);
  const [linePoints, setLinePoints] = useState<number[]>([]);
  const [drawingMode, setDrawingMode] = useState<'roi' | 'line'>('roi');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const { data: camera, isLoading } = useQuery({
    queryKey: ['camera', id],
    queryFn: () => cameraApi.getById(parseInt(id!)).then((res) => res.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { roi_polygon: number[][], detection_line: number[] }) =>
      cameraApi.update(parseInt(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camera', id] });
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setToast({ message: 'ROI configuration saved successfully!', type: 'success' });
    },
    onError: () => {
      setToast({ message: 'Failed to save ROI configuration', type: 'error' });
    },
  });

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (camera) {
      if (camera.roi_polygon && camera.roi_polygon.length > 1) {
        setRoiPoints(camera.roi_polygon);
      }
      if (camera.detection_line && camera.detection_line.length === 4) {
        setLinePoints(camera.detection_line);
      }
    }
  }, [camera]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw background image if available
    if (backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0);
    }

    // Draw ROI polygon (green)
    if (roiPoints.length > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 3;

      // Draw lines between existing points
      ctx.beginPath();
      ctx.moveTo(roiPoints[0][0], roiPoints[0][1]);
      for (let i = 1; i < roiPoints.length; i++) {
        ctx.lineTo(roiPoints[i][0], roiPoints[i][1]);
      }

      // If we have points but not complete, draw line to mouse position
      if (roiPoints.length > 0 && roiPoints.length < 4 && mousePos && drawingMode === 'roi') {
        ctx.lineTo(mousePos.x, mousePos.y);
      }

      // Close polygon only if we have all 4 points
      if (roiPoints.length === 4) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Draw points
      roiPoints.forEach((point, index) => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(point[0], point[1], 6, 0, 2 * Math.PI);
        ctx.fill();

        // Draw point number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), point[0], point[1]);
      });
    }

    // Draw detection line (red)
    if (linePoints.length >= 2) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;

      // Draw first point
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(linePoints[0], linePoints[1], 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1', linePoints[0], linePoints[1]);

      // Draw line
      ctx.beginPath();
      ctx.moveTo(linePoints[0], linePoints[1]);

      if (linePoints.length === 4) {
        // Draw to second point
        ctx.lineTo(linePoints[2], linePoints[3]);
        ctx.stroke();

        // Draw second point
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(linePoints[2], linePoints[3], 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2', linePoints[2], linePoints[3]);
      } else if (mousePos && drawingMode === 'line') {
        // Draw line to mouse position
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [roiPoints, linePoints, imageLoaded, mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round(displayX * scaleX);
    const y = Math.round(displayY * scaleY);

    setMousePos({ x, y });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Get click position relative to the displayed canvas
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    // Calculate the scale factor between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Scale to actual canvas coordinates
    const x = Math.round(displayX * scaleX);
    const y = Math.round(displayY * scaleY);

    console.log('Click debug:', {
      displaySize: { width: rect.width, height: rect.height },
      canvasSize: { width: canvas.width, height: canvas.height },
      scale: { scaleX, scaleY },
      displayPos: { displayX, displayY },
      canvasPos: { x, y }
    });

    if (drawingMode === 'roi') {
      if (roiPoints.length < 4) {
        setRoiPoints([...roiPoints, [x, y]]);
      } else {
        setToast({ message: 'ROI polygon already has 4 points. Clear to redraw.', type: 'error' });
      }
    } else if (drawingMode === 'line') {
      if (linePoints.length < 4) {
        setLinePoints([...linePoints, x, y]);
      } else {
        setToast({ message: 'Detection line already has 2 points. Clear to redraw.', type: 'error' });
      }
    }
  };

  const handleClearROI = () => {
    setRoiPoints([]);
  };

  const handleClearLine = () => {
    setLinePoints([]);
  };

  const handleSave = async () => {
    if (roiPoints.length !== 4) {
      setToast({ message: 'ROI polygon must have exactly 4 points', type: 'error' });
      return;
    }
    if (linePoints.length !== 4) {
      setToast({ message: 'Detection line must have exactly 2 points', type: 'error' });
      return;
    }

    await updateMutation.mutateAsync({
      roi_polygon: roiPoints,
      detection_line: linePoints,
    });
  };

  const handleLoadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !camera) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set loading state
    setImageLoading(true);
    setImageLoaded(false);

    // Fetch frame from API
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Store the image reference for redrawing
      backgroundImageRef.current = img;

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image
      ctx.drawImage(img, 0, 0);
      setImageLoaded(true);
      setImageLoading(false);
    };

    img.onerror = () => {
      // Fallback to placeholder if image fails to load
      canvas.width = 1280;
      canvas.height = 720;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(camera.name, canvas.width / 2, 40);

      ctx.font = '16px sans-serif';
      ctx.fillText('Failed to load camera frame', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Click to draw ROI polygon (4 points) and detection line (2 points)', canvas.width / 2, canvas.height / 2 + 30);

      setImageLoaded(true);
      setImageLoading(false);
    };

    // Set the image source to the frame endpoint with timestamp to avoid caching
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    img.src = `${apiUrl}/cameras/${camera.id}/frame?t=${Date.now()}`;
  };

  useEffect(() => {
    if (camera) {
      handleLoadImage();
    }
  }, [camera]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">Camera not found</p>
          <button
            onClick={() => navigate('/cameras')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Cameras
          </button>
        </div>
      </div>
    );
  }

  const canSave = roiPoints.length === 4 && linePoints.length === 4;

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cameras')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{camera.name}</h1>
            <p className="mt-1 text-sm text-slate-500">Configure ROI and detection line</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave || updateMutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none"
        >
          <Save className="h-5 w-5" />
          {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Drawing Controls */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-800">Drawing Mode</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDrawingMode('roi')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                drawingMode === 'roi'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Hexagon className="h-4 w-4" />
              ROI Polygon ({roiPoints.length}/4)
            </button>
            <button
              onClick={() => setDrawingMode('line')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                drawingMode === 'line'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Minus className="h-4 w-4" />
              Detection Line ({linePoints.length / 2}/2)
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleClearROI}
            disabled={roiPoints.length === 0}
            className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Clear ROI
          </button>
          <button
            onClick={handleClearLine}
            disabled={linePoints.length === 0}
            className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Clear Line
          </button>
          <button
            onClick={handleLoadImage}
            className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Frame
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Video className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Canvas</h2>
            <p className="text-sm text-slate-500">Click to place points</p>
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-900 flex justify-center items-center min-h-[400px]">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <p className="text-sm text-slate-200">Loading camera frame...</p>
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos(null)}
            className="cursor-crosshair"
            style={{
              maxWidth: '100%',
              maxHeight: '600px',
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 p-4">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select ROI mode and click 4 points to define the region of interest (green polygon)</li>
              <li>Select Line mode and click 2 points to define the detection line (red line)</li>
              <li>Use Clear buttons to reset and redraw</li>
              <li>Click Save when both ROI (4 points) and Line (2 points) are complete</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Configuration */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
            <Hexagon className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Current Configuration</h2>
            <p className="text-sm text-slate-500">Coordinate values</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <Hexagon className="h-4 w-4 text-emerald-600" />
                ROI Polygon Points
              </div>
            </label>
            <div className="rounded-xl bg-slate-50 p-4">
              <pre className="text-sm text-slate-700 font-mono">
                {roiPoints.length > 0 ? JSON.stringify(roiPoints, null, 2) : '[\n  // Click 4 points\n]'}
              </pre>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-red-600" />
                Detection Line
              </div>
            </label>
            <div className="rounded-xl bg-slate-50 p-4">
              <pre className="text-sm text-slate-700 font-mono">
                {linePoints.length > 0 ? JSON.stringify(linePoints, null, 2) : '[\n  // Click 2 points\n]'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Video className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Camera Information</h2>
            <p className="text-sm text-slate-500">Basic configuration</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <span className="text-sm text-slate-500">Stream URL</span>
            <span className="text-sm font-semibold text-slate-800 truncate max-w-md">{camera.stream_url}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <span className="text-sm text-slate-500">Target FPS</span>
            <span className="text-sm font-semibold text-slate-800">{camera.target_fps}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <span className="text-sm text-slate-500">Confidence Threshold</span>
            <span className="text-sm font-semibold text-slate-800">{(camera.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
