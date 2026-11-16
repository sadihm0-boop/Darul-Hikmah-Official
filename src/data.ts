import { 
  Library, GraduationCap, Scroll, Book, PenTool, 
  History, Brain, Search, Globe, Atom, Telescope, 
  FlaskConical, Ruler, Settings, Cpu, RoadIcon, LibraryIcon, Quote 
} from 'lucide-react';

export interface Course {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  duration: string;
  icon: any;
  image: string;
}

export interface Department {
  id: string;
  name: string;
  arabic: string;
  description: string;
  icon: any;
}

export interface Faculty {
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  image: string;
}

export interface SiteData {
  instituteName: string;
  foundationYear: number;
  announcement: string;
  missionStatement: string;
  aboutOverview: string;
  courses: Course[];
  departments: Department[];
  founder: Faculty;
  certificationSteps: {
    title: string;
    description: string;
  }[];
  youtubeUrl: string;
}

export const siteData: SiteData = {
  instituteName: "Darul Hikmah",
  foundationYear: 2024,
  announcement: "Special Launch Announcements | Foundation Date: 2024",
  missionStatement: "Preserving the legacy of classical Islamic scholarship through rigorous academic inquiry and spiritual refinement.",
  aboutOverview: "Darul Hikmah is a premier Islamic educational institute dedicated to bridging the gap between traditional wisdom and contemporary challenges. We offer a comprehensive curriculum through both online and offline modes of learning, ensuring accessibility for seekers of knowledge worldwide.",
  courses: [
    {
      id: "way-to-hikmah",
      title: "Way to Hikmah",
      level: "Beginner",
      description: "A foundational course designed to introduce the basics of Islamic belief, practice, and character building.",
      duration: "lifetime",
      icon: RoadIcon,
      image: "/way to hikmah.jpg",
    },
    {
      id: "dars-e-aqaid",
      title: "Dars-e-Aqaid",
      level: "Intermediate",
      description: "An in-depth study of Islamic theology (Aqidah), exploring the core articles of faith with rational and textual evidences.",
      duration: "1 Year",
      icon: LibraryIcon,
      image: "/aqidah new image.jpg",
    },
    {
      id: "dars-e-hadith",
      title: "Dars-e-Hadith",
      level: "Advanced",
      description: "Rigorous analysis of Prophetic traditions, focusing on methodology, authenticity, and legal implications.",
      duration: "2 Years",
      icon: Quote,
      image: "/Hadith.jpeg",
    },
    {
      id: "dars-e-asrarul-quran",
      title: "Dars-e-Asrarul Qur'an",
      level: "Advanced",
      description: "Exploring the profound mysteries and thematic depths of the Holy Qur'an through classical and contemporary Tafsir.",
      duration: "2 Years",
      icon: Book,
      image: "/quran.webp",
    }
    
  ],
 departments: [
    {
      id: "quranic-sciences",
      name: "Quranic Sciences",
      arabic: "علوم القرآن",
      description: "Focusing on Tajweed, Qira'at, and Exegesis (Tafsir).",
      icon: Library
    },
    {
      id: "hadith-sciences",
      name: "Hadith Sciences",
      arabic: "علوم الحديث",
      description: "The study of Hadith terminology, transmission, and criticism.",
      icon: GraduationCap
    },
    {
      id: "jurisprudence",
      name: "Jurisprudence (Fiqh)",
      arabic: "الفقه وأصوله",
      description: "Understanding Islamic law and its practical application (Usul al-Fiqh).",
      icon: Scroll
    },
    {
      id: "theology",
      name: "Aqidah & Theology",
      arabic: "العقيدة وعلم الكلام",
      description: "Defending and explaining the rational foundations of faith.",
      icon: Book
    },
    {
      id: "tasawwuf",
      name: "Tasawwuf & Spirituality",
      arabic: "التصوف والتزكية",
      description: "The science of spiritual purification and heart rectification.",
      icon: PenTool
    },
    {
      id: "islamic-history",
      name: "Islamic History & Seerah",
      arabic: "التاريخ الإسلامي والسيرة",
      description: "Chronicling the rise and expansion of Islamic civilization and the prophetic biography.",
      icon: History
    },
    {
      id: "islamic-philosophy",
      name: "Islamic Philosophy",
      arabic: "الفلسفة الإسلامية",
      description: "Exploring the philosophical traditions of thinkers like Ibn Sina and Al-Ghazali.",
      icon: Brain
    },
    {
      id: "logic-epistemology",
      name: "Logic & Epistemology",
      arabic: "المنطق ونظرية المعرفة",
      description: "The study of classical logic (Mantiq) and the nature of knowledge.",
      icon: Search
    },
    {
      id: "comparative-philosophy",
      name: "Comparative Philosophy",
      arabic: "الفلسفة المقارنة",
      description: "Analyzing and comparing Western and Eastern philosophical thought.",
      icon: Globe
    },
    {
      id: "physics",
      name: "Physics",
      arabic: "الفيزياء",
      description: "Studying classical mechanics, quantum physics, and thermodynamics.",
      icon: Atom
    },
    {
      id: "astronomy",
      name: "Astronomy & Cosmology",
      arabic: "علم الفلك والفضاء",
      description: "Exploring the universe, celestial mechanics, and historical Islamic astronomy.",
      icon: Telescope
    },
    {
      id: "chemistry-biology",
      name: "Chemistry & Biology",
      arabic: "الكيمياء والأحياء",
      description: "The study of organic chemistry, cellular biology, and historical Islamic medicine.",
      icon: FlaskConical
    },
    {
      id: "mathematics",
      name: "Mathematics",
      arabic: "الرياضيات",
      description: "Covering algebra, calculus, geometry, and the rich heritage of Islamic mathematics.",
      icon: Ruler
    },
    {
      id: "mechanics-dynamics",
      name: "Mechanics & Dynamics",
      arabic: "الميكانيكا والديناميكا",
      description: "Understanding statics, fluid mechanics, and the strength of materials.",
      icon: Settings
    },
    {
      id: "engineering-technology",
      name: "Engineering & Technology",
      arabic: "الهندسة والتكنولوجيا",
      description: "Modern applications of civil, electrical, and computer engineering.",
      icon: Cpu
    }
  ],
  founder: {
    name: "Abul Masakin Mufti Sayyed Saiful Islam Bari",
    role: " Founding Director & Principal",
    bio: "Mufti Sayyed Saiful Islam Bari is a distinguished scholar of Islamic sciences with over two decades of experience in teaching and research. He has authorized numerous students in the traditional sciences (Ijazah) and is known for his profound insights into both classical texts and modern contexts.",
    expertise: ["Fiqh", "Hadith", "Theology", "Spiritual Mentorship"],
    image: "/new-founder.png"
  },
  certificationSteps: [
    {
      title: "Academic Enrollment",
      description: "Complete the rigorous entry assessment and enroll in your chosen program of study."
    },
    {
      title: "Scholarly Mentorship",
      description: "Engage in direct learning under qualified faculty, adhering to the traditional teacher-student bond."
    },
    {
      title: "Final Examination",
      description: "Demonstrate mastery of the curriculum through oral and written examinations."
    },
    {
      title: "Ijazah & Sanad",
      description: "Receive the traditional authorization (Ijazah) and chain of transmission (Sanad) connecting you to the source."
    }
  ],
  youtubeUrl: "https://youtube.com/@darulhikmahlive?si=mgSpHIa8hxr7OHGF"
};
