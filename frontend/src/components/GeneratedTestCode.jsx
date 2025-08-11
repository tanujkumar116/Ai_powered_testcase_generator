import React from 'react'
import { FileCode2, FolderOpen, CheckCircle, Circle, Loader2, Sparkles, ArrowLeft, File, Folder, Copy, Download } from 'lucide-react';
const GeneratedTestCode = ({generatedTestCode,handlePrRequest}) => {
  return (
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
  )
}

export default GeneratedTestCode