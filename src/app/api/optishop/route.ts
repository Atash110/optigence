import { NextRequest, NextResponse } from 'next/server';
import { openai, AI_CONFIGS } from '@/lib/openai';

interface ShoppingRequest {
  action: 'search' | 'compare' | 'recommend' | 'analyze' | 'wishlist';
  query?: string;
  products?: Array<{
    name: string;
    price: number;
    retailer: string;
    rating?: number;
    features?: string[];
  }>;
  budget?: {
    min: number;
    max: number;
  };
  preferences?: {
    categories?: string[];
    brands?: string[];
    features?: string[];
  };
  instructions?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, query, products, budget, preferences, instructions }: ShoppingRequest = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const config = AI_CONFIGS.optishop;
    
    // Build specific prompt based on action
    let prompt = '';
    
    switch (action) {
      case 'search':
        prompt = `Help me find products for: "${query || 'general search'}"
        
        ${budget ? `Budget: $${budget.min} - $${budget.max}` : ''}
        ${preferences?.categories ? `Preferred categories: ${preferences.categories.join(', ')}` : ''}
        ${preferences?.brands ? `Preferred brands: ${preferences.brands.join(', ')}` : ''}
        ${preferences?.features ? `Must-have features: ${preferences.features.join(', ')}` : ''}
        
        ${instructions ? `Additional requirements: ${instructions}` : ''}
        
        Please provide product recommendations with reasons why they match my needs.`;
        break;
        
      case 'compare':
        prompt = `Please compare these products and help me choose the best option:
        
        ${products?.map((product, index) => `
        Product ${index + 1}: ${product.name}
        Price: $${product.price}
        Retailer: ${product.retailer}
        ${product.rating ? `Rating: ${product.rating}/5` : ''}
        ${product.features ? `Features: ${product.features.join(', ')}` : ''}
        `).join('\n') || 'No products provided'}
        
        ${budget ? `My budget: $${budget.min} - $${budget.max}` : ''}
        ${instructions ? `Comparison criteria: ${instructions}` : ''}
        
        Please provide a detailed comparison with pros/cons and a clear recommendation.`;
        break;
        
      case 'recommend':
        prompt = `Based on my preferences, recommend products in these categories:
        
        ${preferences?.categories ? `Categories: ${preferences.categories.join(', ')}` : 'General recommendations'}
        ${budget ? `Budget: $${budget.min} - $${budget.max}` : ''}
        ${preferences?.brands ? `Preferred brands: ${preferences.brands.join(', ')}` : ''}
        ${preferences?.features ? `Important features: ${preferences.features.join(', ')}` : ''}
        
        ${instructions ? `Special considerations: ${instructions}` : ''}
        
        Please suggest 3-5 products with detailed explanations of why they're good choices.`;
        break;
        
      case 'analyze':
        prompt = `Please analyze this shopping decision:
        
        Product/Service: ${query || 'Not specified'}
        ${budget ? `Budget consideration: $${budget.min} - $${budget.max}` : ''}
        
        ${instructions ? `Analysis focus: ${instructions}` : ''}
        
        Please provide insights on:
        - Value for money
        - Market alternatives
        - Best time to buy
        - Potential drawbacks
        - Long-term considerations`;
        break;
        
      case 'wishlist':
        prompt = `Help me organize and prioritize my shopping wishlist:
        
        ${products?.map((product, index) => `
        ${index + 1}. ${product.name} - $${product.price} (${product.retailer})
        `).join('') || 'No products in wishlist'}
        
        ${budget ? `Total budget: $${budget.min} - $${budget.max}` : ''}
        ${instructions ? `Priority criteria: ${instructions}` : ''}
        
        Please help me prioritize these items and suggest the best purchasing strategy.`;
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
    console.error('OptiShop API error:', error);
    
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
