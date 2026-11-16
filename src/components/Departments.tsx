import React from 'react';
import { motion } from 'framer-motion';
import { siteData } from '../data';
import { theme } from '../theme';

const Departments: React.FC = () => {
  return (
    <section
      className={`${theme.sectionContainer} relative overflow-hidden`}
    >

      {/* BACKGROUND GLOW - Updated to Golden Touch */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#d4af37]/20 blur-[140px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ffd700]/15 blur-[140px] rounded-full" />

      <div className="relative z-10">

        {/* HEADER */}
        <div className="text-center mb-24">

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
            Academic Departments
          </div>

          <h2
            className="
              text-4xl
              md:text-6xl
              font-black
              mb-8
            "
          >
            <span className="text-white">
              Departmental
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
              Excellence
            </span>
          </h2>

          <p
            className="
              max-w-3xl
              mx-auto
              text-lg
              md:text-xl
              text-[#f5f5dc]
              leading-relaxed
            "
          >
            Our specialized departments ensure focused mastery
            in every branch of Islamic sciences.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {siteData.departments.map((dept, index) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              whileHover={{ y: -10 }}
              className="
                group
                relative
                overflow-hidden
                rounded-[2rem]
                border
                border-[#d4af37]/15
                bg-[#001a00]/40
                backdrop-blur-2xl
                p-10
                shadow-2xl
                shadow-[#008000]/10
                hover:border-[#ffd700]/40
                transition-all
                duration-500
                outline-none 
                focus:outline-none 
                active:outline-none
                [-webkit-tap-highlight-color:transparent]
              "
            >

              {/* HOVER GLOW */}
              <div
                className="
                  absolute
                  inset-0
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity
                  duration-500
                  bg-gradient-to-br
                  from-[#ffd700]/5
                  to-[#d4af37]/10
                "
              />

              {/* FLEX ROW: ICON CONTAINER + ARABIC TEXT */}
              <div className="flex items-center justify-between mb-8 gap-4">

                {/* ICON CONTAINER */}
                <div
                  className="
                    relative
                    w-20
                    h-20
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    bg-[#020b04]
                    border-2
                    border-[#d4af37]/50
                    shadow-[0_0_15px_rgba(212,175,55,0.15)]
                    group-hover:scale-110
                    group-hover:shadow-[0_0_25px_rgba(212,175,55,0.35)]
                    group-hover:border-[#ffd700]
                    transition-all
                    duration-500
                    shrink-0
                  "
                >
                  <dept.icon className="w-10 h-10 text-[#ffd700]" />
                </div>

                {/* NEW: ARABIC SUBJECT NAME */}
                {dept.arabic && (
                  <span
                    className="
                      font-serif 
                      text-2xl 
                      md:text-3xl 
                      font-bold 
                      text-right 
                      bg-gradient-to-l 
                      from-[#ffd700] 
                      to-[#fff4b0] 
                      bg-clip-text 
                      text-transparent
                      drop-shadow-[0_2px_8px_rgba(212,175,55,0.2)]
                      select-none
                    "
                    dir="rtl"
                  >
                    {dept.arabic}
                  </span>
                )}

              </div>

              {/* TITLE */}
              <h3
                className="
                  relative
                  text-2xl
                  font-black
                  text-[#fff4b0]
                  mb-5
                "
              >
                {dept.name}
              </h3>

              {/* DESCRIPTION */}
              <p
                className="
                  relative
                  text-[#f5f5dc]
                  leading-relaxed
                  text-lg
                "
              >
                {dept.description}
              </p>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default Departments;