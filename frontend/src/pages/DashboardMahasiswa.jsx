import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Plus, FolderKanban, Loader2, ArrowRight, Compass, Layout, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageCropperModal } from '../components/ui/ImageCropperModal';

export default function DashboardMahasiswa() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', course_id: '', class_name: '', image_file: null });
  const [submitting, setSubmitting] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedFileToCrop, setSelectedFileToCrop] = useState(null);

  // Activity Log State
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // 1. Ambil list mata kuliah untuk form pilihan
      const { data: coursesData } = await supabase.from('courses').select('id, name, code');
      setCourses(coursesData || []);

      // 2. Ambil keanggotaan mahasiswa di project lain
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id, status')
        .eq('user_id', user.id);
        
      if (memberError) {
        console.error("Error fetching memberships:", memberError);
      }

      const pendingInviteIds = memberData?.filter(m => m.status === 'pending').map(m => m.project_id) || [];
      const acceptedProjectIds = memberData?.filter(m => m.status === 'accepted').map(m => m.project_id) || [];

      // Fetch detail project untuk undangan yang pending
      if (pendingInviteIds.length > 0) {
        const { data: inviteProjects } = await supabase
          .from('projects')
          .select('id, title, owner:users!projects_owner_id_fkey(full_name)')
          .in('id', pendingInviteIds);
          
        setInvitations(inviteProjects?.map(p => ({
          project_id: p.id,
          project: p
        })) || []);
      } else {
        setInvitations([]);
      }

      // 3. Ambil project dimana user adalah owner ATAU accepted member
      let query = supabase
        .from('projects')
        .select('*, course:courses(name, code, deadline), owner:users!owner_id(full_name)');
        
      if (acceptedProjectIds.length > 0) {
        query = query.or(`owner_id.eq.${user.id},id.in.(${acceptedProjectIds.join(',')})`);
      } else {
        query = query.eq('owner_id', user.id);
      }
      
      const { data: projectsData, error: projError } = await query.order('created_at', { ascending: false });

      if (projError) throw projError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      // 3. Ambil data project_tasks untuk hitung progress
      const projIds = projectsData.map(p => p.id);
      const { data: tasksData, error: taskError } = await supabase
        .from('project_tasks')
        .select('project_id, is_checked')
        .in('project_id', projIds);
        
      if (taskError) throw taskError;

      // 4. Ambil anggota tim untuk project-project ini
      const { data: membersData, error: memError } = await supabase
        .from('project_members')
        .select('project_id, user:users(full_name)')
        .in('project_id', projIds)
        .eq('status', 'accepted');
        
      if (memError) throw memError;

      const now = new Date();

      const formattedProjects = projectsData.map(p => {
        const pTasks = tasksData.filter(t => t.project_id === p.id);
        const checkedTasks = pTasks.filter(t => t.is_checked).length;
        const totalTasks = pTasks.length > 0 ? pTasks.length : 20; // fallback to 20 if none fetched
        const progress = Math.round((checkedTasks / totalTasks) * 100);
        const isLate = new Date(p.course.deadline) < now && progress < 100;
        
        // Gabungkan nama owner (jika ada, harusnya ada) dan members
        const teamMembers = [];
        // Masukkan nama pembuat project
        teamMembers.push(p.owner_id === user.id ? 'Anda' : (p.owner?.full_name || 'Ketua'));
        
        membersData.filter(m => m.project_id === p.id).forEach(m => {
          if (m.user?.full_name) {
            teamMembers.push(m.user.full_name === profile?.full_name ? 'Anda' : m.user.full_name);
          }
        });

        // Filter unique names in case of duplicates
        const uniqueMembers = [...new Set(teamMembers)];

        return { ...p, progress, isLate, teamMembers: uniqueMembers };
      });

      setProjects(formattedProjects);

      // 5. Ambil Activity Logs secara GLOBAL (bisa dilihat semua orang)
      const { data: logsData, error: logsError } = await supabase
        .from('activity_log')
        .select('*, project:projects(title), user:users(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!logsError && logsData) {
        setActivityLogs(logsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondInvitation = async (projectId, accept) => {
    try {
      if (accept) {
        await supabase
          .from('project_members')
          .update({ status: 'accepted' })
          .eq('project_id', projectId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id);
      }
      fetchData();
    } catch (err) {
      alert("Gagal memproses undangan: " + err.message);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFileToCrop(e.target.files[0]);
      setIsCropModalOpen(true);
      e.target.value = null; // reset input
    }
  };

  const handleCropComplete = (croppedFile) => {
    setFormData({ ...formData, image_file: croppedFile });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Upload Gambar jika ada
      let uploadedImageUrl = null;
      if (formData.image_file) {
        const fileExt = formData.image_file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project_images')
          .upload(filePath, formData.image_file);
          
        if (uploadError) {
          throw new Error('Gagal mengupload gambar. Pastikan bucket storage "project_images" sudah dibuat dan public. Detail: ' + uploadError.message);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('project_images')
          .getPublicUrl(filePath);
          
        uploadedImageUrl = publicUrl;
      }

      // 2. Buat Project Baru
      const { data: newProject, error: projError } = await supabase
        .from('projects')
        .insert([{
          title: formData.title,
          description: formData.description,
          course_id: formData.course_id,
          class_name: formData.class_name,
          owner_id: user.id,
          image_url: uploadedImageUrl
        }])
        .select()
        .single();

      if (projError) throw projError;

      // 2. Ambil semua master tasks
      const { data: masterTasks, error: taskError } = await supabase.from('tasks').select('id');
      if (taskError) throw taskError;

      // 3. Generate project_tasks (status checklist awal = false)
      const projectTasksPayload = masterTasks.map(t => ({
        project_id: newProject.id,
        task_id: t.id,
        is_checked: false
      }));

      const { error: ptError } = await supabase.from('project_tasks').insert(projectTasksPayload);
      if (ptError) throw ptError;

      // 4. Catat ke Activity Log
      await supabase.from('activity_log').insert([{
        project_id: newProject.id,
        user_id: user.id,
        action_type: 'PROJECT_CREATED',
        description: `Telah membuat project baru: ${formData.title} (Kelas: ${formData.class_name})`
      }]);

      await fetchData();
      setShowForm(false);
      setFormData({ title: '', description: '', course_id: '', class_name: '', image_file: null });
    } catch (error) {
      console.error('Error creating project:', error.message);
      alert('Gagal membuat project: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative pt-10 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200 dark:border-slate-800/50 mb-8 bg-slate-50/50 dark:bg-slate-900/20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.2))] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium text-sm mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                Selamat Datang di SPMonitor
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">{profile?.full_name?.split(' ')[0] || 'Mahasiswa'}</span> 👋
              </h1>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Wujudkan ide cemerlangmu, pantau progresnya, dan berkolaborasi bersama tim dalam satu platform terpadu. 
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 mt-4 md:mt-0">
              <Link to="/explore">
                <Button variant="outline" size="lg" className="rounded-xl shadow-sm w-full sm:w-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Compass className="w-5 h-5 mr-2" /> Eksplorasi Karya
                </Button>
              </Link>
              <Button onClick={() => setShowForm(true)} size="lg" className="rounded-xl shadow-md bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white w-full sm:w-auto border-0">
                <Plus className="w-5 h-5 mr-2" /> Mulai Project Baru
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        
        {/* Quick Stats Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Stat 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Project Aktif</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{projects.length}</p>
            </div>
          </div>
          {/* Stat 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Project Selesai</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{projects.filter(p => p.progress === 100).length}</p>
            </div>
          </div>
          {/* Stat 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { if(invitations.length === 0) alert('Belum ada undangan tim untuk Anda.'); }}>
            <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Undangan Tim</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{invitations.length}</p>
            </div>
          </div>
        </motion.section>

        {/* Features / Onboarding Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-8 md:p-10 text-white overflow-hidden relative shadow-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Apa yang Bisa Anda Lakukan?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <FolderKanban className="w-10 h-10 mb-4 text-primary-400" />
                <h3 className="font-bold text-lg mb-2">Manajemen Project</h3>
                <p className="text-sm text-slate-300 leading-relaxed">Buat dan kelola ide project Anda dengan rapi sesuai mata kuliah yang diambil.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <Users className="w-10 h-10 mb-4 text-emerald-400" />
                <h3 className="font-bold text-lg mb-2">Kolaborasi Tim</h3>
                <p className="text-sm text-slate-300 leading-relaxed">Undang teman ke dalam project Anda dan kerjakan tugas secara bergotong royong.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <TrendingUp className="w-10 h-10 mb-4 text-amber-400" />
                <h3 className="font-bold text-lg mb-2">Pantau Progres</h3>
                <p className="text-sm text-slate-300 leading-relaxed">Checklist task yang sudah selesai dan biarkan sistem menghitung progres otomatis.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <Compass className="w-10 h-10 mb-4 text-indigo-400" />
                <h3 className="font-bold text-lg mb-2">Eksplorasi Ide</h3>
                <p className="text-sm text-slate-300 leading-relaxed">Intip karya keren dari mahasiswa lain untuk referensi atau motivasi Anda.</p>
              </div>
            </div>
          </div>
        </motion.section>
        


        {/* Form Modal / Dropdown */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden max-w-3xl mx-auto w-full"
            >
              <Card className="border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-primary-900/10 shadow-xl">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Mulai Project Baru</h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Tutup</Button>
                  </div>
                  <form onSubmit={handleCreateProject} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Pilih Mata Kuliah</label>
                      <select 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 shadow-sm"
                        value={formData.course_id}
                        onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                        required
                      >
                        <option value="" disabled>-- Pilih Mata Kuliah --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kelas</label>
                      <select 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 shadow-sm"
                        value={formData.class_name}
                        onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                        required
                      >
                        <option value="" disabled>-- Pilih Kelas --</option>
                        <option value="3 A">Kelas 3 A</option>
                        <option value="3 B">Kelas 3 B</option>
                        <option value="3 C">Kelas 3 C</option>
                        <option value="3 D">Kelas 3 D</option>
                        <option value="3 E">Kelas 3 E</option>
                        <option value="3 F">Kelas 3 F</option>
                      </select>
                    </div>
                    <Input 
                      label="Judul Project" 
                      placeholder="Contoh: Sistem Informasi Akademik" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required 
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload Gambar Project (Opsional)</label>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-400 focus:outline-none transition-colors"
                      />
                      {formData.image_file && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Gambar siap diupload: {formData.image_file.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Deskripsi Singkat</label>
                      <textarea 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[120px] shadow-sm resize-none"
                        placeholder="Jelaskan secara singkat project Anda, tujuan, dan fitur utamanya..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
                      <Button type="submit" isLoading={submitting} className="px-6 rounded-full">Buat Project</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
              <Layout className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Project Terkini</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <FolderKanban className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Belum ada project yang Anda buat.</p>
                <p className="text-sm mt-2">Mulai eksplorasi ide dengan membuat project pertama Anda.</p>
                <Button onClick={() => setShowForm(true)} className="mt-6 rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> Buat Project
                </Button>
              </div>
            ) : (
              projects.slice(0, 3).map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:border-primary-300 dark:hover:border-primary-700 transition-colors shadow-sm hover:shadow-xl hover:shadow-primary-500/10 overflow-hidden">
                    {project.image_url && (
                      <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border-b border-slate-100 dark:border-slate-800">
                        <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-md w-fit tracking-wide border border-primary-100 dark:border-primary-900/50">
                            {project.course?.code}
                          </span>
                          {project.class_name && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-md w-fit tracking-wide border border-indigo-100 dark:border-indigo-900/50">
                              Kelas {project.class_name.toUpperCase().replace(/([0-9])\s*([A-Z])/gi, '$1 $2').trim()}
                            </span>
                          )}
                          {project.isLate && <Badge variant="danger" className="py-1">Terlambat</Badge>}
                          {project.progress === 100 && <Badge variant="success" className="py-1">Selesai</Badge>}
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-xl leading-tight mb-2 line-clamp-2">{project.title}</h3>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                        <span className="font-medium">Tim:</span> {project.teamMembers?.join(', ') || 'Tanpa Anggota'}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-3 flex-1 leading-relaxed">
                        {project.description}
                      </p>
                      
                      <div className="mt-auto space-y-5">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Progres</span>
                            <span className={project.progress === 100 ? 'text-success-600' : 'text-primary-600'}>{project.progress}%</span>
                          </div>
                          <ProgressBar progress={project.progress} variant={project.progress === 100 ? 'success' : 'primary'} />
                        </div>
                        <Link to={`/project/${project.id}`}>
                          <Button variant="outline" className="w-full text-sm rounded-xl group hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 dark:hover:bg-primary-900/20 dark:hover:border-primary-800">
                            Lihat Detail <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
          
          {projects.length > 3 && (
            <div className="flex justify-center pt-4">
              <Link to="/my-projects">
                <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  Lihat Semua Project Saya <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Activity Log Section */}
        {activityLogs.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Log Aktivitas Terbaru</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="space-y-4">
                {activityLogs.map(log => (
                  <div key={log.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 items-start">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      {log.user?.avatar_url ? (
                        <img src={log.user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        <span className="font-bold">{log.user?.full_name}</span> {log.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Di project <span className="font-medium text-primary-600">{log.project?.title}</span> • {new Date(log.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
      <ImageCropperModal 
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageFile={selectedFileToCrop}
        onCropCompleteAction={handleCropComplete}
        aspect={16/9}
        title="Sesuaikan Gambar Project"
      />
    </div>
  );
}
