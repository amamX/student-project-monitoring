const supabase = require('./supabaseClient');

async function check() {
  const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).not('role', 'is', null);
  const { count: dosenCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'dosen');
  const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
  
  console.log("=== DATA DI DATABASE (BYPASS RLS) ===");
  console.log("Total Users (ber-role):", usersCount);
  console.log("Total Dosen:", dosenCount);
  console.log("Total Projects:", projectsCount);
}

check();
