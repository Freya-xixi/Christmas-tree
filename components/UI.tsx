import React from 'react';
import { TreeState } from '../types';

interface UIProps {
  treeState: TreeState;
  onToggle: () => void;
}

const UI: React.FC<UIProps> = ({ treeState, onToggle }) => {
  const isTree = treeState === TreeState.TREE_SHAPE;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-12 z-20 overflow-hidden">
      
      {/* Top Left: Title Block */}
      <div className="flex flex-col items-start space-y-4">
        <div className="flex flex-col">
          <h1 className="font-['Cinzel'] text-5xl md:text-7xl font-bold text-[#FFD700] leading-none drop-shadow-lg">
            GRAND
          </h1>
          <h1 className="font-['Cinzel'] text-5xl md:text-7xl font-bold text-[#FFD700] leading-none drop-shadow-lg">
            LUXURY
          </h1>
        </div>
        
        <div className="bg-[#FFD700] px-4 py-1">
          <span className="font-['Cinzel'] font-bold tracking-[0.2em] text-[#001a0a] text-sm md:text-base">
            INTERACTIVE TREE
          </span>
        </div>
      </div>

      {/* Bottom Right: Control Button */}
      <div className="flex flex-col items-end pb-8">
        <button
          onClick={onToggle}
          className="group pointer-events-auto relative px-10 py-5 transition-all duration-300"
        >
          {/* Custom Border Effect */}
          <div className="absolute inset-0 border border-[#FFD700] opacity-60 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_15px_rgba(255,215,0,0.3)]"></div>
          
          {/* Inner fill */}
          <div className="absolute inset-[3px] bg-[#001a0a]/80 backdrop-blur-sm group-hover:bg-[#FFD700]/10 transition-colors duration-300"></div>

          {/* Text */}
          <span className="relative z-10 font-['Cinzel'] font-bold text-lg md:text-xl tracking-[0.15em] text-[#FFD700] group-hover:text-white transition-colors drop-shadow-md">
            {isTree ? "UNLEASH CHAOS" : "ASSEMBLE"}
          </span>
          
          {/* Glow Element */}
          <div className="absolute -inset-2 bg-[#FFD700] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
        </button>
        
        <div className="mt-4 flex flex-col items-end opacity-60">
          <span className="font-['Cinzel'] text-[#FFD700] tracking-widest text-xs">EST. 2024</span>
          <span className="font-['Playfair_Display'] italic text-white text-sm">The Gold Standard</span>
        </div>
      </div>
    </div>
  );
};

export default UI;