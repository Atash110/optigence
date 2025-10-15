import { NextRequest, NextResponse } from 'next/server';
import { openai, AI_CONFIGS } from '@/lib/openai';

interface OptiHireRequest {
  action: 'resume' | 'coverletter' | 'interview' | 'jobmatch' | 'career' | 'skills';
  data: {
    resume?: string;
    jobDescription?: string;
    position?: string;
    company?: string;
    experience?: string[];
    skills?: string[];
    goals?: string[];
    industry?: string;
    careerLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  };
  instructions?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, data, instructions }: OptiHireRequest = await request.json();

    if (!action || !data) {
      return NextResponse.json(
        { error: 'Action and data are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const config = AI_CONFIGS.optihire;
    
    // Build specific prompt based on action
    let prompt = '';
    
    switch (action) {
      case 'resume':
        prompt = `Please help optimize this resume for the target position:
        
        Target Position: ${data.position || 'Not specified'}
        Target Company: ${data.company || 'Not specified'}
        Career Level: ${data.careerLevel || 'Not specified'}
        
        Current Resume:
        ${data.resume || 'Resume content needed'}
        
        Job Description (if available):
        ${data.jobDescription || 'No job description provided'}
        
        ${instructions ? `Specific optimization requests: ${instructions}` : ''}
        
        Please provide:
        1. Optimized resume content
        2. Key improvements made
        3. ATS optimization tips
        4. Missing elements to add`;
        break;
        
      case 'coverletter':
        prompt = `Create a compelling cover letter for this application:
        
        Position: ${data.position || 'Position not specified'}
        Company: ${data.company || 'Company not specified'}
        
        My Experience/Background:
        ${data.experience?.join('\n') || 'Experience details needed'}
        
        Key Skills:
        ${data.skills?.join(', ') || 'Skills not provided'}
        
        Job Description:
        ${data.jobDescription || 'Job description not provided'}
        
        ${instructions ? `Special requirements: ${instructions}` : ''}
        
        Please create a personalized, compelling cover letter that highlights relevant experience.`;
        break;
        
      case 'interview':
        prompt = `Help me prepare for an interview:
        
        Position: ${data.position || 'Position not specified'}
        Company: ${data.company || 'Company not specified'}
        Industry: ${data.industry || 'Industry not specified'}
        Career Level: ${data.careerLevel || 'Not specified'}
        
        Job Description:
        ${data.jobDescription || 'Job description not available'}
        
        My Background:
        ${data.experience?.join('\n') || 'Background not provided'}
        
        ${instructions ? `Interview focus areas: ${instructions}` : ''}
        
        Please provide:
        1. Common interview questions for this role
        2. STAR method examples based on my background
        3. Questions I should ask the interviewer
        4. Key points to highlight
        5. Company research suggestions`;
        break;
        
      case 'jobmatch':
        prompt = `Analyze how well I match this job opportunity:
        
        Job Title: ${data.position || 'Position not specified'}
        Company: ${data.company || 'Company not specified'}
        
        Job Description:
        ${data.jobDescription || 'Job description needed'}
        
        My Skills:
        ${data.skills?.join(', ') || 'Skills not provided'}
        
        My Experience:
        ${data.experience?.join('\n') || 'Experience not provided'}
        
        ${instructions ? `Analysis criteria: ${instructions}` : ''}
        
        Please provide:
        1. Match percentage and reasoning
        2. Strengths that align well
        3. Gaps to address
        4. How to position myself
        5. Salary negotiation insights`;
        break;
        
      case 'career':
        prompt = `Provide career development guidance:
        
        Current Role/Level: ${data.careerLevel || 'Not specified'}
        Industry: ${data.industry || 'Not specified'}
        
        Current Skills:
        ${data.skills?.join(', ') || 'Skills not provided'}
        
        Career Goals:
        ${data.goals?.join('\n') || 'Goals not specified'}
        
        ${instructions ? `Specific career questions: ${instructions}` : ''}
        
        Please provide:
        1. Career path recommendations
        2. Skills to develop
        3. Industry trends to watch
        4. Networking strategies
        5. Timeline and milestones`;
        break;
        
      case 'skills':
        prompt = `Help me with skill development planning:
        
        Current Skills:
        ${data.skills?.join(', ') || 'Current skills not provided'}
        
        Target Role: ${data.position || 'Target role not specified'}
        Industry: ${data.industry || 'Industry not specified'}
        
        Job Requirements:
        ${data.jobDescription || 'Job requirements not provided'}
        
        ${instructions ? `Learning preferences: ${instructions}` : ''}
        
        Please provide:
        1. Skill gap analysis
        2. Priority skills to develop
        3. Learning resources and methods
        4. Timeline for skill acquisition
        5. How to demonstrate new skills`;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const responseMessage = completion.choices[0]?.message?.content;

    if (!responseMessage) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      action,
      result: responseMessage,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('OptiHire API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
