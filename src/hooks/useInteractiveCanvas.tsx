'use client';

import React, { useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

interface UseInteractiveCanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    cursorDotRef: React.RefObject<HTMLDivElement>;
    cursorFollowerRef: React.RefObject<HTMLDivElement>;
    preloaderGridRef: React.RefObject<HTMLDivElement>;
    glowDotRef: React.RefObject<HTMLDivElement>;
    mainContentRef: React.RefObject<HTMLDivElement>;
    preloaderRef: React.RefObject<HTMLDivElement>;
    muteButtonRef: React.RefObject<HTMLDivElement>;
    enterButtonRef: React.RefObject<HTMLButtonElement>;
    playInhale: () => void;
    playExhale: () => void;
}

export function useInteractiveCanvas({
    canvasRef,
    cursorDotRef,
    cursorFollowerRef,
    preloaderGridRef,
    glowDotRef,
    mainContentRef,
    preloaderRef,
    muteButtonRef,
    enterButtonRef,
    playInhale,
    playExhale
}: UseInteractiveCanvasProps) {
    const audioRefs = React.useRef({ playInhale, playExhale });
    React.useEffect(() => {
        audioRefs.current = { playInhale, playExhale };
    }, [playInhale, playExhale]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const body = document.body;
        gsap.registerPlugin(ScrollTrigger);

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothTouch: false,
            syncTouch: true
        });

        if (prefersReducedMotion) {
            lenis.stop();
        } else {
            lenis.stop();
        }

        // Uñch'ukiña (Cursor)
        const cursorDot = cursorDotRef.current;
        const cursorFollower = cursorFollowerRef.current;
        
        if (prefersReducedMotion) {
            if(cursorDot) cursorDot.style.display = 'none';
            if(cursorFollower) cursorFollower.style.display = 'none';
        } else {
            gsap.set(cursorDot, { xPercent: -50, yPercent: -50 });
            gsap.set(cursorFollower, { xPercent: -50, yPercent: -50 });
        }

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let mouseNormX = 0;
        let mouseNormY = 0;
        let lastTouchTime = 0;

        const handleMouseMove = (e: MouseEvent) => {
            if (prefersReducedMotion) return;
            mouseX = e.clientX;
            mouseY = e.clientY;
            mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseNormY = -(e.clientY / window.innerHeight) * 2 + 1;
            gsap.to(cursorDot, { x: mouseX, y: mouseY, duration: 0.1, ease: "power2.out" });
            gsap.to(cursorFollower, { x: mouseX, y: mouseY, duration: 0.6, ease: "power3.out" });
        };
        window.addEventListener('mousemove', handleMouseMove);

        function handleOrientation(e: DeviceOrientationEvent) {
            if (Date.now() - lastTouchTime < 2000) return;
            if (e.gamma !== null && e.beta !== null) {
                let gamma = e.gamma;
                let beta = e.beta;
                let normX = gamma / 35; 
                let normY = (beta - 45) / 35; 
                mouseNormX = Math.max(-1, Math.min(1, normX));
                mouseNormY = -Math.max(-1, Math.min(1, normY)); 
            }
        }
        
        const requestSensorAccess = () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                (DeviceOrientationEvent as any).requestPermission()
                    .then((permissionState: string) => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation);
                        }
                    })
                    .catch((err) => {
                        console.warn("Gyroscope permission denied by user.", err);
                    });
            } else {
                 window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        window.addEventListener('touchstart', requestSensorAccess, { once: true });
        window.addEventListener('click', requestSensorAccess, { once: true });

        document.querySelectorAll('button, .video-wrapper, a').forEach(el => {
            const mouseEnterHandler = () => {
                if (prefersReducedMotion) return;
                gsap.to(cursorFollower, { width: 60, height: 60, backgroundColor: 'rgba(0, 255, 157, 0.1)', borderColor: 'rgba(0, 255, 157, 0.5)', duration: 0.3 });
            };
            const mouseLeaveHandler = () => {
                if (prefersReducedMotion) return;
                gsap.to(cursorFollower, { width: 30, height: 30, backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.4)', duration: 0.3 });
            };
            el.addEventListener('mouseenter', mouseEnterHandler);
            el.addEventListener('mouseleave', mouseLeaveHandler);
        });

        // 3D Canvas
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 15;

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // IX Luraña
        const ixGroup = new THREE.Group();
        const faceMaterial = new THREE.MeshPhysicalMaterial({ color: 0x050a05, metalness: 0.8, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1 });
        const edgeMaterial = new THREE.MeshPhysicalMaterial({ color: 0x22c55e, metalness: 0.5, roughness: 0.2, emissive: 0x001100 });
        const boxMaterials = [edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, faceMaterial, faceMaterial];
        const iGeometry = new THREE.BoxGeometry(1.6, 6, 1.2);
        const iMesh = new THREE.Mesh(iGeometry, boxMaterials);
        iMesh.position.x = -2.8;
        ixGroup.add(iMesh);
        const xGroup = new THREE.Group();
        const xLegGeo = new THREE.BoxGeometry(1.6, 7.5, 1.2);
        const xLeg1 = new THREE.Mesh(xLegGeo, boxMaterials);
        xLeg1.rotation.z = Math.PI / 5.5; 
        const xLeg2 = new THREE.Mesh(xLegGeo, boxMaterials);
        xLeg2.rotation.z = -Math.PI / 5.5;
        xGroup.add(xLeg1, xLeg2);
        xGroup.position.x = 2.2;
        ixGroup.add(xGroup);
        ixGroup.visible = false;
        scene.add(ixGroup);

        const shipGroup = new THREE.Group();
        const darkMetal = new THREE.MeshPhysicalMaterial({ color: 0x050806, metalness: 1.0, roughness: 0.15, clearcoat: 1.0, clearcoatRoughness: 0.1, side: THREE.DoubleSide });
        const neonGreen = new THREE.MeshBasicMaterial({ color: 0x00FF77 });
        const bodyGeo = new THREE.CylinderGeometry(0.7, 1.2, 3.5, 32);
        bodyGeo.rotateX(-Math.PI / 2);
        shipGroup.add(new THREE.Mesh(bodyGeo, darkMetal));
        const noseGeo = new THREE.ConeGeometry(0.7, 2.0, 32);
        noseGeo.rotateX(-Math.PI / 2);
        const noseMesh = new THREE.Mesh(noseGeo, darkMetal);
        noseMesh.position.set(0, 0, -2.75);
        shipGroup.add(noseMesh);
        const wingShape = new THREE.Shape().moveTo(0, 0).lineTo(4.5, 2.5).lineTo(4.5, 3.2).lineTo(0, 3.2);
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
        const wingEdge = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.1, 0.3), neonGreen);
        wingEdge.position.set(0, 0, 2.3);
        shipGroup.add(wingEdge);
        const tailShape = new THREE.Shape().moveTo(0, 0).lineTo(0.5, 2.0).lineTo(1.5, 2.0).lineTo(2.0, 0);
        const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.15, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
        const tailMesh = new THREE.Mesh(tailGeo, darkMetal);
        tailMesh.rotation.y = -Math.PI / 2;
        tailMesh.position.set(0.075, 0.6, 0.5);
        shipGroup.add(tailMesh);
        const tailEdge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.0, 0.2), neonGreen);
        tailEdge.rotation.x = Math.PI / 8;
        tailEdge.position.set(0, 1.7, 2.3); 
        shipGroup.add(tailEdge);
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.4 });
        const thrusterGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.0, 32);
        thrusterGeo.rotateX(Math.PI / 2);
        const engTop = new THREE.Mesh(thrusterGeo, engineMat); engTop.position.set(0, 0.7, 2.5); shipGroup.add(engTop);
        const engBL = new THREE.Mesh(thrusterGeo, engineMat); engBL.position.set(-0.7, -0.4, 2.5); shipGroup.add(engBL);
        const engBR = new THREE.Mesh(thrusterGeo, engineMat); engBR.position.set(0.7, -0.4, 2.5); shipGroup.add(engBR);
        const ringGeo = new THREE.TorusGeometry(0.5, 0.05, 16, 32);
        const engRingTop = new THREE.Mesh(ringGeo, neonGreen); engRingTop.position.set(0, 0.7, 3.0); shipGroup.add(engRingTop);
        const engRingBL = new THREE.Mesh(ringGeo, neonGreen); engRingBL.position.set(-0.7, -0.4, 3.0); shipGroup.add(engRingBL);
        const engRingBR = new THREE.Mesh(ringGeo, neonGreen); engRingBR.position.set(0.7, -0.4, 3.0); shipGroup.add(engRingBR);
        const flameGeo = new THREE.CylinderGeometry(0.4, 0.05, 2.5, 32); flameGeo.rotateX(-Math.PI / 2);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0x00FFaa, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
        const coreGeo = new THREE.CylinderGeometry(0.2, 0.02, 2.0, 16); coreGeo.rotateX(-Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
        const createFlame = (x: number, y: number, z: number) => {
            const group = new THREE.Group();
            const outer = new THREE.Mesh(flameGeo, flameMat); outer.position.set(0, 0, 1.25);
            const inner = new THREE.Mesh(coreGeo, coreMat); inner.position.set(0, 0, 1.0);
            group.add(outer, inner); group.position.set(x, y, z); return group;
        };
        const flameTop = createFlame(0, 0.7, 2.8); shipGroup.add(flameTop);
        const flameBL = createFlame(-0.7, -0.4, 2.8); shipGroup.add(flameBL);
        const flameBR = createFlame(0.7, -0.4, 2.8); shipGroup.add(flameBR);
        const shipEngineLight = new THREE.PointLight(0x00FFaa, 3.0, 25);
        shipEngineLight.position.set(0, 0, 4.0); shipGroup.add(shipEngineLight);
        const reflectionGroup = new THREE.Group(); shipGroup.add(reflectionGroup);
        const neonPalette = [0x00FFFF, 0xFF00FF, 0xFFFF00, 0x00FF9D, 0x9D00FF];
        neonPalette.forEach((c, i) => {
            const light = new THREE.PointLight(c, 1.5, 10);
            const angle = (i / neonPalette.length) * Math.PI * 2;
            light.position.set(Math.cos(angle) * 3, Math.sin(angle) * 3, 0);
            reflectionGroup.add(light);
        });
        const hitboxGeo = new THREE.SphereGeometry(4, 16, 16);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        shipGroup.add(hitbox);
        shipGroup.position.set(0, 0, 3);
        scene.add(shipGroup);

        const buttonAnchor = new THREE.Object3D();
        buttonAnchor.position.set(0, -3.2, 0);
        shipGroup.add(buttonAnchor);

        function updateShipScale() {
            let scaleFact = Math.min(window.innerWidth / 2400, window.innerHeight / 1600); 
            if(window.innerWidth < 768) scaleFact *= 1.3;
            shipGroup.scale.set(scaleFact, scaleFact, scaleFact);
        }
        updateShipScale();
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); scene.add(ambientLight);
        const pointLight1 = new THREE.PointLight(0xdcffdc, 3, 50); pointLight1.position.set(-5, 5, 5); scene.add(pointLight1);
        let isExperienceStarted = false; let shipFired = false; let isHoveringShip = false; let isLaunching = false; let stopLines = false;
        const raycaster = new THREE.Raycaster();
        lenis.on('scroll', ScrollTrigger.update);
        
        const renderLoop = (time: number) => {
            if (!prefersReducedMotion) lenis.raf(time * 1000);

            if (!shipFired) {
                const enterButton = enterButtonRef.current;
                if (enterButton) {
                    const vector = new THREE.Vector3();
                    buttonAnchor.getWorldPosition(vector);
                    vector.project(camera);
                    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.width;
                    const y = (vector.y * -0.5 + 0.5) * renderer.domElement.height;
                    enterButton.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
                }

                shipGroup.position.y = Math.sin(time * 2) * 0.15;
                gsap.to(shipGroup.rotation, { y: -mouseNormX * 0.3, x: mouseNormY * 0.3, duration: 0.5 });
                reflectionGroup.rotation.z = time * 2;
                reflectionGroup.position.z = (time * 12) % 8 - 4;
                raycaster.setFromCamera({x: mouseNormX, y: mouseNormY}, camera);
                const intersects = raycaster.intersectObject(hitbox);
                if (intersects.length > 0) {
                    if(!isHoveringShip) {
                        isHoveringShip = true; 
                        if (enterButtonRef.current) enterButtonRef.current.style.cursor = 'pointer';
                        gsap.to(cursorFollower, { width: 60, height: 60, backgroundColor: 'rgba(0, 255, 157, 0.2)', borderColor: 'rgba(0, 255, 157, 0.8)', duration: 0.3 });
                    }
                } else {
                    if(isHoveringShip) {
                        isHoveringShip = false; 
                        if (enterButtonRef.current) enterButtonRef.current.style.cursor = 'default';
                        gsap.to(cursorFollower, { width: 30, height: 30, backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.4)', duration: 0.3 });
                    }
                }
                let flickerZ = 1 + Math.sin(time * 40) * 0.15 + Math.random() * 0.1;
                let flickerXY = 1 + Math.sin(time * 30) * 0.05 + Math.random() * 0.05;
                let targetScale = isHoveringShip ? 1.2 : 1.0;
                flameTop.scale.set(targetScale * flickerXY, targetScale * flickerXY, targetScale * flickerZ);
                flameBL.scale.set(targetScale * flickerXY, targetScale * flickerXY, targetScale * flickerZ);
                flameBR.scale.set(targetScale * flickerXY, targetScale * flickerXY, targetScale * flickerZ);
            }
            if (isExperienceStarted) ixGroup.rotation.y += 0.002;
            ixGroup.rotation.z = Math.sin(time * 0.5) * 0.05;
            renderer.render(scene, camera);
        };
        gsap.ticker.add(renderLoop);
        gsap.ticker.lagSmoothing(0);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updateShipScale();
        };
        window.addEventListener('resize', handleResize);

        const preloaderGrid = preloaderGridRef.current;
        if (!preloaderGrid) return;
        gsap.set(preloaderGrid, { opacity: 0.8 }); 
        const numLines = 60; 
        const warpColors = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF9D', '#FF3366', '#9D00FF', '#FFFFFF'];

        function animateLine(line: HTMLDivElement, isInitial: boolean) {
            const angle = Math.random() * Math.PI * 2;
            const maxDist = Math.max(window.innerWidth, window.innerHeight);
            const radiusX = 100, radiusY = 30;
            const boundaryDist = (radiusX * radiusY) / Math.sqrt(Math.pow(radiusY * Math.cos(angle), 2) + Math.pow(radiusX * Math.sin(angle), 2));
            const startDist = boundaryDist - 5;
            const length = gsap.utils.random(50, 150);
            const duration = isLaunching ? gsap.utils.random(0.08, 0.15) : gsap.utils.random(1.2, 3.0);
            const delay = isInitial ? gsap.utils.random(0, 3) : (isLaunching ? gsap.utils.random(0, 0.05) : gsap.utils.random(0, 0.5));
            const color = warpColors[Math.floor(Math.random() * warpColors.length)];
            line.style.background = `linear-gradient(to right, transparent, ${color})`;
            line.style.filter = `drop-shadow(0 0 10px ${color})`;
            gsap.set(line, { left: '50%', top: '50%', width: length + 'px', rotation: angle * 180 / Math.PI, transformOrigin: '0% 50%', x: Math.cos(angle) * startDist, y: Math.sin(angle) * startDist, z: -100, scaleX: isLaunching ? 0.2 : 0.05, scaleY: isLaunching ? 0.2 : 0.5, opacity: 0 });
            const tl = gsap.timeline({ delay, onComplete: () => { if (!stopLines) animateLine(line, false); else line.remove(); } });
            tl.to(line, { scaleX: isLaunching ? 1.5 : 0.5, opacity: gsap.utils.random(0.8, 1), duration: duration * 0.2, ease: "power2.out" })
            .to(line, { x: Math.cos(angle) * (maxDist * 1.5), y: Math.sin(angle) * (maxDist * 1.5), z: isLaunching ? 1000 : 600, scaleX: isLaunching ? 8 : 2.5, scaleY: isLaunching ? 0.8 : 3, opacity: 0, duration: duration * 0.8, ease: isLaunching ? "none" : "expo.in" }, "-=" + (duration * 0.1));
        }

        if (!prefersReducedMotion) {
            for (let i = 0; i < numLines; i++) {
                const line = document.createElement('div');
                line.classList.add('bg-falling-line');
                preloaderGrid.appendChild(line);
                animateLine(line, true);
            }
        }

        const preloader = preloaderRef.current;
        const mainContent = mainContentRef.current;
        const glowDot = glowDotRef.current;
        const enterButton = enterButtonRef.current;
        
        if (enterButton && !prefersReducedMotion) {
            gsap.to(enterButton, { opacity: 1, duration: 1.5, delay: 0.5, ease: 'power2.out' });
        }


        function launchShip() {
            const muteButton = muteButtonRef.current;
            if (!mainContent || !preloader || !glowDot || shipFired) return;
            window.removeEventListener('touchstart', handleTouchStart, { passive: false } as AddEventListenerOptions);
            if (enterButton) enterButton.removeEventListener('click', launchShip);

            shipFired = true;

            if (prefersReducedMotion) {
                showMainContent();
                if (muteButton) muteButton.style.display = 'none';
                if (enterButton) enterButton.style.display = 'none';
                return;
            }

            isLaunching = true;
            body.classList.remove('main-page-cursor');
            gsap.to([cursorDot, cursorFollower, enterButton], { opacity: 0, duration: 0.2 });
            gsap.getTweensOf('.bg-falling-line').forEach(tween => gsap.to(tween, { timeScale: 20, duration: 0.5, ease: "power2.in" }));
            audioRefs.current.playInhale();
            const tl = gsap.timeline();
            tl.to(shipEngineLight, { intensity: 25, distance: 200, duration: 1.0 }, 0)
            .to([flameTop.scale, flameBL.scale, flameBR.scale], { x: 3, y: 3, z: 6, duration: 1.0 }, 0)
            .to(shipGroup.position, { z: -300, ease: "power3.in", duration: 1.5 }, 0)
            .to(shipGroup.scale, { z: 15, x: 0.2, y: 0.2, ease: "power3.in", duration: 1.5 }, 0)
            .to(glowDot, { opacity: 1, scale: 10, duration: 2.0, ease: "power2.in" }, 0.5)
            .call(audioRefs.current.playExhale, [], 2.0)
            .to(glowDot, { scale: 150, duration: 1.0, ease: "expo.in" }, 2.5)
            .to('.bg-falling-line', { opacity: 0, duration: 0.2, onStart: () => { stopLines = true; } }, 3.3)
            .to(preloaderGrid, { opacity: 0, duration: 0.2 }, 3.3)
            .call(() => { shipGroup.visible = false; if (preloaderGrid) preloaderGrid.style.display = 'none'; }, [], 3.5)
            .add(() => showMainContent(), 3.5)
            .to(preloader, { opacity: 0, duration: 1.2, ease: "power2.inOut", onComplete: () => { if (preloader) preloader.style.display = 'none'; body.classList.add('main-page-cursor'); gsap.to([cursorDot, cursorFollower], { opacity: 1, duration: 0.5 }); } }, 3.5)
            .to(muteButton, { 
                opacity: 0, 
                duration: 0.5, 
                onComplete: () => { 
                    if(muteButton) muteButton.style.display = 'none'; 
                } 
            }, 3.5);
        }

        function showMainContent() {
            if (!mainContent) return;
            mainContent.style.display = 'block';
            ixGroup.visible = true;
            ixGroup.rotation.set(0, 0, 0);
            isExperienceStarted = true;
            const revealTl = gsap.timeline();
            revealTl.fromTo(mainContent, { opacity: 0, scale: 1.05, filter: "blur(12px)" }, { opacity: 1, scale: 0.98, filter: "blur(0px)", duration: 1.2, ease: "power2.out" })
                  .to(mainContent, { scale: 1, duration: 1.2, ease: "elastic.out(1, 0.4)" });
            lenis.start(); 
            if (!prefersReducedMotion) {
                initScrollAnimations();
            } else {
                gsap.set(mainContent, { opacity: 1, scale: 1, filter: "blur(0px)" });
                gsap.set('.breathe-element', { opacity: 1, scale: 1, y: 0 });
            }
        }
        
        if (enterButton) {
            enterButton.addEventListener('click', launchShip);
        }

        const handleWindowClick = (e: MouseEvent) => {
            if (isHoveringShip && !shipFired) {
                // Prevent click on enterButton from also triggering this
                if(e.target !== enterButton) {
                    launchShip();
                }
            }
        };
        window.addEventListener('click', handleWindowClick);

        const handleTouchStart = (e: TouchEvent) => {
            if (shipFired) {
                window.removeEventListener('touchstart', handleTouchStart, { passive: false } as AddEventListenerOptions);
                return;
            };

            if (e.touches.length > 1) return;
            if (e.target === enterButton) return;
        
            const touchX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            const touchY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera({x: touchX, y: touchY}, camera);
            if (raycaster.intersectObject(hitbox).length > 0) {
                launchShip();
            } else {
                lastTouchTime = Date.now();
                mouseNormX = touchX;
                mouseNormY = touchY;
            }
        };
        window.addEventListener('touchstart', handleTouchStart, {passive: false});

        function initScrollAnimations() {
            gsap.to('.scroll-indicator', { opacity: 0, y: -20, scrollTrigger: { trigger: document.body, start: "top top", end: "top -10%", scrub: true } });
            gsap.to(ixGroup.rotation, { x: Math.PI * 2, y: Math.PI * 4, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 } });
            gsap.to(ixGroup.position, { y: 5, z: -5, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 } });
            const scaleTl = gsap.timeline({ scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 } });
            scaleTl.to(ixGroup.scale, { x: 0.4, y: 0.4, z: 0.4, ease: "power1.inOut", duration: 1 }).to(ixGroup.scale, { x: 1, y: 1, z: 1, ease: "power1.inOut", duration: 1 });
            gsap.utils.toArray('.breathe-element').forEach(el => {
                gsap.fromTo(el as HTMLElement, { scale: 0.9, opacity: 0, y: 50 }, { scale: 1, opacity: 1, y: 0, ease: "power2.out", scrollTrigger: { trigger: el as HTMLElement, start: "top 85%", end: "top 50%", scrub: 1 } });
            });
            gsap.to(document.body, { backgroundColor: "#0a0c10", ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true } });
            gsap.to(pointLight1.color, { r: 0.0, g: 1.0, b: 0.6, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true } });
        }
        
        if (prefersReducedMotion) {
            launchShip();
        }

        return () => {
            body.classList.remove('main-page-cursor');
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('click', handleWindowClick);
            window.removeEventListener('touchstart', handleTouchStart);
            if(enterButton) enterButton.removeEventListener('click', launchShip);
            window.removeEventListener('deviceorientation', handleOrientation);
            gsap.ticker.remove(renderLoop);
            lenis.destroy();
            ScrollTrigger.killAll();
        }
    }, []);
}
