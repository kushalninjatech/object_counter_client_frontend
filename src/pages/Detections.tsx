import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Camera,
  AlertCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { detectionApi, cameraApi } from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Detection, DetectionFilter } from '../types';

const ITEMS_PER_PAGE = 20;

export default function Detections() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<DetectionFilter>({
    camera_id: undefined,
    object_class: undefined,
    activity_type: undefined,
    uploaded: undefined,
    start_date: undefined,
    end_date: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportFromTime, setExportFromTime] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [exportToTime, setExportToTime] = useState('');


  // Fetch cameras for filter
  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      const response = await cameraApi.getAll();
      return response.data;
    },
  });

  // Fetch detections with filters
  const { data: detections = [], isLoading, error } = useQuery({
    queryKey: ['detections', filters, currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const filterParams = {
        ...filters,
        limit: ITEMS_PER_PAGE,
        offset,
      };
      const response = await detectionApi.filter(filterParams);
      return response.data;
    },
  });

  // Get total count
  const { data: countData } = useQuery({
    queryKey: ['detections-count', filters],
    queryFn: async () => {
      const response = await detectionApi.count(filters);
      return response.data;
    },
  });

  // Fetch object classes for filter
  const { data: objectClasses = [] } = useQuery({
    queryKey: ['object-classes'],
    queryFn: async () => {
      const response = await detectionApi.getStatisticsByClass();
      return response.data.map((item) => item.object_class);
    },
  });

  // Fetch detection statistics for IN/OUT counts
  const { data: detectionStats } = useQuery({
    queryKey: ['detection-statistics'],
    queryFn: async () => {
      const response = await detectionApi.getStatistics();
      return response.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const totalCount = countData?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const inDetections = detectionStats?.in_count || 0;
  const outDetections = detectionStats?.out_count || 0;

  const handleFilterChange = (key: keyof DetectionFilter, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      camera_id: undefined,
      object_class: undefined,
      activity_type: undefined,
      uploaded: undefined,
      start_date: undefined,
      end_date: undefined,
    });
    setCurrentPage(1);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleExportSubmit = async () => {
    try {
      let fromDatetime: string;
      let toDatetime: string;

      if (exportDateRange === 'custom') {
        // Validate custom dates and times
        if (!exportFromDate || !exportFromTime || !exportToDate || !exportToTime) {
          alert('Please enter both date and time for from and to fields');
          return;
        }

        // Parse DD/MM/YYYY format for date and HH:MM for time
        const parseCustomDateTime = (dateStr: string, timeStr: string): Date | null => {
          // Date format: DD/MM/YYYY
          const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          const dateMatch = dateStr.match(dateRegex);

          // Time format: HH:MM
          const timeRegex = /^(\d{2}):(\d{2})$/;
          const timeMatch = timeStr.match(timeRegex);

          if (!dateMatch || !timeMatch) {
            return null;
          }

          const [, day, month, year] = dateMatch;
          const [, hours, minutes] = timeMatch;

          const date = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hours),
            parseInt(minutes)
          );

          // Validate the date is valid
          if (isNaN(date.getTime())) {
            return null;
          }

          return date;
        };

        const fromDate = parseCustomDateTime(exportFromDate, exportFromTime);
        const toDate = parseCustomDateTime(exportToDate, exportToTime);

        if (!fromDate) {
          alert('Invalid from date/time format. Please use DD/MM/YYYY for date and HH:MM for time');
          return;
        }

        if (!toDate) {
          alert('Invalid to date/time format. Please use DD/MM/YYYY for date and HH:MM for time');
          return;
        }

        // Validate date range
        if (fromDate > toDate) {
          alert('From date/time must be before to date/time');
          return;
        }

        fromDatetime = fromDate.toISOString().slice(0, 19);
        toDatetime = toDate.toISOString().slice(0, 19);
      } else {
        // Calculate date range based on preset
        const now = new Date();
        let fromDate: Date;
        let toDate: Date = now;

        if (exportDateRange === 'today') {
          // Today: 00:00:00 to current time
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        } else if (exportDateRange === 'week') {
          // This week: Start of week (Sunday) to current time
          const dayOfWeek = now.getDay();
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0);
        } else if (exportDateRange === 'month') {
          // This month: Start of month to current time
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        } else {
          fromDate = now;
        }

        fromDatetime = fromDate.toISOString().slice(0, 19);
        toDatetime = toDate.toISOString().slice(0, 19);
      }

      // Call backend API to export CSV
      const response = await detectionApi.exportCsv({
        from_datetime: fromDatetime,
        to_datetime: toDatetime,
        camera_id: filters.camera_id,
        object_class: filters.object_class,
        activity_type: filters.activity_type,
      });

      // Create blob from response and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Generate filename with current date and time
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${day}-${month}-${year}-${hours}-${minutes}-${seconds}`;
      a.download = `detection-${timestamp}.xlsx`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Close modal and reset
      setShowExportModal(false);
      setExportDateRange('today');
      setExportFromDate('');
      setExportFromTime('');
      setExportToDate('');
      setExportToTime('');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold">Failed to load detections</p>
          <p className="text-gray-600 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detections</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage object detections from all cameras
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button
            onClick={handleExport}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total IN</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {inDetections.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Objects moving in</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total OUT</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {outDetections.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Objects moving out</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ArrowDown className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Detections</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalCount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">All detections</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card title="Filters" subtitle="Filter detections by various criteria">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Camera Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Camera
              </label>
              <select
                value={filters.camera_id || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'camera_id',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="input w-full"
              >
                <option value="">All Cameras</option>
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Object Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Object Class
              </label>
              <select
                value={filters.object_class || ''}
                onChange={(e) => handleFilterChange('object_class', e.target.value)}
                className="input w-full"
              >
                <option value="">All Classes</option>
                {objectClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <select
                value={filters.activity_type || ''}
                onChange={(e) => handleFilterChange('activity_type', e.target.value)}
                className="input w-full"
              >
                <option value="">All Activities</option>
                <option value="in">IN</option>
                <option value="out">OUT</option>
              </select>
            </div>

            {/* Upload Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Status
              </label>
              <select
                value={
                  filters.uploaded === undefined
                    ? ''
                    : filters.uploaded
                    ? 'true'
                    : 'false'
                }
                onChange={(e) =>
                  handleFilterChange(
                    'uploaded',
                    e.target.value === '' ? undefined : e.target.value === 'true'
                  )
                }
                className="input w-full"
              >
                <option value="">All</option>
                <option value="true">Uploaded</option>
                <option value="false">Not Uploaded</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={filters.start_date ? new Date(filters.start_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const isoString = new Date(value).toISOString();
                    handleFilterChange('start_date', isoString);
                  } else {
                    handleFilterChange('start_date', undefined);
                  }
                }}
                className="input w-full"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={filters.end_date ? new Date(filters.end_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const isoString = new Date(value).toISOString();
                    handleFilterChange('end_date', isoString);
                  } else {
                    handleFilterChange('end_date', undefined);
                  }
                }}
                className="input w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handleResetFilters} className="btn btn-secondary">
              Reset Filters
            </button>
          </div>
        </Card>
      )}

      {/* Detections Table */}
      <Card
        title={`Detections (${totalCount.toLocaleString()} total)`}
        subtitle={`Page ${currentPage} of ${totalPages || 1}`}
      >
        {detections.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold">No detections found</p>
            <p className="text-gray-600 text-sm mt-1">
              {Object.values(filters).some((v) => v !== undefined)
                ? 'Try adjusting your filters'
                : 'No detections have been recorded yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Camera
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Object Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Track ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detected At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detections.map((detection) => (
                    <tr key={detection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {detection.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-gray-400" />
                          {detection.camera_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge variant="info">
                          {detection.object_class || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {detection.activity_type ? (
                          <Badge variant={detection.activity_type === 'in' ? 'success' : 'warning'}>
                            {detection.activity_type.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {detection.object_track_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(parseISO(detection.detected_at), 'dd/MM/yyyy HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {detection.uploaded ? (
                          <Badge variant="success">Uploaded</Badge>
                        ) : detection.upload_retry_count > 0 ? (
                          <Badge variant="warning">
                            Retry {detection.upload_retry_count}
                          </Badge>
                        ) : (
                          <Badge variant="default">Pending</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedDetection(detection);
                            setShowImageModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}{' '}
                results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Export CSV Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Export Detections to CSV</h3>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportDateRange('today');
                  setExportFromDate('');
                  setExportFromTime('');
                  setExportToDate('');
                  setExportToTime('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Select the date range for the detections you want to export.
              </p>

              {/* Date Range Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>

                {/* Today */}
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="dateRange"
                    value="today"
                    checked={exportDateRange === 'today'}
                    onChange={(e) => setExportDateRange(e.target.value as 'today')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Today</span>
                    <p className="text-xs text-gray-500">From start of day to now</p>
                  </div>
                </label>

                {/* This Week */}
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="dateRange"
                    value="week"
                    checked={exportDateRange === 'week'}
                    onChange={(e) => setExportDateRange(e.target.value as 'week')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">This Week</span>
                    <p className="text-xs text-gray-500">From start of week (Sunday) to now</p>
                  </div>
                </label>

                {/* This Month */}
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="dateRange"
                    value="month"
                    checked={exportDateRange === 'month'}
                    onChange={(e) => setExportDateRange(e.target.value as 'month')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">This Month</span>
                    <p className="text-xs text-gray-500">From start of month to now</p>
                  </div>
                </label>

                {/* Custom Date */}
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="dateRange"
                    value="custom"
                    checked={exportDateRange === 'custom'}
                    onChange={(e) => setExportDateRange(e.target.value as 'custom')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Custom Dates</span>
                    <p className="text-xs text-gray-500">Select your own date range</p>
                  </div>
                </label>
              </div>

              {/* Custom Date Inputs - Only show when custom is selected */}
              {exportDateRange === 'custom' && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  {/* From Date and Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date & Time <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={exportFromDate}
                          onChange={(e) => setExportFromDate(e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="input w-full font-mono text-sm"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Date: 01/01/2026</p>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={exportFromTime}
                          onChange={(e) => setExportFromTime(e.target.value)}
                          placeholder="HH:MM"
                          className="input w-full font-mono text-sm"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Time: 00:00</p>
                      </div>
                    </div>
                  </div>

                  {/* To Date and Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date & Time <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={exportToDate}
                          onChange={(e) => setExportToDate(e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="input w-full font-mono text-sm"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Date: 31/12/2026</p>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={exportToTime}
                          onChange={(e) => setExportToTime(e.target.value)}
                          placeholder="HH:MM"
                          className="input w-full font-mono text-sm"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Time: 23:59</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Filters Info */}
              {(filters.camera_id || filters.object_class || filters.activity_type) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Active Filters:</p>
                  <div className="text-xs text-blue-900 space-y-1">
                    {filters.camera_id && (
                      <div>
                        • Camera: {cameras.find(c => c.id === filters.camera_id)?.name || filters.camera_id}
                      </div>
                    )}
                    {filters.object_class && (
                      <div>• Object Class: {filters.object_class}</div>
                    )}
                    {filters.activity_type && (
                      <div>• Activity: {filters.activity_type.toUpperCase()}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportDateRange('today');
                  setExportFromDate('');
                  setExportFromTime('');
                  setExportToDate('');
                  setExportToTime('');
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleExportSubmit}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && selectedDetection && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detection #{selectedDetection.id}
              </h3>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedDetection(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Detection Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Camera</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedDetection.camera_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Object Class</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedDetection.object_class || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Activity</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedDetection.activity_type ? (
                    <Badge variant={selectedDetection.activity_type === 'in' ? 'success' : 'warning'}>
                      {selectedDetection.activity_type.toUpperCase()}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Track ID</p>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {selectedDetection.object_track_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Detected At</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(parseISO(selectedDetection.detected_at), 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Upload Status</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedDetection.uploaded ? (
                    <Badge variant="success">Uploaded</Badge>
                  ) : (
                    <Badge variant="warning">
                      Retry {selectedDetection.upload_retry_count}
                    </Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Central ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedDetection.central_detection_id || 'N/A'}
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="mb-4 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
              <img
                src={`http://localhost:8000${selectedDetection.image_url}`}
                alt={`Detection ${selectedDetection.id} - ${selectedDetection.object_class || 'Unknown'}`}
                className="max-w-full h-auto max-h-[70vh] object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="text-gray-400 text-center py-12 px-4">
                      <p class="text-lg mb-2">Image not available</p>
                      <p class="text-sm">URL: ${selectedDetection.image_url}</p>
                      <p class="text-xs mt-2 text-gray-500">Full URL: http://localhost:8000${selectedDetection.image_url}</p>
                    </div>`;
                  }
                }}
              />
            </div>

            {/* Image URL for reference */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 font-semibold mb-1">Image URL:</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-blue-900 break-all flex-1">
                  http://localhost:8000{selectedDetection.image_url}
                </code>
                <a
                  href={`http://localhost:8000${selectedDetection.image_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>

            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedDetection(null);
              }}
              className="btn btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
