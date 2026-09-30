import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import supabase from '../supabaseClient';
import { UserPlus, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [nim, setNim] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('mahasiswa');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  if (user && profile) {
    return <Navigate to={profile.role === 'dosen' ? '/dashboard-dosen' : '/dashboard-mahasiswa'} replace />;
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (role === 'dosen' && secretCode !== 'DOSEN-FT-2024') {
        throw new Error('Kode Keamanan Dosen tidak valid. Pendaftaran ditolak.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            nim: role === 'mahasiswa' ? nim : null,
            role: role,
          }
        }
      });
      if (error) throw error;
      
      // Auto redirect to login after successful register (or handle email confirm)
      alert("Registrasi berhasil! Silakan login.");
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-600 p-3 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-center tracking-tight">Buat Akun Baru</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Bergabung ke platform monitoring</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Register</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 text-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setRole('mahasiswa'); setError(null); }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${role === 'mahasiswa' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                  Mahasiswa
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('dosen'); setError(null); }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${role === 'dosen' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                  Dosen
                </button>
              </div>

              <Input 
                label="Nama Lengkap" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap" 
                required 
              />
              
              {role === 'mahasiswa' && (
                <Input 
                  label="NIM" 
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="Masukkan NIM" 
                  required 
                />
              )}

              {role === 'dosen' && (
                <div className="space-y-1">
                  <Input 
                    label="Kode Keamanan Dosen" 
                    type="password"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    placeholder="Masukkan kode rahasia dari admin" 
                    required 
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kode ini diperlukan untuk memverifikasi status dosen Anda.</p>
                </div>
              )}

              <Input 
                label="Email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@kampus.ac.id" 
                required 
              />
              <Input 
                label="Password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter" 
                required 
                minLength={6}
              />
              
              <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
                <UserPlus className="w-4 h-4 mr-2" />
                Daftar
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary-600 hover:underline font-medium">
                Masuk di sini
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
