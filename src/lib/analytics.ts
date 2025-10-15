/**
 * OptiMail Analytics Service
 * Tracks usage patterns, performance metrics, and provides insights
 */

export interface EmailMetrics {
  sent: number;
  received: number;
  replied: number;
  opened?: number;
  clicked?: number;
}

export interface TemplateMetrics {
  templateId: string;
  templateName: string;
  usageCount: number;
  successRate: number;
  avgResponseTime: number;
  lastUsed: Date;
}

export interface VoiceCommandMetrics {
  command: string;
  usageCount: number;
  successRate: number;
  avgExecutionTime: number;
}

export interface CrossModuleMetrics {
  targetModule: string;
  actionType: string;
  usageCount: number;
  successRate: number;
  avgResponseTime: number;
}

export interface CalendarMetrics {
  meetingsScheduled: number;
  smartSlotsGenerated: number;
  smartSlotAcceptanceRate: number;
  avgSchedulingTime: number;
}

export interface ProductivityMetrics {
  emailsPerHour: number;
  responseTime: number;
  templatesUsed: number;
  voiceCommandsUsed: number;
  meetingsScheduled: number;
  crossModuleActions: number;
  timeSpentComposing: number;
  aiAssistanceUsage: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface AnalyticsDashboard {
  overview: {
    totalEmails: number;
    avgResponseTime: number;
    productivityScore: number;
    aiUsagePercentage: number;
  };
  timeRange: 'day' | 'week' | 'month' | 'year';
  emailMetrics: EmailMetrics;
  templateMetrics: TemplateMetrics[];
  voiceMetrics: VoiceCommandMetrics[];
  crossModuleMetrics: CrossModuleMetrics[];
  calendarMetrics: CalendarMetrics;
  productivityMetrics: ProductivityMetrics;
  timeSeries: {
    emails: TimeSeriesData[];
    responses: TimeSeriesData[];
    productivity: TimeSeriesData[];
  };
  insights: Array<{
    type: 'improvement' | 'achievement' | 'trend' | 'recommendation';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    action?: string;
  }>;
}

class AnalyticsService {
  private metrics: Map<string, unknown> = new Map();
  private events: Array<{
    type: string;
    data: unknown;
    timestamp: Date;
    userId?: string;
  }> = [];

  constructor() {
    this.loadMockData();
  }

  private loadMockData() {
    // Mock analytics data for demonstration
    this.metrics.set('emailsSent', 42);
    this.metrics.set('emailsReceived', 38);
    this.metrics.set('templatesUsed', 12);
    this.metrics.set('voiceCommandsUsed', 8);
    this.metrics.set('meetingsScheduled', 5);
    this.metrics.set('crossModuleActions', 3);
  }

  /**
   * Track an event
   */
  trackEvent(type: string, data: unknown, userId?: string) {
    this.events.push({
      type,
      data,
      timestamp: new Date(),
      userId
    });

    // Update relevant metrics
    this.updateMetrics(type);
  }

  private updateMetrics(type: string) {
    const currentValue = (this.metrics.get(type) as number) || 0;
    this.metrics.set(type, currentValue + 1);
  }

