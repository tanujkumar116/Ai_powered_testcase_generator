import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileCode2, FolderOpen, CheckCircle, Circle, Loader2, Sparkles, ArrowLeft, File, Folder, Copy, Download } from 'lucide-react';
import GeneratedTestCode from '../components/GeneratedTestCode';
const Repository = () => {
  const { repo } = useParams();
  const navigate = useNavigate();
  const [selectedScenarios, setSelectedScenarios] = useState([]);

  const [userData, setUserData] = useState(null);
  const [repoDetails, setRepoDetails] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [repoContents, setRepoContents] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoadingRepo, setIsLoadingRepo] = useState(true);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testCaseSummaries, setTestCaseSummaries] = useState([]);
  const [generatedTestCode, setGeneratedTestCode] = useState(null);
  const [error, setError] = useState(null);

  // Get user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Load repository details and contents
  useEffect(() => {
    if (userData && repo) {
      loadRepositoryData();
    }
  }, [userData, repo]);

  const getAuthToken = () => {
    return localStorage.getItem('token') || userData?.accessToken;
  };

  const loadRepositoryData = async () => {
    setIsLoadingRepo(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Load repository details
      const repoResponse = await fetch(`${import.meta.env.VITE_API_URL}api/repositories/${userData.login}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!repoResponse.ok) {
        throw new Error('Failed to fetch repository details');
      }

      const repoData = await repoResponse.json();
      setRepoDetails(repoData.repository);

      // Load repository contents
      await loadRepositoryContents('');

    } catch (err) {
      console.error('Error loading repository:', err);
      setError(err.message);
    } finally {
      setIsLoadingRepo(false);
    }
  };

  const loadRepositoryContents = async (path = '') => {
    setIsLoadingContents(true);
    
    try {
      const token = getAuthToken();
      const contentsResponse = await fetch(`${import.meta.env.VITE_API_URL}api/repositories/${userData.login}/${repo}/contents?path=${path}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!contentsResponse.ok) {
        throw new Error('Failed to fetch repository contents');
      }

      const contentsData = await contentsResponse.json();
      setRepoContents(contentsData.contents);
      setCurrentPath(path);

    } catch (err) {
      console.error('Error loading contents:', err);
      setError(err.message);
    } finally {
      setIsLoadingContents(false);
    }
  };

  const handleItemClick = (item) => {
    if (item.type === 'dir') {
      loadRepositoryContents(item.path);
    } else if (item.type === 'file') {
      toggleFileSelection(item);
    }
  };
  const handlePrRequest=async()=>{
      try {
        const token = getAuthToken();
        console.log(token)
        console.log("hello")
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/create-pr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`,"Content-Type": "application/json" },
        body: JSON.stringify({
          owner: userData.login,
          repo: repo,
          base: "main", // target branch
          filePath: `tests/${generatedTestCode.fileName.split('.')[0]}.test.${getFileExtension(generatedTestCode.fileName)}`,
          content: generatedTestCode.code,
          prTitle: `Add generated tests for ${generatedTestCode.fileName}`,
          prBody: "Auto-generated test cases by AI",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`PR created: ${data.html_url}`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to push to GitHub");
    }
  }
  const toggleFileSelection = (file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.path === file.path);
      if (isSelected) {
        return prev.filter(f => f.path !== file.path);
      } else {
        return [...prev, file];
      }
    });
  };

  const navigateUp = () => {
    if (currentPath) {
      const pathParts = currentPath.split('/');
      pathParts.pop();
      const newPath = pathParts.join('/');
      loadRepositoryContents(newPath);
    }
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const getLanguageFromExtension = (extension) => {
    const languageMap = {
      js: 'JavaScript',
      jsx: 'JavaScript',
      ts: 'TypeScript',
      tsx: 'TypeScript',
      py: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      php: 'PHP',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust',
      swift: 'Swift',
      kt: 'Kotlin',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      json: 'JSON',
      xml: 'XML',
      md: 'Markdown',
      yml: 'YAML',
      yaml: 'YAML'
    };
    return languageMap[extension] || extension.toUpperCase();
  };

  const estimateNumberOfTests = (summary) => {
    const testCount = (summary.match(/test/gi) || []).length;
    return testCount > 0 ? testCount : 3;
  };

  const generateTestCases = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const token = getAuthToken();

      const filesWithContent = await Promise.all(
        selectedFiles.map(async (file) => {
          const fileResponse = await fetch(
            `${import.meta.env.VITE_API_URL}api/repositories/${userData.login}/${repo}/file?path=${file.path}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!fileResponse.ok) throw new Error(`Failed to fetch file: ${file.path}`);
          
          const fileData = await fileResponse.json();
          const fileContent = fileData.file.content || '';

          const aiResponse = await fetch(`${import.meta.env.VITE_API_URL}api/gemini/summarize`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              fileName: file.name,
              content: fileContent
            })
          });

          if (!aiResponse.ok) throw new Error('Failed to generate test cases');
          
          const { summary, framework, testScenarios, estimatedTests } = await aiResponse.json();

          return {
            id: Math.random().toString(36).substr(2, 9),
            fileName: file.path,
            name: file.name,
            language: getLanguageFromExtension(getFileExtension(file.name)),
            framework: framework || 'Jest',
            testScenarios: testScenarios || [],
            summary: summary || 'No summary generated',
            hasContent: !!fileContent,
            fileSize: file.size,
            estimatedTests: estimatedTests || 3
          };
        })
      );

      setTestCaseSummaries(filesWithContent);
    } catch (err) {
      console.error('Error generating test cases:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTestCode = async (summary) => {
    try {
      setIsGenerating(true);
      const token = getAuthToken();
      
      const fileResponse = await fetch(
        `${import.meta.env.VITE_API_URL}api/repositories/${userData.login}/${repo}/file?path=${summary.fileName}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!fileResponse.ok) throw new Error('Failed to fetch original file');
      
      const fileData = await fileResponse.json();
      const fileContent = fileData.file.content || '';

      const aiResponse = await fetch(`${import.meta.env.VITE_API_URL}api/gemini/generate-tests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: summary.name,
          content: fileContent,
          framework: summary.framework,
          testScenarios: summary.testScenarios
        })
      });

      if (!aiResponse.ok) throw new Error('Failed to generate test code');

      const { testCode } = await aiResponse.json();
      
      setGeneratedTestCode({
        fileName: summary.name,
        code: testCode,
        framework: summary.framework
      });
      
    } catch (err) {
      console.error('Error generating test code:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };


  if (isLoadingRepo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading repository...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-semibold">Error loading repository</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-b-gray-300">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Repositories
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{repoDetails?.name}</h1>
                <p className="text-gray-600">{repoDetails?.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {repoDetails?.language && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {repoDetails.language}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                ⭐ {repoDetails?.stargazers_count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Browser Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-300">
              <div className="px-6 py-4 border-b border-b-gray-400">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Repository Files</h2>
                    <p className="text-gray-600 mt-1">
                      Path: /{currentPath || 'root'}
                    </p>
                  </div>
                  {currentPath && (
                    <button
                      onClick={navigateUp}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      ↑ Parent Directory
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {isLoadingContents ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading contents...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {repoContents.map((item, index) => {
                      const isFile = item.type === 'file';
                      const isSelected = isFile && selectedFiles.some(f => f.path === item.path);
                      const language = isFile ? getLanguageFromExtension(getFileExtension(item.name)) : '';
                      
                      return (
                        <div
                          key={index}
                          onClick={() => handleItemClick(item)}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {isFile ? (
                            <>
                              {isSelected ? (
                                <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400 mr-3" />
                              )}
                              <File className="w-5 h-5 text-gray-500 mr-3" />
                            </>
                          ) : (
                            <Folder className="w-5 h-5 text-blue-500 mr-3" />
                          )}
                          
                          <div className="flex-1">
                            <span className="text-gray-900 font-medium">{item.name}</span>
                            {isFile && language && (
                              <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                {language}
                              </span>
                            )}
                            {isFile && item.size && (
                              <span className="ml-2 text-xs text-gray-500">
                                {(item.size / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                          
                          {!isFile && (
                            <span className="text-gray-400 text-sm">→</span>
                          )}
                        </div>
                      );
                    })}
                    
                    {repoContents.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        No files found in this directory
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            {/* Selection Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selection Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected Files:</span>
                  <span className="font-semibold">{selectedFiles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Path:</span>
                  <span className="font-semibold text-sm">/{currentPath || 'root'}</span>
                </div>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Selected:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="text-xs bg-gray-100 rounded px-2 py-1">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={generateTestCases}
                disabled={selectedFiles.length === 0 || isGenerating}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Test Cases
                  </>
                )}
              </button>
            </div>        
          </div>
          {/* Test Case Summaries */}
            {testCaseSummaries.length > 0 && (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300">
      <div className="px-6 py-4 border-b border-b-gray-300">
        <h3 className="text-lg font-semibold text-gray-900">
          Generated Test Cases ({testCaseSummaries.length})
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          AI-generated test scenarios for selected files
        </p>
      </div>
      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
        {testCaseSummaries.map((summary) => (
          <div key={summary.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {summary.fileName.split('/').pop()}
                </h4>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {summary.framework}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {summary.language}
                  </span>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {summary.estimatedTests} tests
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3">{summary.summary}</p>
            
            {summary.testScenarios.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Test Scenarios:</p>
                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                  {summary.testScenarios.slice(0, 3).map((scenario, i) => (
                    <li key={i}>{scenario}</li>
                  ))}
                  {summary.testScenarios.length > 3 && (
                    <li className="text-gray-400">+{summary.testScenarios.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
            
            <button
              onClick={() => generateTestCode(summary)}
              disabled={!summary.hasContent || isGenerating}
              className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileCode2 className="w-4 h-4 mr-2" />
              )}
              Generate Test Code
            </button>
          </div>
        ))}
      </div>
    </div>
  )}
        </div>
      </div>
      {generatedTestCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Generated Test Code for {generatedTestCode.fileName}
              </h3>
              <button 
                onClick={() => setGeneratedTestCode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                  {generatedTestCode.framework}
                </span>
              </div>
              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                <code>{generatedTestCode.code}</code>
              </pre>
            </div>
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedTestCode.code);
                  alert('Test code copied to clipboard!');
                }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([generatedTestCode.code], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${generatedTestCode.fileName.split('.')[0]}.test.${getFileExtension(generatedTestCode.fileName)}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Test File
              </button>
              <button onClick={handlePrRequest} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center">
                Push to Github
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repository;