# Forum – AI Brainstorming Chatbot - Project Brief

## Core Purpose
Build **Forum**, a single-page web app that visualizes AI-generated ideas as an interactive mind-map. Every user prompt is answered by **three fixed Gemini personalities** — **Optimist**, **Pessimist**, and **Realist** — whose replies grow the graph outward.

## Essential Requirements (MVP Only)
1. **Fixed Triple Response System**: User enters a prompt → system generates responses from three specific AI personalities:
   - **Optimist** – Assumes best-case scenario, highlights bold opportunities
   - **Pessimist** – Surfaces risks, pitfalls, and worst-case outcomes
   - **Realist** – Projects most likely scenario, balancing pros and cons
2. **Interactive Mind Map**: Display responses as connected nodes in fullscreen React-Flow interface with intelligent radial layout
3. **Branching Conversations**: Users can click any response node to ask follow-ups, with all three personalities responding again
4. **Enhanced User Experience**: Fullscreen immersive interface with floating input overlay and draggable node customization
4. **Session Management**: In-memory session storage with sessionId for graph persistence during user session

## Success Criteria
- User can input a brainstorming question or idea
- System returns exactly three responses from distinct AI personalities
- Results display as color-coded interactive mind map (green Optimist, red Pessimist, grey Realist)
- **NEW**: Fullscreen interface with intelligent radial layout prevents visual conflicts
- **NEW**: Draggable nodes allow user customization while maintaining organized structure
- Users can branch from any node to explore deeper with follow-up questions
- Session persistence allows users to build complex conversation trees

## Non-Goals for MVP
- Cross-browser session persistence
- User accounts or authentication
- Real-time collaboration
- Advanced graph features beyond basic expand/collapse
- Complex deployment strategies (monolithic container only)

## Target Users
Individual creators, writers, entrepreneurs, and students who need rapid idea exploration from contrasting perspectives and visual exploration of complex topics.

## Technical Constraints
- Three parallel Gemini API calls with distinct system prompts per user input
- React + TypeScript frontend with React-Flow for visualization
- Express + TypeScript backend with rate limiting and security measures
- In-memory session storage (no database required for MVP)
- Single deployment artifact (Express serves both API and static React build)
- Security: Rate limiting, CORS protection, API key security 