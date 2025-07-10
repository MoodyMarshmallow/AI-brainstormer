# System Patterns - Forum

## 🏗️ **Core Architecture Patterns**

### **Frontend Architecture** (Client)
```
src/
├── components/           # React components with specific responsibilities
│   ├── GraphCanvas.tsx  # React Flow graph container & overlay display
│   ├── CustomNode.tsx   # Personality-themed node styling
│   ├── FloatingEdge.tsx # Dynamic edge calculation system
│   ├── PromptInput.tsx  # Sliding input with dual-mode behavior
│   └── ContentOverlay.tsx # Semi-transparent content display
├── store/
│   └── graphStore.ts    # Zustand state management (graph + overlay)
├── services/
│   └── api.ts          # HTTP client for server communication
└── types/              # Shared TypeScript definitions
```

### **Backend Architecture** (Server)
```
server/
├── services/           # Business logic layer
│   ├── geminiService.ts    # AI personality response generation
│   ├── personalityService.ts # Personality-specific prompt handling  
│   └── graphService.ts     # Session and node management
├── middleware/
│   └── security.ts    # Rate limiting, CORS, headers
└── index.ts          # Express app with API routes
```

---

## 🎨 **UI/UX Design Patterns**

### **Minimalistic Design Philosophy**
- **Core Principle**: Function-first design with zero unnecessary elements
- **Visual Hierarchy**: Content > Function > Aesthetics
- **Interface Rules**:
  - No permanent UI chrome or navigation bars
  - Context-sensitive element visibility
  - Smooth animations serve functional purposes only
  - Personality colors for content distinction, not decoration

### **Content Overlay System**
```typescript
// Pattern: Semi-transparent overlay with personality theming
const overlayStyles = {
  backdrop: 'fixed inset-0 bg-black bg-opacity-50 z-[2000]',
  content: 'personality-themed border with white background',
  positioning: 'centered with max dimensions and scroll handling',
  animations: 'fadeIn/fadeOut with 150ms transitions'
}
```

### **Sliding Input Animation**
```typescript
// Pattern: Position-based animation with context awareness
const inputAnimation = {
  initial: 'bottom: 20px (visible for topic entry)',
  hidden: 'bottom: -200px (slides down after submission)',
  followUp: 'bottom: 20px (slides up for follow-ups)',
  transition: '0.6s cubic-bezier(0.4, 0, 0.2, 1)'
}
```

### **Node Styling Standards**
```typescript
// Pattern: Card-based design with personality indicators
const nodeDesign = {
  base: 'white background, subtle shadow, rounded corners',
  border: 'personality-colored (green/red/gray)',
  badge: 'floating emoji indicator (🌟⚠️⚖️)',
  hover: 'elevation increase with shadow enhancement',
  typography: 'uppercase labels, readable content hierarchy'
}
```

---

## 🔄 **State Management Patterns**

### **Zustand Store Structure**
```typescript
interface GraphStore {
  // Graph data
  nodes: Node[]
  edges: Edge[]
  currentSessionId: string | null
  isLoading: boolean
  
  // Overlay system
  overlayNode: Node | null
  isOverlayVisible: boolean
  
  // Actions
  setGraphData: (nodes: Node[], edges: Edge[]) => void
  addNodes: (newNodes: Node[]) => void
  addEdges: (newEdges: Edge[]) => void
  showOverlay: (node: Node) => void
  hideOverlay: () => void
  setLoading: (loading: boolean) => void
}
```

### **State Update Patterns**
- **Graph Updates**: Immutable operations with spread operators
- **Loading States**: Boolean flags with UI feedback integration
- **Overlay Management**: Single source of truth for content display
- **Session Persistence**: UUID-based session identification

---

## 🌐 **API Communication Patterns**

### **Endpoint Design**
```typescript
// RESTful endpoints with consistent response structure
POST /api/forum/brainstorm    // Create initial session
POST /api/forum/expand        // Add follow-up responses

// Response Pattern
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### **Error Handling Pattern**
```typescript
// Consistent error handling across API calls
try {
  const response = await api.post('/endpoint', data)
  if (!response.data.success) {
    throw new Error(response.data.error)
  }
  return response.data.data
} catch (error) {
  console.error('API Error:', error)
  // UI feedback through toast or error state
}
```

---

## 🎯 **React Flow Integration Patterns**

### **Custom Component Registration**
```typescript
// Pattern: Custom components with proper type registration
const nodeTypes = {
  personality: CustomNode
}

const edgeTypes = {
  floating: FloatingEdge
}

// Usage in ReactFlow with proper providers
<ReactFlowProvider>
  <ReactFlow
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    // ... other props
  />
