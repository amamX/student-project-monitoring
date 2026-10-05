import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    fetchSession();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Row not found, create a default one to fix deleted db issue
          const { data: authData } = await supabase.auth.getUser();
          const email = authData?.user?.email || '';
          const name = email.split('@')[0];
          
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert([{ id: userId, email: email, full_name: name, role: 'mahasiswa' }])
            .select()
            .single();
            
          if (!insertError) {
            setProfile(newProfile);
            return;
          }
        }
        throw error;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
      // If we completely fail to get profile, we might want to log out to prevent being stuck
      if (!profile) {
        supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
