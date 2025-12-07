
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeState } from '../types';
import TreeElements from './Ornaments';
import Star from './Star';

interface ExperienceProps {
  treeState: TreeState;
}

const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  const isTree = treeState === TreeState.TREE_SHAPE;
  const targetProgress = isTree ? 1 : 0;
  
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle rotation of the whole system
      const rotSpeed = isTree ? 0.05 : 0.02;
      groupRef.current.rotation.y += rotSpeed * delta;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 35]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minDistance={15} 
        maxDistance={60} 
        maxPolarAngle={Math.PI / 1.5} // Prevent going too low
        autoRotate={isTree}
        autoRotateSpeed={0.8}
        enableDamping
      />

      {/* LUXURY LIGHTING SETUP */}
      <ambientLight intensity={0.1} />
      
      {/* Main Key Light (Warm Gold) */}
      <spotLight
        position={[20, 30, 20]}
        angle={0.25}
        penumbra={0.5}
        intensity={2.5}
        color="#ffeebb"
        castShadow
        shadow-bias={-0.0001}
      />
      
      {/* Fill Light (Cooler to contrast gold) */}
      <pointLight position={[-20, 10, -20]} intensity={1} color="#cceeff" />

      {/* Rim Light for edge definition */}
      <spotLight position={[0, 40, -10]} angle={0.5} intensity={1.5} color="#ffd700" />

      {/* Environment for reflections (Gold needs things to reflect) */}
      <Environment preset="city" environmentIntensity={0.8} />

      {/* SCENE CONTENT */}
      <group ref={groupRef} position={[0, -2, 0]}>
        <TreeElements progress={targetProgress} />
        <Star progress={targetProgress} />
      </group>

      {/* POST PROCESSING */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={1.1} // Higher threshold so only Star and glints glow
          mipmapBlur 
          intensity={0.8} 
          radius={0.5} 
        />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.1} darkness={0.7} />
      </EffectComposer>
      
      {/* BACKGROUND */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </>
  );
};

export default Experience;
