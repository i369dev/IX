'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

export function useAudio() {
  const [isMuted, setIsMuted] = useState(true);

  const { audioCtx, masterGainNode } = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gainNode = context.createGain();
        gainNode.connect(context.destination);
        return { audioCtx: context, masterGainNode: gainNode };
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.");
        return { audioCtx: null, masterGainNode: null };
      }
    }
    return { audioCtx: null, masterGainNode: null };
  }, []);
  
  useEffect(() => {
      if (masterGainNode && audioCtx) {
          const targetGain = isMuted ? 0 : 1;
          masterGainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 0.1);
      }
  }, [isMuted, audioCtx, masterGainNode]);

  useEffect(() => {
    if (audioCtx && audioCtx.state === "suspended") {
      const resumeAudio = () => {
        audioCtx.resume();
        document.body.removeEventListener('click', resumeAudio);
        document.body.removeEventListener('touchstart', resumeAudio);
      };
      document.body.addEventListener('click', resumeAudio);
      document.body.addEventListener('touchstart', resumeAudio);
    }
  }, [audioCtx]);

  const playSound = useCallback((type: 'inhale' | 'exhale') => {
    if (!audioCtx || !masterGainNode) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (type === 'inhale') {
      const noise = audioCtx.createBufferSource();
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < audioCtx.sampleRate * 4; i++) {
          data[i] = Math.random() * 2 - 1; 
      }
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 3); 

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 3);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainNode);
      noise.start();
    } else { // exhale
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 2);

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);

      osc.connect(gain);
      gain.connect(masterGainNode);
      osc.start();
      osc.stop(audioCtx.currentTime + 3);
    }
  }, [audioCtx, masterGainNode]);

  const playInhale = useCallback(() => playSound('inhale'), [playSound]);
  const playExhale = useCallback(() => playSound('exhale'), [playSound]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
        const newMutedState = !prev;
        if (!newMutedState && audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return newMutedState;
    });
  }, [audioCtx]);

  return { isMuted, toggleMute, playInhale, playExhale };
}
