// Advanced Analytics Dashboard for OptiMail Phase 7
// Displays predictive insights, performance metrics, and business intelligence

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

interface AnalyticsDashboardProps {
  userId: string
  teamId?: string
  timeframe?: 'last_7_days' | 'last_30_days' | 'last_90_days'
}

interface DashboardData {
  overview: {
    email_success_rate: number
    predictions_made: number
    time_saved_hours: number
    optimization_suggestions_applied: number
    recent_predictions: Array<{
      email_subject: string
      predicted_success: number
      actual_outcome: string
      created_at: string
    }>
    trending_insights: string[]
  }
  performance: {
    email_metrics: {
      total_emails_analyzed: number
      avg_predicted_success: number
      actual_success_rate: number
      prediction_accuracy: number
    }
    timing_optimization: {
      suggestions_made: number
      suggestions_followed: number
      improvement_achieved: number
    }
    content_optimization: {
      suggestions_made: number
      suggestions_applied: number
      avg_improvement: number
    }
    productivity_gains: {
      time_saved_hours: number
      emails_auto_optimized: number
      manual_review_time_reduced: number
    }
  }
  anomalies: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    description: string
    suggested_action: string
    confidence: number
  }>
}

const AdvancedAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  teamId,
  timeframe = 'last_30_days'
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'predictions' | 'intelligence'>('overview')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [userId, teamId, timeframe])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch overview data
      const overviewResponse = await fetch(
        `/api/analytics/predict?action=dashboard_overview&user_id=${userId}${teamId ? `&team_id=${teamId}` : ''}`
      )
      const overviewData = await overviewResponse.json()

      // Fetch performance metrics
      const performanceResponse = await fetch(
        `/api/analytics/predict?action=performance_metrics&user_id=${userId}&timeframe=${timeframe}${teamId ? `&team_id=${teamId}` : ''}`
      )
      const performanceData = await performanceResponse.json()

      // Fetch anomalies
      const anomaliesResponse = await fetch('/api/analytics/predict?action=detect_anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe: timeframe,
          sensitivity: 'medium',
          user_id: userId,
          team_id: teamId
        })
      })
      const anomaliesData = await anomaliesResponse.json()

      setDashboardData({
        overview: overviewData.overview,
        performance: performanceData.metrics,
        anomalies: anomaliesData.anomalies || []
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshDashboard = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading advanced analytics...</span>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p>Unable to load analytics data. Please try again.</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // Chart data configurations
  const successRateChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Predicted Success Rate',
        data: [72, 75, 78, 76, 81, 83],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Actual Success Rate',
        data: [68, 73, 76, 74, 79, 81],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }
    ]
  }

  const optimizationChart = {
    labels: ['Content', 'Timing', 'Recipients', 'Subject Line'],
    datasets: [
      {
        data: [35, 25, 20, 20],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  }

  const productivityChart = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Time Saved (Hours)',
        data: [8, 12, 15, 23],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🚀 Advanced Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered insights and predictive intelligence for OptiMail
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={timeframe} 
              onChange={(e) => window.location.reload()}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
            </select>
            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {refreshing ? '🔄' : '↻'} Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['overview', 'performance', 'predictions', 'intelligence'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' && '📊'} 
                {tab === 'performance' && '📈'} 
                {tab === 'predictions' && '🔮'} 
                {tab === 'intelligence' && '🧠'} 
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Email Success Rate"
                  value={`${Math.round(dashboardData.overview.email_success_rate * 100)}%`}
                  trend="+12% vs last month"
                  icon="📧"
                />
                <MetricCard
                  title="Predictions Made"
                  value={dashboardData.overview.predictions_made.toString()}
                  trend="+34 this week"
                  icon="🔮"
                />
                <MetricCard
                  title="Time Saved"
                  value={`${dashboardData.overview.time_saved_hours}h`}
                  trend="+8h this week"
                  icon="⏰"
                />
                <MetricCard
                  title="Optimizations Applied"
                  value={dashboardData.overview.optimization_suggestions_applied.toString()}
                  trend="67 this month"
                  icon="⚡"
                />
              </div>

              {/* Success Rate Trend Chart */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">📈 Success Rate Trends</h3>
                <div style={{ height: '300px' }}>
                  <Line 
                    data={successRateChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' as const }
                      }
                    }} 
                  />
                </div>
              </div>

              {/* Recent Predictions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">🔮 Recent Predictions</h3>
                <div className="space-y-3">
                  {dashboardData.overview.recent_predictions.map((prediction, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                      <div>
                        <p className="font-medium">{prediction.email_subject}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(prediction.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {Math.round(prediction.predicted_success * 100)}%
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          prediction.actual_outcome === 'success' 
                            ? 'bg-green-100 text-green-800'
                            : prediction.actual_outcome === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {prediction.actual_outcome}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Insights */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">💡 Trending Insights</h3>
                <div className="space-y-2">
                  {dashboardData.overview.trending_insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <p className="text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'performance' && (
            <div className="space-y-6">
              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 Email Analytics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Analyzed:</span>
                      <span className="font-bold">{dashboardData.performance.email_metrics.total_emails_analyzed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Predicted Success:</span>
                      <span className="font-bold text-blue-600">
                        {Math.round(dashboardData.performance.email_metrics.avg_predicted_success * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual Success Rate:</span>
                      <span className="font-bold text-green-600">
                        {Math.round(dashboardData.performance.email_metrics.actual_success_rate * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prediction Accuracy:</span>
                      <span className="font-bold text-purple-600">
                        {Math.round(dashboardData.performance.email_metrics.prediction_accuracy * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">🎯 Optimization Impact</h3>
                  <div style={{ height: '200px' }}>
                    <Doughnut 
                      data={optimizationChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom' }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Productivity Gains Chart */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">⚡ Productivity Gains</h3>
                <div style={{ height: '300px' }}>
                  <Bar 
                    data={productivityChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Timing Suggestions"
                  value={dashboardData.performance.timing_optimization.suggestions_made.toString()}
                  trend={`${dashboardData.performance.timing_optimization.suggestions_followed} followed`}
                  icon="⏰"
                />
                <MetricCard
                  title="Content Optimizations"
                  value={dashboardData.performance.content_optimization.suggestions_made.toString()}
                  trend={`${dashboardData.performance.content_optimization.suggestions_applied} applied`}
                  icon="📝"
                />
                <MetricCard
                  title="Auto-Optimized"
                  value={dashboardData.performance.productivity_gains.emails_auto_optimized.toString()}
                  trend={`${Math.round(dashboardData.performance.productivity_gains.manual_review_time_reduced * 100)}% less review time`}
                  icon="🤖"
                />
              </div>
            </div>
          )}

          {selectedTab === 'predictions' && (
            <div className="space-y-6">
              <PredictionInterface userId={userId} />
            </div>
          )}

          {selectedTab === 'intelligence' && (
            <div className="space-y-6">
              {/* Anomaly Detection */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">🚨 Anomaly Detection</h3>
                {dashboardData.anomalies.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.anomalies.map((anomaly, index) => (
                      <div key={index} className={`p-4 rounded border-l-4 ${
                        anomaly.severity === 'high' ? 'bg-red-50 border-red-400' :
                        anomaly.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                        'bg-blue-50 border-blue-400'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{anomaly.description}</p>
                            <p className="text-sm text-gray-600 mt-1">{anomaly.suggested_action}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded uppercase ${
                            anomaly.severity === 'high' ? 'bg-red-200 text-red-800' :
                            anomaly.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {anomaly.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No anomalies detected. Your communication patterns look healthy! 🎉</p>
                )}
              </div>

              {/* Business Intelligence Insights */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">🧠 Business Intelligence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded p-4">
                    <h4 className="font-medium mb-2">Communication Efficiency</h4>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                      <span className="ml-2 text-sm font-bold">87%</span>
                    </div>
                  </div>
                  <div className="bg-white rounded p-4">
                    <h4 className="font-medium mb-2">Competitive Advantage</h4>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                      <span className="ml-2 text-sm font-bold">82%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
const MetricCard: React.FC<{
  title: string
  value: string
  trend: string
  icon: string
}> = ({ title, value, trend, icon }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-green-600">{trend}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
)

// Real-time Prediction Interface
const PredictionInterface: React.FC<{ userId: string }> = ({ userId }) => {
  const [emailContent, setEmailContent] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [recipients, setRecipients] = useState('')
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const makePrediction = async () => {
    if (!emailContent || !emailSubject || !recipients) return

    setLoading(true)
    try {
      const response = await fetch('/api/analytics/predict?action=predict_email_success&user_id=' + userId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: emailContent,
          subject: emailSubject,
          recipients: recipients.split(',').map(r => r.trim()),
          user_id: userId
        })
      })
      const result = await response.json()
      setPrediction(result.prediction)
    } catch (error) {
      console.error('Prediction error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">🔮 Real-time Email Success Prediction</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter email subject..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipients (comma-separated)</label>
          <input
            type="text"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="recipient1@example.com, recipient2@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
          <textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter your email content..."
          />
        </div>
        
        <button
          onClick={makePrediction}
          disabled={loading || !emailContent || !emailSubject || !recipients}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : '🔮 Predict Email Success'}
        </button>
        
        {prediction && (
          <div className="mt-6 p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-3">📊 Prediction Results</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(prediction.success_probability * 100)}%
                </div>
                <div className="text-sm text-gray-600">Success Probability</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {prediction.predicted_response_time}
                </div>
                <div className="text-sm text-gray-600">Expected Response Time</div>
              </div>
            </div>
            
            <div className="mb-4">
              <h5 className="font-medium mb-2">🎯 Optimization Suggestions</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {prediction.optimization_suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">📈 Predicted Metrics</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Open Rate: <span className="font-bold">{Math.round(prediction.predicted_metrics.open_rate * 100)}%</span></div>
                <div>Click Rate: <span className="font-bold">{Math.round(prediction.predicted_metrics.click_rate * 100)}%</span></div>
                <div>Response Rate: <span className="font-bold">{Math.round(prediction.predicted_metrics.response_rate * 100)}%</span></div>
                <div>Conversion Rate: <span className="font-bold">{Math.round(prediction.predicted_metrics.conversion_rate * 100)}%</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedAnalyticsDashboard
