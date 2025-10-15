'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BeakerIcon,
  PlayIcon,
  CpuChipIcon,
  CloudIcon,
  CalendarDaysIcon,
  CircleStackIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'testing';
  endpoint?: string;
  lastTest?: string;
  responseTime?: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface TestResult {
  service: string;
  success: boolean;
  message: string;
  timestamp: string;
  duration: number;
}

const AdminDiagnostics: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'OpenAI Audio',
      status: 'healthy',
      endpoint: '/api/openai/audio',
      lastTest: '2 minutes ago',
      responseTime: 245,
      icon: SpeakerWaveIcon,
      description: 'Text-to-speech and speech recognition'
    },
    {
      name: 'OpenAI Text',
      status: 'healthy',
      endpoint: '/api/openai/text',
      lastTest: '3 minutes ago',
      responseTime: 1200,
      icon: ChatBubbleLeftRightIcon,
      description: 'GPT-4 text generation and completion'
    },
    {
      name: 'Cohere',
      status: 'warning',
      endpoint: '/api/cohere',
      lastTest: '15 minutes ago',
      responseTime: 800,
      icon: SparklesIcon,
      description: 'AI classification and embeddings'
    },
    {
      name: 'Gemini Flash',
      status: 'healthy',
      endpoint: '/api/gemini',
      lastTest: '1 minute ago',
      responseTime: 340,
      icon: BoltIcon,
      description: 'Fast AI processing and summarization'
    },
    {
      name: 'Google Calendar',
      status: 'healthy',
      endpoint: '/api/calendar',
      lastTest: '5 minutes ago',
      responseTime: 450,
      icon: CalendarDaysIcon,
      description: 'Calendar integration and event management'
    },
    {
      name: 'Supabase Read',
      status: 'healthy',
      endpoint: '/api/supabase/read',
      lastTest: '1 minute ago',
      responseTime: 95,
      icon: CircleStackIcon,
      description: 'Database read operations'
    },
    {
      name: 'Supabase Write',
      status: 'healthy',
      endpoint: '/api/supabase/write',
      lastTest: '2 minutes ago',
      responseTime: 120,
      icon: CircleStackIcon,
      description: 'Database write operations'
    }
  ]);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'warning': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'error': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'testing': return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return CheckCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'error': return XCircleIcon;
      case 'testing': return BeakerIcon;
      default: return BeakerIcon;
    }
  };

  const runSafeTest = useCallback(async (service: ServiceStatus) => {
    // Update service status to testing
    setServices(prev => prev.map(s => 
      s.name === service.name ? { ...s, status: 'testing' } : s
    ));

    const startTime = Date.now();
    
    try {
      // Simulate API test with safe, non-destructive operations
      const testPayload = {
        test: true,
        operation: 'health-check',
        timestamp: Date.now()
      };

      const response = await fetch(`${service.endpoint}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      const duration = Date.now() - startTime;
      const success = response.ok;

      // Update service status based on result
      setServices(prev => prev.map(s => 
        s.name === service.name 
          ? { 
              ...s, 
              status: success ? 'healthy' : 'error',
              lastTest: 'just now',
              responseTime: duration
            } 
          : s
      ));

      // Add test result
      const result: TestResult = {
        service: service.name,
        success,
        message: success ? 'Test passed' : `Error: ${response.status}`,
        timestamp: new Date().toLocaleTimeString(),
        duration
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      setServices(prev => prev.map(s => 
        s.name === service.name 
          ? { 
              ...s, 
              status: 'error',
              lastTest: 'just now',
              responseTime: duration
            } 
          : s
      ));

      const result: TestResult = {
        service: service.name,
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString(),
        duration
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    }
  }, []);

  const runAllTests = useCallback(async () => {
    setIsRunningTests(true);
    
    for (const service of services) {
      await runSafeTest(service);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunningTests(false);
  }, [services, runSafeTest]);

  const calculateHealthScore = () => {
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    return Math.round((healthyCount / services.length) * 100);
  };

  const getOverallStatus = () => {
    const hasErrors = services.some(s => s.status === 'error');
    const hasWarnings = services.some(s => s.status === 'warning');
    const isTesting = services.some(s => s.status === 'testing');

    if (isTesting) return { status: 'testing', text: 'Testing in progress...' };
    if (hasErrors) return { status: 'error', text: 'System errors detected' };
    if (hasWarnings) return { status: 'warning', text: 'Minor issues detected' };
    return { status: 'healthy', text: 'All systems operational' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1A1F2E] to-[#0D1B2A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
              <CpuChipIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">System Diagnostics</h1>
              <p className="text-gray-400">OptiMail AI Engine Health Monitor</p>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`p-4 rounded-xl border backdrop-blur-sm ${getStatusColor(overallStatus.status as 'healthy' | 'warning' | 'error' | 'testing')}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-current animate-pulse" />
                <span className="font-medium">{overallStatus.text}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{calculateHealthScore()}%</div>
                <div className="text-sm opacity-80">System Health</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runAllTests}
            disabled={isRunningTests}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunningTests ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <BoltIcon className="w-4 h-4" />
            Refresh Status
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Status Cards */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <CloudIcon className="w-5 h-5" />
              Service Status
            </h2>

            <div className="grid gap-4">
              {services.map((service) => {
                const StatusIcon = getStatusIcon(service.status);
                const ServiceIcon = service.icon;

                return (
                  <motion.div
                    key={service.name}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-xl border backdrop-blur-sm ${getStatusColor(service.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <ServiceIcon className="w-5 h-5" />
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-4 h-4" />
                        {service.responseTime && (
                          <span className="text-xs opacity-80">
                            {service.responseTime}ms
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs opacity-80 mb-2">{service.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs opacity-60">
                        Last tested: {service.lastTest}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => runSafeTest(service)}
                        className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        Test
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <BeakerIcon className="w-5 h-5" />
              Recent Test Results
            </h2>

            <div className="space-y-2">
              {testResults.length === 0 ? (
                <div className="p-8 text-center text-gray-500 rounded-xl border border-gray-700/50">
                  <BeakerIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No test results yet</p>
                  <p className="text-sm">Run tests to see results here</p>
                </div>
              ) : (
                testResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'border-green-400/30 bg-green-400/10' 
                        : 'border-red-400/30 bg-red-400/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-sm font-medium text-gray-200">
                          {result.service}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <ClockIcon className="w-3 h-3" />
                        {result.duration}ms
                        <span className="opacity-60">{result.timestamp}</span>
                      </div>
                    </div>
                    
                    <p className={`text-xs mt-1 ${
                      result.success ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {result.message}
                    </p>
                  </motion.div>
                ))
              )}
            </div>

            {/* Performance Metrics */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5" />
                Performance & Cost
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold text-green-400">$24.30</div>
                  <div className="text-sm text-gray-400">Monthly Cost</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ↓ 15% from last month
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold text-blue-400">1.2k</div>
                  <div className="text-sm text-gray-400">Tokens/min</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Average throughput
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold text-purple-400">340ms</div>
                  <div className="text-sm text-gray-400">Avg Latency</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ↑ 5ms from yesterday
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold text-yellow-400">99.8%</div>
                  <div className="text-sm text-gray-400">Uptime</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last 30 days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDiagnostics;
