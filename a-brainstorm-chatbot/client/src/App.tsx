import React from 'react';
import PromptInput from './components/PromptInput';
import GraphCanvas from './components/GraphCanvas';

const App = () => {
  return (
    <div>
      <h1>AI Brainstormer</h1>
      <PromptInput />
      <GraphCanvas />
    </div>
  );
};

export default App;
