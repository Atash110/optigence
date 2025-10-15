/**
 * Cross-Module Integration Service
 * Routes actions and data between OptiMail and other Optigence modules
 */

export interface CrossModuleAction {
  id: string;
  sourceModule: 'optimail' | 'optihire' | 'optitrip' | 'optishop';
  targetModule: 'optimail' | 'optihire' | 'optitrip' | 'optishop';
  actionType: string;
  payload: unknown;
  timestamp: Date;
  userId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ModuleCapability {
  module: string;
  actions: string[];
  dataTypes: string[];
  endpoints: string[];
}

export interface CrossModuleResult {
  success: boolean;
  data?: unknown;
  redirectUrl?: string;
  message?: string;
  error?: string;
}

export interface EmailToJobData {
  email: {
    subject: string;
    content: string;
    sender: string;
    recipients: string[];
  };
  extractedInfo: {
    jobTitle?: string;
    company?: string;
    location?: string;
    salary?: string;
    requirements?: string[];
    contactInfo?: {
      name: string;
      email: string;
      phone?: string;
    };
  };
}

export interface EmailToTravelData {
  email: {
    subject: string;
    content: string;
    sender: string;
  };
  extractedInfo: {
    destination?: string;
    dates?: {
      departure: string;
      return?: string;
    };
    travelers?: number;
    budget?: string;
    preferences?: string[];
    bookingInfo?: {
      confirmationNumber?: string;
      airline?: string;
      hotel?: string;
    };
  };
}

export interface EmailToShoppingData {
  email: {
    subject: string;
    content: string;
    sender: string;
  };
  extractedInfo: {
    products?: Array<{
      name: string;
      price?: string;
      url?: string;
      image?: string;
    }>;
    orderInfo?: {
      orderNumber?: string;
      total?: string;
      status?: string;
    };
    store?: {
      name: string;
      website?: string;
    };
    deals?: Array<{
      product: string;
      discount: string;
      validUntil?: string;
    }>;
  };
}

class CrossModuleService {
  private moduleCapabilities: Map<string, ModuleCapability> = new Map();
  private pendingActions: Map<string, CrossModuleAction> = new Map();

  constructor() {
    this.initializeModuleCapabilities();
  }

  private initializeModuleCapabilities() {
    // OptiMail capabilities
    this.moduleCapabilities.set('optimail', {
      module: 'optimail',
      actions: ['compose', 'send', 'analyze', 'extract_contact', 'schedule_meeting'],
      dataTypes: ['email', 'contact', 'meeting', 'template'],
      endpoints: ['/api/optimail/compose', '/api/optimail/send', '/api/optimail/analyze']
    });

    // OptiHire capabilities
    this.moduleCapabilities.set('optihire', {
      module: 'optihire',
      actions: ['create_job', 'add_candidate', 'schedule_interview', 'parse_resume'],
      dataTypes: ['job', 'candidate', 'interview', 'resume'],
      endpoints: ['/api/optihire/jobs', '/api/optihire/candidates', '/api/optihire/interviews']
    });

    // OptiTrip capabilities
    this.moduleCapabilities.set('optitrip', {
      module: 'optitrip',
      actions: ['create_trip', 'search_flights', 'book_hotel', 'track_expense'],
      dataTypes: ['trip', 'flight', 'hotel', 'expense'],
      endpoints: ['/api/optitrip/trips', '/api/optitrip/bookings', '/api/optitrip/expenses']
    });

    // OptiShop capabilities
    this.moduleCapabilities.set('optishop', {
      module: 'optishop',
      actions: ['track_product', 'compare_prices', 'create_wishlist', 'track_order'],
      dataTypes: ['product', 'price', 'wishlist', 'order'],
      endpoints: ['/api/optishop/products', '/api/optishop/prices', '/api/optishop/orders']
    });
  }

