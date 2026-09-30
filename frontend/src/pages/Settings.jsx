import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Settings as SettingsIcon, Save, Key, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  const { user, profile, fetchProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      
      await fetchProfile(user.id);
      setProfileMessage('Profil berhasil diperbarui!');
    } catch (error) {
      setProfileMessage('Gagal memperbarui profil: ' + error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMessage('');

    if (password !== confirmPassword) {
      setPasswordMessage('Password dan konfirmasi password tidak sama.');
      setIsUpdatingPassword(false);
      return;
    }

    if (password.length < 6) {
      setPasswordMessage('Password minimal 6 karakter.');
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setPasswordMessage('Password berhasil diperbarui!');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordMessage('Gagal memperbarui password: ' + error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Pengaturan Akun</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="w-5 h-5 text-primary-500" /> Profil Publik
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileMessage && (
                  <div className={`p-3 text-sm rounded-md ${profileMessage.includes('berhasil') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {profileMessage}
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Akun (Tidak dapat diubah)</label>
                  <Input value={user?.email || ''} disabled className="bg-slate-50 dark:bg-slate-900 text-slate-500" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role Anda</label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 capitalize font-medium">
                    {profile?.role || 'User'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    required
                  />
                </div>

                <Button type="submit" isLoading={isUpdatingProfile} className="w-full">
                  <Save className="w-4 h-4 mr-2" /> Simpan Profil
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Key className="w-5 h-5 text-indigo-500" /> Keamanan Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {passwordMessage && (
                  <div className={`p-3 text-sm rounded-md ${passwordMessage.includes('berhasil') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {passwordMessage}
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password Baru</label>
                  <Input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Konfirmasi Password Baru</label>
                  <Input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    required
                  />
                </div>

                <Button type="submit" variant="outline" isLoading={isUpdatingPassword} className="w-full border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900/50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <Key className="w-4 h-4 mr-2" /> Ganti Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
