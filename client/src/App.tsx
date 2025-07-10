/**
 * ===================================================================
 * MAIN APP COMPONENT - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * Simplified full-screen interface for the Forum AI brainstorming application.
 * The React Flow graph takes up the entire viewport with a floating input overlay.
 * 
 * @author Forum Development Team
 * @version 2.0.0
 * @since 2024
 */

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import PromptInput from './components/PromptInput';
import GraphCanvas from './components/GraphCanvas';
import { useGraphStore } from './store/graphStore';

/**
 * Main App component providing a fullscreen Forum application interface.
 * 
 * Layout Structure:
 * - Fullscreen GraphCanvas taking entire viewport
 * - Floating PromptInput overlay at bottom center
 * - Error display when needed
 * 
 * @returns {JSX.Element} The complete fullscreen Forum application interface
 */
function App() {
  const { error } = useGraphStore();

  return (
    <div className="app">
      {/* ReactFlow Provider for context */}
      <ReactFlowProvider>
        {/* Fullscreen Graph Canvas */}
        <GraphCanvas />
      </ReactFlowProvider>
      
      {/* Floating Input Overlay */}
      <PromptInput />
      
      {/* Global Error Display */}
      {error && (
        <div className="global-error">
          <p>⚠️ {error}</p>
        </div>
      )}
      
      {/* Minimal Global Styles */}
      <style>{`
        .app {
          height: 100vh;
          width: 100vw;
          position: relative;
          overflow: hidden;
        }
        
        .global-error {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          padding: 12px 24px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .global-error p {
          margin: 0;
        }
        
        /* Reset default margins/padding */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
      `}</style>
    </div>
  );
}

export default App;
