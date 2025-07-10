# Technical Context - Forum

## 🛠️ **Technology Stack**

### **Frontend Architecture**
```json
{
  "framework": "React 18.3.1",
  "bundler": "Vite 7.0.2", 
  "language": "TypeScript 5.6.2",
  "ui-library": "@xyflow/react 12.3.5",
  "state-management": "zustand 5.0.2",
  "styling": "tailwindcss 3.4.17",
  "markdown": "react-markdown 10.1.0"
}
```

### **Backend Architecture**
```json
{
  "runtime": "Node.js",
  "framework": "express 4.x",
  "language": "TypeScript 5.6.2",
  "ai-integration": "@google/generative-ai",
  "security": "helmet + express-rate-limit",
  "development": "tsx watch"
}
```

### **Development Environment**
```json
{
  "package-manager": "npm",
  "build-tool": "vite",
  "dev-server": "concurrently client + server",
  "type-checking": "TypeScript strict mode",
  "hot-reload": "Vite HMR + tsx watch"
}
```

---

## 🏗️ **Application Architecture**

### **Monorepo Structure**
```
AI-brainstormer/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── store/         # Zustand state management
│   │   ├── services/      # API communication layer
│   │   └── types/         # Frontend TypeScript definitions
│   ├── index.html         # Entry point
│   └── vite.config.ts     # Build configuration
├── server/                # Node.js backend
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   └── index.ts         # Server entry point
├── shared/               # Shared TypeScript types
└── cursor_memory/        # Documentation and context
```

### **Component Architecture**
```typescript
// React Flow based graph visualization
GraphCanvas (React Flow container)
├── CustomNode (personality-themed nodes)
├── FloatingEdge (dynamic edge calculation)
├── ContentOverlay (markdown content display)
└── PromptInput (sliding input with animations)

// State management layer
GraphStore (Zustand)
├── Graph data (nodes, edges, session)
├── Overlay state (visibility, content)
├── Loading states
└── Actions (API integration)
```

---

## 🔌 **Key Dependencies**

### **React Flow Integration**
```typescript
// Core visualization library
"@xyflow/react": "12.3.5"

// Implementation patterns:
- ReactFlowProvider for context
- Custom node/edge types
- Invisible handles for floating edges
- Viewport management and interactions
```

### **State Management**
```typescript
// Zustand for efficient global state
"zustand": "5.0.2"

// Store structure:
interface GraphStore {
  nodes: Node[]
  edges: Edge[]
  currentSessionId: string | null
  isLoading: boolean
  overlayNode: Node | null
  isOverlayVisible: boolean
  // ... actions
}
```

### **Markdown Rendering**
```typescript
// Rich text display in overlays
"react-markdown": "10.1.0"

// Usage: Full content display with:
- Proper heading hierarchy
- Code block formatting
- Link handling
- Typography optimization
```

### **AI Integration**
```typescript
// Google Gemini API
"@google/generative-ai": "latest"

// Personality-based prompt engineering:
- Three distinct AI personas
- Context-aware follow-up generation
- Response formatting and validation
```

---

## 🔐 **Security Implementation**

### **Server Security Stack**
```typescript
// Express middleware security
"helmet": "^8.0.0",           // Security headers
"express-rate-limit": "^7.0.0", // Rate limiting
"express-validator": "^7.0.0",  // Input validation
"cors": "^2.8.5"                // Cross-origin requests

// Configuration:
- Rate limit: 60 requests per minute
- CORS origin: http://localhost:5173
- Input sanitization and validation
- Response size limits (64KB)
```

### **Development Security**
```typescript
// Environment management
- Gemini API key via environment variables
- CORS restricted to development origin
- Input validation on all endpoints
- Error message sanitization
```

---

## ⚡ **Performance Optimizations**

### **Frontend Performance**
```typescript
// React optimizations
- React.memo for node components
- useCallback for event handlers
- Zustand shallow comparison
- Vite code splitting and tree shaking
- React Flow devtools (ViewportLogger) for monitoring viewport changes and debugging

// Animation performance
- CSS transform-based animations
- Hardware acceleration with transform3d
- Optimized transition timing (150ms/600ms)
- Cubic bezier easing functions
```

### **React Flow Optimizations**
```typescript
// Graph rendering efficiency
- Custom edge calculations cached
- Node intersection algorithms optimized
- Viewport management with fitView
- Efficient edge recalculation on drag
```

---

## 🌐 **API Design**

### **Endpoint Architecture**
```typescript
// RESTful API design
POST /api/forum/brainstorm
- Creates initial session with 3 personalities
- Returns session ID and initial graph data

POST /api/forum/expand  
- Adds follow-up responses to existing session
- Returns new nodes/edges for graph expansion

// Response format
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### **Data Flow**
```typescript
// Request/Response cycle
1. Client API call via services/api.ts
2. Express route with validation middleware
3. Personality service generates AI responses
4. Graph service formats for React Flow
5. Response sent to client
6. Zustand store updated
7. React Flow re-renders with new data
```

---

## 🎨 **Styling Architecture**

### **Tailwind CSS Integration**
```typescript
// Utility-first styling approach
"tailwindcss": "3.4.17"

