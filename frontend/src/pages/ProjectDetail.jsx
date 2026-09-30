import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Input } from '../components/ui/Input';
import { CheckCircle, Circle, ArrowLeft, Loader2, AlertCircle, Upload, Link as LinkIcon, MessageSquare, Download, Trash2, Send, Users, UserPlus, Plus, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  
  // Phase 4 States
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Team States
  const [members, setMembers] = useState([]);
  const [newMemberNim, setNewMemberNim] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  // Proof of Work States
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedTaskForProof, setSelectedTaskForProof] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeMilestoneId, setActiveMilestoneId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const isOwner = profile?.role === 'mahasiswa' && project?.owner_id === profile?.id;
  const isDosen = profile?.role === 'dosen';
  const isMember = members.some(m => m.user_id === profile?.id && (m.status === 'accepted' || m.invite_status === 'diterima'));
  const canEdit = isOwner || isMember; 

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      // 1. Fetch Project
      const { data: projData, error: projError } = await supabase
        .from('projects')
        .select('*, course:courses(name, code, deadline), owner:users!owner_id(full_name, nim)')
        .eq('id', id)
        .single();
      if (projError) throw projError;
      setProject(projData);

      // 2. Fetch Master Milestones & Tasks
      const { data: msData } = await supabase.from('milestones').select('*').order('order_index');
      const { data: tData } = await supabase.from('tasks').select('*').order('order_index');
      setMilestones(msData || []);
      setTasks(tData || []);

      // 3. Fetch Project Tasks Status
      const { data: ptData } = await supabase.from('project_tasks').select('*').eq('project_id', id);
      setProjectTasks(ptData || []);

      // 4. Fetch Comments, Links, Files, Members
      const { data: commentData, error: commentError } = await supabase.from('project_comments').select('*, user:users(full_name, role)').eq('project_id', id).order('created_at', { ascending: true });
      if (commentError) console.error("Error fetching comments:", commentError);
      setComments(commentData || []);

      const { data: linkData } = await supabase.from('project_links').select('*').eq('project_id', id);
      setLinks(linkData || []);

      const { data: fileData } = await supabase.from('project_files').select('*').eq('project_id', id);
      setFiles(fileData || []);

      const { data: memberData, error: memErr } = await supabase.from('project_members').select('*, student:users!project_members_user_id_fkey(full_name, nim)').eq('project_id', id);
      if (memErr) {
        console.error("Member fetch error:", memErr);
      }
      setMembers(memberData || []);

    } catch (error) {
      console.error('Error fetching project:', error.message);
      toast.error('Gagal memuat project! ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (taskId) => {
    const pt = projectTasks.find(pt => pt.task_id === taskId);
    return pt ? pt.is_checked : false;
  };
  
  const getTaskProof = (taskId) => {
    const pt = projectTasks.find(pt => pt.task_id === taskId);
    return pt ? pt.proof_image_url : null;
  };

  const canCheckTask = (milestoneId, taskOrderIndex) => {
    if (!canEdit) return false;
    const currentMs = milestones.find(m => m.id === milestoneId);
    if (currentMs.order_index > 1) {
      const prevMs = milestones.find(m => m.order_index === currentMs.order_index - 1);
      const prevMsTasks = tasks.filter(t => t.milestone_id === prevMs.id);
      const allPrevChecked = prevMsTasks.every(t => getTaskStatus(t.id));
      if (!allPrevChecked) return false;
    }
    if (taskOrderIndex > 1) {
      const prevTask = tasks.find(t => t.milestone_id === milestoneId && t.order_index === taskOrderIndex - 1);
      if (prevTask && !getTaskStatus(prevTask.id)) return false;
    }
    return true;
  };

  const handleToggleTaskClick = (task, isChecked) => {
    if (!canEdit) return;
    if (isChecked) {
      handleToggleTask(task, true);
    } else {
      if (!canCheckTask(task.milestone_id, task.order_index)) {
        toast.error("Harus dikerjakan secara berurutan!");
        return;
      }
      setSelectedTaskForProof({ ...task, isCustom: false });
      setShowProofModal(true);
    }
  };

  const handleToggleCustomTaskClick = (pt, isChecked) => {
    if (!canEdit) return;
    if (isChecked) {
      handleToggleCustomTask(pt.id, true);
    } else {
      setSelectedTaskForProof({ ...pt, isCustom: true });
      setShowProofModal(true);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error("Harap unggah bukti gambar pengerjaan!");
      return;
    }
    setIsUploadingProof(true);
    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `proof-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('project_images').upload(filePath, proofFile);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('project_images').getPublicUrl(filePath);
      
      if (selectedTaskForProof.isCustom) {
        await supabase.from('project_tasks')
          .update({ is_checked: true, checked_at: new Date(), proof_image_url: publicUrl })
          .eq('id', selectedTaskForProof.id);
      } else {
        const pt = projectTasks.find(p => p.task_id === selectedTaskForProof.id);
        if (pt) {
          await supabase.from('project_tasks')
            .update({ is_checked: true, checked_at: new Date(), proof_image_url: publicUrl })
            .eq('id', pt.id);
        }
      }
      
      setShowProofModal(false);
      setProofFile(null);
      setSelectedTaskForProof(null);
      fetchProjectData();
    } catch (err) {
      toast.error("Gagal upload bukti: " + err.message);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleToggleTask = async (task, currentStatus) => {
    if (!canEdit) return;
    setUpdating(true);
    try {
      if (!currentStatus) {
        // Now handled by modal
      } else {
        const currentMs = milestones.find(m => m.id === task.milestone_id);
        const tasksToUncheck = tasks.filter(t => {
          const tMs = milestones.find(m => m.id === t.milestone_id);
          if (tMs.order_index > currentMs.order_index) return true;
          if (tMs.order_index === currentMs.order_index && t.order_index >= task.order_index) return true;
          return false;
        });
        const taskIdsToUncheck = tasksToUncheck.map(t => t.id);
        await supabase.from('project_tasks').update({ is_checked: false, checked_at: null, proof_image_url: null }).eq('project_id', id).in('task_id', taskIdsToUncheck);
      }
      await fetchProjectData();
    } catch (error) {
      console.error('Error updating task:', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleCustomTask = async (ptId, currentStatus) => {
    if (!canEdit) return;
    setUpdating(true);
    try {
      await supabase.from('project_tasks').update({ is_checked: !currentStatus, checked_at: !currentStatus ? new Date() : null, proof_image_url: !currentStatus ? null : null }).eq('id', ptId);
      await fetchProjectData();
    } catch (error) {
      console.error('Error updating task:', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddCustomTask = async (e, milestoneId) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      const { error: insertErr } = await supabase.from('project_tasks').insert([{
        project_id: id,
        custom_title: newTaskTitle,
        milestone_id: milestoneId,
        is_checked: false
      }]);
      if (insertErr) throw insertErr;
      setNewTaskTitle('');
      setActiveMilestoneId(null);
      fetchProjectData();
    } catch (err) {
      toast.error("Gagal menambahkan task: " + err.message);
    }
  };

  const handleDeleteCustomTask = async (ptId) => {
    try {
      await supabase.from('project_tasks').delete().eq('id', ptId);
      fetchProjectData();
    } catch(err) { toast.error(err.message); }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLink) return;
    try {
      await supabase.from('project_links').insert([{ project_id: id, url: newLink, label: 'Demo/Repo' }]);
      setNewLink('');
      fetchProjectData();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await supabase.from('project_links').delete().eq('id', linkId);
      fetchProjectData();
    } catch (err) { toast.error(err.message); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 52428800) {
      toast.error("Maksimal ukuran file 50MB");
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('project_files').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('project_files').getPublicUrl(filePath);
      await supabase.from('project_files').insert([{ project_id: id, file_url: publicUrl }]);
      fetchProjectData();
    } catch (err) {
      toast.error('Gagal upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await supabase.from('project_files').delete().eq('id', fileId);
      fetchProjectData();
    } catch (err) { toast.error(err.message); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment) return;
    try {
      const { error } = await supabase.from('project_comments').insert([{ project_id: id, user_id: profile.id, content: newComment }]);
      if (error) throw error;
      setNewComment('');
      fetchProjectData();
    } catch (err) { toast.error("Gagal mengirim pesan: " + err.message); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await supabase.from('project_comments').delete().eq('id', commentId);
      fetchProjectData();
    } catch (err) { toast.error(err.message); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberNim) return;
    try {
      // Find user by NIM
      const { data: users, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('nim', newMemberNim)
        .eq('role', 'mahasiswa');
        
      if (findError) throw findError;
      if (!users || users.length === 0) {
        toast.error('Mahasiswa dengan NIM tersebut tidak ditemukan!');
        return;
      }
      const studentToAdd = users[0];

      if (studentToAdd.id === project.owner_id) {
        toast.error('Ini adalah ketua project!');
        return;
      }

      const alreadyMember = members.some(m => m.user_id === studentToAdd.id);
      if (alreadyMember) {
        toast.error('Mahasiswa sudah ada di dalam tim!');
        return;
      }

      const { error: insertErr } = await supabase.from('project_members').insert([{ 
        project_id: id, 
        user_id: studentToAdd.id, 
        invite_status: 'pending',
        role_in_team: 'anggota'
      }]);
      if (insertErr) throw insertErr;
      setNewMemberNim('');
      setShowAddMember(false);
      fetchProjectData();
    } catch (err) {
      toast.error('Gagal menambahkan anggota: ' + err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if(!window.confirm("Yakin ingin menghapus atau membatalkan undangan anggota ini?")) return;
    try {
      await supabase.from('project_members').delete().eq('id', memberId);
      fetchProjectData();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  if (!project) return <div>Project tidak ditemukan</div>;

  const customTasksCount = projectTasks.filter(pt => pt.custom_title).length;
  const totalTasks = tasks.length + customTasksCount;
  const checkedTasks = projectTasks.filter(pt => pt.is_checked).length;
  const progressPercent = Math.round((checkedTasks / (totalTasks || 1)) * 100);

  const isFinalMilestoneReached = progressPercent >= 80;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 px-4 sm:px-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </button>

      {/* Header Project */}
      <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0 shadow-lg shadow-primary-500/20 overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col gap-4">
          <div>
            <div className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-md text-xs font-bold tracking-wider mb-3">
              {project.course?.code} - {project.course?.name}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2 break-words">{project.title}</h1>
            <p className="text-primary-100 opacity-90 max-w-2xl">{project.description}</p>
          </div>
          
          <div className="mt-4 bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span>Progres Keseluruhan</span>
              <span>{progressPercent}%</span>
            </div>
            <ProgressBar progress={progressPercent} className="h-3" variant="success" />
          </div>
        </CardContent>
      </Card>

      {!canEdit && profile?.role === 'mahasiswa' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm font-medium">Anda sedang melihat project mahasiswa lain dalam mode Read-Only.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Kolom Kiri: Milestone & Task */}
        <div className="lg:col-span-2 space-y-8 relative">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
          
          {milestones.map((ms, index) => {
            const msTasks = tasks.filter(t => t.milestone_id === ms.id);
            const customTasks = projectTasks.filter(pt => pt.milestone_id === ms.id && pt.custom_title);
            
            const msChecked = msTasks.filter(t => getTaskStatus(t.id)).length + customTasks.filter(pt => pt.is_checked).length;
            const totalMsTasks = msTasks.length + customTasks.length;
            const isMilestoneCompleted = msChecked === totalMsTasks && totalMsTasks > 0;
            
            return (
              <div key={ms.id} className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-8">
                <div className="md:w-48 flex-shrink-0 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0
                    ${isMilestoneCompleted ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                    {index + 1}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-bold">{ms.name}</h3>
                    <p className="text-xs text-slate-500">{msChecked}/{msTasks.length} Selesai</p>
                  </div>
                </div>

                <Card className="flex-1 border-slate-200 dark:border-slate-800 shadow-sm w-full overflow-hidden">
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {msTasks.map((task) => {
                        const isChecked = getTaskStatus(task.id);
                        const isCheckable = canCheckTask(ms.id, task.order_index);
                        
                        return (
                          <div key={task.id} className={`flex items-start gap-3 p-4 transition-colors ${isChecked ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                            <button 
                              disabled={!canEdit || updating}
                              onClick={() => handleToggleTaskClick(task, isChecked)}
                              className={`mt-0.5 flex-shrink-0 transition-transform active:scale-95 disabled:cursor-not-allowed
                                ${isChecked ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-400'}
                                ${!isCheckable && !isChecked ? 'opacity-40' : ''}`}
                            >
                              {isChecked ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </button>
                            <div className={`flex-1 text-sm sm:text-base ${isChecked ? 'text-slate-500 dark:text-slate-400 line-through' : 'font-medium'}`}>
                              {task.title}
                            </div>
                            {isChecked && getTaskProof(task.id) && (
                              <a href={getTaskProof(task.id)} target="_blank" rel="noreferrer" title="Lihat Bukti Pengerjaan" className="text-primary-500 hover:text-primary-600 transition-colors p-1">
                                <ImageIcon className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                      {customTasks.map(pt => (
                        <div key={pt.id} className={`flex items-start gap-3 p-4 transition-colors ${pt.is_checked ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                          <button 
                            disabled={!canEdit || updating}
                            onClick={() => handleToggleCustomTaskClick(pt, pt.is_checked)}
                            className={`mt-0.5 flex-shrink-0 transition-transform active:scale-95 disabled:cursor-not-allowed
                              ${pt.is_checked ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-400'}`}
                          >
                            {pt.is_checked ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                          </button>
                          <div className={`flex-1 text-sm sm:text-base ${pt.is_checked ? 'text-slate-500 dark:text-slate-400 line-through' : 'font-medium'}`}>
                            {pt.custom_title}
                          </div>
                          {pt.is_checked && pt.proof_image_url && (
                            <a href={pt.proof_image_url} target="_blank" rel="noreferrer" title="Lihat Bukti Pengerjaan" className="text-primary-500 hover:text-primary-600 transition-colors p-1">
                              <ImageIcon className="w-5 h-5" />
                            </a>
                          )}
                          {isDosen && (
                            <button onClick={() => handleDeleteCustomTask(pt.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {isDosen && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/30">
                          {activeMilestoneId === ms.id ? (
                            <form onSubmit={(e) => handleAddCustomTask(e, ms.id)} className="flex gap-2">
                              <Input 
                                placeholder="Judul task baru..." 
                                value={newTaskTitle} 
                                onChange={e => setNewTaskTitle(e.target.value)} 
                                className="h-8 text-sm flex-1"
                              />
                              <Button type="submit" size="sm" className="h-8">Simpan</Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setActiveMilestoneId(null)}>Batal</Button>
                            </form>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => setActiveMilestoneId(ms.id)} className="w-full text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-900/50 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                              <Plus className="w-4 h-4 mr-2" /> Tambah Task Custom
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Kolom Kanan: Tim, Penyerahan & Review */}
        <div className="space-y-6">

          {/* Tim Panel */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-500" /> Anggota Tim
                </CardTitle>
                {isOwner && (
                  <button onClick={() => setShowAddMember(!showAddMember)} className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-1.5 rounded transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{project.owner?.full_name}</span>
                  <span className="text-xs text-slate-500">Ketua Tim - {project.owner?.nim}</span>
                </div>
                <Badge variant="primary">Owner</Badge>
              </div>
              
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{member.student?.full_name}</span>
                    <span className="text-xs text-slate-500">{member.student?.nim}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={(member.status === 'accepted' || member.invite_status === 'diterima') ? 'success' : 'warning'}>
                      {(member.status === 'accepted' || member.invite_status === 'diterima') ? 'Member' : 'Pending'}
                    </Badge>
                    {isOwner && (
                      <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 hover:text-red-700 p-1" title={(member.status === 'pending' || member.invite_status === 'pending') ? 'Batalkan Undangan' : 'Keluarkan Anggota'}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <AnimatePresence>
                {showAddMember && isOwner && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddMember} 
                    className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
                  >
                    <Input 
                      placeholder="Masukkan NIM..." 
                      value={newMemberNim} 
                      onChange={e => setNewMemberNim(e.target.value)}
                      className="text-sm h-8"
                    />
                    <Button type="submit" size="sm" className="h-8">Invite</Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Submission Panel */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary-500" /> Hasil Akhir
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              {/* Links Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Link Project
                </h4>
                {links.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline truncate mr-2">
                      {link.url}
                    </a>
                    {canEdit && (
                      <button onClick={() => handleDeleteLink(link.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && isFinalMilestoneReached && (
                  <form onSubmit={handleAddLink} className="flex gap-2 mt-2">
                    <Input 
                      placeholder="https://..." 
                      value={newLink} 
                      onChange={e => setNewLink(e.target.value)}
                      className="text-sm h-8"
                    />
                    <Button type="submit" size="sm" className="h-8 px-3">Add</Button>
                  </form>
                )}
              </div>

              {/* Files Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> File Project (.zip)
                </h4>
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                    <a href={file.file_url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline truncate mr-2">
                      Download ZIP
                    </a>
                    {canEdit && (
                      <button onClick={() => handleDeleteFile(file.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && isFinalMilestoneReached && (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".zip,application/zip"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? 'Uploading...' : 'Upload .ZIP'}
                    </label>
                  </div>
                )}
                {canEdit && !isFinalMilestoneReached && (
                  <p className="text-xs text-slate-500 text-center bg-slate-50 dark:bg-slate-800 p-2 rounded">Selesaikan minimal tahap Testing untuk membuka kunci upload file.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Komentar & Feedback Panel */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> Diskusi & Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Belum ada diskusi atau feedback.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {comments.map(comment => {
                    const isMine = comment.user_id === profile?.id;
                    const isLecturer = comment.user?.role === 'dosen';
                    return (
                      <div key={comment.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl ${
                          isLecturer ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 rounded-tl-sm' 
                          : isMine ? 'bg-primary-600 text-white rounded-tr-sm' 
                          : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-tl-sm'
                        }`}>
                          <div className="flex justify-between items-center mb-1 gap-4">
                            <span className={`text-xs font-bold ${isMine && !isLecturer ? 'text-primary-100' : isLecturer ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {comment.user?.full_name} {isLecturer && ' (Dosen)'}
                            </span>
                            {isMine && (
                              <button onClick={() => handleDeleteComment(comment.id)} className="opacity-70 hover:opacity-100 transition-opacity">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {(canEdit || isDosen) && (
                <form onSubmit={handleAddComment} className="mt-4 flex flex-col gap-2 relative">
                  <textarea 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Tulis pesan atau feedback..."
                    className="w-full p-3 pr-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-xl text-sm min-h-[50px] max-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  <Button type="submit" size="icon" className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-primary-600 hover:bg-primary-700 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Proof Upload Modal */}
      <AnimatePresence>
        {showProofModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProofModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
            >
              <Card className="shadow-2xl border-0 overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary-500" /> Upload Bukti Tugas
                  </CardTitle>
                  <button onClick={() => setShowProofModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmitProof} className="space-y-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 rounded-lg text-sm mb-4 border border-primary-100 dark:border-primary-800/30">
                      Anda akan menyelesaikan: <strong>{selectedTaskForProof?.title || selectedTaskForProof?.custom_title}</strong>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pilih File Gambar Bukti Pengerjaan</label>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files[0])}
                        required
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-400 focus:outline-none transition-colors"
                      />
                      <p className="text-xs text-slate-500 mt-1">Format didukung: JPG, PNG, GIF (Maks. 5MB)</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="ghost" onClick={() => setShowProofModal(false)} className="flex-1">Batal</Button>
                      <Button type="submit" isLoading={isUploadingProof} className="flex-1">Upload & Selesai</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

