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

export default function MyProjects() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', course_id: '', image_file: null });
  const [submitting, setSubmitting] = useState(false);

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

      await fetchData();
      setShowForm(false);
      setFormData({ title: '', description: '', course_id: '', image_file: null });
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
      {/* Page Header */}
      <section className="pt-8 pb-6 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Project Saya</h1>
              <p className="text-slate-500 dark:text-slate-400">Daftar lengkap semua project dan undangan kolaborasi Anda.</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="rounded-xl shadow-md w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Buat Project Baru
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {invitations.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Undangan Kolaborasi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitations.map(inv => (
                <Card key={inv.project_id} className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 shadow-sm">
                  <CardContent className="p-5 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="font-bold text-lg leading-tight mb-1">{inv.project?.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Diundang oleh: <span className="font-semibold text-slate-900 dark:text-slate-200">{inv.project?.owner?.full_name}</span>
                      </p>
                    </div>
                    <div className="flex gap-3 mt-auto">
                      <Button onClick={() => handleRespondInvitation(inv.project_id, true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Terima</Button>
                      <Button variant="outline" onClick={() => handleRespondInvitation(inv.project_id, false)} className="flex-1">Tolak</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

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
                        onChange={(e) => setFormData({...formData, image_file: e.target.files[0]})}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-400 focus:outline-none transition-colors"
                      />
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
            <h2 className="text-2xl font-bold tracking-tight">Project Saya</h2>
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
              projects.map((project) => (
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
                      <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                        <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full w-fit">
                            {project.course?.code}
                          </span>
                          <div className="flex gap-2">
                            {project.isLate && <Badge variant="danger">Terlambat</Badge>}
                            {project.progress === 100 && <Badge variant="success">Selesai</Badge>}
                          </div>
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
        </section>
      </div>
    </div>
  );
}
