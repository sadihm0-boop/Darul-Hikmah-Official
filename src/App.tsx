import { useState } from 'react';
import TopBar from './components/TopBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Programs from './components/Programs';
import Departments from './components/Departments';
import Founder from './components/Founder';
import Certification from './components/Certification';
import YouTubeCTA from './components/YouTubeCTA';
import Footer from './components/Footer';
import IntroAnimation from './components/IntroAnimation';

function App() {
  const [showIntro, setShowIntro] = useState(true);
  // 1. State to track which "page" we are on
  const [currentPage, setCurrentPage] = useState('home');

  // 2. This function decides what to render based on the current page
  const renderContent = () => {
    switch (currentPage) {
      case 'founder':
        return <Founder />;
      case 'departments':
        return <Departments />;
      case 'home':
      default:
        // 3. This is your main homepage. 
        // Notice I removed Founder and Departments from here so they act like separate pages!
        return (
          <>
            <Hero />
            <About />
            <Programs />
            <Certification />
            <YouTubeCTA />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen selection:bg-indigo-500/30 selection:text-white">
      <TopBar />
      {/* 4. Pass the page-changing function to the Navbar */}
      <Navbar setCurrentPage={setCurrentPage} />

      <main>
        {/* 5. Render the chosen page */}
        {renderContent()}
      </main>

      <Footer />
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
    </div>
  );
}

export default App;