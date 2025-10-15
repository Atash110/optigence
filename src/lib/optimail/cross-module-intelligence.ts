interface CrossModuleContext {
  currentModule: 'optimail' | 'optitrip' | 'optishop' | 'optihire';
  userHistory: Array<{
    module: string;
    action: string;
    timestamp: Date;
    context: Record<string, unknown>;
  }>;
  preferences: {
    travelPreferences?: {
      budgetRange: [number, number];
      preferredAirlines: string[];
      seatPreference: string;
      dietaryRestrictions: string[];
    };
    shoppingPreferences?: {
      categories: string[];
      brands: string[];
      priceRange: [number, number];
      preferredStores: string[];
    };
    workPreferences?: {
      industry: string;
      experienceLevel: string;
      salaryRange: [number, number];
      remotePreference: 'remote' | 'hybrid' | 'onsite';
    };
  };
}

interface IntentRoute {
  targetModule: string;
  confidence: number;
  suggestedAction: string;
  context: Record<string, unknown>;
}

class CrossModuleIntelligence {
  private userContext: CrossModuleContext;

  constructor() {
    this.userContext = {
      currentModule: 'optimail',
      userHistory: [],
      preferences: {}
    };
  }

  /**
   * Analyze user input and determine if it should be routed to another module
   */
  analyzeForCrossModuleIntent(input: string, emailContent?: string): IntentRoute[] {
    const routes: IntentRoute[] = [];

    // Travel-related detection (OptiTrip)
    const travelKeywords = [
      'flight', 'hotel', 'travel', 'trip', 'vacation', 'booking',
      'airline', 'airport', 'destination', 'itinerary', 'visa',
      'passport', 'luggage', 'accommodation', 'resort'
    ];

    const travelScore = this.calculateKeywordScore(input + ' ' + (emailContent || ''), travelKeywords);
    
    if (travelScore > 0.3) {
      routes.push({
        targetModule: 'optitrip',
        confidence: travelScore,
        suggestedAction: this.detectTravelAction(input, emailContent),
        context: {
          extractedLocations: this.extractLocations(input + ' ' + (emailContent || '')),
          extractedDates: this.extractDates(input + ' ' + (emailContent || ''))
        }
      });
    }

    // Shopping-related detection (OptiShop)
    const shoppingKeywords = [
      'buy', 'purchase', 'order', 'shop', 'product', 'price',
      'deal', 'discount', 'sale', 'cart', 'checkout', 'shipping',
      'return', 'refund', 'review', 'recommendation'
    ];

    const shoppingScore = this.calculateKeywordScore(input + ' ' + (emailContent || ''), shoppingKeywords);
    
    if (shoppingScore > 0.3) {
      routes.push({
        targetModule: 'optishop',
        confidence: shoppingScore,
        suggestedAction: this.detectShoppingAction(input, emailContent),
        context: {
          extractedProducts: this.extractProducts(input + ' ' + (emailContent || '')),
          extractedPrices: this.extractPrices(input + ' ' + (emailContent || ''))
        }
      });
    }

    // Job/Career-related detection (OptiHire)
    const careerKeywords = [
      'job', 'career', 'interview', 'resume', 'application', 'hiring',
      'salary', 'position', 'role', 'candidate', 'recruiter',
      'linkedin', 'portfolio', 'skills', 'experience'
    ];

    const careerScore = this.calculateKeywordScore(input + ' ' + (emailContent || ''), careerKeywords);
    
    if (careerScore > 0.3) {
      routes.push({
        targetModule: 'optihire',
        confidence: careerScore,
        suggestedAction: this.detectCareerAction(input, emailContent),
        context: {
          extractedCompanies: this.extractCompanies(input + ' ' + (emailContent || '')),
          extractedSkills: this.extractSkills(input + ' ' + (emailContent || ''))
        }
      });
    }

    return routes.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate contextual suggestions based on cross-module intelligence
   */
  generateCrossModuleSuggestions(input: string, emailContent?: string): Array<{
    text: string;
    module: string;
    action: string;
    priority: number;
  }> {
    const routes = this.analyzeForCrossModuleIntent(input, emailContent);
    const suggestions = [];

    for (const route of routes) {
      switch (route.targetModule) {
        case 'optitrip':
          suggestions.push({
            text: `🌍 Plan this trip with OptiTrip - ${route.suggestedAction}`,
            module: 'optitrip',
            action: route.suggestedAction,
            priority: Math.round(route.confidence * 100)
          });
          break;

        case 'optishop':
          suggestions.push({
            text: `🛍️ Find the best deals with OptiShop - ${route.suggestedAction}`,
            module: 'optishop',
            action: route.suggestedAction,
            priority: Math.round(route.confidence * 100)
          });
          break;

        case 'optihire':
          suggestions.push({
            text: `💼 Advance your career with OptiHire - ${route.suggestedAction}`,
            module: 'optihire',
            action: route.suggestedAction,
            priority: Math.round(route.confidence * 100)
          });
          break;
      }
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Update user context based on actions
   */
  updateUserContext(module: string, action: string, context: Record<string, unknown>): void {
    this.userContext.userHistory.push({
      module,
      action,
      timestamp: new Date(),
      context
    });

    // Keep only last 50 actions
    if (this.userContext.userHistory.length > 50) {
      this.userContext.userHistory = this.userContext.userHistory.slice(-50);
    }

    // Update preferences based on repeated actions
    this.updatePreferencesFromHistory();
  }

  /**
   * Get personalized suggestions based on user history
   */
  getPersonalizedSuggestions(): Array<{
    text: string;
    module: string;
    reason: string;
  }> {
    const suggestions = [];
    const recentHistory = this.userContext.userHistory.slice(-10);

    // Analyze recent patterns
    const moduleFrequency = recentHistory.reduce((acc, item) => {
      acc[item.module] = (acc[item.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate suggestions based on usage patterns
    for (const [module, frequency] of Object.entries(moduleFrequency)) {
      if (frequency >= 2) {
        switch (module) {
          case 'optitrip':
            suggestions.push({
              text: 'Check your upcoming travel itinerary',
              module: 'optitrip',
              reason: 'You\'ve been planning travel recently'
            });
            break;
          case 'optishop':
            suggestions.push({
              text: 'Track your recent orders and deliveries',
              module: 'optishop',
              reason: 'You\'ve been shopping frequently'
            });
            break;
          case 'optihire':
            suggestions.push({
              text: 'Update your job application status',
              module: 'optihire',
              reason: 'You\'ve been job hunting actively'
            });
            break;
        }
      }
    }

    return suggestions;
  }

  // Private helper methods

  private calculateKeywordScore(text: string, keywords: string[]): number {
    const textLower = text.toLowerCase();
    const matches = keywords.filter(keyword => textLower.includes(keyword));
    return matches.length / keywords.length;
  }

  private detectTravelAction(input: string, emailContent?: string): string {
    const combinedText = input + ' ' + (emailContent || '');
    
    if (/book|reserve|purchase/i.test(combinedText)) {
      return 'Book flight or accommodation';
    } else if (/plan|itinerary|schedule/i.test(combinedText)) {
      return 'Create travel itinerary';
    } else if (/price|cost|budget/i.test(combinedText)) {
      return 'Compare travel prices';
    } else {
      return 'Explore travel options';
    }
  }

  private detectShoppingAction(input: string, emailContent?: string): string {
    const combinedText = input + ' ' + (emailContent || '');
    
    if (/buy|purchase|order/i.test(combinedText)) {
      return 'Find and purchase products';
    } else if (/compare|price|deal/i.test(combinedText)) {
      return 'Compare prices and deals';
    } else if (/review|rating/i.test(combinedText)) {
      return 'Check product reviews';
    } else {
      return 'Discover products';
    }
  }

  private detectCareerAction(input: string, emailContent?: string): string {
    const combinedText = input + ' ' + (emailContent || '');
    
    if (/apply|application/i.test(combinedText)) {
      return 'Apply for positions';
    } else if (/interview|schedule/i.test(combinedText)) {
      return 'Schedule interviews';
    } else if (/resume|cv|portfolio/i.test(combinedText)) {
      return 'Update resume/portfolio';
    } else {
      return 'Find job opportunities';
    }
  }

  private extractLocations(text: string): string[] {
    // Simple location extraction - in production, use a proper NLP library
    const locationPatterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Airport|Hotel|Resort|Beach|City|State|Country)\b/g,
      /\b(?:New York|Los Angeles|Chicago|Houston|Philadelphia|San Francisco|Boston|Seattle|Miami|Las Vegas)\b/gi,
      /\b(?:London|Paris|Tokyo|Sydney|Rome|Barcelona|Amsterdam|Berlin|Vienna|Prague)\b/gi
    ];
    
    const locations = [];
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern) || [];
      locations.push(...matches);
    }
    
    return [...new Set(locations)]; // Remove duplicates
  }

  private extractDates(text: string): string[] {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4}\b/gi,
      /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b/gi
    ];
    
    const dates = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern) || [];
      dates.push(...matches);
    }
    
