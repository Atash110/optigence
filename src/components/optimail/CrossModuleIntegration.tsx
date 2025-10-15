import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink, 
  Users, 
  Plane, 
  ShoppingCart, 
  ArrowRight, 
  Check, 
  Clock,
  X
} from 'lucide-react';
import crossModuleService, { CrossModuleAction, CrossModuleResult } from '@/lib/cross-module';

interface CrossModuleIntegrationProps {
  emailContent: string;
  emailSubject?: string;
  isDarkMode: boolean;
  isVisible: boolean;
  onActionExecute?: (result: CrossModuleResult) => void;
}

const CrossModuleIntegration: React.FC<CrossModuleIntegrationProps> = ({
  emailContent,
  emailSubject = '',
  isDarkMode,
  isVisible,
  onActionExecute
}) => {
  const [suggestedActions, setSuggestedActions] = useState<CrossModuleAction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set());

  // Analyze email for cross-module opportunities
  const analyzeCrossModuleOpportunities = React.useCallback(async () => {
    if (!emailContent.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const actions = await crossModuleService.analyzeEmailForCrossActions(
        emailContent, 
        emailSubject
      );
      setSuggestedActions(actions.filter(action => !dismissedActions.has(action.id)));
    } catch (error) {
      console.error('Error analyzing cross-module opportunities:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [emailContent, emailSubject, dismissedActions]);

  useEffect(() => {
    if (emailContent && isVisible) {
      analyzeCrossModuleOpportunities();
    }
  }, [emailContent, emailSubject, isVisible, analyzeCrossModuleOpportunities]);

  const executeAction = async (action: CrossModuleAction) => {
    setExecutingActions(prev => new Set([...prev, action.id]));
    
    try {
      const result = await crossModuleService.executeCrossModuleAction(action);
      
      setCompletedActions(prev => new Set([...prev, action.id]));
      
      if (onActionExecute) {
        onActionExecute(result);
      }

      // Navigate to target module if redirect URL is provided
      if (result.redirectUrl) {
        setTimeout(() => {
          window.open(result.redirectUrl, '_blank');
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error executing cross-module action:', error);
    } finally {
      setExecutingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(action.id);
        return newSet;
      });
    }
  };

  const dismissAction = (actionId: string) => {
    setDismissedActions(prev => new Set([...prev, actionId]));
    setSuggestedActions(prev => prev.filter(action => action.id !== actionId));
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'optihire': return <Users size={16} />;
      case 'optitrip': return <Plane size={16} />;
      case 'optishop': return <ShoppingCart size={16} />;
      default: return <ExternalLink size={16} />;
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'optihire': return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'optitrip': return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'optishop': return isDarkMode ? 'text-purple-400' : 'text-purple-600';
      default: return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getActionDescription = (action: CrossModuleAction) => {
    const moduleName = action.targetModule.charAt(0).toUpperCase() + action.targetModule.slice(1);
    
    switch (action.actionType) {
      case 'create_job_from_email':
        return `Create job posting in ${moduleName}`;
      case 'create_trip_from_email':
        return `Plan trip in ${moduleName}`;
      case 'track_from_email':
        return `Track order in ${moduleName}`;
      case 'add_candidate_from_email':
        return `Add candidate to ${moduleName}`;
      case 'track_booking_from_email':
        return `Track booking in ${moduleName}`;
      case 'add_deals_from_email':
        return `Save deals to ${moduleName}`;
      default:
        return `Open in ${moduleName}`;
    }
  };

  const getActionDetails = (action: CrossModuleAction) => {
    const payload = action.payload as Record<string, unknown>;
    const extractedInfo = payload?.extractedInfo as Record<string, unknown>;
    
    switch (action.actionType) {
      case 'create_job_from_email':
        return (extractedInfo?.jobTitle as string) || 'Job opportunity detected';
      case 'create_trip_from_email':
        return (extractedInfo?.destination as string) || 'Travel booking detected';
      case 'track_from_email':
        const store = extractedInfo?.store as Record<string, unknown>;
        return (store?.name as string) || 'Order confirmation detected';
      default:
        return 'Relevant content detected';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-optimail-navy border-optimail-bright-blue/20' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ExternalLink size={20} className={isDarkMode ? 'text-optimail-bright-blue' : 'text-blue-600'} />
          <h3 className={`font-semibold ${isDarkMode ? 'text-optimail-light' : 'text-gray-800'}`}>
            Cross-Module Actions
          </h3>
        </div>
        
        {isAnalyzing && (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            <span className={`text-sm ${isDarkMode ? 'text-optimail-muted' : 'text-gray-600'}`}>
              Analyzing...
            </span>
          </div>
        )}
      </div>

      {/* Suggested Actions */}
      <AnimatePresence>
        {suggestedActions.length > 0 ? (
          <div className="space-y-3">
            {suggestedActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border transition-colors ${
                  completedActions.has(action.id)
                    ? isDarkMode
                      ? 'bg-green-900/20 border-green-500/30'
                      : 'bg-green-50 border-green-200'
                    : isDarkMode
                      ? 'bg-optimail-navy-light border-optimail-bright-blue/30 hover:border-optimail-bright-blue/50'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-1 ${getModuleColor(action.targetModule)}`}>
                      {getModuleIcon(action.targetModule)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${
                          isDarkMode ? 'text-optimail-light' : 'text-gray-800'
                        }`}>
                          {getActionDescription(action)}
                        </h4>
                        
                        {completedActions.has(action.id) && (
                          <Check size={14} className="text-green-500 flex-shrink-0" />
                        )}
                        
                        {executingActions.has(action.id) && (
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-blue-500" />
                            <span className="text-xs text-blue-500">Processing...</span>
                          </div>
                        )}
                      </div>
                      
                      <p className={`text-xs ${
                        isDarkMode ? 'text-optimail-muted' : 'text-gray-600'
                      }`}>
                        {getActionDetails(action)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {!completedActions.has(action.id) && !executingActions.has(action.id) && (
                      <>
                        <button
                          onClick={() => executeAction(action)}
                          className={`p-1 rounded transition-colors ${
                            isDarkMode
                              ? 'text-optimail-bright-blue hover:bg-optimail-bright-blue/20'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                          title="Execute action"
                        >
                          <ArrowRight size={14} />
                        </button>
                        
                        <button
                          onClick={() => dismissAction(action.id)}
                          className={`p-1 rounded transition-colors ${
                            isDarkMode
                              ? 'text-optimail-muted hover:bg-red-900/20 hover:text-red-400'
                              : 'text-gray-500 hover:bg-red-100 hover:text-red-600'
                          }`}
                          title="Dismiss suggestion"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                    
                    {executingActions.has(action.id) && (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full text-blue-500" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : !isAnalyzing && (
          <div className={`text-center py-6 ${isDarkMode ? 'text-optimail-muted' : 'text-gray-600'}`}>
            <ExternalLink size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              No cross-module opportunities detected in this email
            </p>
            <p className="text-xs mt-1">
              Actions will appear for job postings, travel bookings, and shopping orders
            </p>
          </div>
        )}
      </AnimatePresence>

      {/* Module Quick Access */}
      {suggestedActions.length > 0 && (
        <div className={`mt-4 pt-4 border-t ${
          isDarkMode ? 'border-optimail-bright-blue/20' : 'border-gray-200'
        }`}>
          <h4 className={`text-xs font-medium mb-3 ${
            isDarkMode ? 'text-optimail-light' : 'text-gray-800'
          }`}>
            Quick Access:
          </h4>
          
          <div className="flex gap-2">
            {['optihire', 'optitrip', 'optishop'].map(module => (
              <button
                key={module}
                onClick={() => window.open(`/${module}`, '_blank')}
                className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-optimail-navy-light text-optimail-muted hover:text-optimail-light'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-800'
                }`}
              >
                {getModuleIcon(module)}
                {module.charAt(0).toUpperCase() + module.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossModuleIntegration;
