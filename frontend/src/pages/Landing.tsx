import React from 'react';
import PublicTopNav from '../components/PublicTopNav';
import PublicBottomNav from '../components/PublicBottomNav';
import homeHeroImage from '../assets/smart-home.png';
import './Landing.css';

const Landing: React.FC = () => {
  return (
    <div className="landing-page">
      <PublicTopNav active="home" />

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-image-wrap" role="img" aria-label="Gallusi Smart Argent mobile money scene with a woman in the foreground">
            <img src={homeHeroImage} alt="Home screen hero illustration" className="landing-image" />
          </div>
        </section>
      </main>

      <PublicBottomNav />
    </div>
  );
};

export default Landing;
