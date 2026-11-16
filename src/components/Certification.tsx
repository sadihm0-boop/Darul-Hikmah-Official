import React from 'react';
import { motion } from 'framer-motion';
import { siteData } from '../data';
import { ShieldCheck } from 'lucide-react';
import { theme } from '../theme';

const Certification: React.FC = () => {
  return (
    <section id="enrollment" className="py-32 relative overflow-hidden">

      {/* BACKGROUND GLOW - Updated to Gold & Green */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#d4af37]/10 blur-[140px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#008000]/10 blur-[140px] rounded-full -z-10 pointer-events-none" />

      <div className={theme.sectionContainer}>

        {/* HEADER SECTION */}
        <div className="max-w-4xl mx-auto text-center mb-24">

          {/* TOP ICON - Black center, Gold border, Gold icon */}
          <div
            className="
              w-20 
              h-20 
              rounded-2xl 
              flex 
              items-center 
              justify-center 
              mx-auto 
              mb-8 
              bg-[#020b04] 
              border-2 
              border-[#d4af37]/50 
              shadow-[0_0_20px_rgba(212,175,55,0.15)]
            "
          >
            <ShieldCheck className="w-10 h-10 text-[#ffd700]" />
          </div>

          {/* TITLE */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 tracking-tight">
            <span className="text-[#f8f5e4]">Traditional </span>
            <span
              className="
                bg-gradient-to-r 
                from-[#ffd700] 
                via-[#fff4b0] 
                to-[#d4af37] 
                bg-clip-text 
                text-transparent
              "
            >
              Certification
            </span>
          </h2>

          {/* SUBTITLE */}
          <p className="text-lg md:text-xl text-[#f5f5dc] leading-relaxed max-w-3xl mx-auto">
            Our certification process adheres to the classical <span className="text-[#ffd700] font-bold">Sanad</span> and <span className="text-[#ffd700] font-bold">Ijazah</span> systems, ensuring your credentials are part of an unbroken chain of transmission.
          </p>
        </div>

        {/* TIMELINE SECTION */}
        <div className="relative">

          {/* Vertical Line for Desktop - Updated to golden gradient */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#d4af37]/30 to-transparent hidden lg:block -translate-x-1/2" />

          <div className="space-y-20">
            {siteData.certificationSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 === 0 ? '' : 'lg:flex-row-reverse'}`}
              >

                {/* LEFT SIDE CONTENT */}
                <div className="flex-1 w-full lg:text-right">
                  {index % 2 === 0 && (
                    <div
                      className="
                        rounded-[2rem] 
                        border 
                        border-[#d4af37]/15 
                        bg-[#001a00]/40 
                        backdrop-blur-2xl 
                        p-8 
                        shadow-2xl 
                        shadow-[#008000]/10 
                        transition-all 
                        duration-500 
                        hover:border-[#ffd700]/40 
                        hover:shadow-[#ffd700]/10 
                        group
                      "
                    >
                      <h3 className="text-2xl font-black text-[#fff4b0] mb-3 group-hover:text-[#ffd700] transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-[#f5f5dc] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* CENTER NUMBER NODE - Updated to Black/Gold */}
                <div
                  className="
                    relative 
                    z-10 
                    w-16 
                    h-16 
                    rounded-2xl 
                    flex 
                    items-center 
                    justify-center 
                    bg-[#020b04] 
                    border-2 
                    border-[#d4af37]/50 
                    text-[#ffd700] 
                    font-black 
                    text-2xl 
                    shadow-[0_0_15px_rgba(212,175,55,0.2)] 
                    ring-4 
                    ring-[#051305]
                  "
                >
                  {index + 1}
                </div>

                {/* RIGHT SIDE CONTENT */}
                <div className="flex-1 w-full text-left">
                  {index % 2 !== 0 && (
                    <div
                      className="
                        rounded-[2rem] 
                        border 
                        border-[#d4af37]/15 
                        bg-[#001a00]/40 
                        backdrop-blur-2xl 
                        p-8 
                        shadow-2xl 
                        shadow-[#008000]/10 
                        transition-all 
                        duration-500 
                        hover:border-[#ffd700]/40 
                        hover:shadow-[#ffd700]/10 
                        group
                      "
                    >
                      <h3 className="text-2xl font-black text-[#fff4b0] mb-3 group-hover:text-[#ffd700] transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-[#f5f5dc] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  )}
                </div>

              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Certification;