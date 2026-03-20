'use client';

import React, { useMemo, useRef } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { useAudio } from '@/hooks/useAudio';
import { useInteractiveCanvas } from '@/hooks/useInteractiveCanvas';
import { MuteToggle } from '@/components/MuteToggle';
import MaintenancePage from '@/components/MaintenancePage';

const defaultContent = {
  hero: {
    title: 'InhaleXheale',
    subtitle: 'Organic Frequencies & Deep Melodies',
  },
  about: {
    title: 'Baare Mein',
    p1: 'Breath and sound combined. A journey through organic textures and dark, meditative spaces.',
    p2: 'Every frequency is a breath. Every silence is a void. Heal with the Neon Emerald light.',
  },
  live: {
    title: 'THE RITUAL',
    videoUrl: '',
  },
  releases: {
    title: 'Naye Releases',
    tracks: [
      { name: '1. Neon Emerald', duration: '04:12' },
      { name: '2. Deep Melodies', duration: '05:45' },
      { name: '3. Inhale', duration: '03:30' },
      { name: '4. Exhale', duration: '06:20' },
    ],
  },
  connect: {
    title: 'Judein',
    links: [
      { icon: 'fab fa-spotify', url: '#' },
      { icon: 'fab fa-soundcloud', url: '#' },
      { icon: 'fab fa-instagram', url: '#' },
      { icon: 'fab fa-youtube', url: '#' },
    ],
  },
  footer: {
    text: '© 2026 InhaleXheale. All rights reserved.',
  },
  maintenanceMode: false,
};

const MainSite = ({ content }: { content: typeof defaultContent }) => {
    const { isMuted, toggleMute, playInhale, playExhale } = useAudio();

    const cursorDotRef = useRef<HTMLDivElement>(null);
    const cursorFollowerRef = useRef<HTMLDivElement>(null);
    const preloaderGridRef = useRef<HTMLDivElement>(null);
    const glowDotRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const preloaderRef = useRef<HTMLDivElement>(null);

    useInteractiveCanvas({
      canvasRef,
      cursorDotRef,
      cursorFollowerRef,
      preloaderGridRef,
      glowDotRef,
      mainContentRef,
      preloaderRef,
      playInhale,
      playExhale,
    });

    return (
        <>
            <MuteToggle isMuted={isMuted} toggleMute={toggleMute} />
            <div className="cursor-dot" ref={cursorDotRef}></div>
            <div className="cursor-follower" ref={cursorFollowerRef}></div>

            <div id="preloader-grid" ref={preloaderGridRef}></div>

            <div id="preloader" ref={preloaderRef}>
                <div className="glowing-dot" id="glow-dot" ref={glowDotRef}></div>
            </div>

            <canvas id="webgl-canvas" ref={canvasRef}></canvas>

            <div id="main-content" ref={mainContentRef}>
                <section className="hero-section">
                    <div className="breathe-element hero-content">
                        <h1 className="hero-title">{content.hero.title}</h1>
                        <div className="hero-subtitle">{content.hero.subtitle}</div>
                        
                        <div className="scroll-indicator">
                            <div className="scroll-line"></div>
                        </div>
                    </div>
                </section>

                <div className="spacer"></div>

                <section>
                    <div className="breathe-element">
                        <h2 style={{fontSize: '2rem', marginBottom: '20px', letterSpacing: '0.2em', textTransform: 'uppercase'}}>{content.about.title}</h2>
                        <p>{content.about.p1}</p>
                        <p>{content.about.p2}</p>
                    </div>
                </section>
                
                <div className="spacer"></div>
                
                <section>
                    <div className="breathe-element">
                        <h2 style={{fontSize: '2rem', marginBottom: '40px', letterSpacing: '0.2em', textTransform: 'uppercase'}}>{content.live?.title || 'Live Session'}</h2>
                        <div className="video-wrapper">
                            {content.live?.videoUrl ? (
                                <video
                                    key={content.live.videoUrl}
                                    src={content.live.videoUrl}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                ></video>
                            ) : (
                                <div className="video-placeholder flex items-center justify-center text-muted-foreground">
                                    {/* Placeholder content if you want */}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="spacer"></div>

                <section>
                    <div className="breathe-element" style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <h2 style={{fontSize: '2rem', marginBottom: '20px', letterSpacing: '0.2em', textTransform: 'uppercase'}}>{content.releases.title}</h2>
                        <ul className="track-list">
                            {content.releases.tracks.map((track, index) => (
                                <li key={index} className="track-item"><span>{track.name}</span> <span>{track.duration}</span></li>
                            ))}
                        </ul>
                    </div>
                </section>

                <div className="spacer"></div>
                
                <section style={{minHeight: '50vh'}}>
                    <div className="breathe-element">
                        <h2 style={{fontSize: '2rem', marginBottom: '20px', letterSpacing: '0.2em', textTransform: 'uppercase'}}>{content.connect.title}</h2>
                        <div className="social-links">
                            {content.connect.links.map((link, index) => (
                                <a key={index} href={link.url} target="_blank" rel="noopener noreferrer"><i className={link.icon}></i></a>
                            ))}
                        </div>
                    </div>
                </section>

                <footer>
                    {content.footer.text}
                </footer>
            </div>
        </>
    );
}


export default function Home() {
    const firestore = useFirestore();
    const contentRef = useMemo(
        () => (firestore ? doc(firestore, 'content', 'landingPage') : null),
        [firestore]
    );
    const { data: pageContent, loading } = useDoc<typeof defaultContent>(contentRef);

    if (loading) {
        return <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">Loading...</div>;
    }
    
    const content = pageContent || defaultContent;

    if (content.maintenanceMode) {
        return <MaintenancePage />;
    }

    return <MainSite content={content} />;
}
