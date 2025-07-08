export const createGraph = (prompt: string, angles: string[], responses: string[]) => {
  const nodes = [];
  const edges = [];

  nodes.push({ id: 'root', text: prompt, parentId: null, label: 'Prompt' });

  angles.forEach((angle, i) => {
    const angleId = `angle-${i}`;
    nodes.push({ id: angleId, text: angle, parentId: 'root', label: 'Angle' });
    edges.push({ source: 'root', target: angleId });

    const responseId = `response-${i}`;
    nodes.push({ id: responseId, text: responses[i], parentId: angleId, label: 'Response' });
    edges.push({ source: angleId, target: responseId });
  });

  return { nodes, edges };
};
