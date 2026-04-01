import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Zap, Shield, ArrowRight } from 'lucide-react';
import logo from '../photo/logo.jpeg';

function Home() {
  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="logo">
          <img src={logo} alt="PingMe" className="logo-img" />
          <span>PingMe</span>
        </div>
        <nav className="nav-buttons">
          <Link to="/login" className="btn btn-secondary">
            Connexion
          </Link>
          <Link to="/register" className="btn btn-primary">
            Inscription
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discutez en temps réel avec vos amis</h1>
          <p>
            Une application de messagerie moderne, rapide et sécurisée. 
            Créez des conversations privées ou des groupes en quelques clics.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Commencer gratuitement
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              J'ai déjà un compte
            </Link>
          </div>
        </div>
        <div className="hero-illustration">
          <div className="chat-preview">
            <div className="chat-bubble left">
              <div className="avatar">A</div>
              <div className="bubble">Salut ! Comment ça va ?</div>
            </div>
            <div className="chat-bubble right">
              <div className="bubble mine">Super ! Tu as des projets pour ce weekend ?</div>
              <div className="avatar">M</div>
            </div>
            <div className="chat-bubble left">
              <div className="avatar">A</div>
              <div className="bubble">On pourrait aller au cinéma !</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">
            <Zap size={32} />
          </div>
          <h3>Temps réel</h3>
          <p>Messages instantanés avec WebSocket. Pas de délai, pas de rafraîchissement.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Users size={32} />
          </div>
          <h3>Groupes</h3>
          <p>Créez des conversations de groupe avec vos amis, collègues ou famille.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Shield size={32} />
          </div>
          <h3>Sécurisé</h3>
          <p>Authentification JWT et stockage sécurisé de vos données.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2024 PingMe - Application de chat temps réel</p>
      </footer>

      <style>{`
        .home-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
          color: white;
        }
        .home-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 3rem;
        }
        .logo-img {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .nav-buttons {
          display: flex;
          gap: 1rem;
        }
        .nav-buttons .btn {
          text-decoration: none;
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .btn-primary {
          background: white;
          color: #6366f1;
        }
        .btn-primary:hover {
          background: #f8fafc;
        }
        .btn-large {
          padding: 1rem 2rem;
          font-size: 1rem;
        }
        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4rem 3rem;
          max-width: 1400px;
          margin: 0 auto;
          gap: 4rem;
        }
        .hero-content {
          flex: 1;
          max-width: 600px;
        }
        .hero-content h1 {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }
        .hero-content p {
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        .hero-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .hero-illustration {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        .chat-preview {
          background: white;
          border-radius: 1.5rem;
          padding: 2rem;
          width: 350px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .chat-bubble {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .chat-bubble.right {
          flex-direction: row-reverse;
        }
        .chat-bubble .avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          flex-shrink: 0;
        }
        .bubble {
          background: #f1f5f9;
          color: #1e293b;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          max-width: 220px;
        }
        .bubble.mine {
          background: #6366f1;
          color: white;
        }
        .features {
          display: flex;
          justify-content: center;
          gap: 2rem;
          padding: 4rem 3rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        .feature-card {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 1rem;
          padding: 2rem;
          text-align: center;
          max-width: 300px;
          transition: transform 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-5px);
        }
        .feature-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        .feature-card h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .feature-card p {
          opacity: 0.9;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .home-footer {
          text-align: center;
          padding: 2rem;
          opacity: 0.7;
          font-size: 0.875rem;
        }
        @media (max-width: 1024px) {
          .hero {
            flex-direction: column;
            text-align: center;
          }
          .hero-content h1 {
            font-size: 2.5rem;
          }
          .hero-buttons {
            justify-content: center;
          }
          .features {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

export default Home;
