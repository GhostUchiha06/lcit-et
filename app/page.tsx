import Link from "next/link";

export default function Home() {
  return (
    <>
      <style suppressHydrationWarning>{`

        *, *::before, *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        :root {
          --royal: #1a1a2e;
          --royal-mid: #16213e;
          --accent: #c9a84c;
          --accent-light: #e8c97a;
          --white: #f5f0eb;
          --muted: #9a9a9a;
        }
        body {
          background-color: var(--royal);
          color: var(--white);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 20% 20%, rgba(201,168,76,0.06) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 80%, rgba(201,168,76,0.04) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 60px;
          background: rgba(26,26,46,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(201,168,76,0.15);
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-badge {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--royal);
          letter-spacing: 0.5px;
        }
        .nav-name {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--white);
          letter-spacing: 0.5px;
        }
        .nav-links {
          display: flex;
          gap: 36px;
          list-style: none;
        }
        .nav-links a {
          text-decoration: none;
          color: var(--muted);
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: color 0.3s;
        }
        .nav-links a:hover {
          color: var(--accent);
        }
        .hero {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 120px 40px 80px;
        }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 100px;
          padding: 6px 18px;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 32px;
        }
        .hero-tag::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--accent);
          border-radius: 50%;
        }
        .hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(42px, 7vw, 88px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -1px;
          color: var(--white);
          max-width: 800px;
          margin-bottom: 16px;
        }
        .hero h1 span {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-dept {
          font-size: 13px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 40px;
          font-weight: 300;
        }
        .hero-desc {
          font-size: 16px;
          color: rgba(245,240,235,0.6);
          max-width: 480px;
          line-height: 1.8;
          font-weight: 300;
          margin-bottom: 52px;
        }
        .hero-btns {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          color: var(--royal);
          padding: 14px 32px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(201,168,76,0.25);
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(201,168,76,0.35);
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          color: var(--white);
          padding: 14px 32px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid rgba(245,240,235,0.2);
          transition: border-color 0.3s, color 0.3s;
        }
        .btn-secondary:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .divider {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 60px;
          margin: 0 auto;
          max-width: 1100px;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(201,168,76,0.15);
        }
        .divider-icon {
          width: 32px;
          height: 32px;
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 20px;
        }
        .divider-icon svg {
          width: 12px;
          height: 12px;
          stroke: var(--accent);
          fill: none;
        }
        .features {
          position: relative;
          z-index: 1;
          padding: 80px 60px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .section-label {
          text-align: center;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 16px;
        }
        .section-title {
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 600;
          color: var(--white);
          margin-bottom: 60px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.1);
          border-radius: 12px;
          padding: 36px 32px;
          transition: border-color 0.3s, transform 0.3s;
        }
        .feature-card:hover {
          border-color: rgba(201,168,76,0.3);
          transform: translateY(-4px);
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          background: rgba(201,168,76,0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .feature-icon svg {
          width: 22px;
          height: 22px;
          stroke: var(--accent);
          fill: none;
          stroke-width: 1.5;
        }
        .feature-card h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 12px;
        }
        .feature-card p {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.7;
          font-weight: 300;
        }
        .cta-section {
          position: relative;
          z-index: 1;
          padding: 60px;
          max-width: 1100px;
          margin: 0 auto 80px;
        }
        .cta-box {
          background: rgba(201,168,76,0.05);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 16px;
          padding: 64px;
          text-align: center;
        }
        .cta-box h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 3.5vw, 40px);
          font-weight: 600;
          color: var(--white);
          margin-bottom: 16px;
        }
        .cta-box p {
          font-size: 15px;
          color: var(--muted);
          margin-bottom: 36px;
          font-weight: 300;
        }
        footer {
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(201,168,76,0.12);
          padding: 28px 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        footer p {
          font-size: 12px;
          color: var(--muted);
          letter-spacing: 0.5px;
        }
        footer span {
          color: var(--accent);
        }
        @media (max-width: 768px) {
          nav {
            padding: 16px 24px;
          }
          .nav-links {
            display: none;
          }
          .features, .cta-section {
            padding: 60px 24px;
          }
          .cta-box {
            padding: 40px 24px;
          }
          footer {
            padding: 24px;
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
      <nav>
        <div className="nav-logo">
          <div className="logo-badge">LCIT</div>
          <span className="nav-name">Lakhmichand Institute of Technology</span>
        </div>
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/dashboard">Whiteboard</Link></li>
          <li><a href="#">Resources</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>

      <section className="hero">
        <div className="hero-tag">B.Tech. Electronics & Telecommunication</div>
        <h1>Your Digital <span>Classroom</span><br/>Whiteboard</h1>
        <p className="hero-dept">Lakhmichand Institute of Technology &nbsp;·&nbsp; LCIT</p>
        <p className="hero-desc">
          A clean, collaborative space for your electronics and telecommunication lectures — 
          draw, annotate, and teach in real time.
        </p>
        <div className="hero-btns">
          <Link href="/dashboard" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            Open Whiteboard
          </Link>
          <a href="#" className="btn-secondary">Learn More</a>
        </div>
      </section>

      <div className="divider">
        <div className="divider-line"></div>
        <div className="divider-icon">
          <svg viewBox="0 0 24 24" strokeWidth="2">
            <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>
          </svg>
        </div>
        <div className="divider-line"></div>
      </div>

      <section className="features">
        <p className="section-label">Features</p>
        <h2 className="section-title">Built for the Modern Classroom</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <h3>Live Annotation</h3>
            <p>Draw circuits, annotate waveforms, and illustrate concepts in real time with smooth pen tools.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h3>Class Collaboration</h3>
            <p>Students and faculty can join, view, and interact with the board from any device, anywhere.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4 4-4-4M12 16V4"/>
              </svg>
            </div>
            <h3>Save & Export</h3>
            <p>Save sessions as PDFs or images and share them with students after class instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
              </svg>
            </div>
            <h3>Session History</h3>
            <p>Access all past whiteboard sessions organized by date and topic for easy revision.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h3>Circuit Templates</h3>
            <p>Pre-built ECE templates for logic gates, filters, amplifiers, and more, ready to use instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Secure Access</h3>
            <p>Role-based login ensures only enrolled students and faculty can access classroom boards.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to Teach Smarter?</h2>
          <p>Join LCIT digital classroom and make every lecture more interactive and effective.</p>
          <Link href="/dashboard" className="btn-primary">Get Started Now</Link>
        </div>
      </section>

      <footer>
        <p>&copy; 2025 <span>LCIT</span> — Lakhmichand Institute of Technology</p>
        <p>B.Tech. Electronics & Telecommunication &nbsp;·&nbsp; All rights reserved</p>
      </footer>
    </>
  );
}
