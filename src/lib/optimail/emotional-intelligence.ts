// Emotional Intelligence System for OptiMail
export interface EmotionalAnalysis {
  dominantEmotion: string;
  confidence: number;
  emotions: {
    [emotion: string]: number;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  arousal: number; // 0-1 scale (calm to excited)
  valence: number; // -1 to 1 scale (negative to positive)
  suggestions: string[];
}

export interface ToneAdjustment {
  currentTone: string;
  suggestedTone: string;
  reasoning: string;
  adjustedContent?: string;
}

export class EmotionalIntelligence {
  private emotionLexicon: Map<string, { valence: number; arousal: number; emotion: string }> = new Map();
  private tonePatterns: Map<string, RegExp[]> = new Map();

  constructor() {
    this.initializeEmotionLexicon();
    this.initializeTonePatterns();
  }

  async analyzeEmotionalContext(
    userInput: string,
    originalEmail: string = '',
    requestedTone?: string
  ): Promise<EmotionalAnalysis> {
    try {
      // Combine user input and original email for context
      const fullContext = `${userInput} ${originalEmail}`.toLowerCase();
      
      // Analyze emotions using lexicon-based approach
      const emotionScores = this.calculateEmotionScores(fullContext);
      
      // Determine dominant emotion
      const dominantEmotion = this.getDominantEmotion(emotionScores);
      
      // Calculate sentiment
      const sentiment = this.calculateSentiment(emotionScores);
      
      // Calculate arousal and valence
      const { arousal, valence } = this.calculateArousalValence(fullContext);
      
      // Generate suggestions based on analysis
      const suggestions = this.generateEmotionalSuggestions(
        dominantEmotion,
        sentiment,
        requestedTone,
        arousal
      );

      return {
        dominantEmotion: dominantEmotion.emotion,
        confidence: dominantEmotion.confidence,
        emotions: emotionScores,
        sentiment,
        arousal,
        valence,
        suggestions
      };

    } catch (error) {
      console.error('Error analyzing emotional context:', error);
      
      // Return neutral analysis as fallback
      return {
        dominantEmotion: 'neutral',
        confidence: 0.5,
        emotions: { neutral: 1.0 },
        sentiment: 'neutral',
        arousal: 0.5,
        valence: 0.0,
        suggestions: ['Use a balanced, professional tone']
      };
    }
  }

  async adjustToneForEmotion(
    content: string,
    targetEmotion: string,
    originalAnalysis: EmotionalAnalysis
  ): Promise<ToneAdjustment> {
    const currentTone = this.detectCurrentTone(content);
    const suggestedTone = this.mapEmotionToTone(targetEmotion, originalAnalysis);
    
    return {
      currentTone,
      suggestedTone,
      reasoning: this.generateToneAdjustmentReasoning(currentTone, suggestedTone, originalAnalysis),
      adjustedContent: await this.adjustContentTone(content, suggestedTone)
    };
  }

  async updateToneModel(
    input: string,
    feedback: 'positive' | 'negative' | 'neutral',
    improvements?: string
  ): Promise<void> {
    // In a production system, this would update ML models
    // For now, we'll store feedback for future improvements
    try {
      const toneData = {
        input,
        feedback,
        improvements,
        timestamp: new Date().toISOString()
      };
      
      const storedData = localStorage.getItem('optimail_tone_feedback') || '[]';
      const feedbackHistory = JSON.parse(storedData);
      feedbackHistory.push(toneData);
      
      // Keep only last 100 feedback entries
      if (feedbackHistory.length > 100) {
        feedbackHistory.splice(0, feedbackHistory.length - 100);
      }
      
      localStorage.setItem('optimail_tone_feedback', JSON.stringify(feedbackHistory));
    } catch (error) {
      console.error('Error storing tone feedback:', error);
    }
  }

  private initializeEmotionLexicon(): void {
    this.emotionLexicon = new Map([
      // Positive emotions
      ['happy', { valence: 0.8, arousal: 0.6, emotion: 'joy' }],
      ['excited', { valence: 0.9, arousal: 0.9, emotion: 'excitement' }],
      ['pleased', { valence: 0.7, arousal: 0.4, emotion: 'satisfaction' }],
      ['grateful', { valence: 0.8, arousal: 0.3, emotion: 'gratitude' }],
      ['confident', { valence: 0.6, arousal: 0.5, emotion: 'confidence' }],
      ['proud', { valence: 0.7, arousal: 0.4, emotion: 'pride' }],
      
      // Negative emotions
      ['angry', { valence: -0.8, arousal: 0.8, emotion: 'anger' }],
      ['frustrated', { valence: -0.6, arousal: 0.7, emotion: 'frustration' }],
      ['disappointed', { valence: -0.7, arousal: 0.3, emotion: 'disappointment' }],
      ['worried', { valence: -0.5, arousal: 0.6, emotion: 'anxiety' }],
      ['sad', { valence: -0.7, arousal: 0.2, emotion: 'sadness' }],
      ['sorry', { valence: -0.4, arousal: 0.3, emotion: 'regret' }],
      
      // Neutral emotions
      ['professional', { valence: 0.1, arousal: 0.3, emotion: 'professional' }],
      ['formal', { valence: 0.0, arousal: 0.2, emotion: 'formal' }],
      ['urgent', { valence: 0.0, arousal: 0.8, emotion: 'urgency' }],
      ['important', { valence: 0.2, arousal: 0.6, emotion: 'importance' }],
    ]);
  }