  /**
   * Analyze email content and suggest cross-module actions
   */
  async analyzeEmailForCrossActions(emailContent: string, subject: string = ''): Promise<CrossModuleAction[]> {
    const suggestions: CrossModuleAction[] = [];

    // Job-related analysis
    if (this.isJobRelatedEmail(emailContent, subject)) {
      const jobData = await this.extractJobInformation(emailContent, subject);
      suggestions.push({
        id: `job_${Date.now()}`,
        sourceModule: 'optimail',
        targetModule: 'optihire',
        actionType: 'create_job_from_email',
        payload: jobData,
        timestamp: new Date(),
        status: 'pending'
      });
    }

    // Travel-related analysis
    if (this.isTravelRelatedEmail(emailContent, subject)) {
      const travelData = await this.extractTravelInformation(emailContent, subject);
      suggestions.push({
        id: `travel_${Date.now()}`,
        sourceModule: 'optimail',
        targetModule: 'optitrip',
        actionType: 'create_trip_from_email',
        payload: travelData,
        timestamp: new Date(),
        status: 'pending'
      });
    }

    // Shopping-related analysis
    if (this.isShoppingRelatedEmail(emailContent, subject)) {
      const shoppingData = await this.extractShoppingInformation(emailContent, subject);
      suggestions.push({
        id: `shopping_${Date.now()}`,
        sourceModule: 'optimail',
        targetModule: 'optishop',
        actionType: 'track_from_email',
        payload: shoppingData,
        timestamp: new Date(),
        status: 'pending'
      });
    }

    return suggestions;
  }

