import React from 'react';
import { motion } from 'framer-motion';
import { siteData } from '../data';
import { CheckCircle2 } from 'lucide-react';
import { theme } from '../theme';

const About: React.FC = () => {
  return (
    <section
      id="about"
      className={`${theme.sectionContainer} relative overflow-hidden`}
    >

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#ffd700]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#008000]/10 blur-[120px] rounded-full" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
        >

          {/* SECTION LABEL */}
          <div
            className="
              inline-block
              px-5
              py-2
              mb-6
              rounded-full
              border
              border-[#d4af37]/25
              bg-[#008000]/15
              backdrop-blur-xl
              text-[#ffd700]
              text-xs
              uppercase
              tracking-[0.3em]
              font-bold
            "
          >
            About Our Institution
          </div>

          {/* TITLE - Updated to crisp white and gold */}
          <h2
            className="
              text-4xl
              md:text-5xl
              lg:text-6xl
              font-black
              leading-[1.15]
              mb-8
            "
          >
            <span className="text-[#f8f5e4]">
              Bridging Tradition
            </span>

            <br />

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
              with Modern Excellence
            </span>
          </h2>

          {/* DESCRIPTION */}
          <p
            className="
              text-lg
              md:text-xl
              text-[#f5f5dc]
              leading-relaxed
              mb-12
              max-w-2xl
            "
          >
            {siteData.aboutOverview}
          </p>

          {/* FEATURES - Updated to Dark Emerald & Gold Theme */}
          <div className="space-y-6">

            {[
              "Authentic Chain of Transmission",
              "Dual Learning Modes (Online/Offline)",
              "Expert Faculty with Traditional Ijazah",
            ].map((item) => (
              <motion.div
                key={item}
                whileHover={{ x: 8 }}
                className="
                  flex
                  items-center
                  gap-5
                  rounded-2xl
                  border
                  border-[#d4af37]/20
                  bg-[#001a00]/40
                  backdrop-blur-xl
                  px-6
                  py-5
                  transition-all
                  duration-300
                  hover:border-[#ffd700]/50
                  hover:bg-[#020b04]/60
                  shadow-lg
                  shadow-black/20
                "
              >

                {/* ICON CONTAINER - Black center, Gold border, Gold icon */}
                <div
                  className="
                    p-2.5
                    rounded-xl
                    bg-[#020b04]
                    border-2
                    border-[#d4af37]/50
                    shadow-[0_0_10px_rgba(212,175,55,0.15)]
                  "
                >
                  <CheckCircle2 className="w-5 h-5 text-[#ffd700]" />
                </div>

                <span
                  className="
                    text-[#f8f5e4]
                    font-semibold
                    text-lg
                  "
                >
                  {item}
                </span>

              </motion.div>
            ))}

          </div>
        </motion.div>

        {/* RIGHT IMAGE SECTION */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="relative"
        >

          {/* IMAGE GLOW */}
          <div
            className="
              absolute
              -inset-2
              rounded-[2rem]
              bg-gradient-to-r
              from-[#ffd700]/30
              via-[#008000]/20
              to-[#ffd700]/30
              blur-2xl
              opacity-70
            "
          />

          {/* IMAGE CARD */}
          <div
            className="
              relative
              aspect-[4/5]
              rounded-[2rem]
              overflow-hidden
              border
              border-[#d4af37]/20
              bg-[#001100]/40
              backdrop-blur-2xl
              p-3
              shadow-2xl
              shadow-[#008000]/20
            "
          >

            <img
              src="/about.png"
              alt="Traditional Learning Environment"
              className="
                w-full
                h-full
                object-cover
                rounded-[1.5rem]
                hover:scale-105
                transition-all
                duration-[4000ms]
              "
            />

          </div>

          {/* FLOATING STATS CARD - Updated to Black/Gold Theme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="
              absolute
              -bottom-8
              -left-8
              hidden
              md:block
              rounded-2xl
              border-2
              border-[#d4af37]/50
              bg-[#020b04]/95
              backdrop-blur-2xl
              px-10
              py-8
              shadow-2xl
              shadow-[#ffd700]/20
            "
          >

            <div
              className="
                text-5xl
                font-black
                mb-2
                bg-gradient-to-r
                from-[#ffd700]
                to-[#fff4b0]
                bg-clip-text
                text-transparent
              "
            >
              98%
            </div>

            <div
              className="
                text-xs
                uppercase
                tracking-[0.3em]
                text-[#d4af37]
                font-bold
              "
            >
              Completion Rate
            </div>

          </motion.div>

        </motion.div>

      </div>
    </section>
  );
};

export default About;