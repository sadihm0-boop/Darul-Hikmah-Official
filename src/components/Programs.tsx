import React from 'react';
import { motion } from 'framer-motion';
import { siteData } from '../data';
import { ArrowRight } from 'lucide-react';
import { theme } from '../theme';

const Programs: React.FC = () => {
  return (
    <section
      id="courses"
      className="relative py-32 overflow-hidden"
    >

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#d4af37]/15 blur-[140px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ffd700]/10 blur-[140px] rounded-full" />

      <div className={theme.sectionContainer}>

        {/* SECTION HEADER */}
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
            Our Educational Programs
          </div>

          <h2
            className="
              text-4xl
              md:text-6xl
              font-black
              mb-8
              leading-tight
            "
          >
            <span className="text-[#f8f5e4]">
              Educational
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
              Curriculum
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
            From foundational basics to advanced scholarly depth,
            explore our structured programs rooted in authentic
            Islamic tradition and modern educational excellence.
          </p>
        </div>

        {/* COURSE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {siteData.courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
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
                shadow-2xl
                shadow-[#008000]/10
                transition-all
                duration-500
                hover:border-[#ffd700]/40
                hover:shadow-[#ffd700]/10
                outline-none 
                focus:outline-none 
                active:outline-none
                [-webkit-tap-highlight-color:transparent]
              "
            >

              {/* GOLD GLOW */}
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
                  via-transparent
                  to-[#d4af37]/10
                "
              />

              {/* IMAGE */}
              <div className="relative h-60 overflow-hidden p-4">

                <img
                  src={course.image}
                  alt={course.title}
                  className="
                    w-full
                    h-full
                    object-cover
                    rounded-2xl
                    border
                    border-[#d4af37]/20
                    transition-all
                    duration-[4000ms]
                    group-hover:scale-110
                  "
                />

                {/* LEVEL BADGE - Updated to match theme */}
                <div
                  className="
                    absolute
                    top-8
                    right-8
                    px-4
                    py-2
                    rounded-full
                    bg-[#020b04]/85
                    backdrop-blur-xl
                    border
                    border-[#d4af37]/40
                    text-[#ffd700]
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.3em]
                    shadow-lg
                  "
                >
                  {course.level}
                </div>

              </div>

              {/* CONTENT */}
              <div className="relative p-8 flex flex-col h-full">

                {/* ICON CONTAINER - Black center, Gold border, Gold icon */}
                <div
                  className="
                    w-16
                    h-16
                    rounded-2xl
                    mb-6
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
                  "
                >
                  <course.icon className="w-8 h-8 text-[#ffd700]" />
                </div>

                {/* TITLE */}
                <h3
                  className="
                    text-2xl
                    font-black
                    text-[#fff4b0]
                    mb-4
                  "
                >
                  {course.title}
                </h3>

                {/* DESCRIPTION */}
                <p
                  className="
                    text-[#f5f5dc]
                    leading-relaxed
                    mb-8
                    flex-1
                  "
                >
                  {course.description}
                </p>

                {/* FOOTER */}
                <div
                  className="
                    pt-6
                    border-t
                    border-[#d4af37]/20
                    flex
                    items-center
                    justify-between
                  "
                >

                  <span
                    className="
                      text-xs
                      uppercase
                      tracking-[0.3em]
                      text-[#d4af37]
                      font-bold
                    "
                  >
                    {course.duration}
                  </span>

                  <button
                    className="
                      flex
                      items-center
                      gap-2
                      text-[#ffd700]
                      font-semibold
                      uppercase
                      tracking-[0.15em]
                      text-sm
                      group-hover:gap-4
                      transition-all
                      duration-300
                    "
                  >
                    Details
                    <ArrowRight className="w-4 h-4" />
                  </button>

                </div>
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default Programs;