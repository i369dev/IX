'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const MaintenancePage = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let animationFrameId: number;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 15;

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
        scene.add(ixGroup);
        
        ixGroup.scale.set(1.2, 1.2, 1.2);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight1 = new THREE.PointLight(0xdcffdc, 3, 50);
        pointLight1.position.set(-5, 5, 5);
        scene.add(pointLight1);
        
        const animate = (time: number) => {
            time *= 0.001; // convert time to seconds
            ixGroup.rotation.y = time * 0.15;
            ixGroup.rotation.x = Math.sin(time * 0.25) * 0.05;
            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(animate);
        };
        animate(0);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            // Proper cleanup for Three.js
            scene.remove(ixGroup);
            iGeometry.dispose();
            xLegGeo.dispose();
            faceMaterial.dispose();
            edgeMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-background text-center">
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />
            <div className="z-10 px-4">
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                    Our sincere apologies, this website is currently undergoing essential updates. Please check back shortly.
                </h2>
            </div>
        </div>
    );
};

export default MaintenancePage;
