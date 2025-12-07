
export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export const CONSTANTS = {
  FOLIAGE_COUNT: 15000, // Increased for dense, high-fidelity silhouette
  ITEM_COUNT: 1200, // Total gifts + ornaments
  TREE_HEIGHT: 18,
  TREE_RADIUS: 6.5,
  SCATTER_RADIUS: 45, // Increased from 35 to 45 to fix "center clumping"
  COLORS: {
    EMERALD_DEEP: '#002813',
    EMERALD_LIGHT: '#006B3C',
    GOLD_METALLIC: '#FFD700',
    GOLD_ROSE: '#F4C430',
    BRONZE: '#CD7F32',
    WHITE: '#F5F5F5',
    GLOW: '#FFFACD'
  }
};
