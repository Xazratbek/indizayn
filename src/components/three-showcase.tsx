"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeShowcase: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    let scene: THREE.Scene | null = new THREE.Scene();

    const currentMount = mountRef.current;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 50;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Particles
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const palette = [
        new THREE.Color(0xFF69B4), // Pink
        new THREE.Color(0x9370DB), // Purple
        new THREE.Color(0x32CD32), // Green
        new THREE.Color(0xFFFF00)  // Yellow
    ];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        posArray[i3] = (Math.random() - 0.5) * 100;
        posArray[i3 + 1] = (Math.random() - 0.5) * 100;
        posArray[i3 + 2] = (Math.random() - 0.5) * 100;
        
        velocities[i3] = (Math.random() - 0.5) * 0.1;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;

        const randomColor = palette[Math.floor(Math.random() * palette.length)];
        colors[i3] = randomColor.r;
        colors[i3 + 1] = randomColor.g;
        colors[i3 + 2] = randomColor.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.25,
        vertexColors: true,
        sizeAttenuation: true
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Lines
    const linesGeometry = new THREE.BufferGeometry();
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2
    });
    const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(linesMesh);

    // Mouse interaction
    const mouse = new THREE.Vector2(-100, -100);
    const onMouseMove = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    currentMount.addEventListener('mousemove', onMouseMove);

    // Resize handler
    const handleResize = () => {
      if (currentMount) {
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const positions = (particlesMesh.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      
      const linePositions = [];
      const connectionDistance = 20;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Update position
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];

        // Bounce off walls
        if (positions[i3] > 50 || positions[i3] < -50) velocities[i3] *= -1;
        if (positions[i3 + 1] > 50 || positions[i3 + 1] < -50) velocities[i3 + 1] *= -1;

        // Connect to other particles
        for(let j = i + 1; j < particleCount; j++) {
            const j3 = j * 3;
            const dx = positions[i3] - positions[j3];
            const dy = positions[i3 + 1] - positions[j3 + 1];
            const dz = positions[i3 + 2] - positions[j3 + 2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < connectionDistance) {
                linePositions.push(positions[i3], positions[i3 + 1], positions[i3 + 2]);
                linePositions.push(positions[j3], positions[j3 + 1], positions[j3 + 2]);
            }
        }
      }

      (linesMesh.geometry as THREE.BufferGeometry).setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      particlesMesh.geometry.attributes.position.needsUpdate = true;

      // Mouse interaction - slightly pan camera
      camera.position.x += (mouse.x * 5 - camera.position.x) * .05;
      camera.position.y += (-mouse.y * 5 - camera.position.y) * .05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if(currentMount) {
        currentMount.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', handleResize);
        if (renderer.domElement.parentElement) {
            renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
      }
      
      scene?.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
          if(object.geometry) object.geometry.dispose();
          
          if (Array.isArray(object.material)) {
             object.material.forEach(material => material.dispose());
          } else if(object.material) {
            object.material.dispose();
          }
        }
      });
      scene = null;
      renderer.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20">
        <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};

export default ThreeShowcase;
