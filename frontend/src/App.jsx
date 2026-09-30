import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import DashboardDosen from './pages/DashboardDosen';
import DashboardMahasiswa from './pages/DashboardMahasiswa';
import MyProjects from './pages/MyProjects';
import ProjectDetail from './pages/ProjectDetail';
import Explore from './pages/Explore';
import Settings from './pages/Settings';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { WebLayout } from './components/layout/WebLayout';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const DynamicLayout = ({ isDark, setIsDark }) => {
  const { profile } = useAuth();
  
  if (!profile) return null; // or loading

  if (profile.role === 'dosen') {
    return <MainLayout isDark={isDark} setIsDark={setIsDark} />;
  }
  
  return <WebLayout isDark={isDark} setIsDark={setIsDark} />;
};

function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <AuthProvider>
      <Toaster position="top-center" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white rounded-xl shadow-lg' }} />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes with Dynamic Layout */}
          <Route element={<DynamicLayout isDark={isDark} setIsDark={setIsDark} />}>
            
            {/* Dosen Only */}
            <Route element={<ProtectedRoute allowedRoles={['dosen']} />}>
              <Route path="/dashboard-dosen" element={<DashboardDosen />} />
              <Route path="/courses" element={<Courses />} />
            </Route>

            {/* Mahasiswa Only */}
            <Route element={<ProtectedRoute allowedRoles={['mahasiswa']} />}>
              <Route path="/dashboard-mahasiswa" element={<DashboardMahasiswa />} />
              <Route path="/my-projects" element={<MyProjects />} />
              <Route path="/explore" element={<Explore />} />
            </Route>

            {/* Accessible by BOTH */}
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/settings" element={<Settings />} />

          </Route>

          {/* Fallback route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