    return [...new Set(dates)];
  }

  private extractProducts(text: string): string[] {
    // Simple product extraction - look for common product keywords
    const productPatterns = [
      /\b(?:laptop|phone|tablet|computer|headphones|camera|watch|shoes|clothing|book)\b/gi,
      /\b[A-Z][a-z]+\s+(?:Pro|Max|Plus|Air|Mini|Ultra)\b/g,
      /\biPhone\s+\d+\b/gi,
      /\bMacBook\s+(?:Pro|Air)\b/gi
    ];
    
    const products = [];
    for (const pattern of productPatterns) {
      const matches = text.match(pattern) || [];
      products.push(...matches);
    }
    
    return [...new Set(products)];
  }

  private extractPrices(text: string): string[] {
    const pricePatterns = [
      /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
      /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|usd)\b/gi,
      /\b(?:€|EUR)\s*\d+(?:,\d{3})*(?:\.\d{2})?/g
    ];
    
    const prices = [];
    for (const pattern of pricePatterns) {
      const matches = text.match(pattern) || [];
      prices.push(...matches);
    }
    
    return [...new Set(prices)];
  }

  private extractCompanies(text: string): string[] {
    // Common company patterns and names
    const companyPatterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|LLC|Corp|Corporation|Company|Ltd|Limited)\b/g,
      /\b(?:Google|Apple|Microsoft|Amazon|Facebook|Meta|Netflix|Tesla|Uber|Airbnb|Spotify|LinkedIn)\b/gi,
      /\b(?:Goldman Sachs|JP Morgan|Morgan Stanley|Bank of America|Wells Fargo|Citibank)\b/gi
    ];
    
    const companies = [];
    for (const pattern of companyPatterns) {
      const matches = text.match(pattern) || [];
      companies.push(...matches);
    }
    
    return [...new Set(companies)];
  }

  private extractSkills(text: string): string[] {
    const skillKeywords = [
      'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript',
      'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL',
      'Machine Learning', 'Data Science', 'AI', 'DevOps',
      'Project Management', 'Agile', 'Scrum', 'Leadership'
    ];
    
    return skillKeywords.filter(skill => 
      new RegExp('\\b' + skill + '\\b', 'gi').test(text)
    );
  }

  private updatePreferencesFromHistory(): void {
    // Analyze user history to update preferences
    const recentActions = this.userContext.userHistory.slice(-20);
    
    // Update travel preferences
    const travelActions = recentActions.filter(action => action.module === 'optitrip');
    if (travelActions.length > 3) {
      // Extract travel patterns and update preferences
      // This is a simplified version - in production, implement more sophisticated analysis
    }

    // Update shopping preferences
    const shoppingActions = recentActions.filter(action => action.module === 'optishop');
    if (shoppingActions.length > 3) {
      // Extract shopping patterns and update preferences
    }

    // Update career preferences
    const careerActions = recentActions.filter(action => action.module === 'optihire');
    if (careerActions.length > 3) {
      // Extract career patterns and update preferences
    }
  }
}

const crossModuleIntelligence = new CrossModuleIntelligence();
export default crossModuleIntelligence;
export type { CrossModuleContext, IntentRoute };