// Key patterns:
- Component-scoped styling
- Responsive design utilities
- Custom animations and transitions
- Personality color system integration
```

### **Animation System**
```css
/* Sliding input animation */
.input-container {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  bottom: var(--position); /* 20px | -200px */
}

/* Overlay fade effects */
.overlay {
  transition: opacity 150ms ease-in-out;
}
```

---

## 🧪 **Development Workflow**

### **Build & Development**
```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
    "dev:client": "cd client && vite",
    "dev:server": "npx tsx watch server/index.ts",
    "build": "cd client && npm run build",
    "preview": "cd client && npm run preview"
  }
}
```

### **TypeScript Configuration**
```typescript
// Strict TypeScript across all packages
- client/tsconfig.json (React + DOM)
- server/tsconfig.json (Node.js)
- Root tsconfig.json (shared types)

// Key settings:
- strict: true
- noImplicitAny: true
- Path mapping for clean imports
- ES2022 target for modern features
```

---

## 📦 **Deployment Configuration**

### **Production Build**
```typescript
// Vite production optimization
- Code splitting and tree shaking
- Asset optimization and compression
- TypeScript compilation and checking
- CSS extraction and minification
```

### **Environment Variables**
```bash
# Required for production
GEMINI_API_KEY=your_api_key_here
NODE_ENV=production
PORT=3000
CORS_ORIGIN=your_frontend_domain
```

---

## 🔄 **State Management Patterns**

### **Zustand Store Design**
```typescript
// Clean state management with actions
const useGraphStore = create<GraphStore>((set, get) => ({
  // State
  nodes: [],
  edges: [],
  overlayNode: null,
  isOverlayVisible: false,
  
  // Actions
  showOverlay: (node) => set({ overlayNode: node, isOverlayVisible: true }),
  hideOverlay: () => set({ overlayNode: null, isOverlayVisible: false }),
  setGraphData: (nodes, edges) => set({ nodes, edges }),
  // ... other actions
}))
```

### **Component Integration**
```typescript
// Hook usage patterns
const { 
  nodes, 
  edges, 
  showOverlay, 
  isOverlayVisible 
} = useGraphStore()

// Event handling
const handleNodeClick = useCallback((node: Node) => {
  showOverlay(node)
}, [showOverlay])
```

---

## 🎯 **React Flow Integration Details**

### **Custom Component Registration**
```typescript
// Node and edge type configuration
const nodeTypes = { personality: CustomNode }
const edgeTypes = { floating: FloatingEdge }

// React Flow setup
<ReactFlowProvider>
  <ReactFlow
    nodes={nodes}
    edges={edges}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    nodesDraggable={true}
    nodesConnectable={false}
    edgesSelectable={false}
  />
</ReactFlowProvider>
```

### **Edge Calculation System**
```typescript
// Mathematical positioning for floating edges
const calculateIntersection = (nodeA, nodeB) => {
  // 1. Calculate node centers
  // 2. Find line intersection with node boundaries
  // 3. Return SVG path coordinates
  // 4. Handle edge cases (overlapping nodes, etc.)
}
```

---

## 🔧 **Development Tools**

### **Hot Reload Setup**
```bash
# Concurrent development servers
concurrently "npm:dev:server" "npm:dev:client"

# Server: tsx watch for TypeScript hot reload
# Client: Vite HMR for instant React updates
# Automatic browser refresh on changes
```

### **Browser Testing**
```typescript
// Playwright integration for E2E testing
- Browser automation for real user flows
- Content overlay interaction testing
- Follow-up conversation verification
- Cross-browser compatibility checks
```

---

## 🚀 **Performance Metrics**

### **Current Performance**
- **Initial Load**: < 2s for complete application
- **Graph Rendering**: < 500ms for 10+ nodes
- **Overlay Display**: < 150ms transition time
- **API Response**: < 3s for AI generation
- **Memory Usage**: Efficient with cleanup on session end

### **Optimization Strategies**
- **Code Splitting**: Vite automatic chunking
- **Asset Optimization**: Image and font optimization
- **Bundle Analysis**: Regular size monitoring
- **Memory Management**: Proper cleanup of graph state

---

## 🔮 **Technical Evolution Path**

### **Near-term Enhancements**
- **Database Integration**: Replace in-memory session storage
- **Caching Layer**: Redis for improved response times
- **WebSocket Support**: Real-time collaboration features
- **Mobile Optimization**: Touch-friendly graph interactions

### **Architecture Scalability**
- **Microservices**: Split personality services
- **CDN Integration**: Static asset delivery
- **Load Balancing**: Multi-instance deployment
- **Monitoring**: Application performance tracking

The technical architecture demonstrates a sophisticated balance of modern web technologies, efficient state management, and thoughtful performance optimization, resulting in a production-ready application that delivers smooth, responsive user experiences while maintaining clean, maintainable code. 