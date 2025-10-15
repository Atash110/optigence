/**
 * OptiMail Phase 7: Template System
 * Smart template detection, creation, and suggestion engine
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject_pattern: string;
  body_template: string;
  intent: string;
  recipients: string[];
  topic_tags: string[];
  usage_count: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface TemplateMatch {
  template: EmailTemplate;
  match_score: number;
  suggested_modifications: {
    subject?: string;
    body?: string;
    recipients?: string[];
  };
}

export interface PatternDetection {
  pattern_type: 'subject' | 'body' | 'recipients' | 'intent';
  pattern: string;
  frequency: number;
  confidence: number;
  examples: string[];
}

class TemplateService {
  private templates: Map<string, EmailTemplate> = new Map();
  private patternHistory: Map<string, PatternDetection[]> = new Map();

  /**
   * Analyze email content for template patterns
   */
  async analyzeForPatterns(
    subject: string,
    body: string,
    recipients: string[],
    intent: string,
    userId: string
  ): Promise<PatternDetection[]> {
    try {
      const response = await fetch('/api/optimail/templates/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          recipients,
          intent,
          userId
        })
      });

      if (!response.ok) throw new Error('Pattern analysis failed');

      const data = await response.json();
      return data.patterns || [];

    } catch (error) {
      console.error('Pattern analysis error:', error);
      return [];
    }
  }

  /**
   * Check if content matches existing templates
   */
  async findTemplateMatches(
    subject: string,
    body: string,
    recipients: string[],
    intent: string,
    userId: string
  ): Promise<TemplateMatch[]> {
    try {
      const response = await fetch('/api/optimail/templates/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          recipients,
          intent,
          userId
        })
      });

      if (!response.ok) throw new Error('Template matching failed');

      const data = await response.json();
      return data.matches || [];

    } catch (error) {
      console.error('Template matching error:', error);
      return [];
    }
  }

  /**
   * Create a new template from email content
   */
  async createTemplate(
    name: string,
    subject: string,
    body: string,
    intent: string,
    recipients: string[],
    topicTags: string[],
    userId: string
  ): Promise<EmailTemplate | null> {
    try {
      const response = await fetch('/api/optimail/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject_pattern: this.extractPattern(subject),
          body_template: this.extractTemplate(body),
          intent,
          recipients,
          topic_tags: topicTags,
          user_id: userId
        })
      });

      if (!response.ok) throw new Error('Template creation failed');

      const template = await response.json();
      this.templates.set(template.id, template);
      return template;

    } catch (error) {
      console.error('Template creation error:', error);
      return null;
    }
  }

  /**
   * Get user's templates
   */
  async getUserTemplates(userId: string): Promise<EmailTemplate[]> {
    try {
      const response = await fetch(`/api/optimail/templates?userId=${userId}`);

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      const templates = data.templates || [];

      // Cache templates locally
      templates.forEach((template: EmailTemplate) => {
        this.templates.set(template.id, template);
      });

      return templates;

    } catch (error) {
      console.error('Template fetch error:', error);
      return [];
    }
  }

  /**
   * Use a template to generate email content
   */
  async useTemplate(
    templateId: string,
    context: {
      recipients?: string[];
      customData?: Record<string, string>;
    }
  ): Promise<{ subject: string; body: string } | null> {
    try {
      const response = await fetch(`/api/optimail/templates/${templateId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      });

      if (!response.ok) throw new Error('Template usage failed');

      return await response.json();

    } catch (error) {
      console.error('Template usage error:', error);
      return null;
    }
  }

  /**
   * Update template usage statistics
   */
  async trackTemplateUsage(templateId: string, successful: boolean): Promise<void> {
    try {
      await fetch(`/api/optimail/templates/${templateId}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ successful })
      });
    } catch (error) {
      console.error('Template usage tracking error:', error);
    }
  }

  /**
   * Extract pattern from subject line
   */
  private extractPattern(subject: string): string {
    // Replace specific dates, names, numbers with placeholders
    return subject
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g, '[DATE]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
      .replace(/\b\d+\b/g, '[NUMBER]')
      .replace(/\b[A-Z]{2,}\b/g, '[ACRONYM]');
  }

  /**
   * Extract template from email body
   */
  private extractTemplate(body: string): string {
    // Replace variable content with placeholders
    return body
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[RECIPIENT_NAME]')
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g, '[DATE]')
      .replace(/\b\d+:\d{2} ?(AM|PM)\b/gi, '[TIME]')
      .replace(/\$\d+(\.\d{2})?/g, '[AMOUNT]')
      .replace(/\b\d+\b/g, '[NUMBER]');
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  /**
   * Detect if current email should become a template
   */
  shouldSuggestTemplate(
    patterns: PatternDetection[],
    currentIntent: string,
    currentRecipients: string[]
  ): boolean {
    // Suggest template if we see repeated patterns
    const hasRepeatedPatterns = patterns.some(pattern => 
      pattern.frequency >= 3 && 
      pattern.confidence > 0.7
    );

    // Additional checks for template worthiness
    const hasConsistentIntent = patterns.some(p => 
      p.pattern_type === 'intent' && currentIntent === p.pattern
    );
    
    const hasConsistentRecipients = patterns.some(p =>
      p.pattern_type === 'recipients' && 
      currentRecipients.some(r => p.pattern.includes(r))
    );

    return hasRepeatedPatterns && (hasConsistentIntent || hasConsistentRecipients);
  }
}

const templateService = new TemplateService();
export default templateService;
