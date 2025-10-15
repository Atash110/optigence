// Predictive Analytics API
// Provides AI-powered email success predictions and optimization suggestions

import { NextRequest, NextResponse } from 'next/server'
import PredictiveAnalyticsEngine from '@/lib/predictive-analytics'
import { z } from 'zod'

// Email prediction request schema
const emailPredictionSchema = z.object({
  content: z.string().min(10),
  subject: z.string().min(1),
  recipients: z.array(z.string().email()),
  timing: z.string().optional(),
  context: z.string().optional(),
  template_id: z.string().optional(),
  user_id: z.string()
})

// Timing optimization request schema
const timingOptimizationSchema = z.object({
  recipients: z.array(z.string().email()),
  urgency: z.enum(['low', 'medium', 'high']),
  contentType: z.string(),
  timezone: z.string().optional()
})

// Anomaly detection request schema
const anomalyDetectionSchema = z.object({
  timeframe: z.string(),
  sensitivity: z.enum(['low', 'medium', 'high']),
  user_id: z.string().optional(),
  team_id: z.string().optional()
})

// Business intelligence request schema
const businessIntelligenceSchema = z.object({
  team_id: z.string(),
  timeframe: z.string(),
  metrics: z.array(z.string())
})

const analyticsEngine = new PredictiveAnalyticsEngine()

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: user_id' },
        { status: 400 }
      )
    }

    const body = await request.json()

    switch (action) {
      case 'predict_email_success': {
        const validatedData = emailPredictionSchema.parse(body)
        
        const prediction = await analyticsEngine.predictEmailSuccess({
          ...validatedData,
          user_id: userId
        })

        return NextResponse.json({
          success: true,
          prediction,
          timestamp: new Date().toISOString()
        })
      }

      case 'optimize_timing': {
        const validatedData = timingOptimizationSchema.parse(body)
        
        const timingOptimization = await analyticsEngine.getOptimalSendTime(validatedData)

        return NextResponse.json({
          success: true,
          timing_optimization: timingOptimization,
          timestamp: new Date().toISOString()
        })
      }

      case 'detect_anomalies': {
        const validatedData = anomalyDetectionSchema.parse(body)
        
        const anomalies = await analyticsEngine.detectAnomalies(validatedData)

        return NextResponse.json({
          success: true,
          anomalies,
          count: anomalies.length,
          timestamp: new Date().toISOString()
        })
      }

      case 'business_intelligence': {
        const validatedData = businessIntelligenceSchema.parse(body)
        
        const intelligence = await analyticsEngine.generateBusinessIntelligence(validatedData)

        return NextResponse.json({
          success: true,
          business_intelligence: intelligence,
          timestamp: new Date().toISOString()
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: predict_email_success, optimize_timing, detect_anomalies, business_intelligence' },
          { status: 400 }
        )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors,
          success: false 
        },
        { status: 400 }
      )
    }

    console.error('Error in analytics API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('user_id')
    const teamId = searchParams.get('team_id')

    if (!userId && !teamId) {
      return NextResponse.json(
        { error: 'Missing required parameter: user_id or team_id' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'dashboard_overview': {
        // Get comprehensive analytics overview
        const overview = await getDashboardOverview(userId, teamId)
        
        return NextResponse.json({
          success: true,
          overview,
          timestamp: new Date().toISOString()
        })
      }

      case 'performance_metrics': {
        // Get performance metrics for specific timeframe
        const timeframe = searchParams.get('timeframe') || 'last_30_days'
        const metrics = await getPerformanceMetrics(userId, teamId, timeframe)
        
        return NextResponse.json({
          success: true,
          metrics,
          timeframe,
          timestamp: new Date().toISOString()
        })
      }

      case 'prediction_history': {
        // Get history of predictions and their accuracy
        const limit = parseInt(searchParams.get('limit') || '50')
        const history = await getPredictionHistory(userId, teamId, limit)
        
        return NextResponse.json({
          success: true,
          history,
          count: history.length,
          timestamp: new Date().toISOString()
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: dashboard_overview, performance_metrics, prediction_history' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in analytics GET:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}

// Helper functions

async function getDashboardOverview(userId?: string, teamId?: string): Promise<Record<string, unknown>> {
  // Implementation would aggregate key analytics metrics
  const mockOverview = {
    email_success_rate: 0.76,
    predictions_made: 145,
    time_saved_hours: 23,
    optimization_suggestions_applied: 67,
    recent_predictions: [
      {
        email_subject: "Q4 Strategy Meeting",
        predicted_success: 0.89,
        actual_outcome: "pending",
        created_at: new Date().toISOString()
      },
      {
        email_subject: "Client Follow-up",
        predicted_success: 0.72,
        actual_outcome: "success",
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    trending_insights: [
      "Tuesday 10 AM shows highest engagement rates",
      "Personalized subject lines improve success by 23%",
      "Emails under 150 words have better response rates"
    ]
  }

  return mockOverview
}

async function getPerformanceMetrics(userId?: string, teamId?: string, timeframe?: string): Promise<Record<string, unknown>> {
  // Implementation would fetch detailed performance metrics
  const mockMetrics = {
    timeframe,
    email_metrics: {
      total_emails_analyzed: 234,
      avg_predicted_success: 0.73,
      actual_success_rate: 0.71,
      prediction_accuracy: 0.89
    },
    timing_optimization: {
      suggestions_made: 89,
      suggestions_followed: 67,
      improvement_achieved: 0.18
    },
    content_optimization: {
      suggestions_made: 156,
      suggestions_applied: 123,
      avg_improvement: 0.15
    },
    productivity_gains: {
      time_saved_hours: 47,
      emails_auto_optimized: 89,
      manual_review_time_reduced: 0.34
    }
  }

  return mockMetrics
}

async function getPredictionHistory(userId?: string, teamId?: string, limit?: number): Promise<Array<Record<string, unknown>>> {
  // Implementation would fetch prediction history with accuracy tracking
  const mockHistory = [
    {
      id: "pred_001",
      email_subject: "Product Demo Request",
      predicted_success: 0.85,
      actual_outcome: "success",
      accuracy_score: 0.92,
      optimization_suggestions: ["Optimize send time", "Add personalization"],
      created_at: new Date().toISOString(),
      outcome_confirmed_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: "pred_002", 
      email_subject: "Meeting Reschedule",
      predicted_success: 0.67,
      actual_outcome: "success",
      accuracy_score: 0.78,
      optimization_suggestions: ["Reduce content length", "Strengthen CTA"],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      outcome_confirmed_at: new Date(Date.now() - 79200000).toISOString()
    }
  ]

  return mockHistory.slice(0, limit || 50)
}
