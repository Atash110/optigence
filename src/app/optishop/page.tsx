'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBagIcon, 
  SparklesIcon, 
  MagnifyingGlassIcon, 
  HeartIcon,
  StarIcon,
  TruckIcon,
  TagIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAI } from '@/hooks/useAI';
import ProtectedModule from '@/components/ProtectedModule';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  inStock: boolean;
  freeShipping: boolean;
  isLiked: boolean;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 299.99,
    originalPrice: 399.99,
    rating: 4.8,
    reviews: 2341,
    image: '🎧',
    category: 'Electronics',
    inStock: true,
    freeShipping: true,
    isLiked: true
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt',
    price: 29.99,
    rating: 4.5,
    reviews: 890,
    image: '👕',
    category: 'Clothing',
    inStock: true,
    freeShipping: false,
    isLiked: false
  },
  {
    id: '3',
    name: 'Smart Watch Series 9',
    price: 449.99,
    originalPrice: 499.99,
    rating: 4.9,
    reviews: 5623,
    image: '⌚',
    category: 'Electronics',
    inStock: false,
    freeShipping: true,
    isLiked: true
  },
  {
    id: '4',
    name: 'Premium Coffee Maker',
    price: 189.99,
    rating: 4.6,
    reviews: 1234,
    image: '☕',
    category: 'Home & Kitchen',
    inStock: true,
    freeShipping: true,
    isLiked: false
  }
];

const categories = [
  'All',
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Sports',
  'Beauty',
  'Toys'
];

const priceRanges = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $250', min: 100, max: 250 },
  { label: 'Over $250', min: 250, max: Infinity }
];

export default function ShorporaPage() {
  return (
    <ProtectedModule moduleName="OptiShop">
      <ShorporaContent />
    </ProtectedModule>
  );
}

function ShorporaContent() {
  const { callOptiShop, loading, error } = useAI();
  const [activeTab, setActiveTab] = useState<'search' | 'recommendations' | 'wishlist' | 'analytics'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [products, setProducts] = useState(mockProducts);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high' | 'rating'>('relevance');

  const handleSearch = async () => {
    setIsSearching(true);
    
    try {
      // Use AI for enhanced product search and recommendations
      const shoppingData = {
        query: searchQuery,
        preferences: {
          categories: selectedCategory !== 'All' ? [selectedCategory] : undefined,
        }
      };

      const aiResponse = await callOptiShop('search', shoppingData);
      console.log('AI Search Response:', aiResponse);
      
      // For now, fall back to local filtering while AI integration is being refined
      // In the future, this would parse the AI response to get actual product data
      let filteredProducts = mockProducts;
      
      if (searchQuery) {
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (selectedCategory !== 'All') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
      }
      
      // Sort products
      if (sortBy === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        filteredProducts.sort((a, b) => b.rating - a.rating);
      }
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error with AI search:', error);
      
      // Fallback to original logic
      let filteredProducts = mockProducts;
      
      if (searchQuery) {
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (selectedCategory !== 'All') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
      }
      
      if (sortBy === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        filteredProducts.sort((a, b) => b.rating - a.rating);
      }
      
      setProducts(filteredProducts);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleLike = (productId: string) => {
    setProducts(products.map(product =>
      product.id === productId ? { ...product, isLiked: !product.isLiked } : product
    ));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="w-4 h-4 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="w-4 h-4 text-foreground-light/30 dark:text-foreground-dark/30" />);
    }

    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-navy-950 dark:via-navy-900 dark:to-navy-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <ShoppingBagIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground-light dark:text-foreground-dark mb-2">
            OptiShop
          </h1>
          <p className="text-xl text-foreground-light/70 dark:text-foreground-dark/70 mb-6">
            Smart Shopping & E-commerce Assistant
          </p>
          <div className="flex justify-center space-x-4 text-sm text-foreground-light/60 dark:text-foreground-dark/60">
            <div className="flex items-center">
              <SparklesIcon className="w-4 h-4 mr-1" />
              AI-Powered
            </div>
            <div className="flex items-center">
              <TagIcon className="w-4 h-4 mr-1" />
              Best Deals
            </div>
            <div className="flex items-center">
              <TruckIcon className="w-4 h-4 mr-1" />
              Fast Shipping
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-1 shadow-lg">
            {[
              { id: 'search', name: 'Smart Search', icon: MagnifyingGlassIcon },
              { id: 'recommendations', name: 'For You', icon: SparklesIcon },
              { id: 'wishlist', name: 'Wishlist', icon: HeartIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-light text-white shadow-md'
                    : 'text-foreground-light/70 dark:text-foreground-dark/70 hover:bg-accent-light dark:hover:bg-accent-dark/20'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'search' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Search and Filters */}
              <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for products..."
                        className="w-full pl-10 pr-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                  </div>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label="Select category"
                    className="px-4 py-3 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-foreground-light dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    aria-label="Sort products by"
                    className="px-4 py-3 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-foreground-light dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
                
                <button
                  onClick={handleSearch}
                  disabled={isSearching || loading}
                  className="mt-4 w-full md:w-auto px-8 py-3 bg-primary-light hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary-light text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {(isSearching || loading) ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      AI Smart Search
                    </>
                  )}
                </button>
                
                {/* Error display */}
                {error && (
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      AI search encountered an error. Showing filtered results instead.
                    </p>
                  </div>
                )}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="relative p-6 text-center">
                      <div className="text-6xl mb-4">{product.image}</div>
                      <button
                        onClick={() => toggleLike(product.id)}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent-light dark:hover:bg-accent-dark/20 transition-colors"
                      >
                        {product.isLiked ? (
                          <HeartIconSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {product.originalPrice && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                          {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                        </div>
                      )}
                      
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center mb-2">
                        <div className="flex">{renderStars(product.rating)}</div>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({product.reviews})
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span>{product.category}</span>
                        {product.freeShipping && (
                          <span className="flex items-center text-green-600">
                            <TruckIcon className="w-4 h-4 mr-1" />
                            Free Ship
                          </span>
                        )}
                      </div>
                      
                      <button
                        disabled={!product.inStock}
                        className="w-full py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                      >
                        {product.inStock ? 'Add to Cart' : 'Notify Me'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {products.length === 0 && (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Try adjusting your search criteria or browse our categories.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-8 text-center"
            >
              <SparklesIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AI Recommendations
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Our AI will learn your preferences and suggest products you&apos;ll love. Start shopping to get personalized recommendations!
              </p>
              <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors">
                Start Shopping
              </button>
            </motion.div>
          )}

          {activeTab === 'wishlist' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.filter(product => product.isLiked).map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="relative p-6 text-center">
                      <div className="text-6xl mb-4">{product.image}</div>
                      <HeartIconSolid className="absolute top-4 right-4 w-5 h-5 text-red-500" />
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {product.name}
                      </h3>
                      <div className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {formatPrice(product.price)}
                      </div>
                      <button className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {products.filter(product => product.isLiked).length === 0 && (
                <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-8 text-center">
                  <HeartIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Your Wishlist is Empty
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Start adding products to your wishlist by clicking the heart icon on any product.
                  </p>
                  <button 
                    onClick={() => setActiveTab('search')}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-8 text-center"
            >
              <ChartBarIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Shopping Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Get insights into your shopping habits, price trends, and savings opportunities. Analytics will be available once you start shopping.
              </p>
              <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors">
                View Analytics
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
