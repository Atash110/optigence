/**
 * Phase 6: Team Collaboration Suite
 * Shared intelligence, approval workflows, and collaborative learning
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShareIcon,
  StarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export interface TeamTemplate {
  id: string;
  teamId: string;
  title: string;
  content: string;
  category: 'reply' | 'meeting' | 'announcement' | 'follow-up' | 'other';
  performanceScore: number; // 0-1
  usageCount: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  lastUsed: Date;
  tags: string[];
  isPublic: boolean;
  approvalRequired: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  teamId: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  approvers: WorkflowApprover[];
  settings: WorkflowSettings;
  isActive: boolean;
  createdAt: Date;
}

export interface WorkflowTrigger {
  type: 'confidence' | 'recipient' | 'content' | 'template' | 'urgency';
  operator: 'above' | 'below' | 'equals' | 'contains' | 'matches';
  value: string | number;
  description: string;
}

export interface WorkflowApprover {
  userId: string;
  userName: string;
  role: 'reviewer' | 'approver' | 'final_approver';
  order: number;
  canOverride: boolean;
}

export interface WorkflowSettings {
  timeout: number; // minutes
  allowParallelApproval: boolean;
  requireAllApprovers: boolean;
  autoApproveAfterTimeout: boolean;
  notifyOnPending: boolean;
}

export interface PendingApproval {
  id: string;
  workflowId: string;
  userId: string;
  emailContent: string;
  recipients: string[];
  confidence: number;
  triggeredBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  currentApprovers: string[];
  approvalHistory: ApprovalAction[];
  createdAt: Date;
  expiresAt: Date;
}

export interface ApprovalAction {
  approverId: string;
  approverName: string;
  action: 'approve' | 'reject' | 'request_changes';
  comment?: string;
  timestamp: Date;
}

export const TeamCollaborationHub: React.FC<{
  userId: string;
  teamId: string;
}> = ({ userId, teamId }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'workflows' | 'approvals' | 'analytics'>('templates');
  const [teamTemplates, setTeamTemplates] = useState<TeamTemplate[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TeamTemplate | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const [templatesRes, workflowsRes, approvalsRes] = await Promise.all([
        fetch(`/api/team/templates?teamId=${teamId}`),
        fetch(`/api/team/workflows?teamId=${teamId}`),
        fetch(`/api/team/approvals?teamId=${teamId}&status=pending`)
      ]);

      if (templatesRes.ok) {
        const templates = await templatesRes.json();
        setTeamTemplates(templates);
      }

      if (workflowsRes.ok) {
        const workflows = await workflowsRes.json();
        setWorkflows(workflows);
      }

      if (approvalsRes.ok) {
        const approvals = await approvalsRes.json();
        setPendingApprovals(approvals);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, action: 'approve' | 'reject', comment?: string) => {
    try {
      const response = await fetch(`/api/team/approvals/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action,
          comment
        })
      });

      if (response.ok) {
        loadTeamData(); // Refresh data
      }
    } catch (error) {
      console.error('Approval action failed:', error);
    }
  };

  const shareTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/team/templates/${templateId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId })
      });

      if (response.ok) {
        loadTeamData();
      }
    } catch (error) {
      console.error('Template sharing failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-100">Team Collaboration</h1>
            <p className="text-gray-400">Shared intelligence and approval workflows</p>
          </div>
        </div>
        
        {pendingApprovals.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/40">
            <ClockIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-200 text-sm font-medium">
              {pendingApprovals.length} pending approval{pendingApprovals.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl">
        {[
          { key: 'templates', label: 'Team Templates', icon: ShareIcon },
          { key: 'workflows', label: 'Workflows', icon: ClockIcon },
          { key: 'approvals', label: 'Approvals', icon: CheckCircleIcon },
          { key: 'analytics', label: 'Analytics', icon: EyeIcon }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              activeTab === tab.key
                ? 'bg-blue-600/80 text-white shadow-lg'
                : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'templates' && (
            <TeamTemplatesView
              templates={teamTemplates}
              onShare={shareTemplate}
              onSelect={setSelectedTemplate}
              onCreateNew={() => setShowCreateTemplate(true)}
            />
          )}

          {activeTab === 'workflows' && (
            <WorkflowsView
              workflows={workflows}
              onUpdate={loadTeamData}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsView
              approvals={pendingApprovals}
              onApproval={handleApproval}
              userId={userId}
            />
          )}

          {activeTab === 'analytics' && (
            <TeamAnalyticsView
              teamId={teamId}
              templates={teamTemplates}
              workflows={workflows}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onShare={() => shareTemplate(selectedTemplate.id)}
        />
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <CreateTemplateModal
          teamId={teamId}
          userId={userId}
          onClose={() => setShowCreateTemplate(false)}
          onCreated={loadTeamData}
        />
      )}
    </div>
  );
};

const TeamTemplatesView: React.FC<{
  templates: TeamTemplate[];
  onShare: (id: string) => void;
  onSelect: (template: TeamTemplate) => void;
  onCreateNew: () => void;
}> = ({ templates, onShare, onSelect, onCreateNew }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Team Templates</h2>
        <button
          onClick={onCreateNew}
          className="bg-blue-600/80 hover:bg-blue-600 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
        >
          Create Template
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ y: -2 }}
            className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-4 cursor-pointer"
            onClick={() => onSelect(template)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-100 mb-1">{template.title}</h3>
                <p className="text-xs text-gray-400 capitalize">{template.category}</p>
              </div>
              <div className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-300">
                  {Math.round(template.performanceScore * 100)}%
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-300 mb-4 line-clamp-2">
              {template.content}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Used {template.usageCount} times</span>
              <span>by {template.createdByName}</span>
            </div>

            <div className="flex gap-2 mt-3">
              {template.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const WorkflowsView: React.FC<{
  workflows: ApprovalWorkflow[];
  onUpdate: () => void;
}> = ({ workflows, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Approval Workflows</h2>
        <button className="bg-blue-600/80 hover:bg-blue-600 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors">
          Create Workflow
        </button>
      </div>

      <div className="space-y-3">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-100 mb-1">{workflow.name}</h3>
                <p className="text-sm text-gray-400">{workflow.description}</p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                workflow.isActive 
                  ? 'bg-green-600/20 text-green-300'
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {workflow.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{workflow.triggers.length} triggers</span>
              <span>{workflow.approvers.length} approvers</span>
              <span>{workflow.settings.timeout}min timeout</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ApprovalsView: React.FC<{
  approvals: PendingApproval[];
  onApproval: (id: string, action: 'approve' | 'reject', comment?: string) => void;
  userId: string;
}> = ({ approvals, onApproval, userId }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-100">Pending Approvals</h2>

      {approvals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-100">
                      Email Approval Request
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      approval.confidence > 0.8 
                        ? 'bg-green-600/20 text-green-300'
                        : approval.confidence > 0.6
                        ? 'bg-yellow-600/20 text-yellow-300'
                        : 'bg-red-600/20 text-red-300'
                    }`}>
                      {Math.round(approval.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    To: {approval.recipients.join(', ')}
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  Expires {new Date(approval.expiresAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {approval.emailContent}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Triggered by: {approval.triggeredBy}
                </div>
                
                {approval.currentApprovers.includes(userId) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApproval(approval.id, 'reject')}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded text-xs transition-colors"
                    >
                      <XCircleIcon className="w-3 h-3" />
                      Reject
                    </button>
                    <button
                      onClick={() => onApproval(approval.id, 'approve')}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded text-xs transition-colors"
                    >
                      <CheckCircleIcon className="w-3 h-3" />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TeamAnalyticsView: React.FC<{
  teamId: string;
  templates: TeamTemplate[];
  workflows: ApprovalWorkflow[];
}> = ({ teamId, templates, workflows }) => {
  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
  const avgPerformance = templates.reduce((sum, t) => sum + t.performanceScore, 0) / templates.length || 0;
  const activeWorkflows = workflows.filter(w => w.isActive).length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-100">Team Analytics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400 mb-1">{templates.length}</div>
          <div className="text-sm text-gray-400">Team Templates</div>
        </div>
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400 mb-1">{totalUsage}</div>
          <div className="text-sm text-gray-400">Total Usage</div>
        </div>
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {Math.round(avgPerformance * 100)}%
          </div>
          <div className="text-sm text-gray-400">Avg Performance</div>
        </div>
        <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-400 mb-1">{activeWorkflows}</div>
          <div className="text-sm text-gray-400">Active Workflows</div>
        </div>
      </div>

      {/* Top Performing Templates */}
      <div className="bg-white/8 backdrop-blur-md border border-white/10 rounded-xl p-4">
        <h3 className="font-semibold text-gray-100 mb-4">Top Performing Templates</h3>
        <div className="space-y-2">
          {templates
            .sort((a, b) => b.performanceScore - a.performanceScore)
            .slice(0, 5)
            .map((template, index) => (
              <div key={template.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-100">{template.title}</div>
                    <div className="text-xs text-gray-400">Used {template.usageCount} times</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-green-400">
                  {Math.round(template.performanceScore * 100)}%
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Additional components would include TemplateDetailModal and CreateTemplateModal
const TemplateDetailModal: React.FC<{
  template: TeamTemplate;
  onClose: () => void;
  onShare: () => void;
}> = ({ template, onClose, onShare }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-100">{template.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Content</label>
            <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">
              {template.content}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Category:</span>
              <span className="text-gray-200 ml-2 capitalize">{template.category}</span>
            </div>
            <div>
              <span className="text-gray-400">Performance:</span>
              <span className="text-green-400 ml-2">{Math.round(template.performanceScore * 100)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Usage Count:</span>
              <span className="text-gray-200 ml-2">{template.usageCount}</span>
            </div>
            <div>
              <span className="text-gray-400">Created by:</span>
              <span className="text-gray-200 ml-2">{template.createdByName}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onShare}
            className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Share with Team
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CreateTemplateModal: React.FC<{
  teamId: string;
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}> = ({ teamId, userId, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'reply' | 'meeting' | 'announcement' | 'follow-up' | 'other'>('reply');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/team/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          userId,
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
          isPublic
        })
      });

      if (response.ok) {
        onCreated();
        onClose();
      }
    } catch (error) {
      console.error('Template creation failed:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full"
      >
        <h2 className="text-xl font-semibold text-gray-100 mb-6">Create Team Template</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Template title..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="Template content..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="reply">Reply</option>
                <option value="meeting">Meeting</option>
                <option value="announcement">Announcement</option>
                <option value="follow-up">Follow-up</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Visibility</label>
              <select
                value={isPublic ? 'public' : 'private'}
                onChange={(e) => setIsPublic(e.target.value === 'public')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="public">Team Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Add tag..."
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded cursor-pointer hover:bg-red-600/20 hover:text-red-300 transition-colors"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !content.trim()}
            className="flex-1 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            {creating ? 'Creating...' : 'Create Template'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TeamCollaborationHub;
