import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../supabaseClient';
import { Button } from '../ui/Button';
import { 
  LogOut, 
  Moon, 
  Sun, 
  Compass,
  GraduationCap,
  Menu,
  X,
  Bell,
  Home,
  FolderKanban,
  Settings,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WebLayout = ({ isDark, setIsDark }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchInvitations();
    }
  }, [profile]);

  const fetchInvitations = async () => {
    try {
      const { data: memberData, error } = await supabase
        .from('project_members')
        .select('project_id, status')
        .eq('user_id', profile.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      if (memberData && memberData.length > 0) {
        const pendingIds = memberData.map(m => m.project_id);
        const { data: inviteProjects } = await supabase
          .from('projects')
          .select('id, title, owner:users!projects_owner_id_fkey(full_name)')
          .in('id', pendingIds);
          
        setInvitations(inviteProjects?.map(p => ({
          project_id: p.id,
          project: p
        })) || []);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  };

  const handleRespondInvitation = async (projectId, accept) => {
    try {
      if (accept) {
        await supabase
          .from('project_members')
          .update({ status: 'accepted' })
          .eq('project_id', projectId)
          .eq('user_id', profile.id);
      } else {
        await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', profile.id);
      }
      fetchInvitations();
      window.location.reload(); 
    } catch (err) {
      alert("Gagal memproses undangan: " + err.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { title: 'Beranda', path: '/dashboard-mahasiswa', icon: Home },
    { title: 'Project Saya', path: '/my-projects', icon: FolderKanban },
    { title: 'Explore', path: '/explore', icon: Compass },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-surface/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <Link to="/dashboard-mahasiswa" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 group-hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-white/20 rounded-xl blur-[2px]"></div>
                <GraduationCap className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 hidden sm:block">SPMonitor</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link key={item.path} to={item.path}>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                      {item.title}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative text-slate-600 dark:text-slate-300"
              >
                <Bell className="w-5 h-5" />
                {invitations.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
                )}
              </button>

              {/* Dropdown Notification */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-surface border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-semibold text-sm">Notifikasi Undangan</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {invitations.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">
                          Tidak ada undangan baru.
                        </div>
                      ) : (
                        invitations.map((inv) => (
                          <div key={inv.project_id} className="p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <p className="text-sm mb-3">
                              <span className="font-semibold">{inv.project?.owner?.full_name}</span> mengundang Anda ke project <span className="font-semibold">{inv.project?.title}</span>
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleRespondInvitation(inv.project_id, true)} className="flex-1 bg-primary-600 hover:bg-primary-700 text-xs py-1.5 h-auto">Terima</Button>
                              <Button size="sm" variant="outline" onClick={() => handleRespondInvitation(inv.project_id, false)} className="flex-1 text-xs py-1.5 h-auto">Tolak</Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Dropdown / Actions */}
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="text-left mr-2">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{profile?.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile?.role}</p>
              </div>
              <Link to="/settings">
                <button 
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Pengaturan Akun"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </Link>
              <button 
                onClick={handleSignOut}
                className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-surface"
          >
            <nav className="p-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      <item.icon className="w-5 h-5" />
                      {item.title}
                    </div>
                  </Link>
                );
              })}
              <div className="border-t border-slate-200 dark:border-slate-800 mt-2 pt-4 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{profile?.full_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="text-slate-600">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 bg-surface/50 mt-auto">
        <p>&copy; {new Date().getFullYear()} SPMonitor. Platform pemantauan project mahasiswa.</p>
      </footer>
    </div>
  );
};
