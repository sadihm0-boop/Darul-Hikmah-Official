import React from 'react';
import { Video, Play, MessageCircle, Send } from 'lucide-react';
import { siteData } from '../data';
import { theme } from '../theme';

const YouTubeCTA: React.FC = () => {
  return (
    <div className="relative overflow-hidden py-24">

      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/cta-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 z-0 bg-[#001100]/80" />

      {/* GOLD TOUCH BACKGROUND GLOWS */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ffd700]/10 rounded-full blur-[140px] opacity-60 z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#d4af37]/5 rounded-full blur-[140px] opacity-60 z-0 pointer-events-none" />

      <div className={`${theme.sectionContainer} relative z-10`}>

        {/* GLASS PANEL */}
        <div className="
          relative
          overflow-hidden
          rounded-[2rem]
          border-2
          border-[#d4af37]/30
          bg-[#020b04]/75
          backdrop-blur-2xl
          p-16
          text-center
          shadow-2xl
          shadow-black/50
        ">

          {/* TOP FLASHING ICON CONTAINER - Black center, Gold border, Gold icon */}
          <div
            className="
              w-20 
              h-20 
              rounded-2xl 
              flex 
              items-center 
              justify-center 
              mx-auto 
              mb-10 
              bg-[#020b04] 
              border-2 
              border-[#d4af37] 
              shadow-[0_0_20px_rgba(212,175,55,0.2)]
            "
          >
            <Video className="w-10 h-10 text-[#ffd700] animate-pulse" />
          </div>

          {/* TITLE - Updated to premium gold gradient */}
          <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tight">
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
              Connect With Us
            </span>
          </h2>

          {/* DESCRIPTION */}
          <p className="text-lg md:text-xl text-[#f5f5dc] max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
            Experience our teaching methodology firsthand. Watch free lessons on YouTube and join our Telegram & WhatsApp channels for updates.
          </p>

          {/* BUTTONS WITH CLICK FIX */}
          <div className="flex flex-wrap justify-center gap-6">

            {/* YOUTUBE */}
            <a
              href={siteData.youtubeUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="
                bg-red-600
                hover:bg-red-700
                text-white
                rounded-full
                px-8
                py-4
                font-bold
                inline-flex
                items-center
                gap-3
                shadow-lg
                shadow-red-950/40
                hover:scale-105
                transition-all
                duration-300
                outline-none
                focus:outline-none
                [-webkit-tap-highlight-color:transparent]
              "
            >
              <Play className="w-6 h-6 fill-current" />
              YouTube
            </a>

            {/* TELEGRAM */}
            <a
              href="https://t.me/darulhikmah899"
              target="_blank"
              rel="noopener noreferrer"
              className="
                bg-[#0088cc]
                hover:bg-[#007ab8]
                text-white
                rounded-full
                px-8
                py-4
                font-bold
                inline-flex
                items-center
                gap-3
                shadow-lg
                shadow-blue-950/40
                hover:scale-105
                transition-all
                duration-300
                outline-none
                focus:outline-none
                [-webkit-tap-highlight-color:transparent]
              "
            >
              <Send className="w-6 h-6" />
              Telegram
            </a>

            {/* WHATSAPP */}
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="
                bg-[#25D366]
                hover:bg-[#20bd5a]
                text-white
                rounded-full
                px-8
                py-4
                font-bold
                inline-flex
                items-center
                gap-3
                shadow-lg
                shadow-green-950/40
                hover:scale-105
                transition-all
                duration-300
                outline-none
                focus:outline-none
                [-webkit-tap-highlight-color:transparent]
              "
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp
            </a>

          </div>

        </div>
      </div>
    </div>
  );
};

export default YouTubeCTA;