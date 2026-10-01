import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { TestimonialsColumn } from '../components/ui/testimonials-columns-1';
import { motion } from 'framer-motion';
import { CheckSquare, Users, LineChart, Lightbulb, Globe, Moon, Sun } from 'lucide-react';
import supabase from '../supabaseClient';

const testimonials = [
  {
    text: "Progres tugas kelompok jadi jelas. Sangat membantu dalam memantau setiap langkah yang dilakukan teman sekelompok.",
    image: "https://cdn.21st.dev/assets/mirror/7c/7c408d5bb79392ba04b0b8a6294b4eee47a16ec377d3dae0c3108e918864bfad.jpg",
    name: "Budi Santoso",
    role: "Mahasiswa",
  },
  {
    text: "Mudah dipakai dari HP. Interface yang responsif bikin saya bisa cek tugas dimanapun dan kapanpun.",
    image: "https://cdn.21st.dev/assets/mirror/71/716cfb40836039a4e9e34d89320b6398ba7871ea7882e32b7397029586f6dda7.jpg",
    name: "Siti Aminah",
    role: "Mahasiswa",
  },
  {
    text: "Sangat mudah memantau dan menunggu pengumpulan akhir dari setiap kelompok. Fitur komentarnya juga membantu.",
    image: "https://cdn.21st.dev/assets/mirror/7a/7ae9db9990bb424cc1cf68b6af248e7b88e7add27109a6d951eb5b4f881eda98.jpg",
    name: "Dr. Hendra",
    role: "Dosen",
  },
  {
    text: "Fitur undang tim memudahkan bagi tugas. Gak perlu repot lagi bagi-bagi file lewat chat.",
    image: "https://cdn.21st.dev/assets/mirror/d1/d1db668ef30403e132bab1de4720f1c9159e8ba03dc0f3d65d5bf95f3985b80a.jpg",
    name: "Andi Wijaya",
    role: "Mahasiswa",
  },
  {
    text: "Menu Explore memberi referensi karya teman. Saya jadi lebih terinspirasi untuk membuat project yang lebih bagus.",
    image: "https://cdn.21st.dev/assets/mirror/9e/9ef716cb49c8a7e58c27a65358d91e806a1d4c8579a128772a5d9d09d62cb113.jpg",
    name: "Rina Sari",
    role: "Mahasiswa",
  },
  {
    text: "Checklist task bikin semangat. Ada kepuasan tersendiri saat mencentang task yang sudah selesai.",
    image: "https://cdn.21st.dev/assets/mirror/7f/7f2f1b6a4c09f5092437fe960232360d1e2dcf7a198c8580f3c5478c7b2d9386.jpg",
    name: "Kevin Pratama",
    role: "Mahasiswa",
  },
  {
    text: "Manajemen kelas jadi lebih terstruktur. Saya bisa langsung memberikan feedback per task ke setiap mahasiswa.",
    image: "https://cdn.21st.dev/assets/mirror/f2/f25b1b7a6a351c0f748d81bf4fcaf8c5a2f8ed036563c2693d4c1ca3718d9d5d.jpg",
    name: "Prof. Yudi",
    role: "Dosen",
  },
  {
    text: "Bisa pantau semua tugas dari satu tempat. Gak ada lagi alasan tugas tercecer atau lupa ngerjain.",
    image: "https://cdn.21st.dev/assets/mirror/41/417105f5784df0a25c3486becfe5c967d448e3c98b3c0231ef4ea0c59d27cb4b.jpg",
    name: "Lisa Gunawan",
    role: "Mahasiswa",
  },
  {
    text: "Tampilan keren banget, dark modenya nyaman di mata buat ngerjain tugas malem-malem.",
    image: "https://cdn.21st.dev/assets/mirror/62/6252a3b6790cbb48919cb8ea756a4e1ce829f3271a141731226871b3c3df9d6d.jpg",
    name: "Dito Nugroho",
    role: "Mahasiswa",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [stats, setStats] = useState({ users: 0, projects: 0, dosen: 0 });

  useEffect(() => {
    // Check initial dark mode class
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }
    
    // Fetch stats
    const fetchStats = async () => {
      try {
        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: dosenCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'dosen');
        const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        
        setStats({
          users: usersCount || 0,
          dosen: dosenCount || 0,
          projects: projectsCount || 0
        });
      } catch (error) {
        console.error("Error fetching stats", error);
      }
    };
    fetchStats();
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'} overflow-hidden font-sans`}>
      {/* Navigation */}
      <nav className={`flex items-center justify-between px-4 sm:px-6 py-4 md:px-12 border-b fixed top-0 w-full z-50 transition-colors duration-300 ${isDark ? 'border-white/5 bg-[#0a0a0a]/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight hidden sm:block">ProjectMonitor</span>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-800'}`}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link to="/login" className={`px-4 sm:px-5 py-2 text-sm font-medium border rounded-full transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-300 hover:bg-gray-100'}`}>
            Masuk
          </Link>
          <Link to="/register" className="px-4 sm:px-5 py-2 text-sm font-medium bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
            Daftar
          </Link>
        </div>
      </nav>

      {/* Hero Section with Container Scroll */}
      <div className="flex flex-col overflow-hidden pt-16 sm:pt-20">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center gap-4 mb-2 sm:mb-4 px-4">
              <span className={`px-4 py-1.5 text-xs font-semibold rounded-full border shadow-sm ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                Untuk mahasiswa dan dosen
              </span>
              <p className={`text-center text-base sm:text-lg md:text-xl font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Pantau project kuliah dari ide sampai selesai
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-center mb-4 sm:mb-6 leading-tight">
                Semua project, <br className="block sm:hidden" /><span className="text-blue-500">satu tempat</span>
              </h1>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Link to="/register" className="w-full sm:w-auto text-center px-8 py-3 text-sm font-bold bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                  Daftar
                </Link>
                <Link to="/login" className={`w-full sm:w-auto text-center px-8 py-3 text-sm font-bold border rounded-full transition-colors ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'}`}>
                  Masuk
                </Link>
              </div>
            </div>
          }
        >
          {/* Dashboard Preview Image */}
          <div className={`w-full h-full relative border rounded-xl sm:rounded-2xl overflow-hidden ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
              alt="Dashboard Preview"
              className={`w-full h-full object-cover ${isDark ? 'opacity-80' : 'opacity-100'}`}
              draggable={false}
            />
            {isDark && <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-60"></div>}
          </div>
        </ContainerScroll>
      </div>

      {/* Stats Section */}
      <section className={`py-12 sm:py-20 border-y relative transition-colors duration-300 ${isDark ? 'border-white/5 bg-[#0d0d0d]' : 'border-gray-200 bg-gray-100'}`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-center items-center gap-8 md:gap-32">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold mb-1 sm:mb-2 text-blue-500">{stats.users}</div>
            <div className={`font-medium text-sm sm:text-base ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Pengguna</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold mb-1 sm:mb-2 text-blue-500">{stats.projects}</div>
            <div className={`font-medium text-sm sm:text-base ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Project</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold mb-1 sm:mb-2 text-blue-500">{stats.dosen}</div>
            <div className={`font-medium text-sm sm:text-base ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Dosen</div>
          </div>
        </div>
      </section>

      {/* Cara Kerja */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-16 tracking-tight">Cara kerja</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 ${isDark ? 'border-white/5 bg-gradient-to-b from-[#151515] to-[#0a0a0a] hover:border-blue-500/30' : 'border-gray-200 bg-white hover:border-blue-400 shadow-sm hover:shadow-md'}`}>
            <span className="text-blue-500 text-xs sm:text-sm font-semibold mb-2 sm:mb-3 block">Langkah 1</span>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Daftar akun</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pilih peran sebagai mahasiswa atau dosen. Buat profilmu dan mulai eksplorasi fitur ProjectMonitor.</p>
          </div>
          <div className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 ${isDark ? 'border-white/5 bg-gradient-to-b from-[#151515] to-[#0a0a0a] hover:border-blue-500/30' : 'border-gray-200 bg-white hover:border-blue-400 shadow-sm hover:shadow-md'}`}>
            <span className="text-blue-500 text-xs sm:text-sm font-semibold mb-2 sm:mb-3 block">Langkah 2</span>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Buat project</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tambah anggota tim, buat checklist task, dan unggah file referensi atau dokumen tugas.</p>
          </div>
          <div className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 ${isDark ? 'border-white/5 bg-gradient-to-b from-[#151515] to-[#0a0a0a] hover:border-blue-500/30' : 'border-gray-200 bg-white hover:border-blue-400 shadow-sm hover:shadow-md'}`}>
            <span className="text-blue-500 text-xs sm:text-sm font-semibold mb-2 sm:mb-3 block">Langkah 3</span>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Pantau progres</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Progres terhitung otomatis dari task yang selesai. Dosen dapat memberikan komentar pada tiap task.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8">
          <div className={`flex flex-col items-center justify-center p-4 sm:p-8 border rounded-[1.5rem] sm:rounded-[2rem] transition-colors group ${isDark ? 'border-white/5 bg-[#111] hover:bg-[#151515]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <CheckSquare className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
            <span className={`text-xs sm:text-sm font-medium text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Manajemen project</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-4 sm:p-8 border rounded-[1.5rem] sm:rounded-[2rem] transition-colors group ${isDark ? 'border-white/5 bg-[#111] hover:bg-[#151515]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
            <span className={`text-xs sm:text-sm font-medium text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Kolaborasi tim</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-4 sm:p-8 border rounded-[1.5rem] sm:rounded-[2rem] transition-colors group ${isDark ? 'border-white/5 bg-[#111] hover:bg-[#151515]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <LineChart className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
            <span className={`text-xs sm:text-sm font-medium text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Pantau progres</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-4 sm:p-8 border rounded-[1.5rem] sm:rounded-[2rem] transition-colors group ${isDark ? 'border-white/5 bg-[#111] hover:bg-[#151515]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
            <span className={`text-xs sm:text-sm font-medium text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Eksplorasi ide</span>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-16 sm:py-24 relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]' : 'bg-gradient-to-b from-gray-50 to-gray-100'}`}>
        <div className="container z-10 mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-10 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center">
              Kata mereka tentang ProjectMonitor
            </h2>
          </motion.div>

          <div className={`flex justify-center gap-4 sm:gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[500px] sm:max-h-[740px] overflow-hidden`}>
            <TestimonialsColumn testimonials={firstColumn} duration={18} isDark={isDark} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden sm:block" duration={22} isDark={isDark} />
            <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={19} isDark={isDark} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-blue-500/5"></div>
        <div className={`max-w-4xl mx-auto rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden transition-colors duration-300 shadow-[0_0_50px_rgba(59,130,246,0.15)] ${isDark ? 'bg-gradient-to-br from-blue-600 to-blue-400' : 'bg-gradient-to-br from-blue-500 to-blue-400'}`}>
          <h2 className={`text-2xl sm:text-3xl md:text-5xl font-bold mb-8 sm:mb-10 tracking-tight ${isDark ? 'text-white' : 'text-white'}`}>Mulai project pertamamu hari ini</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 relative z-10 w-full sm:w-auto">
            <Link to="/register" className={`w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-sm font-bold rounded-full transition-colors shadow-xl ${isDark ? 'bg-[#111] text-white hover:bg-black' : 'bg-white text-blue-600 hover:bg-gray-50'}`}>
              Daftar Sekarang
            </Link>
            <Link to="/login" className={`w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-sm font-bold border-2 rounded-full transition-colors ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-white text-white hover:bg-white/10'}`}>
              Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-10 sm:py-12 px-4 sm:px-6 transition-colors duration-300 ${isDark ? 'border-white/10 bg-[#050505]' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className={`flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="font-medium">Dibuat oleh</span>
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-colors ${isDark ? 'border-white/10 bg-[#111] hover:border-white/20' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                AM
              </div>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Ahmad Maulana</span>
              <div className={`flex items-center gap-3 ml-2 pl-3 border-l ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <a href="#" className={`text-xs font-bold transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-blue-500'}`}>IG</a>
                <a href="#" className={`text-xs font-bold transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-blue-500'}`}>IN</a>
                <a href="#" className={`text-xs font-bold transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-blue-500'}`}>GH</a>
              </div>
            </div>
          </div>
          <div className={`text-xs sm:text-sm font-medium text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            © 2026 ProjectMonitor. Platform pemantauan project mahasiswa.
          </div>
        </div>
      </footer>
    </div>
  );
}
