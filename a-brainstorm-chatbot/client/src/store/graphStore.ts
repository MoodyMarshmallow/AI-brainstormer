import create from 'zustand';

interface GraphState {
  nodes: any[];
  edges: any[];
  setGraph: (nodes: any[], edges: any[]) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  setGraph: (nodes, edges) => set({ nodes, edges }),
}));
