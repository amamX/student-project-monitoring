import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Search, Compass, ArrowRight, Loader2, Users, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Explore() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');

  useEffect(() => {
    fetchExploreData();
  }, [user]);

  const fetchExploreData = async () => {
    try {
      // For MVP: Explore shows ALL projects across all courses (or we could limit it to courses the user is enrolled in)
      // We will show all projects to make the "Explore" lively.
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select('*, course:courses(name, code), owner:users!owner_id(full_name)')
        .order('created_at', { ascending: false });

      if (projError) throw projError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      // Fetch task completion
      const projIds = projectsData.map(p => p.id);
      const { data: tasksData, error: taskError } = await supabase
        .from('project_tasks')
        .select('project_id, is_checked')
        .in('project_id', projIds);
        
      if (taskError) throw taskError;

      // 4. Ambil anggota tim
      const { data: membersData, error: memError } = await supabase
        .from('project_members')
        .select('project_id, user:users(full_name)')
        .in('project_id', projIds)
        .eq('status', 'accepted');
        
      if (memError) throw memError;

      const TOTAL_TASKS = 20;

      const formattedProjects = projectsData.map(p => {
        const pTasks = tasksData.filter(t => t.project_id === p.id);
        const checkedTasks = pTasks.filter(t => t.is_checked).length;
        const progress = Math.round((checkedTasks / TOTAL_TASKS) * 100);
        
        const teamMembers = [p.owner?.full_name || 'Ketua'];
        membersData.filter(m => m.project_id === p.id).forEach(m => {
          if (m.user?.full_name) teamMembers.push(m.user.full_name);
        });
        const uniqueMembers = [...new Set(teamMembers)];

        return { ...p, progress, teamMembers: uniqueMembers };
      });

      // Ambil daftar unik mata kuliah dari data project
      const uniqueCourses = [];
      projectsData.forEach(p => {
        if (p.course && !uniqueCourses.find(c => c.id === p.course.id)) {
          uniqueCourses.push(p.course);
        }
      });
      setCoursesList(uniqueCourses);

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching explore data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCourse = filterCourse === 'all' || (p.course?.id && p.course.id.toString() === filterCourse.toString());
    
    return matchSearch && matchCourse;
  });

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="relative pt-10 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200 dark:border-slate-800/50 mb-8 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-4 text-primary-600 dark:text-primary-400">
              <Compass className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Explore Projects
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Jelajahi karya inovatif dari mahasiswa lain. Temukan inspirasi, pelajari teknologi baru, dan bangun koneksi.
            </p>

            {/* Search & Filter Bar */}
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
              
              <div className="relative w-full flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari project, teknologi, atau pembuat..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-transparent border-none focus:ring-0 text-base outline-none"
                />
              </div>

              <div className="w-full sm:w-px sm:h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

              <div className="w-full sm:w-auto relative flex items-center px-2">
                <Filter className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <select 
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm outline-none cursor-pointer text-slate-700 dark:text-slate-300 appearance-none font-medium"
                >
                  <option value="all">Semua Kategori</option>
                  {coursesList.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
            <Compass className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Project Tidak Ditemukan</p>
            <p className="text-sm max-w-md mx-auto">Coba ubah kata kunci pencarian atau filter kategori untuk menemukan project yang Anda cari.</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full flex flex-col hover:shadow-2xl transition-all border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 group bg-white dark:bg-slate-900/50">
                <CardContent className="p-0 flex flex-col flex-1">
                  
                  {/* Card Image / Header Decoration */}
                  <div className="h-32 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-t-xl border-b border-slate-100 dark:border-slate-800 relative overflow-hidden flex items-end p-4">
                    {project.image_url && (
                      <img src={project.image_url} alt={project.title} className="absolute inset-0 w-full h-full object-cover z-0" />
                    )}
                    <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.2))] z-0"></div>
                    {project.image_url && <div className="absolute inset-0 bg-black/40 z-0"></div>}
                    <span className="relative z-10 text-xs font-bold text-primary-700 dark:text-primary-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                      {project.course?.code}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg sm:text-xl leading-tight line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{project.title}</h3>
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-3 flex-1 leading-relaxed">
                      {project.description}
                    </p>
                    
                    <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800/50 space-y-5">
                      <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0 font-bold uppercase text-xs">
                          {project.owner?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="truncate font-semibold" title={project.teamMembers?.join(', ')}>
                            Tim: {project.teamMembers?.join(', ')}
                          </span>
                          <span className="text-xs text-slate-400">{project.course?.name}</span>
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <span>Progres</span>
                          <span className={project.progress === 100 ? "text-emerald-500" : "text-primary-600"}>{project.progress}%</span>
                        </div>
                        <ProgressBar progress={project.progress} variant={project.progress === 100 ? 'success' : 'primary'} className="h-1.5" />
                      </div>

                      <Link to={`/project/${project.id}`} className="block">
                        <Button variant="outline" className="w-full text-sm font-medium rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border-slate-200 dark:border-slate-700">
                          Lihat Detail <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}
