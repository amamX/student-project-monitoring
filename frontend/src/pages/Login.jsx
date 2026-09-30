import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import supabase from '../supabaseClient';
import { LogIn, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('dosen@test.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Auto redirect if already logged in
  if (user && profile) {
    return <Navigate to={profile.role === 'dosen' ? '/dashboard-dosen' : '/dashboard-mahasiswa'} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Note: We don't need to manually navigate here.
      // The onAuthStateChange in AuthContext will fetch the profile 
      // and the `if (user && profile)` block above will automatically handle the redirection.
      toast.success("Login berhasil!");
    } catch (err) {
      setError(err.message);
      toast.error("Gagal login: " + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
          <h1 className="text-2xl font-bold text-center tracking-tight">Student Project Monitor</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Masuk untuk memantau progres project</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-md">
                  {error}
                </div>
              )}
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukan email anda"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukan password anda"
                required
              />
              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                <LogIn className="w-4 h-4 mr-2" />
                Masuk
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary-600 hover:underline font-medium">
                Daftar sekarang
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
