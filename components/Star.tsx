
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS } from '../types';

interface StarProps {
  progress: number;
}

const Star: React.FC<StarProps> = ({ progress }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Create 5-pointed star shape
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.2;
    const innerRadius = 0.5; // Thinner for sharper points
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Bobbing motion
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = (CONSTANTS.TREE_HEIGHT / 2 + 1.2) + Math.sin(t * 2) * 0.1;
    groupRef.current.rotation.y = t * 0.8;
    
    // Scale up when tree is formed, disappear when scattered
    const targetScale = progress > 0.8 ? 1 : 0;
    const currentScale = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05);
    groupRef.current.scale.setScalar(currentScale);
    
    // Update light intensity based on scale
    if (lightRef.current) {
        lightRef.current.intensity = currentScale * 3.0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Real Light Source for the top of tree */}
      <pointLight 
        ref={lightRef}
        distance={30} 
        decay={2} 
        color="#fff5cc" 
        intensity={3}
      />

      {/* Main Star Body - Emissive for Bloom */}
      <mesh geometry={starGeometry}>
        <meshStandardMaterial 
            color={CONSTANTS.COLORS.GOLD_METALLIC} 
            emissive={CONSTANTS.COLORS.GLOW}
            emissiveIntensity={3.0} // High intensity for bloom
            toneMapped={false}
            roughness={0.1}
            metalness={1.0}
        />
      </mesh>
      
      {/* Edges for extra definition */}
      <mesh geometry={starGeometry} scale={[1.02, 1.02, 1.02]}>
         <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default Star;
