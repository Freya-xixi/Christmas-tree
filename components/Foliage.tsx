
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS } from '../types';

const foliageVertexShader = `
  uniform float uTime;
  uniform float uProgress;
  
  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;
  attribute float aSize;
  
  varying float vAlpha;
  varying vec3 vPos;
  varying float vRandom;

  // Quartic easing to match Ornaments.tsx exactly
  float easeOutQuart(float x) {
    return 1.0 - pow(1.0 - x, 4.0);
  }

  void main() {
    float easedProgress = easeOutQuart(uProgress);
    
    // 0. Base interpolation
    vec3 basePos = mix(aScatterPos, aTreePos, easedProgress);
    
    // 1. SCATTER FLOAT (Large drifting motion when scattered)
    // Inverse progress: 1.0 when scattered, 0.0 when tree
    float floatState = 1.0 - easedProgress; 
    
    // Complex drifting turbulence
    float t = uTime * 0.5; // Increased speed for visibility
    float noise = aRandom * 20.0;
    
    // Use different frequencies for x,y,z to create non-linear organic motion
    // GREATLY Increased amplitude to ensure they really float around
    float driftX = sin(t + basePos.y * 0.05 + noise) * 15.0 * floatState;
    float driftY = cos(t * 0.7 + basePos.x * 0.05 + noise) * 10.0 * floatState;
    float driftZ = sin(t * 0.9 + basePos.z * 0.05 + noise) * 15.0 * floatState;
    
    // 2. TREE BREATHING (Only when tree is formed)
    // Calculate a pseudo-normal vector from center (0,y,0) outward
    vec3 centerAxis = vec3(0.0, basePos.y, 0.0);
    vec3 dir = normalize(basePos - centerAxis);
    
    // Breathing sine wave: slow expansion and contraction when tree is formed
    float breath = sin(uTime * 1.5 + basePos.y * 0.5) * 0.2 * easedProgress;
    
    // 3. MICRO JITTER (Always active)
    // High frequency noise for "shimmering" / magical dust feel
    float jitterX = sin(uTime * 3.0 + aRandom * 50.0) * 0.1;
    float jitterY = cos(uTime * 2.5 + aRandom * 30.0) * 0.1;
    float jitterZ = sin(uTime * 3.5 + aRandom * 20.0) * 0.1;

    // Combine all
    vec3 finalPos = basePos + vec3(driftX, driftY, driftZ) + (dir * breath) + vec3(jitterX, jitterY, jitterZ);

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    // Size breathing - Particles pulse in size
    float sizeBreath = 1.0 + 0.4 * sin(uTime * 3.0 + aRandom * 100.0);
    gl_PointSize = (aSize * sizeBreath) * (80.0 / -mvPosition.z); // Larger base size
    
    gl_Position = projectionMatrix * mvPosition;
    
    vPos = finalPos;
    vRandom = aRandom;
    
    // Twinkle alpha based on time and random offset
    float twinkle = sin(uTime * 3.0 + aRandom * 10.0);
    vAlpha = 0.8 + 0.2 * twinkle; 
  }
`;

const foliageFragmentShader = `
  varying float vAlpha;
  varying float vRandom;
  uniform vec3 uColorGreen;
  uniform vec3 uColorGold;
  uniform vec3 uColorWhite;
  
  void main() {
    // 1. Circular Soft Particle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) discard;
    
    // Soft glow falloff
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 1.2); // Soft core
    
    // 2. Color Mixing: Emerald Core -> Gold/White Edge
    // We mix based on distance from center
    
    // Core (Center) is deep emerald, but we boost it for visibility
    vec3 baseColor = uColorGreen * 2.0; 
    
    // Add a gold rim effect
    float rim = smoothstep(0.1, 0.45, dist); // 0 at center, 1 near edge
    
    // Randomly some particles are more gold (sparkles)
    float isSparkle = step(0.85, vRandom); 
    
    // Mix gold into the rim
    vec3 finalColor = mix(baseColor, uColorGold, rim * 0.8);
    
    // Add a hot white/gold center to sparkles
    if (isSparkle > 0.5) {
       finalColor = mix(uColorGold, uColorWhite, (1.0 - dist * 2.0) * 0.8);
    }
    
    gl_FragColor = vec4(finalColor, vAlpha * strength);
  }
`;

interface FoliageProps {
  progress: number;
}

const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  const { positions, scatterPositions, randoms, sizes } = useMemo(() => {
    const count = CONSTANTS.FOLIAGE_COUNT;
    const pos = new Float32Array(count * 3);
    const scat = new Float32Array(count * 3);
    const rands = new Float32Array(count);
    const sz = new Float32Array(count);

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      // --- TREE POSITION ---
      // Distribute points INSIDE the volume of the cone, not just on the shell
      const hNorm = Math.random(); // 0 to 1 height
      const y = hNorm * CONSTANTS.TREE_HEIGHT - (CONSTANTS.TREE_HEIGHT / 2);
      
      // Cone radius at this height
      const maxR = (1 - hNorm) * CONSTANTS.TREE_RADIUS * 1.1; 
      
      // UNIFORM CIRCLE DISTRIBUTION:
      // Use sqrt(random) to distribute points uniformly within the circle slice
      // This prevents the "hollow shell" look and fills the tree with dust
      const r = maxR * Math.sqrt(Math.random()); 
      
      const theta = i * goldenAngle + Math.random();

      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = r * Math.sin(theta);

      // --- SCATTER POSITION ---
      // UNIFORM SPHERICAL VOLUME DISTRIBUTION
      // Use cbrt(random) to distribute points uniformly in the sphere volume
      // This prevents the "center clump" artifact
      const u = Math.random();
      const v = Math.random();
      const phiS = Math.acos(2 * u - 1);
      const thetaS = 2 * Math.PI * v;
      
      const radS = CONSTANTS.SCATTER_RADIUS * Math.cbrt(Math.random()); 

      scat[i * 3] = radS * Math.sin(phiS) * Math.cos(thetaS);
      scat[i * 3 + 1] = radS * Math.sin(phiS) * Math.sin(thetaS);
      scat[i * 3 + 2] = radS * Math.cos(phiS);

      // --- ATTRIBUTES ---
      rands[i] = Math.random();
      // Sizes vary
      sz[i] = Math.random() * 6.0 + 4.0; 
    }
    return { positions: pos, scatterPositions: scat, randoms: rands, sizes: sz };
  }, []);

  useFrame(({ clock }, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
      
      // Use damp for frame-rate independent smooth transition
      shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.damp(
        shaderRef.current.uniforms.uProgress.value,
        progress,
        1.5,
        delta
      );
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length/3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={positions.length/3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={scatterPositions.length/3} array={scatterPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={randoms.length} array={randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 1 }, 
          uColorGreen: { value: new THREE.Color(CONSTANTS.COLORS.EMERALD_DEEP) },
          uColorGold: { value: new THREE.Color(CONSTANTS.COLORS.GOLD_METALLIC) },
          uColorWhite: { value: new THREE.Color(CONSTANTS.COLORS.GLOW) },
        }}
      />
    </points>
  );
};

export default Foliage;