  /**
   * Execute a cross-module action
   */
  async executeCrossModuleAction(action: CrossModuleAction): Promise<CrossModuleResult> {
    try {
      this.pendingActions.set(action.id, { ...action, status: 'processing' });

      switch (action.targetModule) {
        case 'optihire':
          return await this.executeOptiHireAction(action);
        case 'optitrip':
          return await this.executeOptiTripAction(action);
        case 'optishop':
          return await this.executeOptiShopAction(action);
        default:
          throw new Error(`Unknown target module: ${action.targetModule}`);
      }
    } catch (error) {
      this.pendingActions.set(action.id, { ...action, status: 'failed' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeOptiHireAction(action: CrossModuleAction): Promise<CrossModuleResult> {
    const { actionType, payload } = action;

    switch (actionType) {
      case 'create_job_from_email':
        const jobData = payload as EmailToJobData;
        return {
          success: true,
          redirectUrl: '/optihire/jobs/new',
          message: `Job posting created from email: ${jobData.extractedInfo.jobTitle}`,
          data: jobData
        };

      case 'add_candidate_from_email':
        return {
          success: true,
          redirectUrl: '/optihire/candidates/new',
          message: 'Candidate added from email',
          data: payload
        };

      default:
        throw new Error(`Unknown OptiHire action: ${actionType}`);
    }
  }

  private async executeOptiTripAction(action: CrossModuleAction): Promise<CrossModuleResult> {
    const { actionType, payload } = action;

    switch (actionType) {
      case 'create_trip_from_email':
        const travelData = payload as EmailToTravelData;
        return {
          success: true,
          redirectUrl: '/optitrip/trips/new',
          message: `Trip created from email to ${travelData.extractedInfo.destination}`,
          data: travelData
        };

      case 'track_booking_from_email':
        return {
          success: true,
          redirectUrl: '/optitrip/bookings',
          message: 'Booking tracked from email',
          data: payload
        };

      default:
        throw new Error(`Unknown OptiTrip action: ${actionType}`);
    }
  }

  private async executeOptiShopAction(action: CrossModuleAction): Promise<CrossModuleResult> {
    const { actionType, payload } = action;

    switch (actionType) {
      case 'track_from_email':
        const shoppingData = payload as EmailToShoppingData;
        return {
          success: true,
          redirectUrl: '/optishop/orders',
          message: `Tracking order from ${shoppingData.extractedInfo.store?.name}`,
          data: shoppingData
        };

      case 'add_deals_from_email':
        return {
          success: true,
          redirectUrl: '/optishop/deals',
          message: 'Deals added from email',
          data: payload
        };

      default:
        throw new Error(`Unknown OptiShop action: ${actionType}`);
    }
  }

  // Email Analysis Methods

  private isJobRelatedEmail(content: string, subject: string): boolean {
    const jobKeywords = [
      'job', 'position', 'hiring', 'career', 'employment', 'vacancy',
      'apply', 'resume', 'cv', 'interview', 'candidate', 'recruiter',
      'salary', 'benefits', 'full-time', 'part-time', 'remote'
    ];

    const text = (content + ' ' + subject).toLowerCase();
    return jobKeywords.some(keyword => text.includes(keyword));
  }

  private isTravelRelatedEmail(content: string, subject: string): boolean {
    const travelKeywords = [
      'flight', 'hotel', 'booking', 'reservation', 'trip', 'travel',
      'airline', 'airport', 'departure', 'arrival', 'itinerary',
      'confirmation', 'ticket', 'vacation', 'business trip'
    ];

    const text = (content + ' ' + subject).toLowerCase();
    return travelKeywords.some(keyword => text.includes(keyword));
  }

  private isShoppingRelatedEmail(content: string, subject: string): boolean {
    const shoppingKeywords = [
      'order', 'purchase', 'buy', 'sale', 'deal', 'discount',
      'product', 'item', 'cart', 'checkout', 'payment', 'shipping',
      'delivery', 'tracking', 'receipt', 'invoice'
    ];

    const text = (content + ' ' + subject).toLowerCase();
    return shoppingKeywords.some(keyword => text.includes(keyword));
  }

  private async extractJobInformation(content: string, subject: string): Promise<EmailToJobData> {
    // Simple extraction - in production this would use AI/NLP
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const phoneRegex = /\+?[\d\s\-\(\)]{10,}/g;
    
    const emails = content.match(emailRegex) || [];
    const phones = content.match(phoneRegex) || [];

    // Extract job title from subject or content
    let jobTitle = subject.toLowerCase().includes('job') ? subject : '';
    if (!jobTitle && content.toLowerCase().includes('position')) {
      const lines = content.split('\n');
      jobTitle = lines.find(line => line.toLowerCase().includes('position')) || '';
    }

    return {
      email: {
        subject,
        content,
        sender: emails[0] || '',
        recipients: emails.slice(1)
      },
      extractedInfo: {
        jobTitle: jobTitle.trim() || 'Job Opportunity',
        company: this.extractCompanyName(content),
        location: this.extractLocation(content),
        contactInfo: emails.length > 0 && emails[0] ? {
          name: this.extractContactName(content),
          email: emails[0],
          phone: phones[0]
        } : undefined
      }
    };
  }

  private async extractTravelInformation(content: string, subject: string): Promise<EmailToTravelData> {
    return {
      email: {
        subject,
        content,
        sender: this.extractSenderFromContent(content)
      },
      extractedInfo: {
        destination: this.extractDestination(content),
        dates: this.extractTravelDates(content),
        travelers: this.extractTravelerCount(content),
        bookingInfo: this.extractBookingInfo(content)
      }
    };
  }

  private async extractShoppingInformation(content: string, subject: string): Promise<EmailToShoppingData> {
    return {
      email: {
        subject,
        content,
        sender: this.extractSenderFromContent(content)
      },
      extractedInfo: {
        orderInfo: this.extractOrderInfo(content),
        store: this.extractStoreInfo(content),
        products: this.extractProducts(content)
      }
    };
  }

  // Helper extraction methods (simplified implementations)
  private extractCompanyName(content: string): string {
    const lines = content.split('\n');
    const companyLine = lines.find(line => 
      line.toLowerCase().includes('company') || 
      line.toLowerCase().includes('inc') ||
      line.toLowerCase().includes('corp')
    );
    return companyLine?.trim().slice(0, 50) || 'Unknown Company';
  }

  private extractLocation(content: string): string {
    const locationRegex = /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/g;
    const match = content.match(locationRegex);
    return match ? match[0] : 'Remote';
  }

  private extractContactName(content: string): string {
    const lines = content.split('\n');
    const nameLine = lines.find(line => 
      line.includes('Regards') || 
      line.includes('Best') || 
      line.includes('Sincerely')
    );
    return nameLine?.replace(/^(Regards|Best|Sincerely),?\s*/, '').trim() || 'HR Team';
  }

  private extractSenderFromContent(content: string): string {
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const emails = content.match(emailRegex) || [];
    return emails[0] || 'unknown@example.com';
  }

  private extractDestination(content: string): string {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Las Vegas', 'San Francisco'];
    const foundCity = cities.find(city => content.includes(city));
    return foundCity || 'Unknown Destination';
  }

  private extractTravelDates(content: string): { departure: string; return?: string } {
    const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
    const dates = content.match(dateRegex) || [];
    return {
      departure: dates[0] || new Date().toLocaleDateString(),
      return: dates[1]
    };
  }

  private extractTravelerCount(content: string): number {
    const travelerRegex = /(\d+)\s+(passenger|traveler|guest)/i;
    const match = content.match(travelerRegex);
    return match ? parseInt(match[1]) : 1;
  }

  private extractBookingInfo(content: string): { confirmationNumber?: string; airline?: string } {
    const confirmationRegex = /confirmation\s*#?\s*([A-Z0-9]{6,})/i;
    const confirmationMatch = content.match(confirmationRegex);
    
    const airlines = ['Delta', 'United', 'American', 'Southwest', 'JetBlue'];
    const airline = airlines.find(a => content.includes(a));

    return {
      confirmationNumber: confirmationMatch?.[1],
      airline
    };
  }

  private extractOrderInfo(content: string): { orderNumber?: string; total?: string; status?: string } {
    const orderRegex = /order\s*#?\s*([A-Z0-9]{6,})/i;
    const totalRegex = /total[:\s]*\$?([\d,]+\.?\d*)/i;
    
    const orderMatch = content.match(orderRegex);
    const totalMatch = content.match(totalRegex);

    return {
      orderNumber: orderMatch?.[1],
      total: totalMatch ? `$${totalMatch[1]}` : undefined,
      status: content.toLowerCase().includes('shipped') ? 'shipped' : 
              content.toLowerCase().includes('delivered') ? 'delivered' : 'processing'
    };
  }

  private extractStoreInfo(content: string): { name: string; website?: string } {
    const stores = ['Amazon', 'eBay', 'Walmart', 'Target', 'Best Buy', 'Apple'];
    const foundStore = stores.find(store => content.includes(store));
    
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex) || [];

    return {
      name: foundStore || 'Online Store',
      website: urls[0]
    };
  }

  private extractProducts(content: string): Array<{ name: string; price?: string }> {
    const lines = content.split('\n');
    const productLines = lines.filter(line => 
      line.includes('$') && line.length > 10 && line.length < 100
    );

    return productLines.slice(0, 5).map(line => ({
      name: line.replace(/\$[\d,]+\.?\d*/, '').trim(),
      price: line.match(/\$[\d,]+\.?\d*/)?.[0]
    }));
  }

  /**
   * Get capabilities for a specific module
   */
  getModuleCapabilities(moduleName: string): ModuleCapability | undefined {
    return this.moduleCapabilities.get(moduleName);
  }

  /**
   * Get all available modules and their capabilities
   */
  getAllModuleCapabilities(): ModuleCapability[] {
    return Array.from(this.moduleCapabilities.values());
  }

  /**
   * Get pending actions for a user
   */
  getPendingActions(userId?: string): CrossModuleAction[] {
    const actions = Array.from(this.pendingActions.values());
    return userId 
      ? actions.filter(action => action.userId === userId)
      : actions;
  }
}

const crossModuleService = new CrossModuleService();
export default crossModuleService;