  private initializeTonePatterns(): void {
    this.tonePatterns = new Map([
      ['professional', [
        /\b(dear|sincerely|regards|respectfully)\b/i,
        /\b(please|kindly|would you|could you)\b/i,
        /\b(pursuant to|in accordance with|as per)\b/i
      ]],
      ['casual', [
        /\b(hey|hi|hello|thanks|great)\b/i,
        /\b(awesome|cool|nice|sure thing)\b/i,
        /[!]{1,2}(?![!])/
      ]],
      ['friendly', [
        /\b(hope you\'re well|hope this finds you|looking forward)\b/i,
        /\b(wonderful|fantastic|excellent|appreciate)\b/i,
        /😊|😄|🙂|👍/
      ]],
      ['urgent', [
        /\b(urgent|asap|immediately|priority|rush)\b/i,
        /\b(need|require|must have|deadline)\b/i,
        /[!]{2,}/
      ]],
      ['empathetic', [
        /\b(understand|realize|appreciate|sympathize)\b/i,
        /\b(difficult|challenging|sorry to hear|my apologies)\b/i,
        /\b(feel|concern|worry|care)\b/i
      ]],
      ['persuasive', [
        /\b(benefit|advantage|opportunity|value)\b/i,
        /\b(consider|imagine|picture|think about)\b/i,
        /\b(proven|guaranteed|successful|effective)\b/i
      ]]
    ]);
  }

  private calculateEmotionScores(text: string): { [emotion: string]: number } {
    const emotionScores: { [emotion: string]: number } = {};
    const words = text.split(/\s+/);
    const totalWords = words.length;

    // Initialize emotion categories
    const emotionCategories = [
      'joy', 'excitement', 'satisfaction', 'gratitude', 'confidence', 'pride',
      'anger', 'frustration', 'disappointment', 'anxiety', 'sadness', 'regret',
      'professional', 'formal', 'urgency', 'importance', 'neutral'
    ];

    emotionCategories.forEach(emotion => {
      emotionScores[emotion] = 0;
    });

    // Count emotion words
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      const emotionData = this.emotionLexicon.get(cleanWord);
      
      if (emotionData) {
        emotionScores[emotionData.emotion] += 1;
      }
    });

    // Normalize scores
    Object.keys(emotionScores).forEach(emotion => {
      emotionScores[emotion] = totalWords > 0 ? emotionScores[emotion] / totalWords : 0;
    });

    // If no emotions detected, mark as neutral
    const hasEmotions = Object.values(emotionScores).some(score => score > 0);
    if (!hasEmotions) {
      emotionScores['neutral'] = 1.0;
    }

    return emotionScores;
  }

