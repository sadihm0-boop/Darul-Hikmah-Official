import React from 'react';
import {
  BookOpen,
  Mail,
  MapPin,
  Phone,
  Globe,
  MessageCircle,
  Send
} from 'lucide-react';

import { theme } from '../theme';

const Footer: React.FC = () => {
  return (
    <footer
      className="
        relative
        overflow-hidden
        pt-32
        pb-12
        border-t
        border-[#d4af37]/20
        bg-[#020b04]
        backdrop-blur-2xl
      "
    >

      {/* TOP GLOW LINE */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#ffd700]/40 to-transparent" />

      {/* BACKGROUND GLOWS - Golden Touch */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#d4af37]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#ffd700]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className={`${theme.sectionContainer} relative z-10`}>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">

          {/* BRAND COL */}
          <div className="space-y-8">

            <div className="flex items-center gap-4">
              {/* BRAND LOGO CONTAINER - Black center, Gold border, Gold icon */}
              <div
                className="
                  w-14
                  h-14
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  bg-[#020b04]
                  border-2
                  border-[#d4af37]/50
                  shadow-[0_0_15px_rgba(212,175,55,0.15)]
                "
              >
                <BookOpen className="w-7 h-7 text-[#ffd700]" />
              </div>

              <div>
                <h3 className="font-serif text-3xl font-black text-[#ffd700] tracking-tight">
                  Darul Hikmah
                </h3>
                <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37] mt-1 font-bold">
                  Islamic Institute
                </p>
              </div>
            </div>

            <p
              className="
                text-[#f5f5dc]
                leading-relaxed
                italic
                text-lg
              "
            >
              “Al-Ilmu Nurun”
              <br />
              <span
                className="
                  text-[#d4af37]
                  text-xs
                  uppercase
                  tracking-[0.3em]
                  not-italic
                  font-bold
                "
              >
                Knowledge is Light
              </span>
            </p>

            {/* SOCIAL ICONS - Updated to Black/Gold with Click fixes */}
            <div className="flex gap-4">
              {[Globe, MessageCircle, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="
                    w-12
                    h-12
                    rounded-xl
                    border
                    border-[#d4af37]/30
                    bg-[#020b04]
                    backdrop-blur-xl
                    flex
                    items-center
                    justify-center
                    text-[#ffd700]
                    shadow-[0_0_10px_rgba(212,175,55,0.05)]
                    hover:bg-[#020b04]/80
                    hover:border-[#ffd700]
                    hover:scale-110
                    hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]
                    transition-all
                    duration-300
                    outline-none
                    focus:outline-none
                    [-webkit-tap-highlight-color:transparent]
                  "
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4
              className="
                text-[#ffd700]
                font-black
                mb-8
                uppercase
                tracking-[0.3em]
                text-xs
                border-l-2
                border-[#d4af37]
                pl-4
              "
            >
              Quick Links
            </h4>

            <ul className="space-y-5">
              {[
                'Home',
                'About Us',
                'Courses',
                'Founder',
                'Enrollment'
              ].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(' ', '')}`}
                    className="
                      text-[#f5f5dc]
                      hover:text-[#ffd700]
                      transition-all
                      duration-300
                      outline-none
                      [-webkit-tap-highlight-color:transparent]
                    "
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* DEPARTMENTS */}
          <div>
            <h4
              className="
                text-[#ffd700]
                font-black
                mb-8
                uppercase
                tracking-[0.3em]
                text-xs
                border-l-2
                border-[#d4af37]
                pl-4
              "
            >
              Departments
            </h4>

            <ul className="space-y-5">
              {[
                'Quranic Sciences',
                'Hadith Studies',
                'Jurisprudence',
                'Theology',
                'History'
              ].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="
                      text-[#f5f5dc]
                      hover:text-[#ffd700]
                      transition-all
                      duration-300
                      outline-none
                      [-webkit-tap-highlight-color:transparent]
                    "
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div>
            <h4
              className="
                text-[#ffd700]
                font-black
                mb-8
                uppercase
                tracking-[0.3em]
                text-xs
                border-l-2
                border-[#d4af37]
                pl-4
              "
            >
              Contact Info
            </h4>

            <ul className="space-y-6 text-[#f5f5dc]">
              <li className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-[#ffd700] shrink-0" />
                <span>
                  123 Academic Way, Scholars District
                  <br />
                  Dhaka, Bangladesh
                </span>
              </li>

              <li className="flex items-center gap-4">
                <Phone className="w-6 h-6 text-[#ffd700] shrink-0" />
                <span>+880 1234 567890</span>
              </li>

              <li className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-[#ffd700] shrink-0" />
                <span>contact@darulhikmah.edu</span>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div
          className="
            pt-10
            border-t
            border-[#d4af37]/10
            flex
            flex-col
            md:flex-row
            items-center
            justify-between
            gap-6
            text-xs
            uppercase
            tracking-[0.25em]
            text-[#d4af37]
          "
        >
          <p>
            © {new Date().getFullYear()} Darul Hikmah Institute.
            All Rights Reserved.
          </p>

          <div className="flex gap-8">
            <a
              href="#"
              className="hover:text-[#ffd700] transition-colors outline-none [-webkit-tap-highlight-color:transparent]"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-[#ffd700] transition-colors outline-none [-webkit-tap-highlight-color:transparent]"
            >
              Terms of Service
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;