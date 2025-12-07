
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS } from '../types';

interface TreeElementsProps {
  progress: number;
}

const tempObj = new THREE.Object3D();
const tempVec = new THREE.Vector3();

// Helper to get random color from palette
const getRandomColor = () => {
  const palette = [
    CONSTANTS.COLORS.GOLD_METALLIC,
    CONSTANTS.COLORS.GOLD_METALLIC, // higher weight
    CONSTANTS.COLORS.GOLD_ROSE,
    CONSTANTS.COLORS.EMERALD_DEEP,
    CONSTANTS.COLORS.EMERALD_LIGHT,
    CONSTANTS.COLORS.BRONZE,
    CONSTANTS.COLORS.WHITE,
  ];
  return palette[Math.floor(Math.random() * palette.length)];
};

const TreeElements: React.FC<TreeElementsProps> = ({ progress }) => {
  const sphereRef = useRef<THREE.InstancedMesh>(null);
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const ribbonRef = useRef<THREE.InstancedMesh>(null);
  
  const currentProgress = useRef(0);

  // Generate data for shapes
  const { spheres, boxes } = useMemo(() => {
    const sphereData: any[] = [];
    const boxData: any[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < CONSTANTS.ITEM_COUNT; i++) {
      // 50/50 split between boxes and spheres
      const isBox = Math.random() > 0.4; 
      
      // TREE POSITION (Phyllotaxis Spiral for packing)
      const t = i / CONSTANTS.ITEM_COUNT; // Normalized 0-1
      const y = CONSTANTS.TREE_HEIGHT * (t - 0.5); // Height distribution
      
      // Radius at this height (Cone shape)
      const maxR = (1 - t) * CONSTANTS.TREE_RADIUS;
      
      // Add some radial noise to make it look like a pile, not a perfect smooth cone
      const r = maxR * (0.8 + Math.random() * 0.4); 
      const theta = i * goldenAngle;

      const treePos = new THREE.Vector3(
        r * Math.cos(theta),
        y,
        r * Math.sin(theta)
      );

      // SCATTER POSITION (Volumetric)
      const u = Math.random();
      const v = Math.random();
      const phi = Math.acos(2 * u - 1);
      const scatterTheta = 2 * Math.PI * v;
      const scatterR = CONSTANTS.SCATTER_RADIUS * Math.cbrt(Math.random());
      
      const scatterPos = new THREE.Vector3(
        scatterR * Math.sin(phi) * Math.cos(scatterTheta),
        scatterR * Math.sin(phi) * Math.sin(scatterTheta),
        scatterR * Math.cos(phi)
      );

      // Attributes
      const scale = isBox 
        ? 0.5 + Math.random() * 0.8  // Boxes vary more in size
        : 0.3 + Math.random() * 0.4; // Spheres slightly smaller
      
      const color = new THREE.Color(getRandomColor());
      const rotSpeed = (Math.random() - 0.5) * 1.5;
      
      // Initial rotation
      const rotation = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const item = { treePos, scatterPos, scale, color, rotSpeed, rotation, id: i };

      if (isBox) boxData.push(item);
      else sphereData.push(item);
    }

    return { spheres: sphereData, boxes: boxData };
  }, []);

  useLayoutEffect(() => {
    // Initialize Spheres
    if (sphereRef.current) {
      spheres.forEach((d, i) => {
        tempObj.position.copy(d.scatterPos);
        tempObj.scale.setScalar(d.scale);
        tempObj.rotation.copy(d.rotation);
        tempObj.updateMatrix();
        sphereRef.current!.setMatrixAt(i, tempObj.matrix);
        sphereRef.current!.setColorAt(i, d.color);
      });
      sphereRef.current.instanceMatrix.needsUpdate = true;
      if (sphereRef.current.instanceColor) sphereRef.current.instanceColor.needsUpdate = true;
    }

    // Initialize Boxes & Ribbons
    if (boxRef.current && ribbonRef.current) {
      boxes.forEach((d, i) => {
        tempObj.position.copy(d.scatterPos);
        tempObj.scale.setScalar(d.scale);
        tempObj.rotation.copy(d.rotation);
        tempObj.updateMatrix();
        
        boxRef.current!.setMatrixAt(i, tempObj.matrix);
        boxRef.current!.setColorAt(i, d.color);

        // Ribbon follows box exactly
        ribbonRef.current!.setMatrixAt(i, tempObj.matrix);
        // Ribbon is always Gold/White
        ribbonRef.current!.setColorAt(i, new THREE.Color(CONSTANTS.COLORS.GOLD_METALLIC));
      });
      
      boxRef.current.instanceMatrix.needsUpdate = true;
      if (boxRef.current.instanceColor) boxRef.current.instanceColor.needsUpdate = true;
      
      ribbonRef.current.instanceMatrix.needsUpdate = true;
      if (ribbonRef.current.instanceColor) ribbonRef.current.instanceColor.needsUpdate = true;
    }
  }, [spheres, boxes]);

  useFrame((state, delta) => {
    // Smooth transition logic
    currentProgress.current = THREE.MathUtils.damp(currentProgress.current, progress, 1.5, delta);
    const p = currentProgress.current;
    
    // Ease out quart for dramatic snap effect at end
    const ease = 1 - Math.pow(1 - p, 4);

    const time = state.clock.elapsedTime;

    // UPDATE SPHERES
    if (sphereRef.current) {
      spheres.forEach((d, i) => {
        tempVec.lerpVectors(d.scatterPos, d.treePos, ease);
        
        // Add floating noise when scattered, rigid when tree
        const floatInfluence = (1 - p); 
        tempVec.y += Math.sin(time + d.id) * 0.1 * floatInfluence;
        
        tempObj.position.copy(tempVec);
        
        // Rotation: Spin fast when scattered, settle when tree
        tempObj.rotation.x = d.rotation.x + time * d.rotSpeed * floatInfluence;
        tempObj.rotation.y = d.rotation.y + time * d.rotSpeed * floatInfluence;
        tempObj.rotation.z = d.rotation.z;

        tempObj.scale.setScalar(d.scale * (0.8 + 0.2 * p)); // Slightly puff up when assembled

        tempObj.updateMatrix();
        sphereRef.current!.setMatrixAt(i, tempObj.matrix);
      });
      sphereRef.current.instanceMatrix.needsUpdate = true;
    }

    // UPDATE BOXES AND RIBBONS
    if (boxRef.current && ribbonRef.current) {
      boxes.forEach((d, i) => {
        tempVec.lerpVectors(d.scatterPos, d.treePos, ease);
        
        const floatInfluence = (1 - p);
        const floatY = Math.cos(time * 0.8 + d.id) * 0.15 * floatInfluence;
        tempVec.y += floatY;
        
        tempObj.position.copy(tempVec);
        
        tempObj.rotation.x = d.rotation.x + time * d.rotSpeed * 0.5 * floatInfluence;
        tempObj.rotation.y = d.rotation.y + time * d.rotSpeed * 0.5 * floatInfluence;
        // z rotation fixed from init
        
        tempObj.scale.setScalar(d.scale);
        tempObj.updateMatrix();
        
        boxRef.current!.setMatrixAt(i, tempObj.matrix);
        ribbonRef.current!.setMatrixAt(i, tempObj.matrix);
      });
      boxRef.current.instanceMatrix.needsUpdate = true;
      ribbonRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* ORNAMENTS (Spheres) - High gloss, metallic */}
      <instancedMesh
        ref={sphereRef}
        args={[undefined, undefined, spheres.length]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          roughness={0.1}
          metalness={1.0}
          emissiveIntensity={0.1}
          clearcoat={1}
        />
      </instancedMesh>

      {/* GIFTS (Boxes) - Satin finish */}
      <instancedMesh
        ref={boxRef}
        args={[undefined, undefined, boxes.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={0.4}
          metalness={0.3}
        />
      </instancedMesh>
      
      {/* RIBBONS (Decorations on boxes) - High Metallic Gold */}
      <instancedMesh
        ref={ribbonRef}
        args={[undefined, undefined, boxes.length]}
        // No shadow casting for ribbons to avoid artifacts
      >
        {/* Simple single band wrap for performance & aesthetic */}
        <boxGeometry args={[1.02, 1.02, 0.3]} /> 
        <meshStandardMaterial
          color={CONSTANTS.COLORS.GOLD_METALLIC}
          roughness={0.1}
          metalness={1.0}
          emissive={CONSTANTS.COLORS.GOLD_METALLIC}
          emissiveIntensity={0.5}
        />
      </instancedMesh>
    </group>
  );
};

export default TreeElements;