</ReactFlowProvider>
```

### **Edge Calculation System**
```typescript
// Pattern: Mathematical edge positioning with node intersection
const calculateEdgePosition = (sourceNode, targetNode) => {
  // 1. Get node dimensions and positions
  // 2. Calculate center points
  // 3. Find intersection points on node boundaries
  // 4. Return path string for SVG rendering
}
```

### **Handle Management**
```typescript
// Pattern: Invisible handles for floating edge connectivity
<Handle
  type="source"
  position={Position.Bottom}
  style={{
    opacity: 0,
    pointerEvents: 'none',
    // Invisible but present for React Flow edge system
  }}
/>
```

---

## 🤖 **AI Integration Patterns**

### **Personality System**
```typescript
// Pattern: Distinct personality prompt engineering
const personalityPrompts = {
  optimist: "Respond with enthusiasm and positive outlook...",
  pessimist: "Provide critical analysis and potential concerns...",
  realist: "Give balanced, practical perspective..."
}

// Response formatting for consistency
const formatResponse = (personality: string, content: string) => ({
  personality,
  content: content.trim(),
  timestamp: new Date().toISOString()
})
```

### **Follow-up Context Management**
```typescript
// Pattern: Context-aware follow-up generation
const generateFollowUp = async (originalNode: Node, followUpPrompt: string) => {
  const context = `Expanding on this ${originalNode.data.personality} response: "${originalNode.data.content}"`
  const fullPrompt = `${context}\n\nUser follow-up: ${followUpPrompt}`
  
  return await generatePersonalityResponses(fullPrompt)
}
```

---

## 🔧 **Performance Optimization Patterns**

### **Animation Performance**
- **CSS Transforms**: Use `transform` properties over layout-affecting properties
- **Cubic Bezier Easing**: Natural feeling animations with `cubic-bezier(0.4, 0, 0.2, 1)`
- **Hardware Acceleration**: `transform3d` for complex animations
- **Transition Timing**: 150ms for overlays, 600ms for sliding animations

### **React Flow Optimization**
- **Node Memoization**: Prevent unnecessary re-renders with `React.memo`
- **Edge Calculation Caching**: Cache intersection calculations for static nodes
- **Viewport Management**: Use `fitView` for automatic graph centering
- **Event Handling**: Debounce drag events for performance

---

## 🎪 **Component Communication Patterns**

### **Props vs Store Pattern**
- **Local Component State**: Use `useState` for internal component state (input values, hover states)
- **Global State**: Use Zustand store for shared state (graph data, overlay visibility)
- **Props**: Pass static configuration and callbacks

### **Event Handling Pattern**
```typescript
// Pattern: Centralized event handling with store actions
const handleNodeClick = useCallback((node: Node) => {
  showOverlay(node) // Store action
}, [showOverlay])

const handleSubmit = useCallback(async (prompt: string) => {
  setLoading(true)
  try {
    // API call and store update
  } finally {
    setLoading(false)
  }
}, [setLoading])
```

---

## 🛡️ **Security & Error Patterns**

### **Input Validation**
- **Client-side**: Basic validation for UX (length limits, required fields)
- **Server-side**: Comprehensive validation with express-validator
- **Sanitization**: Clean user inputs before AI processing

### **Error Boundary Pattern**
```typescript
// Pattern: Graceful error handling with user feedback
try {
  await riskyOperation()
} catch (error) {
  console.error('Error:', error)
  setError('User-friendly error message')
  // Maintain application stability
}
```

---

## 🎨 **Design System Patterns**

### **Color System**
```typescript
const personalityColors = {
  optimist: '#10B981', // Green for positive outlook
  pessimist: '#EF4444', // Red for cautionary perspective  
  realist: '#6B7280',   // Gray for balanced viewpoint
  prompt: '#3B82F6'     // Blue for user input nodes
}
```

### **Typography Hierarchy**
- **Node Labels**: `text-xs font-semibold uppercase` for personality indicators
- **Node Content**: `text-sm leading-relaxed` for readability
- **Overlay Content**: Markdown-rendered with proper heading hierarchy
- **Input Text**: `text-base` for comfortable typing experience

### **Spacing System**
- **Component Padding**: `p-4` (16px) for comfortable content spacing
- **Element Margins**: `mb-2` (8px) for related elements, `mb-4` (16px) for sections
- **Overlay Positioning**: `inset-4` (16px) for comfortable overlay margins
- **Animation Offsets**: `200px` for smooth sliding distances

---

## 🔄 **Data Flow Patterns**

### **Request/Response Cycle**
1. **User Input** → PromptInput component
2. **API Call** → Server with validation and AI processing  
3. **Response Processing** → Graph data transformation
4. **State Update** → Zustand store modification
5. **UI Update** → React Flow re-render with new nodes/edges
6. **Animation** → Smooth transitions and user feedback

### **Session Management**
- **Session Creation**: UUID generation for unique identification
- **Data Persistence**: In-memory storage during server runtime
- **State Restoration**: Graph reconstruction from session data
- **Cleanup**: Automatic cleanup on session completion

This architecture demonstrates a sophisticated balance of modern React patterns, advanced graph visualization, AI integration, and thoughtful UX design, all while maintaining simplicity and performance. 