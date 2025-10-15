export interface EmailGeneration {
  id: string;
  subject: string;
  content: string;
  tone: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
}

export interface EmailRequest {
  purpose: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'empathetic' | 'persuasive' | 'urgent';
  originalEmail?: string;
  emailThread?: string;
  intent?: string;
}

export default class MultiLLMRouter {
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  async generateEmail(request: EmailRequest): Promise<EmailGeneration> {
    if (this.isClient) {
      // Use API route for client-side calls
      return this.generateEmailViaAPI(request);
    } else {
      // Direct OpenAI call for server-side usage
      return this.generateEmailDirect(request);
    }
  }

  private async generateEmailViaAPI(request: EmailRequest): Promise<EmailGeneration> {
    try {
      const response = await fetch('/api/optimail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'compose',
          emailData: {
            purpose: request.purpose,
            tone: request.tone,
            originalEmail: request.originalEmail,
            intent: request.intent,
          },
          instructions: request.emailThread,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Parse the response to extract subject and content
      const { subject, content } = this.parseEmailResponse(data.result);

      return {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        subject,
        content,
        tone: request.tone || 'professional',
        timestamp: new Date(),
        intent: request.intent,
        confidence: 0.85,
      };
    } catch (error) {
      console.error('Email generation API error:', error);
      throw new Error(`Failed to generate email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateEmailDirect(request: EmailRequest): Promise<EmailGeneration> {
    // This method would be used for server-side calls
    // Import openai dynamically to avoid browser issues
    const { openai } = await import('@/lib/openai');
    
    try {
      const systemPrompt = this.buildSystemPrompt(request.tone || 'professional', request.intent);
      const userPrompt = this.buildUserPrompt(request);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response generated');
      }

      // Parse the response to extract subject and content
      const { subject, content } = this.parseEmailResponse(responseText);

      return {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        subject,
        content,
        tone: request.tone || 'professional',
        timestamp: new Date(),
        intent: request.intent,
        confidence: 0.85
      };

    } catch (error) {
      console.error('Email generation error:', error);
      throw new Error(`Failed to generate email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(tone: string, intent?: string): string {
    const prompt = `You are OptiMail, an advanced AI email assistant. Generate professional, well-structured emails that sound natural and human-like.

Tone: ${tone}
${intent ? `Intent: ${intent}` : ''}

Guidelines:
- Write clear, concise, and engaging emails
- Match the requested tone perfectly
- Include appropriate subject line and email body
- Use proper email formatting
- Be empathetic and contextually appropriate
- Avoid overly formal or robotic language

Format your response as:
Subject: [Email Subject]
Body: [Email Content]`;

    return prompt;
  }

  private buildUserPrompt(request: EmailRequest): string {
    let prompt = `Purpose: ${request.purpose}\n`;
    
    if (request.tone) {
      prompt += `Tone: ${request.tone}\n`;
    }
    
    if (request.originalEmail) {
      prompt += `\nOriginal Email to Reply to:\n${request.originalEmail}\n`;
    }
    
    if (request.emailThread) {
      prompt += `\nEmail Thread Context:\n${request.emailThread}\n`;
    }

    prompt += '\nPlease generate a complete email with subject line and body.';
    
    return prompt;
  }

  private parseEmailResponse(response: string): { subject: string; content: string } {
    // Try to extract subject and body from the response
    const subjectMatch = response.match(/Subject:\s*(.+?)(?:\n|$)/i);
    const bodyMatch = response.match(/Body:\s*([\s\S]+)/i);

    let subject = '';
    let content = '';

    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    }

    if (bodyMatch) {
      content = bodyMatch[1].trim();
    } else {
      // If no clear body section found, treat everything after subject as content
      if (subjectMatch) {
        const afterSubject = response.substring(response.indexOf(subjectMatch[0]) + subjectMatch[0].length).trim();
        content = afterSubject;
      } else {
        // If no subject found either, use the whole response as content
        content = response.trim();
        subject = 'Email Generated by OptiMail';
      }
    }

    // Clean up the content
    content = content.replace(/^Body:\s*/i, '').trim();
    
    return { subject, content };
  }

  async rewriteEmail(originalContent: string, instructions: string, tone?: string): Promise<EmailGeneration> {
    const request: EmailRequest = {
      purpose: `Rewrite this email: ${originalContent}\n\nInstructions: ${instructions}`,
      tone: (tone as 'professional' | 'casual' | 'friendly' | 'formal' | 'empathetic' | 'persuasive' | 'urgent') || 'professional'
    };

    return this.generateEmail(request);
  }

  async generateReply(originalEmail: string, instructions: string, tone?: string): Promise<EmailGeneration> {
    const request: EmailRequest = {
      purpose: instructions,
      originalEmail,
      tone: (tone as 'professional' | 'casual' | 'friendly' | 'formal' | 'empathetic' | 'persuasive' | 'urgent') || 'professional'
    };

    return this.generateEmail(request);
  }

  async summarizeEmail(emailContent: string): Promise<string> {
    if (this.isClient) {
      // Use API route for client-side calls
      return this.summarizeEmailViaAPI(emailContent);
    } else {
      // Direct OpenAI call for server-side usage
      return this.summarizeEmailDirect(emailContent);
    }
  }

  private async summarizeEmailViaAPI(emailContent: string): Promise<string> {
    try {
      const response = await fetch('/api/optimail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'summarize',
          emailData: {
            originalEmail: emailContent,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.result || 'Unable to generate summary';
    } catch (error) {
      console.error('Email summarization API error:', error);
      throw new Error(`Failed to summarize email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async summarizeEmailDirect(emailContent: string): Promise<string> {
    // This method would be used for server-side calls
    const { openai } = await import('@/lib/openai');
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are OptiMail. Summarize emails concisely, highlighting key points, action items, and important details.'
          },
          {
            role: 'user',
            content: `Please summarize this email:\n\n${emailContent}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      return completion.choices[0]?.message?.content || 'Unable to generate summary';
    } catch (error) {
      console.error('Email summarization error:', error);
      throw new Error(`Failed to summarize email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Named export for compatibility
export { MultiLLMRouter };