import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import GitHubCallback from './routes/GitHubCallback';
import Repository from './pages/Repository';

function App() {
  const isAuth = Boolean(localStorage.getItem('userData') && localStorage.getItem('token'));

  const PrivateRoute = ({ children }) => {
    return isAuth ? children : <Navigate to="/" replace />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/auth/callback" element={<GitHubCallback />} /> 

        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={<PrivateRoute><Dashboard /></PrivateRoute>} 
        />
        <Route 
          path="/repo/:repo" 
          element={<PrivateRoute><Repository /></PrivateRoute>} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
