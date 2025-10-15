# Copilot Instructions for Optigence Platform

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
Optigence is a super agentive AI platform built with Next.js, TypeScript, Tailwind CSS, OpenAI API, and Supabase. The platform features multiple AI assistants (modules) that work through minimal user input and intelligent intent detection.

## Architecture & Patterns
- **Framework**: Next.js 14+ with App Router and TypeScript
- **Styling**: Tailwind CSS with custom design system (navy-blue/white theme)
- **State Management**: Zustand for global state, React Context for i18n
- **Database**: Supabase for user data, templates, and module storage
- **AI Integration**: OpenAI GPT-4 for intent detection and content generation
- **Animations**: Framer Motion for smooth transitions and interactions

## Design System
- **Colors**: Navy-blue (#1E3A8A) primary, white backgrounds, minimal palette
- **Typography**: Inter or Geist font family
- **Layout**: Mobile-first responsive design with collapsible sidebar
- **Animations**: Subtle hover effects, typing animations, fade-ins, modal glows

## Key Components
1. **SuperficialAssistant**: Floating chat agent for intent detection and routing
2. **Modular AI Assistants**: Mailgent (email), Shopora (shopping), Jobvera (career), TravelBuddy (travel)
3. **Global Layout**: Header with language dropdown, collapsible sidebar, responsive design
4. **Multilingual Support**: 10 languages with next-i18next integration

## Code Guidelines
- Use TypeScript strictly with proper type definitions
- Implement agentive UX patterns (minimal input, maximum AI assistance)
- Follow mobile-first responsive design principles
- Use Tailwind utility classes consistently with the design system
- Implement proper error handling and loading states
- Add smooth animations for all state transitions
- Ensure accessibility (WCAG guidelines)

## AI Integration Patterns
- Intent detection through OpenAI GPT-4
- Context-aware responses with user preference memory
- Modular routing based on user intentions
- Proactive assistance and suggestions
- Voice input support with react-speech-recognition

## Security & Authentication
- Basic authentication middleware for MVP modules
- Environment variables for API keys and secrets
- Proper data validation and sanitization
- Rate limiting for AI API calls
