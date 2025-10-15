'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CameraIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  SunIcon,
  CloudIcon,
  StarIcon,
  CurrencyDollarIcon,
  PlusIcon,
  BookmarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import ProtectedModule from '@/components/ProtectedModule';

interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  rating: number;
  price: string;
  duration: string;
  highlights: string[];
  weather: string;
  bestTime: string;
  liked: boolean;
}

interface TravelPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    location: string;
  };
  destination: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked: boolean;
}

interface Trip {
  id: string;
  destination: string;
  dates: string;
  status: 'planned' | 'ongoing' | 'completed';
  companions: number;
  budget: string;
  progress: number;
}

export default function OptiTripPage() {
  return (
    <ProtectedModule moduleName="OptiTrip">
      <OptiTripContent />
    </ProtectedModule>
  );
}

function OptiTripContent() {
  const [activeTab, setActiveTab] = useState<'discover' | 'social' | 'trips' | 'budget' | 'journal'>('discover');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with real API calls
  const destinations: Destination[] = [
    {
      id: '1',
      name: 'Santorini',
      country: 'Greece',
      image: '/placeholder-santorini.jpg',
      rating: 4.8,
      price: '$1,200',
      duration: '7 days',
      highlights: ['Sunset views', 'White architecture', 'Wine tasting', 'Beach hopping'],
      weather: 'Sunny 28°C',
      bestTime: 'Apr-Oct',
      liked: false
    },
    {
      id: '2',
      name: 'Kyoto',
      country: 'Japan',
      image: '/placeholder-kyoto.jpg',
      rating: 4.9,
      price: '$1,800',
      duration: '10 days',
      highlights: ['Ancient temples', 'Cherry blossoms', 'Traditional culture', 'Gardens'],
      weather: 'Mild 22°C',
      bestTime: 'Mar-May',
      liked: true
    },
    {
      id: '3',
      name: 'Bali',
      country: 'Indonesia',
      image: '/placeholder-bali.jpg',
      rating: 4.7,
      price: '$900',
      duration: '14 days',
      highlights: ['Tropical beaches', 'Rice terraces', 'Yoga retreats', 'Local cuisine'],
      weather: 'Warm 30°C',
      bestTime: 'Apr-Oct',
      liked: false
    }
  ];

  const travelPosts: TravelPost[] = [
    {
      id: '1',
      user: {
        name: 'Sarah Chen',
        avatar: '/placeholder-avatar1.jpg',
        location: 'Tokyo, Japan'
      },
      destination: 'Mount Fuji',
      image: '/placeholder-fuji.jpg',
      caption: 'Amazing sunrise hike to Mt. Fuji! The 6-hour climb was totally worth it 🏔️ #Japan #Hiking',
      likes: 234,
      comments: 18,
      timeAgo: '2 hours ago',
      liked: false
    },
    {
      id: '2',
      user: {
        name: 'Alex Rodriguez',
        avatar: '/placeholder-avatar2.jpg',
        location: 'Barcelona, Spain'
      },
      destination: 'Sagrada Familia',
      image: '/placeholder-sagrada.jpg',
      caption: 'Gaudí\'s masterpiece never fails to amaze me. Every detail tells a story ✨',
      likes: 187,
      comments: 25,
      timeAgo: '5 hours ago',
      liked: true
    },
    {
      id: '3',
      user: {
        name: 'Emma Thompson',
        avatar: '/placeholder-avatar3.jpg',
        location: 'Reykjavik, Iceland'
      },
      destination: 'Northern Lights',
      image: '/placeholder-aurora.jpg',
      caption: 'Dancing with the Aurora Borealis! Nature\'s most incredible light show 💚',
      likes: 412,
      comments: 52,
      timeAgo: '1 day ago',
      liked: true
    }
  ];

  const trips: Trip[] = [
    {
      id: '1',
      destination: 'Tokyo & Kyoto',
      dates: 'Mar 15-25, 2025',
      status: 'planned',
      companions: 2,
      budget: '$3,500',
      progress: 75
    },
    {
      id: '2',
      destination: 'Iceland Ring Road',
      dates: 'Jul 8-18, 2025',
      status: 'planned',
      companions: 4,
      budget: '$2,800',
      progress: 45
    },
    {
      id: '3',
      destination: 'Paris Weekend',
      dates: 'Dec 2-5, 2024',
      status: 'completed',
      companions: 1,
      budget: '$1,200',
      progress: 100
    }
  ];

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const toggleLike = (id: string, type: 'destination' | 'post') => {
    // Implementation for toggling likes
    console.log(`Toggling like for ${type} ${id}`);
  };

  const renderDiscover = () => (
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
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Where do you want to go?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
            />
          </div>
          <select 
            title="Budget filter"
            className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-foreground-light dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
          >
            <option>Any Budget</option>
            <option>Under $1,000</option>
            <option>$1,000 - $2,000</option>
            <option>$2,000+</option>
          </select>
          <button className="px-6 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity">
            Search
          </button>
        </div>
      </div>

      {/* Featured Destinations */}
      <div>
        <h2 className="text-2xl font-bold mb-6">🌍 Featured Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <motion.div
              key={destination.id}
              whileHover={{ scale: 1.02 }}
              className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-48 bg-accent-light dark:bg-accent-dark/30">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => toggleLike(destination.id, 'destination')}
                    className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                    title={destination.liked ? 'Unlike destination' : 'Like destination'}
                  >
                    {destination.liked ? (
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{destination.name}</h3>
                  <p className="text-sm opacity-90">{destination.country}</p>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{destination.rating}</span>
                  </div>
                  <div className="text-sm text-foreground-light dark:text-foreground-dark/70">{destination.duration}</div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-primary-light dark:text-primary-dark">
                    {destination.price}
                  </span>
                  <div className="text-sm text-foreground-light dark:text-foreground-dark/70">{destination.weather}</div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-foreground-light dark:text-foreground-dark/60 mb-2">Highlights:</p>
                  <div className="flex flex-wrap gap-1">
                    {destination.highlights.slice(0, 3).map((highlight, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark text-xs rounded"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-primary-light dark:bg-primary-dark text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Travel Inspiration */}
      <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">✨ Travel Inspiration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <SunIcon className="w-8 h-8 text-yellow-500 mb-2" />
            <h4 className="font-medium mb-1">Summer Beach Escapes</h4>
            <p className="text-sm opacity-60">Perfect destinations for sun, sand, and relaxation</p>
          </div>
          
          <div className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <CloudIcon className="w-8 h-8 text-blue-500 mb-2" />
            <h4 className="font-medium mb-1">Mountain Adventures</h4>
            <p className="text-sm opacity-60">Hiking trails and scenic mountain getaways</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSocial = () => (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📸 Travel Community</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity">
          <PhotoIcon className="w-4 h-4" />
          <span>Share Photo</span>
        </button>
      </div>

      <div className="space-y-6">
        {travelPosts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden"
          >
            {/* Post Header */}
            <div className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary-light dark:from-primary-dark dark:to-primary-dark"></div>
              <div className="flex-1">
                <h4 className="font-medium">{post.user.name}</h4>
                <div className="flex items-center space-x-2 text-sm opacity-60">
                  <MapPinIcon className="w-3 h-3" />
                  <span>{post.user.location}</span>
                  <span>•</span>
                  <span>{post.timeAgo}</span>
                </div>
              </div>
              <button 
                title="More options"
                className="p-1 hover:bg-accent-light dark:hover:bg-accent-dark/20 rounded"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>

            {/* Post Image */}
            <div className="h-64 bg-gray-200 dark:bg-gray-700 relative">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <CameraIcon className="w-12 h-12" />
              </div>
            </div>

            {/* Post Actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleLike(post.id, 'post')}
                    className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -m-1 rounded transition-colors"
                    title={post.liked ? 'Unlike post' : 'Like post'}
                  >
                    {post.liked ? (
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -m-1 rounded transition-colors">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span className="text-sm">{post.comments}</span>
                  </button>
                  
                  <button 
                    title="Share post"
                    className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -m-1 rounded transition-colors"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <button 
                  title="Save post"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -m-1 rounded transition-colors"
                >
                  <BookmarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">{post.user.name}</span> {post.caption}
                </p>
                <button className="text-sm opacity-60 hover:opacity-80">
                  View all {post.comments} comments
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderTrips = () => (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">✈️ My Trips</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity">
          <PlusIcon className="w-4 h-4" />
          <span>Plan Trip</span>
        </button>
      </div>

      <div className="space-y-4">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{trip.destination}</h3>
                <div className="flex items-center space-x-4 text-sm opacity-60 mt-1">
                  <div className="flex items-center space-x-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{trip.dates}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{trip.companions} people</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    <span>{trip.budget}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                trip.status === 'completed' 
                  ? 'bg-success-light/20 text-success-light dark:bg-success-dark/20 dark:text-success-dark'
                  : trip.status === 'ongoing'
                  ? 'bg-warning-light/20 text-warning-light dark:bg-warning-dark/20 dark:text-warning-dark'
                  : 'bg-info-light/20 text-info-light dark:bg-info-dark/20 dark:text-info-dark'
              }`}>
                {trip.status === 'completed' ? '✅ Completed' : 
                 trip.status === 'ongoing' ? '🧳 In Progress' : '📋 Planned'}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm opacity-60">Trip Planning Progress</span>
                <span className="text-sm font-medium">{trip.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-light dark:bg-primary-dark h-2 rounded-full transition-all duration-500"
                  data-width={`${trip.progress}%`}
                  style={{ width: `${trip.progress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  View Itinerary
                </button>
                <button className="px-3 py-1 text-sm border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Edit Trip
                </button>
              </div>
              {trip.status === 'completed' && (
                <button className="text-primary-light dark:text-primary-dark text-sm font-medium">
                  Share Experience →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const tabs = [
    { id: 'discover', label: 'Discover', icon: GlobeAltIcon },
    { id: 'social', label: 'Community', icon: UserGroupIcon },
    { id: 'trips', label: 'My Trips', icon: CalendarDaysIcon },
    { id: 'budget', label: 'Budget', icon: CurrencyDollarIcon },
    { id: 'journal', label: 'Journal', icon: BookmarkIcon },
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
              <MapPinIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground-light dark:text-foreground-dark">
              OptiTrip
            </h1>
          </div>
          <p className="text-xl text-foreground-light/80 dark:text-foreground-dark/80 mb-2">
            🌍 Smart Travel & Social Companion
          </p>
          <p className="text-foreground-light/60 dark:text-foreground-dark/60">
            Discover amazing destinations, connect with travelers, and plan unforgettable adventures
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
                onClick={() => setActiveTab(tab.id as 'discover' | 'social' | 'trips' | 'budget' | 'journal')}
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
            {activeTab === 'discover' && renderDiscover()}
            {activeTab === 'social' && renderSocial()}
            {activeTab === 'trips' && renderTrips()}
            {activeTab === 'budget' && (
              <div className="text-center py-12">
                <CurrencyDollarIcon className="w-16 h-16 text-primary-light dark:text-primary-dark mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Budget Tracker</h3>
                <p className="text-foreground-light/60 dark:text-foreground-dark/60">
                  Smart budget management and expense tracking coming soon...
                </p>
              </div>
            )}
            {activeTab === 'journal' && (
              <div className="text-center py-12">
                <BookmarkIcon className="w-16 h-16 text-primary-light dark:text-primary-dark mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Travel Journal</h3>
                <p className="text-foreground-light/60 dark:text-foreground-dark/60">
                  Digital travel diary and memory keeper coming soon...
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
