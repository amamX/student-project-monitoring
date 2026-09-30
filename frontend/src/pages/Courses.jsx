import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, Edit2, BookOpen, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', code: '', deadline: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('lecturer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const coursePayload = {
        name: formData.name,
        code: formData.code,
        deadline: new Date(formData.deadline).toISOString(),
        lecturer_id: user.id
      };

      if (formData.id) {
        // Update
        const { error } = await supabase
          .from('courses')
          .update(coursePayload)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('courses')
          .insert([coursePayload]);
        if (error) throw error;
      }

      await fetchCourses();
      resetForm();
    } catch (error) {
      console.error('Error saving course:', error.message);
      alert('Gagal menyimpan mata kuliah: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus mata kuliah ini? Semua project di dalamnya bisa bermasalah.')) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error.message);
      alert('Gagal menghapus mata kuliah: ' + error.message);
    }
  };

  const handleEdit = (course) => {
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const dateObj = new Date(course.deadline);
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
    
    setFormData({
      id: course.id,
      name: course.name,
      code: course.code,
      deadline: localISOTime
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', code: '', deadline: '' });
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Mata Kuliah</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola kelas dan batas waktu project mahasiswa.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "primary"}>
          {showForm ? 'Batal' : <><Plus className="w-4 h-4 mr-2" /> Tambah MK</>}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-primary-900/10">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Nama Mata Kuliah" 
                      placeholder="Contoh: Pemrograman Web Lanjut" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required 
                    />
                    <Input 
                      label="Kode MK" 
                      placeholder="Contoh: IF301" 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      required 
                    />
                  </div>
                  <Input 
                    label="Batas Waktu (Deadline)" 
                    type="datetime-local" 
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    required 
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={resetForm}>Batal</Button>
                    <Button type="submit" isLoading={submitting}>Simpan Mata Kuliah</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Belum ada mata kuliah.</p>
            <p className="text-sm">Klik tombol Tambah MK di atas untuk membuat kelas pertama Anda.</p>
          </div>
        ) : (
          courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full flex flex-col hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                <CardContent className="pt-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded text-xs font-semibold tracking-wider">
                      {course.code}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(course)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(course.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-4 flex-1 line-clamp-2">{course.name}</h3>
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                    <Clock className="w-4 h-4 mr-2 text-orange-500" />
                    <span>
                      {new Date(course.deadline).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
