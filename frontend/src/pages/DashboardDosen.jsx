import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { 
  Users, 
  FolderKanban, 
  AlertTriangle, 
  CheckCircle2,
  Search,
  Filter,
  Loader2,
  BarChart3,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import toast from 'react-hot-toast';

export default function DashboardDosen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, completed: 0, atRisk: 0, avgProgress: 0 });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [coursesList, setCoursesList] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // 1. Ambil semua mata kuliah milik dosen ini
      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('id, name, code, deadline')
        .eq('lecturer_id', user.id);
      
      if (courseError) throw courseError;
      if (!courses || courses.length === 0) {
        setLoading(false);
        return;
      }
      
      setCoursesList(courses);
      const courseIds = courses.map(c => c.id);

      // 2. Ambil semua project dari mata kuliah tersebut
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select('*, owner:users!owner_id(full_name)')
        .in('course_id', courseIds);

      if (projError) throw projError;

      // 3. Ambil data project_tasks untuk hitung progress
      const projIds = projectsData.map(p => p.id);
      const { data: tasksData, error: taskError } = await supabase
        .from('project_tasks')
        .select('project_id, is_checked')
        .in('project_id', projIds);
        
      if (taskError) throw taskError;

      // 4. Ambil anggota tim untuk setiap project
      const { data: membersData, error: memError } = await supabase
        .from('project_members')
        .select('project_id, user:users(full_name)')
        .in('project_id', projIds)
        .eq('status', 'accepted');
        
      if (memError) throw memError;

      // Kalkulasi Analytics & Progress
      let totalProgress = 0;
      let completedCount = 0;
      let atRiskCount = 0;
      const now = new Date();

      const formattedProjects = projectsData.map(p => {
        const course = courses.find(c => c.id === p.course_id);
        const pTasks = tasksData.filter(t => t.project_id === p.id);
        const checkedTasks = pTasks.filter(t => t.is_checked).length;
        const totalTasks = pTasks.length > 0 ? pTasks.length : 20; // fallback to 20
        const progress = Math.round((checkedTasks / totalTasks) * 100);
        
        // Gabungkan owner dan members menjadi satu daftar tim
        const teamMembers = [p.owner?.full_name];
        membersData.filter(m => m.project_id === p.id).forEach(m => {
          if (m.user?.full_name) teamMembers.push(m.user.full_name);
        });
        
        totalProgress += progress;
        if (progress === 100) completedCount++;

        const isLate = new Date(course.deadline) < now && progress < 100;
        if (isLate) atRiskCount++;

        return {
          ...p,
          course,
          progress,
          isLate,
          teamMembers
        };
      });

      setStats({
        total: projectsData.length,
        completed: completedCount,
        atRisk: atRiskCount,
        avgProgress: projectsData.length > 0 ? Math.round(totalProgress / projectsData.length) : 0
      });

      // Prepare Chart Data (Average Progress per Course)
      const cData = courses.map(c => {
        const cProj = formattedProjects.filter(p => p.course_id === c.id);
        const avg = cProj.length > 0 ? cProj.reduce((acc, curr) => acc + curr.progress, 0) / cProj.length : 0;
        return {
          name: c.code,
          fullName: c.name,
          RataRataProgress: Math.round(avg),
          TotalProject: cProj.length
        };
      }).filter(c => c.TotalProject > 0);
      
      setChartData(cData);
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Yakin ingin menghapus project ini? Semua data terkait akan ikut terhapus dan mahasiswa harus membuat ulang.')) return;
    
    try {
      // Hapus data terkait (tasks dan members) terlebih dahulu untuk menghindari error foreign key
      await supabase.from('project_tasks').delete().eq('project_id', projectId);
      await supabase.from('project_members').delete().eq('project_id', projectId);

      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      toast.success('Project berhasil dihapus');
      fetchDashboardData();
    } catch (err) {
      toast.error('Gagal menghapus project: ' + err.message);
    }
  };

  const filteredProjects = projects.filter(p => {
    // Search
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Course Filter
    const matchCourse = filterCourse === 'all' || p.course_id?.toString() === filterCourse.toString();

    // Status Filter
    let matchStatus = true;
    if (filterStatus === 'completed') matchStatus = p.progress === 100;
    if (filterStatus === 'late') matchStatus = p.isLate;
    if (filterStatus === 'ongoing') matchStatus = p.progress > 0 && p.progress < 100 && !p.isLate;
    if (filterStatus === 'not_started') matchStatus = p.progress === 0;

    return matchSearch && matchCourse && matchStatus;
  });

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Pantau progres seluruh kelas dan project mahasiswa Anda.</p>
      </div>

      {/* Analytics Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon={FolderKanban} title="Total Project" value={stats.total} color="bg-blue-500" />
        <StatCard icon={CheckCircle2} title="Selesai" value={stats.completed} color="bg-emerald-500" />
        <StatCard icon={AlertTriangle} title="Tertinggal / Terlambat" value={stats.atRisk} color="bg-orange-500" />
        <StatCard icon={BarChart3} title="Rata-rata Progres" value={`${stats.avgProgress}%`} color="bg-cyan-500" />
      </motion.div>

      {/* Analytics Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-bold">Rata-rata Progres per Mata Kuliah</h2>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="RataRataProgress" name="Rata-rata Progres (%)" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.RataRataProgress === 100 ? '#10b981' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Project List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight shrink-0">Daftar Project</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="late">Terlambat</option>
              <option value="ongoing">Sedang Berjalan</option>
              <option value="not_started">Belum Mulai</option>
            </select>

            {/* Course Filter */}
            <select 
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="all">Semua Mata Kuliah</option>
              {coursesList.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari project / mahasiswa..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <p>Tidak ada project yang ditemukan.</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Link to={`/project/${project.id}`} className="block h-full">
                  <Card className="h-full flex flex-col hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer overflow-hidden">
                    {project.image_url && (
                      <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                        <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-5 flex flex-col flex-1 relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded w-fit">
                            {project.course?.code}
                          </span>
                          <div className="flex gap-2 mt-1">
                            {project.isLate && <Badge variant="danger">Terlambat</Badge>}
                            {project.progress === 100 && <Badge variant="success">Selesai</Badge>}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteProject(e, project.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Hapus Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{project.title}</h3>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
                        <span className="font-medium">Tim:</span> {project.teamMembers?.join(', ') || 'Tanpa Anggota'}
                      </div>
                      
                      <div className="mt-auto space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Progres</span>
                          <span>{project.progress}%</span>
                        </div>
                        <ProgressBar progress={project.progress} variant={project.progress === 100 ? 'success' : 'primary'} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <div className={`${color} text-white shadow-md overflow-hidden h-full rounded-xl flex flex-col`}>
      <div className="p-5 flex flex-col justify-between h-full relative">
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="absolute right-2 bottom-2 z-0">
          <Icon className="w-16 h-16 text-white/20" />
        </div>
      </div>
    </div>
  );
}
