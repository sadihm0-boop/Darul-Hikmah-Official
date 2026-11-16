import React from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';

const Founder: React.FC = () => {
  return (
    <div className="relative min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">

      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/bg-baria.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* ULTRA-PREMIUM DARK OVERLAY */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#020b04]/90 via-[#051708]/85 to-[#020b04]/95" />

      {/* MAIN CONTAINER */}
      <div className="relative z-10 max-w-7xl mx-auto">

        {/* LUXURY GLASS BOX WRAPPER */}
        <div className="
          bg-[#001a00]/40
          backdrop-blur-2xl
          border
          border-[#d4af37]/20
          rounded-[2rem]
          p-8 sm:p-12 lg:p-16
          shadow-2xl
          shadow-black/40
        ">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* IMAGE COLUMN */}
            <div className="lg:col-span-5">
              <div className="
                rounded-2xl
                overflow-hidden
                border-2
                border-[#d4af37]/40
                aspect-[4/5]
                shadow-2xl
                shadow-black/50
                bg-[#020b04]
              ">
                <img
                  src="/new-founder.png"
                  alt="Founder"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            {/* TEXT COLUMN */}
            <div className="lg:col-span-7 space-y-8">

              <div>
                <h3 className="text-[#d4af37] font-bold uppercase tracking-[0.25em] text-xs mb-3">
                  Founding Director
                </h3>

                <h1 className="text-4xl sm:text-5xl font-black text-[#f8f5e4] leading-tight">
                  Abul Masakin Mufti Sayyed
                  <br />
                  <span className="bg-gradient-to-r from-[#ffd700] via-[#fff4b0] to-[#d4af37] bg-clip-text text-transparent">
                    Saiful Islam Bari
                  </span>
                </h1>
              </div>

              <div className="w-20 h-1 bg-gradient-to-r from-[#ffd700] to-[#b8860b] rounded-full" />

              <p className="text-xl text-[#f5f5dc] italic leading-relaxed border-l-4 border-[#d4af37] pl-6 font-serif">
                "A distinguished scholar of Islamic sciences with decades of teaching, research, and spiritual mentorship."
              </p>

              {/* SKILLS TAGS - Updated to Premium Dark/Gold Theme */}
              <div className="flex flex-wrap gap-3 pt-2">
                {[
                  'Fiqh',
                  'Quran',
                  'Hadith',
                  'Tafsir',
                  'Usul al-Fiqh',
                  'Arabic Grammar',
                  'Islamic History'
                ].map((skill) => (
                  <span
                    key={skill}
                    className="
                      px-5
                      py-2
                      rounded-full
                      border
                      border-[#d4af37]/30
                      bg-[#020b04]
                      text-[#f8f5e4]
                      text-sm
                      font-medium
                      hover:border-[#ffd700]
                      hover:bg-[#051708]
                      transition-all
                      duration-300
                      cursor-default
                      shadow-md
                    "
                  >
                    {skill}
                  </span>
                ))}
              </div>

            </div>
          </div>

          {/* BOTTOM GRID */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-[#d4af37]/20 pt-16">

            {/* BIOGRAPHY SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {/* Micro Icon Container */}
                <div className="p-2.5 rounded-xl bg-[#020b04] border-2 border-[#d4af37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)] flex items-center justify-center shrink-0 w-11 h-11">
                  <BookOpen className="w-5 h-5 text-[#ffd700]" />
                </div>
                <h2 className="text-2xl font-black text-[#fff4b0] tracking-tight">
                  Biography
                </h2>
              </div>

              <p className="text-[#f5f5dc] leading-relaxed text-lg">
                A lifelong seeker of knowledge, the founder studied extensively under renowned classical scholars of our era and has dedicated his life to preserving authentic Islamic teachings through meticulous scholastic inquiry.
              </p>
            </div>

            {/* VISION SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {/* Micro Icon Container */}
                <div className="p-2.5 rounded-xl bg-[#020b04] border-2 border-[#d4af37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)] flex items-center justify-center shrink-0 w-11 h-11">
                  <GraduationCap className="w-5 h-5 text-[#ffd700]" />
                </div>
                <h2 className="text-2xl font-black text-[#fff4b0] tracking-tight">
                  Vision
                </h2>
              </div>

              <p className="text-[#f5f5dc] leading-relaxed text-lg">
                To bridge classical Islamic scholarship with modern global challenges, cultivating generation after generation of well-grounded scholars equipped with both intellectual depth and contemporary relevance.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Founder;