  /**
   * Generate analytics dashboard
   */
  async generateDashboard(userId?: string, timeRange: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<AnalyticsDashboard> {
    const now = new Date();
    const startDate = this.getStartDate(now, timeRange);
    
    // Filter events for time range and user
    const filteredEvents = this.events.filter(event => {
      const isInTimeRange = event.timestamp >= startDate;
      const isForUser = !userId || event.userId === userId;
      return isInTimeRange && isForUser;
    });

    return {
      overview: {
        totalEmails: this.getMetric('emailsSent') + this.getMetric('emailsReceived'),
        avgResponseTime: 3.5, // minutes
        productivityScore: 78, // 0-100
        aiUsagePercentage: 65 // percentage
      },
      timeRange,
      emailMetrics: {
        sent: this.getMetric('emailsSent'),
        received: this.getMetric('emailsReceived'),
        replied: this.getMetric('emailsReplied'),
        opened: this.getMetric('emailsOpened'),
        clicked: this.getMetric('emailsClicked')
      },
      templateMetrics: await this.getTemplateMetrics(),
      voiceMetrics: await this.getVoiceMetrics(),
      crossModuleMetrics: await this.getCrossModuleMetrics(),
      calendarMetrics: {
        meetingsScheduled: this.getMetric('meetingsScheduled'),
        smartSlotsGenerated: this.getMetric('smartSlotsGenerated') || 15,
        smartSlotAcceptanceRate: 0.73,
        avgSchedulingTime: 2.4 // minutes
      },
      productivityMetrics: {
        emailsPerHour: 12.5,
        responseTime: 3.5,
        templatesUsed: this.getMetric('templatesUsed'),
        voiceCommandsUsed: this.getMetric('voiceCommandsUsed'),
        meetingsScheduled: this.getMetric('meetingsScheduled'),
        crossModuleActions: this.getMetric('crossModuleActions'),
        timeSpentComposing: 45.2, // minutes
        aiAssistanceUsage: 28.7 // minutes
      },
      timeSeries: {
        emails: this.generateTimeSeries(timeRange, 'emails'),
        responses: this.generateTimeSeries(timeRange, 'responses'),
        productivity: this.generateTimeSeries(timeRange, 'productivity')
      },
      insights: this.generateInsights(filteredEvents)
    };
  }

  private getMetric(key: string): number {
    return (this.metrics.get(key) as number) || 0;
  }

  private getStartDate(now: Date, timeRange: string): Date {
    const date = new Date(now);
    switch (timeRange) {
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date;
  }

  private async getTemplateMetrics(): Promise<TemplateMetrics[]> {
    return [
      {
        templateId: '1',
        templateName: 'Meeting Request',
        usageCount: 8,
        successRate: 0.87,
        avgResponseTime: 2.3,
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        templateId: '2',
        templateName: 'Follow-up',
        usageCount: 6,
        successRate: 0.92,
        avgResponseTime: 1.8,
        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        templateId: '3',
        templateName: 'Project Update',
        usageCount: 4,
        successRate: 0.75,
        avgResponseTime: 4.2,
        lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private async getVoiceMetrics(): Promise<VoiceCommandMetrics[]> {
    return [
      {
        command: 'compose email',
        usageCount: 12,
        successRate: 0.91,
        avgExecutionTime: 1.2
      },
      {
        command: 'schedule meeting',
        usageCount: 8,
        successRate: 0.87,
        avgExecutionTime: 2.8
      },
      {
        command: 'reply',
        usageCount: 15,
        successRate: 0.93,
        avgExecutionTime: 0.8
      },
      {
        command: 'use template',
        usageCount: 6,
        successRate: 0.83,
        avgExecutionTime: 1.5
      }
    ];
  }

  private async getCrossModuleMetrics(): Promise<CrossModuleMetrics[]> {
    return [
      {
        targetModule: 'optihire',
        actionType: 'create_job_from_email',
        usageCount: 5,
        successRate: 0.80,
        avgResponseTime: 3.2
      },
      {
        targetModule: 'optitrip',
        actionType: 'create_trip_from_email',
        usageCount: 3,
        successRate: 0.67,
        avgResponseTime: 2.8
      },
      {
        targetModule: 'optishop',
        actionType: 'track_from_email',
        usageCount: 7,
        successRate: 0.86,
        avgResponseTime: 1.9
      }
    ];
  }

  private generateTimeSeries(timeRange: string, metric: string): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    const now = new Date();
    
    let points = 7;
    let increment = 24 * 60 * 60 * 1000; // 1 day
    
    switch (timeRange) {
      case 'day':
        points = 24;
        increment = 60 * 60 * 1000; // 1 hour
        break;
      case 'week':
        points = 7;
        increment = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'month':
        points = 30;
        increment = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'year':
        points = 12;
        increment = 30 * 24 * 60 * 60 * 1000; // ~1 month
        break;
    }

    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * increment);
      const value = this.generateMockValue(metric, i, points);
      
      data.push({
        date: date.toISOString(),
        value
      });
    }

    return data;
  }

  private generateMockValue(metric: string, index: number, total: number): number {
    const base = {
      emails: 12,
      responses: 8,
      productivity: 75
    }[metric] || 10;

    // Add some variance
    const variance = Math.sin((index / total) * Math.PI * 2) * (base * 0.3);
    const randomness = (Math.random() - 0.5) * (base * 0.2);
    
    return Math.max(0, Math.round(base + variance + randomness));
  }

  private generateInsights(events: Array<{ type: string; data: unknown; timestamp: Date }>): Array<{
    type: 'improvement' | 'achievement' | 'trend' | 'recommendation';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    action?: string;
  }> {
    const insights = [];

    // Template usage insight
    if (this.getMetric('templatesUsed') > 10) {
      insights.push({
        type: 'achievement' as const,
        title: 'Template Master',
        description: 'You\'ve used templates 12 times this week, saving an estimated 45 minutes',
        impact: 'medium' as const,
        actionable: false
      });
    }

    // Voice command insight
    if (this.getMetric('voiceCommandsUsed') < 5) {
      insights.push({
        type: 'recommendation' as const,
        title: 'Try Voice Commands',
        description: 'Voice commands can speed up your workflow by 40%. Try saying "compose email" to get started.',
        impact: 'high' as const,
        actionable: true,
        action: 'Enable voice commands'
      });
    }

    // Cross-module insight
    if (this.getMetric('crossModuleActions') > 0) {
      insights.push({
        type: 'trend' as const,
        title: 'Cross-Module Integration',
        description: 'You\'re actively using cross-module features, creating seamless workflows across Optigence.',
        impact: 'high' as const,
        actionable: false
      });
    }

    // Productivity insight
    insights.push({
      type: 'improvement' as const,
      title: 'Peak Productivity Hours',
      description: 'You\'re most productive between 9-11 AM. Consider scheduling important emails during this time.',
      impact: 'medium' as const,
      actionable: true,
      action: 'Schedule emails for peak hours'
    });

    return insights;
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics() {
    return {
      activeUsers: 1,
      emailsSentToday: this.getMetric('emailsSent'),
      avgResponseTime: '3.5 min',
      productivityScore: 78
    };
  }

  /**
   * Export analytics data
   */
  async exportData(format: 'json' | 'csv' = 'json', userId?: string) {
    const dashboard = await this.generateDashboard(userId);
    
    if (format === 'json') {
      return JSON.stringify(dashboard, null, 2);
    }
    
    // Simple CSV export for overview metrics
    const csvData = [
      'Metric,Value',
      `Total Emails,${dashboard.overview.totalEmails}`,
      `Avg Response Time,${dashboard.overview.avgResponseTime} min`,
      `Productivity Score,${dashboard.overview.productivityScore}%`,
      `AI Usage,${dashboard.overview.aiUsagePercentage}%`,
      `Templates Used,${dashboard.productivityMetrics.templatesUsed}`,
      `Voice Commands,${dashboard.productivityMetrics.voiceCommandsUsed}`,
      `Meetings Scheduled,${dashboard.productivityMetrics.meetingsScheduled}`
    ].join('\n');
    
    return csvData;
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
