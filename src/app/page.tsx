'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc } from '@/firebase';

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
  releases: {
    title: 'Naye Releases',
    tracks: [
      { name: '1. Neon Emerald', duration: '04:12' },
      { name: '2. Deep Melodies', duration: '05:45' },
      { name: '3. Inhale', duration: '03:30' },
      { name: '4. Exhale', duration: '06:20' },
    ],
  },
  live: {
    title: 'Live Session',
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
};

export default function Home() {
    const firestore = useFirestore();
    const contentRef = useMemo(
        () => (firestore ? doc(firestore, 'content', 'landingPage') : null),
        [firestore]
    );
    const { data: pageContent } = useDoc(contentRef);

    const content = pageContent || defaultContent;

    const cursorDotRef = useRef<HTMLDivElement>(null);
    const cursorFollowerRef = useRef<HTMLDivElement>(null);
    const preloaderGridRef = useRef<HTMLDivElement>(null);
    const glowDotRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const preloaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Jawsaña (Audio Setup)
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        function playInhale() {
            if(audioCtx.state === 'suspended') audioCtx.resume();
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
            gain.connect(audioCtx.destination);
            noise.start();
        }

        function playExhale() {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 2);

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 3);
        }

        // Uñch'ukiña
        const cursorDot = cursorDotRef.current;
        const cursorFollower = cursorFollowerRef.current;
        
        gsap.set(cursorDot, { xPercent: -50, yPercent: -50 });
        gsap.set(cursorFollower, { xPercent: -50, yPercent: -50 });

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let mouseNormX = 0;
        let mouseNormY = 0;
        let lastTouchTime = 0; // Touch kelyachi vel thevnyasathi (For tracking last touch time)

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Nave p'iqiña tupunaka
            mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseNormY = -(e.clientY / window.innerHeight) * 2 + 1;
            
            gsap.to(cursorDot, { x: mouseX, y: mouseY, duration: 0.1, ease: "power2.out" });
            gsap.to(cursorFollower, { x: mouseX, y: mouseY, duration: 0.6, ease: "power3.out" });
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Mobile Gyroscope / Accelerometer Map for Spaceship (Sensors)
        function handleOrientation(e: DeviceOrientationEvent) {
            if (Date.now() - lastTouchTime < 2000) return; // Touch kelyavar 2 second sensor thambva (Pause sensor for 2s after touch)

            if (e.gamma !== null && e.beta !== null) {
                let gamma = e.gamma; // Left-to-right tilt (-90 to 90)
                let beta = e.beta;   // Front-to-back tilt (-180 to 180)

                // The phone is usually held at a 45-60 degree tilt naturally in the hand.
                // We use 35 degrees as the limit for maximum turn (makes it highly responsive).
                let normX = gamma / 35; 
                let normY = (beta - 45) / 35; 

                // Smoothly map limits to -1 to 1 just like desktop mouse coordinates
                mouseNormX = Math.max(-1, Math.min(1, normX));
                mouseNormY = -Math.max(-1, Math.min(1, normY)); 
            }
        }
        
        // Android allows access directly
        window.addEventListener('deviceorientation', handleOrientation);

        // iOS 13+ requires user interaction to request sensor permissions
        const requestSensorAccess = () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                (DeviceOrientationEvent as any).requestPermission()
                    .then((permissionState: string) => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation);
                        }
                    })
                    .catch(console.error);
            }
        };

        // Trigger permission on first touch/click
        window.addEventListener('touchstart', requestSensorAccess, { once: true });
        window.addEventListener('click', requestSensorAccess, { once: true });

        document.querySelectorAll('button, .video-wrapper, a').forEach(el => {
            const mouseEnterHandler = () => {
                gsap.to(cursorFollower, { width: 60, height: 60, backgroundColor: 'rgba(0, 255, 157, 0.1)', borderColor: 'rgba(0, 255, 157, 0.5)', duration: 0.3 });
            };
            const mouseLeaveHandler = () => {
                gsap.to(cursorFollower, { width: 30, height: 30, backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.4)', duration: 0.3 });
            };
            el.addEventListener('mouseenter', mouseEnterHandler);
            el.addEventListener('mouseleave', mouseLeaveHandler);
        });

        // Sarnaqawi Lenis
        const lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            smoothTouch: true, 
            touchMultiplier: 2 
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        lenis.stop(); 

        // 3D Canvas
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scene = new THREE.Scene();
        // Camera pacha
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 15;

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // IX Luraña
        const ixGroup = new THREE.Group();
        
        const faceMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x050a05, 
            metalness: 0.8,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        
        const edgeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x22c55e,
            metalness: 0.5,
            roughness: 0.2,
            emissive: 0x001100
        });

        const boxMaterials = [
            edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, faceMaterial, faceMaterial
        ];

        // "I" 
        const iGeometry = new THREE.BoxGeometry(1.6, 6, 1.2);
        const iMesh = new THREE.Mesh(iGeometry, boxMaterials);
        iMesh.position.x = -2.8;
        ixGroup.add(iMesh);

        // "X" 
        const xGroup = new THREE.Group();
        const xLegGeo = new THREE.BoxGeometry(1.6, 7.5, 1.2);
        const xLeg1 = new THREE.Mesh(xLegGeo, boxMaterials);
        xLeg1.rotation.z = Math.PI / 5.5; 
        const xLeg2 = new THREE.Mesh(xLegGeo, boxMaterials);
        xLeg2.rotation.z = -Math.PI / 5.5;
        xGroup.add(xLeg1);
        xGroup.add(xLeg2);
        xGroup.position.x = 2.2;
        
        ixGroup.add(xGroup);
        ixGroup.position.x = 0;
        ixGroup.visible = false;
        scene.add(ixGroup);

        // Gatti Bahyakasha Nauke Nirmana 
        const shipGroup = new THREE.Group();
        
        // Jisk'a qhana (Highly reflective polished material like glass/metal)
        const darkMetal = new THREE.MeshPhysicalMaterial({
            color: 0x050806,
            metalness: 1.0,      // Maximum reflection
            roughness: 0.15,     // Sharp reflections
            clearcoat: 1.0,      // Glass-like coat
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });

        const neonGreen = new THREE.MeshBasicMaterial({ color: 0x00FF77 });

        // 1. Madhya Bhaga
        const bodyGeo = new THREE.CylinderGeometry(0.7, 1.2, 3.5, 32);
        bodyGeo.rotateX(-Math.PI / 2);
        const bodyMesh = new THREE.Mesh(bodyGeo, darkMetal);
        bodyMesh.position.set(0, 0, 0.5);
        shipGroup.add(bodyMesh);

        // Mugu
        const noseGeo = new THREE.ConeGeometry(0.7, 2.0, 32);
        noseGeo.rotateX(-Math.PI / 2);
        const noseMesh = new THREE.Mesh(noseGeo, darkMetal);
        noseMesh.position.set(0, 0, -2.25);
        shipGroup.add(noseMesh);

        // 2. Rekkegalu
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0); 
        wingShape.lineTo(4.5, 2.5); 
        wingShape.lineTo(4.5, 3.2); 
        wingShape.lineTo(0, 3.2); 

        const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 };
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
        
        const leftWing = new THREE.Mesh(wingGeo, darkMetal);
        leftWing.rotation.x = Math.PI / 2;
        leftWing.position.set(0, 0, -1.0);
        shipGroup.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeo, darkMetal);
        rightWing.rotation.x = Math.PI / 2;
        rightWing.rotation.y = Math.PI;
        rightWing.position.set(0, 0, -1.0);
        shipGroup.add(rightWing);

        // Neon Wing Edges
        const wingEdgeGeo = new THREE.BoxGeometry(8.8, 0.1, 0.3);
        const wingEdge = new THREE.Mesh(wingEdgeGeo, neonGreen);
        wingEdge.position.set(0, 0, 2.3);
        shipGroup.add(wingEdge);

        // 3. Bala
        const tailShape = new THREE.Shape();
        tailShape.moveTo(0, 0);
        tailShape.lineTo(0.5, 2.0); 
        tailShape.lineTo(1.5, 2.0); 
        tailShape.lineTo(2.0, 0); 

        const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.15, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
        const tailMesh = new THREE.Mesh(tailGeo, darkMetal);
        tailMesh.rotation.y = -Math.PI / 2;
        tailMesh.position.set(0.075, 0.6, 0.5);
        shipGroup.add(tailMesh);

        // Neon Tail Edge
        const tailEdgeGeo = new THREE.BoxGeometry(0.16, 2.0, 0.2);
        const tailEdge = new THREE.Mesh(tailEdgeGeo, neonGreen);
        tailEdge.rotation.x = Math.PI / 8;
        tailEdge.position.set(0, 1.7, 2.3); 
        shipGroup.add(tailEdge);

        // 4. Yantra Thrustergalu
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.4 });
        const thrusterGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.0, 32);
        thrusterGeo.rotateX(Math.PI / 2);

        const engTop = new THREE.Mesh(thrusterGeo, engineMat);
        engTop.position.set(0, 0.7, 2.5);
        shipGroup.add(engTop);

        const engBL = new THREE.Mesh(thrusterGeo, engineMat);
        engBL.position.set(-0.7, -0.4, 2.5);
        shipGroup.add(engBL);

        const engBR = new THREE.Mesh(thrusterGeo, engineMat);
        engBR.position.set(0.7, -0.4, 2.5);
        shipGroup.add(engBR);

        // Neon Rings
        const ringGeo = new THREE.TorusGeometry(0.5, 0.05, 16, 32);
        const engRingTop = new THREE.Mesh(ringGeo, neonGreen);
        engRingTop.position.set(0, 0.7, 3.0);
        shipGroup.add(engRingTop);

        const engRingBL = new THREE.Mesh(ringGeo, neonGreen);
        engRingBL.position.set(-0.7, -0.4, 3.0);
        shipGroup.add(engRingBL);

        const engRingBR = new THREE.Mesh(ringGeo, neonGreen);
        engRingBR.position.set(0.7, -0.4, 3.0);
        shipGroup.add(engRingBR);

        // 5. Thruster Jwale (Flames shortened)
        const flameGeo = new THREE.CylinderGeometry(0.4, 0.05, 2.5, 32); // Shortened
        flameGeo.rotateX(-Math.PI / 2);
        
        const flameMat = new THREE.MeshBasicMaterial({ 
            color: 0x00FFaa, 
            transparent: true, 
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const coreGeo = new THREE.CylinderGeometry(0.2, 0.02, 2.0, 16); // Shortened
        coreGeo.rotateX(-Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const createFlame = (x: number, y: number, z: number) => {
            const group = new THREE.Group();
            const outer = new THREE.Mesh(flameGeo, flameMat);
            outer.position.set(0, 0, 1.25); // Adjusted position
            const inner = new THREE.Mesh(coreGeo, coreMat);
            inner.position.set(0, 0, 1.0); // Adjusted position
            group.add(outer);
            group.add(inner);
            group.position.set(x, y, z);
            return group;
        };

        const flameTop = createFlame(0, 0.7, 2.8);
        shipGroup.add(flameTop);

        const flameBL = createFlame(-0.7, -0.4, 2.8);
        shipGroup.add(flameBL);

        const flameBR = createFlame(0.7, -0.4, 2.8);
        shipGroup.add(flameBR);
        
        // Ship Engine Point Light
        const shipEngineLight = new THREE.PointLight(0x00FFaa, 3.0, 25);
        shipEngineLight.position.set(0, 0, 4.0);
        shipGroup.add(shipEngineLight);

        // --- Tunnel Reflections (Qhana uñstayawi) ---
        // Creates sweeping neon lights around the ship to simulate reflecting a multicolored tunnel
        const reflectionGroup = new THREE.Group();
        shipGroup.add(reflectionGroup);

        const neonPalette = [0x00FFFF, 0xFF00FF, 0xFFFF00, 0x00FF9D, 0x9D00FF];
        neonPalette.forEach((c, i) => {
            const light = new THREE.PointLight(c, 1.5, 10);
            const angle = (i / neonPalette.length) * Math.PI * 2;
            light.position.set(Math.cos(angle) * 3, Math.sin(angle) * 3, 0);
            reflectionGroup.add(light);
        });

        // Ch'ikhiña Raycaster Hitbox 
        const hitboxGeo = new THREE.SphereGeometry(4, 16, 16);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        shipGroup.add(hitbox);

        // Nave pacha
        shipGroup.position.set(0, 0, 3);
        scene.add(shipGroup);

        // Fit to screen / Mobile responsive scaling (Smaller scale)
        function updateShipScale() {
            // Jisk'a
            let scaleFact = Math.min(window.innerWidth / 2400, window.innerHeight / 1600); 
            if(window.innerWidth < 768) scaleFact *= 1.3; // Mobile responsive boost
            shipGroup.scale.set(scaleFact, scaleFact, scaleFact);
        }
        updateShipScale();

        // Qhananaka (Lights)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const pointLight1 = new THREE.PointLight(0xdcffdc, 3, 50); 
        pointLight1.position.set(-5, 5, 5);
        scene.add(pointLight1);

        let isExperienceStarted = false; 
        let shipFired = false;
        let isHoveringShip = false;
        let isLaunching = false;
        let stopLines = false;

        const raycaster = new THREE.Raycaster();

        // Uñacht'aya (Render Loop)
        gsap.ticker.add((time) => {
            if (!shipFired) {
                shipGroup.position.y = Math.sin(time * 2) * 0.15;
                gsap.to(shipGroup.rotation, {
                    y: -mouseNormX * 0.3,
                    x: mouseNormY * 0.3,
                    duration: 0.5
                });

                // Animate tunnel reflections moving across the ship body
                reflectionGroup.rotation.z = time * 2;
                // Sweep from front (-4) to back (+4) repeatedly
                reflectionGroup.position.z = (time * 12) % 8 - 4;
                
                raycaster.setFromCamera({x: mouseNormX, y: mouseNormY}, camera);
                const intersects = raycaster.intersectObject(hitbox);
                
                if (intersects.length > 0) {
                    if(!isHoveringShip) {
                        isHoveringShip = true;
                        if (document.body) document.body.style.cursor = 'pointer';
                        gsap.to(cursorFollower, { width: 60, height: 60, backgroundColor: 'rgba(0, 255, 157, 0.2)', borderColor: 'rgba(0, 255, 157, 0.8)', duration: 0.3 });
                    }
                } else {
                    if(isHoveringShip) {
                        isHoveringShip = false;
                        if (document.body) document.body.style.cursor = 'none';
                        gsap.to(cursorFollower, { width: 30, height: 30, backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.4)', duration: 0.3 });
                    }
                }

                // Dynamic flickering engine flames
                let flickerZ = 1 + Math.sin(time * 40) * 0.15 + Math.random() * 0.1;
                let flickerXY = 1 + Math.sin(time * 30) * 0.05 + Math.random() * 0.05;
                let targetScale = isHoveringShip ? 1.2 : 1.0;
                
                flameTop.scale.set(targetScale * flickerXY, targetScale * flickerXY, targetScale * flickerZ);
                flameBL.scale.set(targetScale * flickerXY, targetScale * flickerXY, targetScale * flickerZ);
                flameBR.scale.set(targetScale * flickerXY, targetScale * flickerXY, targetScale * flickerZ);
            }

            if (isExperienceStarted) {
                ixGroup.rotation.y += 0.002;
            }
            ixGroup.rotation.z = Math.sin(time * 0.5) * 0.05;
            renderer.render(scene, camera);
        });

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updateShipScale();
        };
        window.addEventListener('resize', handleResize);

        // Uñstayawi qhana grid (Multi-color Warp lines / Tunnel effect with White Neon)
        const preloaderGrid = preloaderGridRef.current;
        if (!preloaderGrid) return;
        gsap.set(preloaderGrid, { opacity: 0.8 }); 
        const numLines = 60; 
        
        // CSS Hex Array for Neon Tunnel (Added White)
        const warpColors = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF9D', '#FF3366', '#9D00FF', '#FFFFFF'];

        function animateLine(line: HTMLDivElement, isInitial: boolean) {
            const angle = Math.random() * Math.PI * 2;
            const maxDist = Math.max(window.innerWidth, window.innerHeight);
            
            const radiusX = 100; 
            const radiusY = 30;  
            
            const boundaryDist = (radiusX * radiusY) / Math.sqrt(
                Math.pow(radiusY * Math.cos(angle), 2) + Math.pow(radiusX * Math.sin(angle), 2)
            );
            
            const startDist = boundaryDist - 5;
            const length = gsap.utils.random(50, 150);
            
            // Jank'aki sarnaqaña (Faster duration and spear-like shape when launching)
            const duration = isLaunching ? gsap.utils.random(0.08, 0.15) : gsap.utils.random(1.2, 3.0);
            const delay = isInitial ? gsap.utils.random(0, 3) : (isLaunching ? gsap.utils.random(0, 0.05) : gsap.utils.random(0, 0.5));

            // Select random neon color including white
            const color = warpColors[Math.floor(Math.random() * warpColors.length)];
            line.style.background = `linear-gradient(to right, transparent, ${color})`;
            line.style.filter = `drop-shadow(0 0 10px ${color})`;

            gsap.set(line, {
                left: '50%',
                top: '50%',
                width: length + 'px',
                rotation: angle * 180 / Math.PI,
                transformOrigin: '0% 50%',
                x: Math.cos(angle) * startDist, 
                y: Math.sin(angle) * startDist,
                z: -100,
                scaleX: isLaunching ? 0.2 : 0.05,
                scaleY: isLaunching ? 0.2 : 0.5,
                opacity: 0 
            });

            const tl = gsap.timeline({ 
                delay: delay,
                onComplete: () => {
                    if (!stopLines) {
                        animateLine(line, false);
                    } else {
                        line.remove(); // Jiwakha (Remove line when done)
                    }
                }
            });
            
            tl.to(line, {
                scaleX: isLaunching ? 1.5 : 0.5,
                opacity: gsap.utils.random(0.8, 1), 
                duration: duration * 0.2, 
                ease: "power2.out" 
            })
            .to(line, { 
                x: Math.cos(angle) * (maxDist * 1.5), 
                y: Math.sin(angle) * (maxDist * 1.5),
                z: isLaunching ? 1000 : 600,
                scaleX: isLaunching ? 8 : 2.5, // Hella wage (Spear-like stretch)
                scaleY: isLaunching ? 0.8 : 3, // Thinner when fast
                opacity: 0, 
                duration: duration * 0.8, 
                ease: isLaunching ? "none" : "expo.in" 
            }, "-=" + (duration * 0.1));
        }

        for (let i = 0; i < numLines; i++) {
            const line = document.createElement('div');
            line.classList.add('bg-falling-line');
            preloaderGrid.appendChild(line);
            animateLine(line, true);
        }

        // Ch'ikhiña sarnaqawi (Launch)
        const preloader = preloaderRef.current;
        const mainContent = mainContentRef.current;
        const glowDot = glowDotRef.current;

        function launchShip() {
            if (!mainContent || !preloader || !glowDot) return;

            shipFired = true;
            isLaunching = true;
            if (document.body) document.body.style.cursor = 'none';
            gsap.to([cursorDot, cursorFollower], { opacity: 0, duration: 0.2 });
            
            // Jank'aki sarnaqaña (Speed up existing lines to hyperdrive)
            gsap.getTweensOf('.bg-falling-line').forEach(tween => {
                gsap.to(tween, { timeScale: 20, duration: 0.5, ease: "power2.in" });
            });
            
            playInhale();
            
            const tl = gsap.timeline();
            
            tl.to(shipEngineLight, {
                intensity: 25, distance: 200, duration: 1.0
            }, 0)
            .to([flameTop.scale, flameBL.scale, flameBR.scale], {
                x: 3, y: 3, z: 6, duration: 1.0 
            }, 0)
            .to(shipGroup.position, {
                z: -300, 
                ease: "power3.in",
                duration: 1.5
            }, 0)
            .to(shipGroup.scale, {
                z: 15, x: 0.2, y: 0.2, 
                ease: "power3.in",
                duration: 1.5
            }, 0)
            .to(glowDot, { 
                opacity: 1, 
                scale: 10, 
                duration: 2.0, 
                ease: "power2.in" 
            }, 0.5)
            .call(() => { 
                playExhale(); 
            }, [], 2.0)
            .to(glowDot, { 
                scale: 150, 
                duration: 1.0, 
                ease: "expo.in"
            }, 2.5)
            .to('.bg-falling-line', { 
                opacity: 0, 
                duration: 0.2,
                onStart: () => { stopLines = true; } 
            }, 3.3)
            .to(preloaderGrid, { 
                opacity: 0, 
                duration: 0.2 
            }, 3.3)
            // Vurthakara viwaraya open wela iwarunata passe background elements okkoma hide kireema
            .call(() => {
                shipGroup.visible = false;
                if (preloaderGrid) preloaderGrid.style.display = 'none';
            }, [], 3.5)
            // Iwarunata passe front-end eka husma gannawa wage mathuweema
            .add(() => {
                mainContent.style.display = 'block';
                
                ixGroup.visible = true;
                ixGroup.rotation.set(0, 0, 0);
                isExperienceStarted = true;
                
                const revealTl = gsap.timeline();
                revealTl.fromTo(mainContent, 
                    { opacity: 0, scale: 1.05, filter: "blur(12px)" },
                    { opacity: 1, scale: 0.98, filter: "blur(0px)", duration: 1.2, ease: "power2.out" }
                ).to(mainContent, 
                    { scale: 1, duration: 1.2, ease: "elastic.out(1, 0.4)" }
                );
                
                lenis.start(); 
                initScrollAnimations();
            }, 3.5)
            // Ekama welawedi preloader eka (sudupata) fade out wenawa
            .to(preloader, {
                opacity: 0,
                duration: 1.2,
                ease: "power2.inOut",
                onComplete: () => {
                    if (preloader) preloader.style.display = 'none';
                    gsap.to([cursorDot, cursorFollower], { opacity: 1, duration: 0.5 }); 
                }
            }, 3.5);
        }

        const handleClick = () => {
            if (isHoveringShip && !shipFired) launchShip();
        };
        window.addEventListener('click', handleClick);

        const handleTouchStart = (e: TouchEvent) => {
            if (shipFired) return;
            const touchX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            const touchY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera({x: touchX, y: touchY}, camera);
            if (raycaster.intersectObject(hitbox).length > 0) {
                // Spaceship var click kelyas (Tap on ship)
                launchShip();
            } else {
                // Itar thikani click kelyas disha badalna (Look around on outside tap)
                lastTouchTime = Date.now();
                mouseNormX = touchX;
                mouseNormY = touchY;
                mouseX = e.touches[0].clientX;
                mouseY = e.touches[0].clientY;
                
                gsap.to(cursorDot, { x: mouseX, y: mouseY, duration: 0.1, ease: "power2.out" });
                gsap.to(cursorFollower, { x: mouseX, y: mouseY, duration: 0.6, ease: "power3.out" });
            }
        };
        window.addEventListener('touchstart', handleTouchStart, {passive: false});

        // Screen var bot firavlyas disha badalna (Update look direction on drag)
        const handleTouchMove = (e: TouchEvent) => {
            if (shipFired) return;
            lastTouchTime = Date.now();
            
            mouseNormX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouseNormY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
            
            gsap.to(cursorDot, { x: mouseX, y: mouseY, duration: 0.1, ease: "power2.out" });
            gsap.to(cursorFollower, { x: mouseX, y: mouseY, duration: 0.6, ease: "power3.out" });
        };
        window.addEventListener('touchmove', handleTouchMove, {passive: false});

        // Scroll Sarnaqawi
        gsap.registerPlugin(ScrollTrigger);

        function initScrollAnimations() {
            gsap.to('.scroll-indicator', {
                opacity: 0,
                y: -20,
                scrollTrigger: {
                    trigger: document.body,
                    start: "top top",
                    end: "top -10%",
                    scrub: true
                }
            });

            gsap.to(ixGroup.rotation, {
                x: Math.PI * 2,
                y: Math.PI * 4,
                ease: "none",
                scrollTrigger: {
                    trigger: document.body,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1
                }
            });

            gsap.to(ixGroup.position, {
                y: 5, 
                z: -5, 
                ease: "none",
                scrollTrigger: {
                    trigger: document.body,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1
                }
            });

            const scaleTl = gsap.timeline({
                scrollTrigger: {
                    trigger: document.body,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1
                }
            });
            
            scaleTl.to(ixGroup.scale, { x: 0.4, y: 0.4, z: 0.4, ease: "power1.inOut", duration: 1 })
                   .to(ixGroup.scale, { x: 1, y: 1, z: 1, ease: "power1.inOut", duration: 1 });

            gsap.utils.toArray('.breathe-element').forEach(el => {
                gsap.fromTo(el as HTMLElement, 
                    { scale: 0.9, opacity: 0, y: 50 },
                    {
                        scale: 1, opacity: 1, y: 0,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: el as HTMLElement,
                            start: "top 85%", 
                            end: "top 50%",   
                            scrub: 1
                        }
                    }
                );
            });

            gsap.to(document.body, {
                backgroundColor: "#0a0c10", 
                ease: "none",
                scrollTrigger: {
                    trigger: document.body,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: true
                }
            });
            
            gsap.to(pointLight1.color, {
                r: 0.0, g: 1.0, b: 0.6, 
                ease: "none",
                scrollTrigger: {
                    trigger: document.body,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: true
                }
            });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('deviceorientation', handleOrientation);
            gsap.ticker.remove((time) => {});
        }
    }, []);

    return (
        <>
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

                <section>
                    <div className="breathe-element" style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <h2 style={{fontSize: '2rem', marginBottom: '40px', letterSpacing: '0.2em', textTransform: 'uppercase'}}>{content.live.title}</h2>
                        <div className="video-wrapper">
                            <div className="video-placeholder" style={{background: 'radial-gradient(circle at center, var(--surface-color) 0%, var(--bg-color) 100%)'}}></div>
                        </div>
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
