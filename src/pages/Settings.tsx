import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Server,
  Database,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Save,
  Info,
  Cpu,
  HardDrive,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Key,
} from 'lucide-react';
import { format } from 'date-fns';
import { healthApi, settingsApi } from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const queryClient = useQueryClient();
  const [apiUrl, setApiUrl] = useState(
    import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
  );
  const [isSaved, setIsSaved] = useState(false);

  // Central server configuration state
  const [centralServerUrl, setCentralServerUrl] = useState('');
  const [centralServerApiKey, setCentralServerApiKey] = useState('');
  const [centralServerEnabled, setCentralServerEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch health status
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await healthApi.check();
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch root API info
  const { data: apiInfo, isLoading: apiLoading } = useQuery({
    queryKey: ['api-info'],
    queryFn: async () => {
      const response = await healthApi.root();
      return response.data;
    },
  });

  // Fetch central server configuration
  const { data: centralServerConfig, isLoading: centralServerLoading } = useQuery({
    queryKey: ['central-server-config'],
    queryFn: async () => {
      const response = await settingsApi.getCentralServer();
      // Initialize form with current values
      setCentralServerUrl(response.data.central_server_url);
      setCentralServerEnabled(response.data.central_server_enabled);
      return response.data;
    },
  });

  // Update central server configuration mutation
  const updateCentralServerMutation = useMutation({
    mutationFn: (data: { central_server_url: string; central_server_api_key: string; central_server_enabled: boolean }) =>
      settingsApi.updateCentralServer(data),
    onSuccess: () => {
      toast.success('Central server configuration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['central-server-config'] });
      // Clear the API key field after successful update
      setCentralServerApiKey('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update central server configuration');
    },
  });

  const handleSaveApiUrl = () => {
    // In a real app, you'd update the environment or config
    localStorage.setItem('api_url', apiUrl);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleUpdateCentralServer = () => {
    if (!centralServerUrl.trim()) {
      toast.error('Central server URL is required');
      return;
    }
    if (!centralServerApiKey.trim()) {
      toast.error('Central server API key is required');
      return;
    }

    updateCentralServerMutation.mutate({
      central_server_url: centralServerUrl,
      central_server_api_key: centralServerApiKey,
      central_server_enabled: centralServerEnabled,
    });
  };

  const isHealthy = healthData?.status === 'healthy';

  if (healthLoading || apiLoading || centralServerLoading) {
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
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure system settings and view health status
        </p>
      </div>

      {/* System Health */}
      <Card
        title="System Health"
        subtitle="Current system status and health checks"
        action={
          <button
            onClick={() => refetchHealth()}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      >
        <div className="space-y-4">
          {/* Overall Status */}
          <div
            className={`p-4 rounded-lg border-2 ${
              isHealthy
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {isHealthy ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold ${
                    isHealthy ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  System Status: {healthData?.status || 'Unknown'}
                </h3>
                <p
                  className={`text-sm ${
                    isHealthy ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {isHealthy
                    ? 'All systems operational'
                    : 'System experiencing issues'}
                </p>
              </div>
              <Badge variant={isHealthy ? 'success' : 'danger'}>
                {isHealthy ? 'Healthy' : 'Unhealthy'}
              </Badge>
            </div>
          </div>

          {/* Health Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active Workers</p>
                  <p className="text-xl font-bold text-gray-900">
                    {healthData?.active_workers || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Server className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">API Version</p>
                  <p className="text-xl font-bold text-gray-900">
                    {healthData?.version || apiInfo?.version || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-xl font-bold text-gray-900">
                    {apiInfo?.status || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* API Configuration */}
      <Card
        title="API Configuration"
        subtitle="Configure backend API connection settings"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Base URL
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="input flex-1"
                placeholder="http://localhost:8000/api/v1"
              />
              <button
                onClick={handleSaveApiUrl}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
            {isSaved && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Settings saved successfully
              </p>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Configuration Note
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Changes to the API URL will require a page refresh to take effect.
                  Make sure the backend server is running and accessible at the
                  specified URL.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Central Server Configuration */}
      <Card
        title="Central Server Configuration"
        subtitle="Configure central server for detection uploads"
      >
        <div className="space-y-6">
          {/* Current Configuration */}
          {centralServerConfig && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Current Configuration</h3>
                <Badge variant={centralServerConfig.central_server_enabled ? 'success' : 'danger'}>
                  {centralServerConfig.central_server_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">Central Server URL</p>
                    <p className="text-sm text-gray-900 mt-0.5 font-mono break-all">
                      {centralServerConfig.central_server_url}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">API Key</p>
                    <p className="text-sm text-gray-900 mt-0.5 font-mono">
                      {centralServerConfig.central_server_api_key}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">Timeout</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {centralServerConfig.central_server_timeout} seconds
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">Organization ID</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {centralServerConfig.organization_id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Enable Central Server Uploads</p>
                <p className="text-xs text-gray-500 mt-1">
                  Toggle to enable or disable uploading detections to central server
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={centralServerEnabled}
                  onChange={(e) => setCentralServerEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Central Server URL
              </label>
              <input
                type="text"
                value={centralServerUrl}
                onChange={(e) => setCentralServerUrl(e.target.value)}
                className="input w-full"
                placeholder="http://localhost:8010/api/v1/anpr/upload"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Token
              </label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={centralServerApiKey}
                  onChange={(e) => setCentralServerApiKey(e.target.value)}
                  className="input flex-1 font-mono"
                  placeholder="Enter API token"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="btn btn-secondary"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleUpdateCentralServer}
              disabled={updateCentralServerMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateCentralServerMutation.isPending ? 'Updating...' : 'Update Configuration'}
            </button>
          </div>

          {/* Important Notes */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Important Notes</p>
                <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Changes are applied immediately to all new detection uploads</li>
                  <li>Configuration updates are in-memory only and will be lost on server restart</li>
                  <li>For persistent changes, update the .env file on the backend server</li>
                  <li>Ensure the central server is accessible and the API token is valid</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* System Information */}
      <Card title="System Information" subtitle="Backend server details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Server className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Service Name</p>
                <p className="text-sm text-gray-900 mt-1">
                  {apiInfo?.name || 'ANPR Client API'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">API Version</p>
                <p className="text-sm text-gray-900 mt-1">
                  {apiInfo?.version || healthData?.version || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Status</p>
                <p className="text-sm text-gray-900 mt-1">
                  <Badge variant={isHealthy ? 'success' : 'danger'}>
                    {apiInfo?.status || healthData?.status || 'Unknown'}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Cpu className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Active Workers</p>
                <p className="text-sm text-gray-900 mt-1">
                  {healthData?.active_workers || 0} worker(s) running
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <HardDrive className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">API Endpoint</p>
                <p className="text-sm text-gray-900 mt-1 font-mono break-all">
                  {apiUrl}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Last Checked</p>
                <p className="text-sm text-gray-900 mt-1">
                  {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Environment Variables */}
      <Card title="Environment" subtitle="Current environment configuration">
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Mode</span>
            <Badge variant="info">{import.meta.env.MODE}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Development</span>
            <Badge variant={import.meta.env.DEV ? 'warning' : 'success'}>
              {import.meta.env.DEV ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Production</span>
            <Badge variant={import.meta.env.PROD ? 'success' : 'warning'}>
              {import.meta.env.PROD ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Troubleshooting */}
      <Card title="Troubleshooting" subtitle="Common issues and solutions">
        <div className="space-y-4">
          <div className="border-l-4 border-yellow-400 pl-4 py-2">
            <h4 className="font-medium text-gray-900">
              Connection Issues
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              If you're experiencing connection issues, verify that:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
              <li>The backend server is running</li>
              <li>The API URL is correct</li>
              <li>There are no firewall or network issues</li>
              <li>CORS is properly configured on the backend</li>
            </ul>
          </div>

          <div className="border-l-4 border-blue-400 pl-4 py-2">
            <h4 className="font-medium text-gray-900">
              Worker Not Starting
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              If workers fail to start:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
              <li>Check camera stream URL is accessible</li>
              <li>Verify camera configuration (ROI, detection line)</li>
              <li>Check backend logs for error messages</li>
              <li>Ensure sufficient system resources</li>
            </ul>
          </div>

          <div className="border-l-4 border-red-400 pl-4 py-2">
            <h4 className="font-medium text-gray-900">
              Upload Failures
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              If detections are not uploading:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
              <li>Check central server connectivity</li>
              <li>Verify API credentials and permissions</li>
              <li>Review retry count limits</li>
              <li>Check network bandwidth and stability</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* System Alerts */}
      {!isHealthy && (
        <Card>
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">System Health Alert</p>
              <p className="text-xs text-red-600">
                The system is not healthy. Please check the backend server and logs
                for more information.
              </p>
            </div>
          </div>
        </Card>
      )}

      {healthData && healthData.active_workers === 0 && (
        <Card>
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">No Active Workers</p>
              <p className="text-xs text-yellow-600">
                No workers are currently running. Start workers from the Cameras or
                Workers page to begin processing video streams.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
