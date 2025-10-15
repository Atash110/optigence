'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BriefcaseIcon,
  UserIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ArrowUpRightIcon,
  SparklesIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguageStore } from '@/store/language';
import { useAI } from '@/hooks/useAI';
import ProtectedModule from '@/components/ProtectedModule';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  posted: string;
  match: number;
  description: string;
  requirements: string[];
  benefits: string[];
}

interface CareerGoal {
  id: string;
  title: string;
  progress: number;
  deadline: string;
  tasks: string[];
}

export default function OptiHirePage() {
  return (
    <ProtectedModule moduleName="OptiHire">
      <OptiHireContent />
    </ProtectedModule>
  );
}

function OptiHireContent() {
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'resume' | 'skills' | 'goals'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  // Mock data - replace with real API calls
  const jobListings: JobListing[] = [
    {
      id: '1',
      title: 'Senior Full Stack Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120k - $180k',
      type: 'Full-time',
      posted: '2 days ago',
      match: 95,
      description: 'We are looking for a Senior Full Stack Developer to join our innovative team...',
      requirements: ['5+ years React/Node.js experience', 'TypeScript proficiency', 'AWS knowledge'],
      benefits: ['Health insurance', 'Stock options', 'Remote work', '401k matching']
    },
    {
      id: '2',
      title: 'Product Manager',
      company: 'StartupXYZ',
      location: 'New York, NY',
      salary: '$110k - $150k',
      type: 'Full-time',
      posted: '1 week ago',
      match: 87,
      description: 'Join our product team to drive innovation and user-centric solutions...',
      requirements: ['3+ years product management', 'Agile experience', 'Data analysis skills'],
      benefits: ['Equity package', 'Flexible hours', 'Learning budget', 'Team events']
    },
    {
      id: '3',
      title: 'UX/UI Designer',
      company: 'Design Studio',
      location: 'Austin, TX',
      salary: '$85k - $120k',
      type: 'Contract',
      posted: '3 days ago',
      match: 78,
      description: 'Create beautiful and intuitive user experiences for our clients...',
      requirements: ['Portfolio required', 'Figma expertise', 'User research experience'],
      benefits: ['Creative freedom', 'Latest design tools', 'Conference attendance']
    }
  ];

  const careerGoals: CareerGoal[] = [
    {
      id: '1',
      title: 'Master Advanced React Patterns',
      progress: 65,
      deadline: '2025-09-01',
      tasks: ['Complete advanced hooks course', 'Build portfolio project', 'Practice code reviews']
    },
    {
      id: '2',
      title: 'Obtain AWS Certification',
      progress: 30,
      deadline: '2025-10-15',
      tasks: ['Study for Solutions Architect exam', 'Complete hands-on labs', 'Schedule exam']
    },
    {
      id: '3',
      title: 'Leadership Development',
      progress: 45,
      deadline: '2025-12-31',
      tasks: ['Read leadership books', 'Mentor junior developers', 'Lead project team']
    }
  ];

  const skills = [
    { name: 'JavaScript', level: 90, trend: 'up' },
    { name: 'React', level: 85, trend: 'up' },
    { name: 'Node.js', level: 80, trend: 'stable' },
    { name: 'TypeScript', level: 75, trend: 'up' },
    { name: 'Python', level: 70, trend: 'up' },
    { name: 'AWS', level: 60, trend: 'up' },
  ];

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const renderDashboard = () => (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-60">Applications Sent</p>
              <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">23</p>
            </div>
            <BriefcaseIcon className="w-8 h-8 text-primary-light dark:text-primary-dark" />
          </div>
          <p className="text-xs text-success-light dark:text-success-dark mt-2">+12% this week</p>
        </div>

        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-60">Interviews</p>
              <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">5</p>
            </div>
            <UserIcon className="w-8 h-8 text-primary-light dark:text-primary-dark" />
          </div>
          <p className="text-xs text-success-light dark:text-success-dark mt-2">2 upcoming</p>
        </div>

        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-60">Profile Views</p>
              <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">89</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-primary-light dark:text-primary-dark" />
          </div>
          <p className="text-xs text-success-light dark:text-success-dark mt-2">+34% this month</p>
        </div>

        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-60">Avg Match Score</p>
              <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">82%</p>
            </div>
            <StarIcon className="w-8 h-8 text-primary-light dark:text-primary-dark" />
          </div>
          <p className="text-xs text-warning-light dark:text-warning-dark mt-2">Room for improvement</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
            <DocumentTextIcon className="w-6 h-6 text-primary-light dark:text-primary-dark mb-2" />
            <p className="font-medium">Update Resume</p>
            <p className="text-sm opacity-60">Last updated 2 weeks ago</p>
          </button>
          
          <button className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
            <MagnifyingGlassIcon className="w-6 h-6 text-primary-light dark:text-primary-dark mb-2" />
            <p className="font-medium">Find New Jobs</p>
            <p className="text-sm opacity-60">15 new matches today</p>
          </button>
          
          <button className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
            <AcademicCapIcon className="w-6 h-6 text-primary-light dark:text-primary-dark mb-2" />
            <p className="font-medium">Skill Assessment</p>
            <p className="text-sm opacity-60">Take a quick test</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">📈 Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="w-2 h-2 rounded-full bg-success-light dark:bg-success-dark mt-2"></div>
            <div>
              <p className="text-sm font-medium">Applied to Senior Developer at TechCorp</p>
              <p className="text-xs opacity-60">2 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="w-2 h-2 rounded-full bg-info-light dark:bg-info-dark mt-2"></div>
            <div>
              <p className="text-sm font-medium">Profile viewed by Microsoft recruiter</p>
              <p className="text-xs opacity-60">1 day ago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="w-2 h-2 rounded-full bg-warning-light dark:bg-warning-dark mt-2"></div>
            <div>
              <p className="text-sm font-medium">Interview scheduled with StartupXYZ</p>
              <p className="text-xs opacity-60">3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderJobs = () => (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Search and Filters */}
      <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs, companies, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
            />
          </div>
          <button className="px-6 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity">
            Search Jobs
          </button>
        </div>
      </div>

      {/* Job Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {jobListings.map((job) => (
            <motion.div
              key={job.id}
              whileHover={{ scale: 1.02 }}
              className={`p-6 border rounded-xl cursor-pointer transition-all ${
                selectedJob?.id === job.id
                  ? 'border-primary-light dark:border-primary-dark bg-primary-light/5 dark:bg-primary-dark/5'
                  : 'border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:shadow-md'
              }`}
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <div className="flex items-center space-x-2 text-sm opacity-60 mt-1">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span>{job.company}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.match >= 90 ? 'bg-success-light/20 text-success-light dark:bg-success-dark/20 dark:text-success-dark' :
                    job.match >= 80 ? 'bg-warning-light/20 text-warning-light dark:bg-warning-dark/20 dark:text-warning-dark' :
                    'bg-error-light/20 text-error-light dark:bg-error-dark/20 dark:text-error-dark'
                  }`}>
                    {job.match}% match
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm opacity-80 mb-3">
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>{job.salary}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{job.posted}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  {job.type}
                </span>
                <ArrowUpRightIcon className="w-4 h-4 opacity-40" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Job Details */}
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6 sticky top-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedJob.title}</h2>
                <p className="text-primary-light dark:text-primary-dark font-medium">{selectedJob.company}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Job Description</h3>
                <p className="text-sm opacity-80">{selectedJob.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <ul className="space-y-1">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index} className="text-sm opacity-80 flex items-start space-x-2">
                      <span className="w-1 h-1 rounded-full bg-primary-light dark:bg-primary-dark mt-2 flex-shrink-0"></span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-success-light/10 dark:bg-success-dark/10 text-success-light dark:text-success-dark text-xs rounded"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border-light dark:border-border-dark">
                <button className="w-full bg-primary-light dark:bg-primary-dark text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                  Apply Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderSkills = () => (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">🎯 Your Skills Portfolio</h3>
        <div className="space-y-4">
          {skills.map((skill, index) => (
            <div key={skill.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{skill.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm opacity-60">{skill.level}%</span>
                  {skill.trend === 'up' && (
                    <span className="text-success-light dark:text-success-dark">↗</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-primary-light dark:bg-primary-dark h-2 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">📚 Recommended Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border-light dark:border-border-dark rounded-lg">
            <h4 className="font-medium mb-2">Advanced TypeScript</h4>
            <p className="text-sm opacity-60 mb-3">Master advanced type patterns and utility types</p>
            <button className="text-primary-light dark:text-primary-dark text-sm font-medium">
              Start Learning →
            </button>
          </div>
          
          <div className="p-4 border border-border-light dark:border-border-dark rounded-lg">
            <h4 className="font-medium mb-2">System Design</h4>
            <p className="text-sm opacity-60 mb-3">Learn to design scalable distributed systems</p>
            <button className="text-primary-light dark:text-primary-dark text-sm font-medium">
              Start Learning →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderGoals = () => (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🎯 Career Goals</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity">
          <PlusIcon className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      <div className="space-y-4">
        {careerGoals.map((goal) => (
          <div
            key={goal.id}
            className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{goal.title}</h3>
                <p className="text-sm opacity-60">Due: {new Date(goal.deadline).toLocaleDateString()}</p>
              </div>
              <span className="text-2xl font-bold text-primary-light dark:text-primary-dark">
                {goal.progress}%
              </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-primary-light dark:bg-primary-dark h-2 rounded-full transition-all duration-500"
                data-width={`${goal.progress}%`}
                style={{ width: `${goal.progress}%` }}
              />
            </div>

            <div>
              <h4 className="font-medium mb-2">Tasks:</h4>
              <ul className="space-y-1">
                {goal.tasks.map((task, index) => (
                  <li key={index} className="text-sm opacity-80 flex items-start space-x-2">
                    <span className="w-1 h-1 rounded-full bg-primary-light dark:bg-primary-dark mt-2 flex-shrink-0"></span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'jobs', label: 'Job Search', icon: BriefcaseIcon },
    { id: 'resume', label: 'Resume', icon: DocumentTextIcon },
    { id: 'skills', label: 'Skills', icon: AcademicCapIcon },
    { id: 'goals', label: 'Goals', icon: StarIcon },
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-light to-primary-light dark:from-primary-dark dark:to-primary-dark flex items-center justify-center">
              <BriefcaseIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground-light dark:text-foreground-dark">
              OptiHire
            </h1>
          </div>
          <p className="text-xl text-foreground-light/80 dark:text-foreground-dark/80 mb-2">
            Smart Career Assistant
          </p>
          <p className="text-foreground-light/60 dark:text-foreground-dark/60">
            Accelerate your career with AI-powered job matching, resume optimization, and skill development
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'jobs' | 'resume' | 'skills' | 'goals')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-light dark:bg-primary-dark text-white'
                    : 'bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-foreground-light dark:text-foreground-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'jobs' && renderJobs()}
            {activeTab === 'skills' && renderSkills()}
            {activeTab === 'goals' && renderGoals()}
            {activeTab === 'resume' && (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-primary-light dark:text-primary-dark mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Resume Builder</h3>
                <p className="text-foreground-light/60 dark:text-foreground-dark/60">
                  AI-powered resume optimization coming soon...
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
