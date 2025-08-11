import React, { useState, useEffect } from 'react';
import { TestTube, Github, GitBranch, FileCode, Users, Star, Search, Filter, Eye, Download, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Added missing state
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    initializeDashboard();
  }, []); 

  console.log(repositories);
  const navigate=useNavigate();
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authorization token is required');
    }
    return {
      'Authorization': `Bearer ${token}`, // Changed from 'token' to 'Bearer'
      'Content-Type': 'application/json',
    };
  };

  const initializeDashboard = async () => {
    try {
      // Check if user is authenticated
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('token');
      console.log(userData, token);
      
      if (!userData || !token) {
        handleAuthError();
        return;
      }

      setUser(JSON.parse(userData));
      
      // Fetch repositories
      await fetchRepositories();
      
    } catch (err) {
      console.error('Dashboard initialization error:', err);
      handleAuthError();
    }
  };

  const verifyAndRefreshUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}api/user`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('userData', JSON.stringify(data.user)); // Fixed key name
      }
    } catch (err) {
      console.error('User verification error:', err);
      throw err;
    }
  };

  const fetchRepositories = async () => {
    try {
      setError('');
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}api/repositories?per_page=50&sort=updated`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token verification failed');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const processedRepos = data.repositories.map(repo => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description || 'No description available',
          language: repo.language || 'Unknown',
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          watchers: repo.watchers_count || 0,
          updated_at: repo.updated_at,
          created_at: repo.created_at,
          private: repo.private,
          html_url: repo.html_url,
          clone_url: repo.clone_url,
          default_branch: repo.default_branch || 'main',
          topics: repo.topics || [],
          size: repo.size || 0,
          archived: repo.archived || false,
          disabled: repo.disabled || false,
        }));

        setRepositories(processedRepos);
      } else {
        throw new Error(data.message || 'Failed to fetch repositories');
      }
    } catch (err) {
      console.error('Repository fetch error:', err);
      if (err.message.includes('Token verification failed') || err.message.includes('401')) {
        handleAuthError();
      } else {
        setError('Failed to load repositories. Please try refreshing.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAuthError = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    // Instead of navigate, redirect using window.location
    window.location.href = '/';
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRepositories();
  };

  const handleViewRepository = (repo) => {
    console.log('View repository:', repo.name);
    window.open(repo.html_url, '_blank');
  };

  const handleGenerateTests = (repo) => {
    console.log('Generate tests for:', repo.name);
    alert(`Test generation for ${repo.name} will be implemented in the next phase!`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: 'bg-yellow-500',
      TypeScript: 'bg-blue-600',
      Python: 'bg-blue-500',
      Java: 'bg-orange-500',
      'C++': 'bg-blue-400',
      'C#': 'bg-purple-500',
      Ruby: 'bg-red-500',
      Go: 'bg-cyan-500',
      Rust: 'bg-orange-600',
      PHP: 'bg-indigo-500',
      Swift: 'bg-orange-400',
      Kotlin: 'bg-purple-600',
      Dart: 'bg-cyan-500',
      HTML: 'bg-orange-600',
      CSS: 'bg-blue-500',
      Shell: 'bg-gray-600',
      Unknown: 'bg-gray-400',
      default: 'bg-gray-500'
    };
    return colors[language] || colors.default;
  };

  const filteredRepositories = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === 'all' || repo.language === languageFilter;
    const isNotArchived = !repo.archived && !repo.disabled;
    return matchesSearch && matchesLanguage && isNotArchived;
  });

  const uniqueLanguages = [...new Set(repositories.map(repo => repo.language))]
    .filter(lang => lang && lang !== 'Unknown')
    .sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your repositories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            disabled={refreshing}
          >
            {refreshing ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Workik AI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {user?.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt={user?.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-gray-700 font-medium">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600">Select repositories to generate intelligent test cases with AI</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Repositories</p>
                <p className="text-2xl font-bold text-gray-900">{repositories.length}</p>
                <p className="text-xs text-green-600 mt-1">+2 this week</p>
              </div>
              <GitBranch className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Languages</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueLanguages.length}</p>
                <p className="text-xs text-blue-600 mt-1">JavaScript, Python, Java</p>
              </div>
              <FileCode className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stars</p>
                <p className="text-2xl font-bold text-gray-900">
                  {repositories.reduce((sum, repo) => sum + repo.stars, 0)}
                </p>
                <p className="text-xs text-yellow-600 mt-1">+12 this month</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Forks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {repositories.reduce((sum, repo) => sum + repo.forks, 0)}
                </p>
                <p className="text-xs text-green-600 mt-1">+5 this month</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-300 mb-8 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Languages</option>
                  {uniqueLanguages.map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                {filteredRepositories.length} of {repositories.length} repositories
              </div>
            </div>
          </div>
        </div>

        {/* Repository Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredRepositories.map((repo) => (
            <div key={repo.id} className="bg-white rounded-xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300 hover:border-purple-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div onClick={()=>navigate(`/repo/${repo.name}`)} className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 hover:text-purple-600 cursor-pointer transition-colors">
                        {repo.name}
                      </h3>
                      {repo.private && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md font-medium">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{repo.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`}></div>
                      <span className="font-medium">{repo.language}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>{repo.stars}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <GitBranch className="w-4 h-4" />
                      <span>{repo.forks}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <FileCode className="w-4 h-4" />
                      <span>{repo.files} files</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Updated {formatDate(repo.updated_at)}</span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewRepository(repo)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Files
                    </button>
                    
                    {/* <button
                      onClick={() => handleGenerateTests(repo)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Generate Tests
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRepositories.length === 0 && repositories.length > 0 && (
          <div className="text-center py-12">
            <Github className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No repositories found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* No Repositories State */}
        {repositories.length === 0 && !loading && (
          <div className="text-center py-12">
            <Github className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No repositories available</h3>
            <p className="text-gray-600">Connect your GitHub account to see repositories</p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-12 text-center">
          <button className="inline-flex items-center px-6 py-3 text-lg font-medium text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
            <Github className="w-5 h-5 mr-2" />
            Connect More Repositories
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;