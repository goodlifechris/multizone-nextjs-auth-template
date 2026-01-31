"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, Search, ArrowRight, Store, TrendingUp, Sparkles, User, LogOut } from 'lucide-react';
import { signOut, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Local interfaces to avoid type conflicts
interface SafeUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface LandingProps {
  session?: {
    user?: SafeUser;
    expires?: string;
  } | null;
}

interface Job {
  id: number;
  title: string;
  tenant: string;
  location: string;
  salary: string;
  tag: string;
  category: string;
}

const Landing: React.FC<LandingProps> = ({ session }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Safe user access helper
  const user: SafeUser | null = session?.user || null;
  
  const tenantJobs: Job[] = [
    { id: 1, title: "Sales Representative", tenant: "Umoja Electronics", location: "Nairobi, CBD", salary: "KES 2,000/day", tag: "Liquid Workforce", category: "Sales" },
    { id: 2, title: "Barista & Server", tenant: "Java Heights", location: "Westlands", salary: "Negotiable", tag: "Full-time", category: "Hospitality" },
    { id: 3, title: "Delivery Rider", tenant: "Kijiji Groceries", location: "Mombasa", salary: "KES 800/trip", tag: "Gig", category: "Logistics" },
    { id: 4, title: "Inventory Manager", tenant: "Pwani Wholesalers", location: "Kisumu", salary: "KES 40,000/mo", tag: "Contract", category: "Admin" },
  ];

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleSignIn = async () => {
    await signIn('google');
  };
  const handleDashboardNavigation = () => {
    const role = user?.role?.toLowerCase()
  
    if (role === 'admin' || role === 'super_admin') {
      window.location.href = '/admin'
    } else {
      window.location.href = '/user'
    }
  }

  // Helper function to get user's first name
  const getUserFirstName = () => {
    if (user?.name) {
      return user.name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Entrepreneur';
  };
 

  return (
    <div className="relative min-h-screen bg-slate-50 text-[#1f2937] font-sans overflow-hidden">
     



      {/* Background animation remains the same */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-orange-100 rounded-full blur-[100px] opacity-60"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -60, 0] 
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-20 w-[500px] h-[500px] bg-slate-200 rounded-full blur-[120px] opacity-40"
        />
      </div>

      <div className="relative z-10">
        {/* NAVBAR */}
        <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-100">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 bg-[#ea580c] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">Rely</span>
          </motion.div>
          <div className="hidden md:flex gap-8 font-semibold text-sm uppercase">
            {['Features', 'Marketplace', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[#ea580c] transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ea580c] transition-all group-hover:w-full" />
              </a>
            ))}
          </div>
     
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* User Profile Display */}
                <div className="flex items-center gap-2 text-sm font-medium">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name || 'User'} 
                      className="w-8 h-8 rounded-full border-2 border-orange-100"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-[#ea580c]" />
                    </div>
                  )}
                  <div className="hidden md:flex flex-col">
                    <span className="text-gray-700 font-medium">
                      {getUserFirstName()}
                    </span>
                    {user.role && (
                      <span className="text-xs text-gray-400 uppercase">
                        {user.role}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Sign Out Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="bg-[#ea580c] text-white px-4 py-2.5 rounded-xl font-bold hover:shadow-lg active:scale-95 transition shadow-md shadow-orange-200 flex items-center gap-2 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                className="bg-[#ea580c] text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg active:scale-95 transition shadow-md shadow-orange-200"
              >
                Sign In with Google
              </motion.button>
            )}
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="py-24 px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-orange-50 text-[#ea580c] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-orange-100"
          >
            <Sparkles className="w-3 h-3" />
            Built for the Kenyan Hustle
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black mb-8 leading-none tracking-tight"
          >
            {user ? (
              <>
                Welcome back, <br />
                <span className="text-[#ea580c]">{getUserFirstName()}!</span>
              </>
            ) : (
              <>
                Work Better. <br />
                <span className="text-[#ea580c]">Live Flourishing.</span>
              </>
            )}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto mb-12"
          >
            {user ? (
              `Ready to continue your journey? Explore new opportunities or manage your business seamlessly.`
            ) : (
              `The super app for SMEs. Automate your sales, manage your team, and find new 
              opportunities in our tenant-powered marketplace.`
            )}
          </motion.p>
          <div className="flex flex-wrap justify-center gap-4">
  {user ? (
    <>
      <motion.a
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        href={user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "SUPER_ADMIN"
          ? "/admin"
          : "/user"
        }
        className="bg-[#ea580c] text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-200 inline-block"
      >
        {user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "SUPER_ADMIN"
          ? "My Workspace"
          : user.role?.toUpperCase() === "USER"
          ? "User Dashboard"
          : "Go to Dashboard"}
      </motion.a>

      <motion.a
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        href="/marketplace"
        className="bg-transparent border-2 border-[#1f2937] px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 inline-block"
      >
        Explore Marketplace
      </motion.a>
    </>
  ) : (
    <>
      <motion.a
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        href="/signin"
        className="bg-[#ea580c] text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-200 inline-block"
      >
        Get Started
      </motion.a>

      <motion.a
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        href="/jobs"
        className="bg-transparent border-2 border-[#1f2937] px-10 py-5 rounded-2xl font-bold text-lg inline-block"
      >
        Find Jobs
      </motion.a>
    </>
  )}
</div>

        </section>

        {/* MARKETPLACE SECTION */}
        <section id="marketplace" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-black mb-2 flex items-center gap-3 justify-center md:justify-start">
                Marketplace <Store className="text-[#ea580c]" />
              </h2>
              <p className="text-gray-500">
                {user 
                  ? `Welcome back! Check out new opportunities matching your profile.`
                  : `Discover gigs and roles from Rely's verified business tenants.`
                }
              </p>
            </div>
            
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ea580c] transition-colors" />
              <input 
                type="text" 
                placeholder={user ? "Search recommended roles..." : "Search by role or city..."}
                className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-md border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#ea580c] transition-all shadow-sm"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <motion.div 
            variants={containerVars}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {tenantJobs.map((job) => (
              <motion.div 
                key={job.id}
                variants={itemVars}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 hover:shadow-2xl hover:shadow-orange-100 transition-all cursor-pointer group"
              >
                <div className="flex justify-between mb-6">
                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-orange-50 group-hover:text-[#ea580c] transition-colors">
                    <Briefcase />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 border border-gray-100 px-2 py-1 rounded-lg uppercase">{job.category}</span>
                </div>
                
                <h3 className="text-xl font-black mb-1 group-hover:text-[#ea580c] transition-colors">{job.title}</h3>
                <p className="text-gray-500 font-bold text-sm mb-6">@{job.tenant}</p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <MapPin className="w-4 h-4" /> {job.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Clock className="w-4 h-4" /> {job.tag}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-lg font-black">{job.salary}</span>
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="w-10 h-10 bg-[#1f2937] rounded-full flex items-center justify-center text-white"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      

        {/* CTA SECTION */}
        <section className="px-6 pb-20">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="max-w-7xl mx-auto bg-[#1f2937] rounded-[3rem] p-12 md:p-20 relative overflow-hidden text-white"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                {user 
                  ? `Ready to take the next step?` 
                  : `Ready to empower your community?`
                }
              </h2>
              <p className="text-gray-400 mb-10 max-w-xl">
                {user 
                  ? `Continue building prosperity with tools designed for Kenyan entrepreneurs.`
                  : `Join thousands of Kenyan entrepreneurs using Rely to break cycles and build prosperous futures.`
                }
              </p>
            
              <button 
                onClick={user ? handleDashboardNavigation : handleSignIn}
                className="bg-[#ea580c] text-white px-12 py-5 rounded-2xl font-black text-xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all"
              >
                {user 
                  ? (user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN' 
                    ? 'Admin Dashboard' 
                    : user.role?.toUpperCase() === 'USER' 
                    ? 'User Dashboard' 
                    : 'Go to Dashboard')
                  : 'Post Your First Job'
                }
              </button>

              <ul>
     
      </ul>
            </div>
            {/* Animated Glow */}
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-24 -right-24 w-96 h-96 bg-[#ea580c] rounded-full blur-[120px]" 
            />
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Landing;