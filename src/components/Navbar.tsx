import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { theme } from '../theme';

// 1. Tell TypeScript that Navbar will receive the setCurrentPage function
interface NavbarProps {
  setCurrentPage: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ setCurrentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Updated nav links to use 'id' for our manual routing instead of 'href'
  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    { name: 'Programs', id: 'programs' },
    { name: 'Departments', id: 'departments' },
    { name: 'Founder', id: 'founder' },
  ];

  // 3. Helper function to change the page and reset the view
  const handleNavigate = (id: string) => {
    setCurrentPage(id);
    setIsMobileMenuOpen(false); // Close mobile menu if it was open
    window.scrollTo(0, 0); // Scroll nicely to the top
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-black/30 backdrop-blur-lg border-b border-white/10 py-3 shadow-2xl' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">

          {/* Clicking the logo now takes you Home */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate('home')}>
            <img
              src="/logo.png"
              alt="Darul Hikmah Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="font-serif text-2xl font-black tracking-tight text-white">Darul Hikmah</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigate(link.id)}
                className={`${theme.navLink} text-sm uppercase tracking-widest bg-transparent border-none cursor-pointer`}
              >
                {link.name}
              </button>
            ))}
            <button onClick={() => handleNavigate('home')} className="px-6 py-2.5 bg-white text-indigo-950 rounded-lg font-bold hover:bg-indigo-50 transition-all text-sm uppercase tracking-wider shadow-xl active:scale-95 cursor-pointer">
              Enroll Now
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`text-white p-2 ${theme.glassPanel.replace('rounded-2xl', 'rounded-lg')}`}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className={`md:hidden mt-2 mx-4 ${theme.glassPanel} py-6 px-6 space-y-6 animate-in fade-in slide-in-from-top-4`}>
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavigate(link.id)}
              className="block w-full text-left text-slate-300 font-bold uppercase tracking-widest hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              {link.name}
            </button>
          ))}
          <button onClick={() => handleNavigate('home')} className="block w-full py-4 bg-white text-indigo-950 text-center font-bold rounded-xl uppercase tracking-widest cursor-pointer">
            Enroll Now
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;