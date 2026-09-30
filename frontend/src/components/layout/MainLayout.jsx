import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { 
  LayoutDashboard, 
  BookOpen, 
  LogOut, 
  Moon, 
  Sun, 
  Compass,
  GraduationCap,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MainLayout = ({ isDark, setIsDark }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { title: 'Dashboard', path: '/dashboard-dosen', icon: LayoutDashboard },
    { title: 'Mata Kuliah', path: '/courses', icon: BookOpen },
    { title: 'Pengaturan', path: '/settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="bg-primary-600 p-2 rounded-xl">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-lg leading-tight">Project<br/>Monitor</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
              <motion.div 
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="px-3">
          <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile?.role}</p>
        </div>
        <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm text-foreground flex transition-colors">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-200/50 dark:border-slate-800/50 bg-surface/80 backdrop-blur-md flex-col hidden md:flex h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-surface/90 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 z-50 flex flex-col md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Navbar (Mobile Top & Desktop Top-right) */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary-600" />
              <span className="font-bold hidden sm:block">Project Monitor</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
