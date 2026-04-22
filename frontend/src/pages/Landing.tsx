import React from 'react';
import { Link } from 'react-router-dom';
import PublicTopNav from '../components/PublicTopNav';
import PublicBottomNav from '../components/PublicBottomNav';
import sharedHeroImage from '../assets/shared-hero.png';
import './Landing.css';

const Landing: React.FC = () => {
  return (
    <div className="landing-page">
      <PublicTopNav active="home" />

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-image-wrap" role="img" aria-label="Gallusi Smart Argent mobile money scene with a woman in the foreground">
            <img src={sharedHeroImage} alt="Simamia biashara yako rahisi" className="landing-image" />
            <div className="landing-copy-overlay">
              <p className="landing-kicker">Simamia biashara yako rahisi</p>
              <h1>Gallusi Smart Argent Mobile Money System.</h1>
              <p>
                Dhibiti huduma, balancing, na ripoti kwa haraka kwa muonekano safi, mwepesi,
                na wa kisasa.
              </p>
              <div className="landing-actions">
                <Link to="/register" className="landing-btn landing-btn-primary">Anza Bure</Link>
                <Link to="/login" className="landing-btn landing-btn-secondary">Login</Link>
                <Link to="/services" className="landing-btn landing-btn-tertiary">Angalia Demo</Link>
              </div>
              <div className="landing-quick-links">
                <Link to="/services">Services</Link>
                <Link to="/benefits">Benefits</Link>
                <Link to="/register">Register</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicBottomNav />
    </div>
  );
};

export default Landing;