  private getDominantEmotion(emotionScores: { [emotion: string]: number }): { emotion: string; confidence: number } {
    let maxEmotion = 'neutral';
    let maxScore = 0;

    Object.entries(emotionScores).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    });

    return {
      emotion: maxEmotion,
      confidence: Math.min(maxScore * 5, 1.0) // Scale confidence
    };
  }

  private calculateSentiment(emotionScores: { [emotion: string]: number }): 'positive' | 'negative' | 'neutral' {
    const positiveEmotions = ['joy', 'excitement', 'satisfaction', 'gratitude', 'confidence', 'pride'];
    const negativeEmotions = ['anger', 'frustration', 'disappointment', 'anxiety', 'sadness', 'regret'];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveEmotions.forEach(emotion => {
      positiveScore += emotionScores[emotion] || 0;
    });

    negativeEmotions.forEach(emotion => {
      negativeScore += emotionScores[emotion] || 0;
    });

    if (positiveScore > negativeScore * 1.2) return 'positive';
    if (negativeScore > positiveScore * 1.2) return 'negative';
    return 'neutral';
  }

  private calculateArousalValence(text: string): { arousal: number; valence: number } {
    const words = text.split(/\s+/);
    let totalValence = 0;
    let totalArousal = 0;
    let emotionWordCount = 0;

    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      const emotionData = this.emotionLexicon.get(cleanWord);
      
      if (emotionData) {
        totalValence += emotionData.valence;
        totalArousal += emotionData.arousal;
        emotionWordCount++;
      }
    });

    return {
      arousal: emotionWordCount > 0 ? totalArousal / emotionWordCount : 0.5,
      valence: emotionWordCount > 0 ? totalValence / emotionWordCount : 0.0
    };
  }

  private generateEmotionalSuggestions(
    dominantEmotion: { emotion: string; confidence: number },
    sentiment: 'positive' | 'negative' | 'neutral',
    requestedTone?: string,
    arousal?: number
  ): string[] {
    const suggestions: string[] = [];

    // Confidence-based suggestions
    if (dominantEmotion.confidence < 0.5) {
      suggestions.push('Emotional context is unclear - consider being more explicit about your feelings or intent');
    }

    // Sentiment-based suggestions
    switch (sentiment) {
      case 'negative':
        suggestions.push('Consider acknowledging concerns while maintaining a constructive tone');
        if (dominantEmotion.emotion === 'anger' || dominantEmotion.emotion === 'frustration') {
          suggestions.push('Take a moment to review tone - aim for firm but professional');
        }
        break;
      case 'positive':
        suggestions.push('Great emotional tone - maintain the positive energy');
        break;
      case 'neutral':
        if (requestedTone === 'friendly' || requestedTone === 'empathetic') {
          suggestions.push('Consider adding warmer language to match the requested tone');
        }
        break;
    }

    // Arousal-based suggestions (if provided)
    if (arousal !== undefined) {
      if (arousal > 0.7) {
        suggestions.push('High energy detected - ensure it comes across as enthusiasm rather than urgency');
      } else if (arousal < 0.3) {
        suggestions.push('Consider adding more engagement or energy to the message');
      }
    }

    // Tone mismatch suggestions
    if (requestedTone) {
      const currentToneMismatch = this.checkToneMismatch(dominantEmotion.emotion, requestedTone);
      if (currentToneMismatch) {
        suggestions.push(currentToneMismatch);
      }
    }

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  private checkToneMismatch(detectedEmotion: string, requestedTone: string): string | null {
    const mismatches = new Map([
      ['anger-professional', 'Anger detected but professional tone requested - consider reframing concerns constructively'],
      ['sadness-casual', 'Sadness detected but casual tone requested - ensure appropriate level of formality'],
      ['excitement-formal', 'High enthusiasm detected but formal tone requested - moderate the energy level'],
      ['anxiety-confident', 'Worry detected but confident tone needed - focus on solutions and positive outcomes']
    ]);

    const key = `${detectedEmotion}-${requestedTone}`;
    return mismatches.get(key) || null;
  }

  private detectCurrentTone(content: string): string {
    let maxMatches = 0;
    let detectedTone = 'neutral';

    for (const [tone, patterns] of this.tonePatterns.entries()) {
      let matches = 0;
      patterns.forEach(pattern => {
        const patternMatches = content.match(pattern);
        if (patternMatches) {
          matches += patternMatches.length;
        }
      });

      if (matches > maxMatches) {
        maxMatches = matches;
        detectedTone = tone;
      }
    }

    return detectedTone;
  }

  private mapEmotionToTone(emotion: string, analysis: EmotionalAnalysis): string {
    const emotionToToneMap = new Map([
      ['anger', 'professional'],
      ['frustration', 'empathetic'],
      ['disappointment', 'empathetic'],
      ['anxiety', 'reassuring'],
      ['sadness', 'supportive'],
      ['regret', 'apologetic'],
      ['joy', 'friendly'],
      ['excitement', 'enthusiastic'],
      ['satisfaction', 'appreciative'],
      ['gratitude', 'warm'],
      ['confidence', 'professional'],
      ['urgency', 'direct']
    ]);

    const suggestedTone = emotionToToneMap.get(emotion);
    
    if (suggestedTone) {
      return suggestedTone;
    }

    // Fallback based on sentiment
    switch (analysis.sentiment) {
      case 'positive': return 'friendly';
      case 'negative': return 'empathetic';
      default: return 'professional';
    }
  }

  private generateToneAdjustmentReasoning(
    currentTone: string,
    suggestedTone: string,
    analysis: EmotionalAnalysis
  ): string {
    if (currentTone === suggestedTone) {
      return `Current tone (${currentTone}) is well-matched to the emotional context`;
    }

    return `Detected ${analysis.dominantEmotion} with ${analysis.sentiment} sentiment. ` +
           `Suggesting ${suggestedTone} tone instead of ${currentTone} for better emotional alignment.`;
  }

  private async adjustContentTone(content: string, targetTone: string): Promise<string> {
    // This is a simplified tone adjustment
    // In production, this would use an LLM to rewrite the content
    
    const toneAdjustments = new Map([
      ['professional', {
        replacements: [
          [/\bhey\b/gi, 'Dear'],
          [/\bthanks\b/gi, 'Thank you'],
          [/\byeah\b/gi, 'Yes'],
          [/!+/g, '.']
        ]
      }],
      ['empathetic', {
        replacements: [
          [/\bI understand\b/gi, 'I completely understand'],
          [/\bsorry\b/gi, 'I sincerely apologize'],
          [/\bproblem\b/gi, 'concern']
        ]
      }],
      ['friendly', {
        replacements: [
          [/\bDear\b/gi, 'Hi'],
          [/\bRegards\b/gi, 'Best wishes'],
          [/\bThank you\b/gi, 'Thanks so much']
        ]
      }]
    ]);

    let adjustedContent = content;
    const adjustments = toneAdjustments.get(targetTone);

    if (adjustments) {
      adjustments.replacements.forEach(([pattern, replacement]) => {
        adjustedContent = adjustedContent.replace(pattern as RegExp, replacement as string);
      });
    }

    return adjustedContent;
  }
}
