import React, { useState } from 'react';

const PromptInput = () => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle prompt submission
    console.log(prompt);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your brainstorming prompt"
      />
      <button type="submit">Brainstorm</button>
    </form>
  );
};

export default PromptInput;
