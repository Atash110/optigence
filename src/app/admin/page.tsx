'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  ServerIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  BoltIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface SystemStats {
  totalUsers: number;
  totalEmails: number;
  templatesCreated: number;
  avgResponseTime: number;
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck: string;
}

interface AdminTool {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'active' | 'maintenance' | 'disabled';
  badge?: string;
}

const AdminPage: React.FC = () => {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const adminTools: AdminTool[] = [
    {
      title: 'System Diagnostics',
      description: 'Monitor API health, latency, and service status',
      href: '/admin/diagnostics',
      icon: ServerIcon,
      status: 'active',
      badge: 'Real-time'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts, permissions, and access levels',
      href: '/admin/users',
      icon: UserGroupIcon,
      status: 'maintenance',
      badge: 'Coming Soon'
    },
    {
      title: 'Email Analytics',
      description: 'View email performance, delivery rates, and user engagement',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      status: 'disabled',
      badge: 'Planned'
    },
    {
      title: 'Database Management',
      description: 'Monitor database performance, storage, and queries',
      href: '/admin/database',
      icon: CircleStackIcon,
      status: 'disabled',
      badge: 'Planned'
    },
    {
      title: 'Template Library',
      description: 'Manage global email templates and approval workflows',
      href: '/admin/templates',
      icon: DocumentTextIcon,
      status: 'maintenance',
      badge: 'Beta'
    },
    {
      title: 'Security Settings',
      description: 'Configure authentication, API keys, and security policies',
      href: '/admin/security',
      icon: ShieldCheckIcon,
      status: 'disabled',
      badge: 'Planned'
    },
    {
      title: 'Performance Monitoring',
      description: 'Track system performance, bottlenecks, and optimization',
      href: '/admin/performance',
      icon: BoltIcon,
      status: 'maintenance',
      badge: 'Alpha'
    },
    {
      title: 'System Configuration',
      description: 'Modify system settings, feature flags, and integrations',
      href: '/admin/config',
      icon: CogIcon,
      status: 'disabled',
      badge: 'Planned'
    }
  ];

  // Fetch system statistics
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        setLoading(true);
        
        // Simulate API call - in real implementation, this would fetch from your admin API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check diagnostics endpoint for health status
        let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        let avgResponseTime = 0;
        
        try {
          const startTime = Date.now();
          const response = await fetch('/api/optimail/diagnostics');
          const latency = Date.now() - startTime;
          
          if (response.ok) {
            const data = await response.json();
            avgResponseTime = latency;
            
            // Determine health based on response and any errors
            if (data.overall === 'healthy') {
              healthStatus = latency > 3000 ? 'degraded' : 'healthy';
            } else {
              healthStatus = data.overall;
            }
          } else {
            healthStatus = 'unhealthy';
            avgResponseTime = latency;
          }
        } catch {
          healthStatus = 'unhealthy';
          avgResponseTime = 5000;
        }
        
        setSystemStats({
          totalUsers: Math.floor(Math.random() * 1000) + 2500,
          totalEmails: Math.floor(Math.random() * 50000) + 150000,
          templatesCreated: Math.floor(Math.random() * 200) + 450,
          avgResponseTime,
          systemHealth: healthStatus,
          lastHealthCheck: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
        setSystemStats({
          totalUsers: 0,
          totalEmails: 0,
          templatesCreated: 0,
          avgResponseTime: 0,
          systemHealth: 'unhealthy',
          lastHealthCheck: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStats();
  }, []);

  const getStatusColor = (status: AdminTool['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'maintenance': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'disabled': return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'unhealthy': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'unhealthy': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl font-bold mb-4">
              ⚡ OptiMail Admin Dashboard
            </h1>
            <p className="text-xl text-gray-400">
              System management and monitoring center
            </p>
          </motion.div>

          {/* System Health Banner */}
          {systemStats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-white/5 border-2 rounded-xl p-4 ${
                systemStats.systemHealth === 'healthy' ? 'border-green-500/30' :
                systemStats.systemHealth === 'degraded' ? 'border-yellow-500/30' :
                'border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getHealthIcon(systemStats.systemHealth)}</span>
                  <div>
                    <div className="font-semibold">
                      System Status: {' '}
                      <span className={getHealthColor(systemStats.systemHealth)}>
                        {systemStats.systemHealth.charAt(0).toUpperCase() + systemStats.systemHealth.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Avg Response: {systemStats.avgResponseTime}ms • Last Check: {' '}
                      {new Date(systemStats.lastHealthCheck).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <Link
                  href="/admin/diagnostics"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          )}
        </div>

        {/* System Statistics */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 text-center"
            >
              <UserGroupIcon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-100">
                {systemStats.totalUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Users</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 text-center"
            >
              <DocumentTextIcon className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-100">
                {systemStats.totalEmails.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Emails Processed</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 text-center"
            >
              <ChartBarIcon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-100">
                {systemStats.templatesCreated}
              </div>
              <div className="text-sm text-gray-400">Active Templates</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 text-center"
            >
              <ClockIcon className="w-8 h-8 text-orange-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-100">
                {systemStats.avgResponseTime}ms
              </div>
              <div className="text-sm text-gray-400">Avg Response Time</div>
            </motion.div>
          </div>
        )}

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {adminTools.map((tool, index) => {
            const IconComponent = tool.icon;
            const isDisabled = tool.status === 'disabled' || tool.status === 'maintenance';
            
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/5 border border-white/10 rounded-xl p-6 transition-all ${
                  isDisabled 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:bg-white/10 hover:scale-[1.02] cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <IconComponent className={`w-8 h-8 ${
                    tool.status === 'active' ? 'text-blue-400' :
                    tool.status === 'maintenance' ? 'text-yellow-400' :
                    'text-gray-500'
                  }`} />
                  
                  {tool.badge && (
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(tool.status)}`}>
                      {tool.badge}
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-100 mb-2">
                  {tool.title}
                </h3>
                
                <p className="text-sm text-gray-400 mb-4">
                  {tool.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${
                    tool.status === 'active' ? 'text-green-400' :
                    tool.status === 'maintenance' ? 'text-yellow-400' :
                    'text-gray-500'
                  }`}>
                    {tool.status === 'active' ? 'Available' :
                     tool.status === 'maintenance' ? 'In Development' :
                     'Coming Soon'}
                  </span>
                  
                  {tool.status === 'maintenance' && (
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
              </motion.div>
            );

            if (isDisabled) {
              return <div key={tool.title}>{card}</div>;
            }

            return (
              <Link key={tool.title} href={tool.href}>
                {card}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/diagnostics"
              className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ServerIcon className="w-6 h-6 text-blue-400" />
              <div>
                <div className="font-medium text-gray-100">Run Diagnostics</div>
                <div className="text-sm text-gray-400">Check all system health</div>
              </div>
            </Link>
            
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg opacity-60 cursor-not-allowed">
              <UserGroupIcon className="w-6 h-6 text-gray-500" />
              <div>
                <div className="font-medium text-gray-400">User Analytics</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg opacity-60 cursor-not-allowed">
              <CircleStackIcon className="w-6 h-6 text-gray-500" />
              <div>
                <div className="font-medium text-gray-400">System Backup</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
