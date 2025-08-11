import React, { useState, useEffect } from 'react';
import { Github, TestTube, Zap, ArrowRight, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const handleOAuthCallback = async (url) => {
      console.log(url)
      const urlParams = new URLSearchParams(url);
      const code = urlParams.get('code');
      console.log(code)
      const error = urlParams.get('error');

      if (error) {
        setError('GitHub authentication was cancelled or failed');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (code) {
        setLoading(true);
        try {
          // Exchange code for access token
          const response = await fetch(`${API_BASE_URL}auth/github/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();

          if (data.success) {
            // Store user data and token
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('github_token', data.accessToken);
            
            // Clean up URL and navigate to dashboard
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('/dashboard');
          } else {
            setError(data.message || 'Authentication failed');
          }
        } catch (err) {
          console.error('Authentication error:', err);
          setError('Failed to authenticate with GitHub. Please try again.');
        } finally {
          setLoading(false);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

  useEffect(() => {
  const queryString = window.location.search;
  if (queryString.includes('code=')) {
    handleOAuthCallback(queryString);
  }
}, []);

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Get GitHub OAuth URL from backend
      const response = await fetch(`${API_BASE_URL}auth/github`);
      console.log(response)
      const data = await response.json();

      if (data.success) {
        // Redirect to GitHub OAuth
        window.location.href = data.authUrl;
      } else {
        setError('Failed to initialize GitHub authentication');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to authentication server');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Workik AI</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-purple-200 mb-8">
              <Zap className="w-4 h-4" />
              <span>AI-Powered Test Case Generation</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Generate Smart
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {' '}Test Cases
              </span>
              <br />
              Automatically
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Revolutionize your testing workflow with AI. Connect your GitHub repositories 
              and let our intelligent system generate comprehensive test cases for your code.
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-8 max-w-md mx-auto">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Login Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={handleGitHubLogin}
                disabled={loading}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[200px]"
              >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <>
                    <Github className="w-6 h-6 mr-3" />
                    <span>Login with GitHub</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex items-center space-x-4 text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Free to use</span>
                </div>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                  <span className="text-sm">Secure OAuth</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative bg-black/20 backdrop-blur-sm py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-300">Everything you need for automated testing</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <Github className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">GitHub Integration</h3>
              <p className="text-gray-300">Seamlessly connect with your repositories and access all your code files in one place.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Smart Code Analysis</h3>
              <p className="text-gray-300">AI analyzes your code structure and suggests relevant test frameworks like JUnit, Jest, or Selenium.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Auto Test Generation</h3>
              <p className="text-gray-300">Generate comprehensive test cases with just a few clicks and create PRs automatically.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300">Simple steps to generate intelligent test cases</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Connect GitHub</h3>
              <p className="text-gray-300">Securely connect your GitHub account with OAuth authentication</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Select Repository</h3>
              <p className="text-gray-300">Choose repositories and specific files you want to test</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">AI Analysis</h3>
              <p className="text-gray-300">Our AI analyzes your code and generates test case summaries</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Generate & Deploy</h3>
              <p className="text-gray-300">Generate test code and create pull requests automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;