import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import Experience from './components/Experience';
import UI from './components/UI';
import { TreeState } from './types';

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE
    );
  };

  return (
    <div className="w-full h-screen bg-[#000501] relative overflow-hidden">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas
          dpr={[1, 2]} // Handle high DPI screens
          gl={{ 
            antialias: false, // Postprocessing handles AA or we accept aliasing for performance
            toneMapping: 3, // THREE.ReinhardToneMapping
            toneMappingExposure: 1.5,
            powerPreference: "high-performance"
          }} 
          shadows
        >
          <Suspense fallback={null}>
            <Experience treeState={treeState} />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <UI treeState={treeState} onToggle={toggleState} />

      {/* Loading Screen */}
      <Loader 
        containerStyles={{ backgroundColor: '#000501' }}
        innerStyles={{ width: '200px', backgroundColor: '#333' }}
        barStyles={{ backgroundColor: '#FFD700', height: '2px' }}
        dataStyles={{ color: '#FFD700', fontFamily: 'Cinzel', fontSize: '12px' }}
      />
    </div>
  );
}

export default App;
