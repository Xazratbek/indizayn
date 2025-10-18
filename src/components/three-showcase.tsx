"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import type { Designer } from '@/lib/types';
import imageData from '@/lib/placeholder-images.json';

const allImages = imageData.placeholderImages;

interface ThreeShowcaseProps {
  designers: Designer[];
}

const ThreeShowcase: React.FC<ThreeShowcaseProps> = ({ designers }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const contentGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current || !containerRef.current) return;
    if (sceneRef.current) return; // Initialize only once

    const TMath = THREE.MathUtils;
    let localMouse = { x: 0, y: 0 };
    const CARD_COUNT = designers.length;
    const RADIUS = 3.5;
    const CARD_WIDTH = 1.2;
    const CARD_HEIGHT = 1.2 * 0.75;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const contentGroup = new THREE.Group();
    scene.add(contentGroup);
    contentGroupRef.current = contentGroup;
    contentGroup.position.z = 0.5;

    const textureLoader = new THREE.TextureLoader();
    const cards: THREE.Mesh[] = [];

    designers.forEach((designer, i) => {
      const designerAvatar = allImages.find(img => img.id === designer.avatarId);
      if (designerAvatar) {
        const texture = textureLoader.load(designerAvatar.imageUrl);
        const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const card = new THREE.Mesh(geometry, material);

        const angle = (i / CARD_COUNT) * Math.PI * 2;
        card.position.set(Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS);
        card.lookAt(0, 0, 0);
        
        // Store designer data on the object
        card.userData = { id: designer.id };
        
        contentGroup.add(card);
        cards.push(card);
      }
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      localMouse.x = mouse.x;
      localMouse.y = mouse.y;
    };
    
    let hoveredObject: THREE.Object3D | null = null;
    const onClick = (event: MouseEvent) => {
        if(hoveredObject && hoveredObject.userData.id) {
            containerRef.current?.querySelector(`a[data-designer-id="${hoveredObject.userData.id}"]`)?.click();
        }
    };

    mountRef.current.addEventListener('mousemove', onMouseMove);
    mountRef.current.addEventListener('click', onClick);


    const handleResize = () => {
      if (mountRef.current) {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Automatic rotation + mouse follow
      contentGroup.rotation.y = elapsedTime * 0.15 + localMouse.x * 0.1;
      
      // Animate camera for depth
      camera.position.z = 5 - Math.sin(elapsedTime * 0.3) * 0.3;

      // Raycasting for hover effect
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cards);

      if (intersects.length > 0) {
        if(hoveredObject !== intersects[0].object) {
            if(hoveredObject) {
                // @ts-ignore
                hoveredObject.material.color.set(0xffffff);
            }
            hoveredObject = intersects[0].object;
            // @ts-ignore
            hoveredObject.material.color.set(0xcccccc);
            mountRef.current!.style.cursor = 'pointer';
        }
      } else {
        if(hoveredObject) {
            // @ts-ignore
            hoveredObject.material.color.set(0xffffff);
        }
        hoveredObject = null;
        mountRef.current!.style.cursor = 'default';
      }


      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', onMouseMove);
        mountRef.current.removeEventListener('click', onClick);
        if(renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      window.removeEventListener('resize', handleResize);
      
      // Cleanup THREE.js objects
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if(Array.isArray(object.material)) {
             object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      sceneRef.current = null;
    };
  }, [designers]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 opacity-20 dark:opacity-10">
        <div ref={mountRef} className="w-full h-full" />
        {/* Hidden links for navigation */}
        <div style={{ display: 'none' }}>
            {designers.map(d => (
                <Link key={d.id} href={`/designers/${d.id}`} data-designer-id={d.id} aria-hidden="true" tabIndex={-1}>
                    {d.name}
                </Link>
            ))}
        </div>
    </div>
  );
};

export default ThreeShowcase;
