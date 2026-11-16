import React from 'react';
import { motion } from 'framer-motion';
import { siteData } from '../data';
import { theme } from '../theme';

const Hero: React.FC = () => {
  return (
    <section 
      id="home" 
      className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-cover bg-center bg-no-repeat bg-blend-overlay bg-slate-950/70"
      style={{ backgroundImage: "url('/library-bg.jpg')" }}
    >
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className={`inline-block px-5 py-2 mb-8 text-xs font-black tracking-[0.25em] text-indigo-300 uppercase ${theme.glassPanel.replace('rounded-2xl', 'rounded-full')} border-white/5`}>
            Est. {siteData.foundationYear} | Academy of Classical Sciences
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-8 leading-[1.05] tracking-tight">
            Unveiling the <br />
            <span className={`text-indigo-400 ${theme.textGradient}`}>Treasures of Wisdom</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-300 mb-14 leading-relaxed font-medium">
            {siteData.missionStatement}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-6 mb-24"
        >
          <a href="#courses" className={`${theme.btnGold} px-12 py-5 text-lg shadow-[0_0_30px_rgba(214,158,46,0.15)]`}>
            Explore Curriculum
          </a>
          <a href="#about" className={`${theme.btnGlass} px-12 py-5 text-lg`}>
            Our Philosophy
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto max-w-6xl rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-900/40 mb-14"
        >
          <img src="/way to hikmah.jpg" alt="Hero illustration" className="w-full h-auto object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 py-14 border-y border-white/5 bg-white/2 backdrop-blur-sm rounded-3xl"
        >
          <div className="text-center px-4 border-r border-white/5">
            <div className="text-4xl font-black text-white mb-2">500+</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-[0.2em]">Sanad Awarded</div>
          </div>
          <div className="text-center px-4 md:border-r border-white/5">
            <div className="text-4xl font-black text-white mb-2">24/7</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-[0.2em]">Global Support</div>
          </div>
          <div className="text-center px-4 border-r border-white/5">
            <div className="text-4xl font-black text-white mb-2">100%</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-[0.2em]">Verified Ijazah</div>
          </div>
          <div className="text-center px-4">
            <div className="text-4xl font-black text-white mb-2">{siteData.foundationYear}</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-[0.2em]">Year Established</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
