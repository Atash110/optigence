'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ServerIcon,
  CpuChipIcon,
  CloudIcon,
  CommandLineIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface DiagnosticResult {
  service: string;
  status: 'success' | 'error' | 'not_configured';
  latency?: number;
  details?: string;
  error?: string;
  timestamp: string;
}

interface HealthCheckResponse {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  results: DiagnosticResult[];
  summary: {
    total: number;
    success: number;
    errors: number;
    not_configured: number;
  };
}

interface ServiceConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  endpoint: string;
  critical: boolean;
}

const DiagnosticsPage: React.FC = () => {
  const [healthCheck, setHealthCheck] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Service configuration mapping
  const serviceConfigs: Record<string, ServiceConfig> = {
    'OpenAI GPT-4': {
      name: 'OpenAI GPT-4',
      icon: CpuChipIcon,
      description: 'Text generation and completion',
      endpoint: '/api/optimail/diagnostics',
      critical: true
    },
    'OpenAI Whisper': {
      name: 'OpenAI Whisper',
      icon: CommandLineIcon,
      description: 'Audio transcription service',
      endpoint: '/api/asr/transcribe',
      critical: true
    },
    'Google Gemini': {
      name: 'Google Gemini',
      icon: CloudIcon,
      description: 'Entity extraction and analysis',
      endpoint: '/api/extract',
      critical: true
    },
    'Cohere': {
      name: 'Cohere',
      icon: ChartBarIcon,
      description: 'Intent classification',
      endpoint: '/api/intent',
      critical: false
    },
    'Supabase': {
      name: 'Supabase',
      icon: ServerIcon,
      description: 'Database and authentication',
      endpoint: '/api/templates',
      critical: true
    },
    'Google Calendar': {
      name: 'Google Calendar',
      icon: CalendarIcon,
      description: 'Calendar integration',
      endpoint: '/api/calendar/check',
      critical: false
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/optimail/diagnostics');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      // Try to parse JSON with better error handling
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Invalid JSON response from diagnostics API');
      }
      
      setHealthCheck(data);
      setLastRun(new Date().toLocaleString());
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
      setHealthCheck({
        overall: 'unhealthy',
        results: [{
          service: 'Diagnostics API',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }],
        summary: { total: 1, success: 0, errors: 1, not_configured: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run diagnostics on page load
    runDiagnostics();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(runDiagnostics, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'error': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'not_configured': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return CheckCircleIcon;
      case 'error': return XCircleIcon;
      case 'not_configured': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  const getOverallStatusColor = (overall: string) => {
    switch (overall) {
      case 'healthy': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'degraded': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'unhealthy': return 'text-red-400 bg-red-900/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const formatLatency = (latency: number | undefined): string => {
    if (!latency) return 'N/A';
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  const getLatencyColor = (latency: number | undefined): string => {
    if (!latency) return 'text-gray-400';
    if (latency < 1000) return 'text-green-400';
    if (latency < 3000) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                🔍 OptiMail System Diagnostics
              </h1>
              <p className="text-gray-400">
                Real-time API health monitoring and configuration validation
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoRefresh" className="text-sm text-gray-300">
                  Auto-refresh
                </label>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={runDiagnostics}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Running Tests...' : 'Run All Tests'}
              </motion.button>
            </div>
          </div>
          
          {lastRun && (
            <div className="mt-4 text-sm text-gray-400">
              Last run: {lastRun}
            </div>
          )}
        </div>

        {/* Overall Status */}
        {healthCheck && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100">System Health</h2>
              <div className={`px-4 py-2 rounded-full font-medium border ${getOverallStatusColor(healthCheck.overall)}`}>
                {healthCheck.overall.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-100">{healthCheck.summary.total}</div>
                <div className="text-sm text-gray-400">Total Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{healthCheck.summary.success}</div>
                <div className="text-sm text-gray-400">Operational</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{healthCheck.summary.errors}</div>
                <div className="text-sm text-gray-400">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{healthCheck.summary.not_configured}</div>
                <div className="text-sm text-gray-400">Not Configured</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Service Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {healthCheck?.results.map((result, index) => {
              const StatusIcon = getStatusIcon(result.status);
              const config = serviceConfigs[result.service];
              const ServiceIcon = config?.icon || ServerIcon;
              
              return (
                <motion.div
                  key={result.service}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <ServiceIcon className="w-6 h-6 text-gray-400" />
                        <div>
                          <h3 className="font-semibold text-gray-100 text-sm">{result.service}</h3>
                          {config && (
                            <p className="text-xs text-gray-400">{config.description}</p>
                          )}
                        </div>
                      </div>
                      <StatusIcon className={`w-6 h-6 ${
                        result.status === 'success' ? 'text-green-400' :
                        result.status === 'error' ? 'text-red-400' :
                        'text-yellow-400'
                      }`} />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Status</span>
                        <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(result.status)}`}>
                          {result.status.toUpperCase()}
                        </div>
                      </div>
                      
                      {result.latency && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Latency</span>
                          <span className={`text-sm font-mono ${getLatencyColor(result.latency)}`}>
                            {formatLatency(result.latency)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Last Check</span>
                        <span className="text-sm font-mono text-gray-300">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {result.details && (
                        <div className="text-xs text-gray-400 bg-white/5 p-2 rounded border border-white/10">
                          {result.details}
                        </div>
                      )}
                      
                      {result.error && (
                        <div className="text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-500/30">
                          <strong className="text-red-400">Error:</strong> {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Configuration Guide */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6 mt-6"
        >
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Configuration Guide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-100 mb-3">Required Environment Variables</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <code className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300">OPENAI_API_KEY</code>
                  <span className={healthCheck?.results.find(r => r.service.includes('OpenAI'))?.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {healthCheck?.results.find(r => r.service.includes('OpenAI'))?.status === 'success' ? 
                      <CheckCircleIcon className="w-4 h-4" /> : 
                      <XCircleIcon className="w-4 h-4" />
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <code className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300">GEMINI_API_KEY</code>
                  <span className={healthCheck?.results.find(r => r.service.includes('Gemini'))?.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {healthCheck?.results.find(r => r.service.includes('Gemini'))?.status === 'success' ? 
                      <CheckCircleIcon className="w-4 h-4" /> : 
                      <XCircleIcon className="w-4 h-4" />
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <code className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300">COHERE_API_KEY</code>
                  <span className={healthCheck?.results.find(r => r.service.includes('Cohere'))?.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {healthCheck?.results.find(r => r.service.includes('Cohere'))?.status === 'success' ? 
                      <CheckCircleIcon className="w-4 h-4" /> : 
                      <XCircleIcon className="w-4 h-4" />
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <code className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300">GOOGLE_CLIENT_ID</code>
                  <span className={healthCheck?.results.find(r => r.service.includes('Calendar'))?.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {healthCheck?.results.find(r => r.service.includes('Calendar'))?.status === 'success' ? 
                      <CheckCircleIcon className="w-4 h-4" /> : 
                      <XCircleIcon className="w-4 h-4" />
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-100 mb-3">Next Steps</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                {(healthCheck?.summary.not_configured ?? 0) > 0 && (
                  <li className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
                    Configure missing API keys in .env.local
                  </li>
                )}
                {(healthCheck?.summary.errors ?? 0) > 0 && (
                  <li className="flex items-center gap-2">
                    <XCircleIcon className="w-4 h-4 text-red-400" />
                    Review error messages and check API key validity
                  </li>
                )}
                {healthCheck?.overall === 'healthy' && (
                  <li className="flex items-center gap-2 text-green-400">
                    <CheckCircleIcon className="w-4 h-4" />
                    All services operational!
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <ArrowPathIcon className="w-4 h-4 text-blue-400" />
                  Run tests after making configuration changes
                </li>
                <li className="flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-purple-400" />
                  Check{' '}
                  <a href="/reports/mock-audit-comprehensive.md" className="text-blue-400 hover:underline">
                    mock audit report
                  </a>{' '}
                  for upgrade status
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DiagnosticsPage;
