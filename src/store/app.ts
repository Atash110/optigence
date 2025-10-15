import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SuperficialAssistantState, ModuleType, AIMessage, User } from '@/types';

interface AppStore {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Superficial Assistant
  assistant: SuperficialAssistantState;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  setListening: (listening: boolean) => void;
  setProcessing: (processing: boolean) => void;
  addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  
  // Navigation
  currentModule: ModuleType | null;
  setCurrentModule: (module: ModuleType | null) => void;
  
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        }));
      },
      
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Superficial Assistant
      assistant: {
        isOpen: false,
        isListening: false,
        isProcessing: false,
        messages: [],
        lastInteractions: [],
      },
      
      openAssistant: () => {
        set((state) => ({
          assistant: { ...state.assistant, isOpen: true }
        }));
      },
      
      closeAssistant: () => {
        set((state) => ({
          assistant: { 
            ...state.assistant, 
            isOpen: false,
            isListening: false,
            isProcessing: false,
          }
        }));
      },
      
      toggleAssistant: () => {
        const { assistant } = get();
        if (assistant.isOpen) {
          get().closeAssistant();
        } else {
          get().openAssistant();
        }
      },
      
      setListening: (listening) => {
        set((state) => ({
          assistant: { ...state.assistant, isListening: listening }
        }));
      },
      
      setProcessing: (processing) => {
        set((state) => ({
          assistant: { ...state.assistant, isProcessing: processing }
        }));
      },
      
      addMessage: (message) => {
        const newMessage: AIMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };
        
        set((state) => {
          const updatedMessages = [...state.assistant.messages, newMessage];
          const lastThree = updatedMessages.slice(-3);
          
          return {
            assistant: {
              ...state.assistant,
              messages: updatedMessages,
              lastInteractions: lastThree,
            }
          };
        });
      },
      
      clearMessages: () => {
        set((state) => ({
          assistant: {
            ...state.assistant,
            messages: [],
            lastInteractions: [],
          }
        }));
      },
      
      // Navigation
      currentModule: null,
      setCurrentModule: (module) => set({ currentModule: module }),
      
      // Sidebar
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },
    }),
    {
      name: 'optigence-app-store',
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        sidebarOpen: state.sidebarOpen,
        // Don't persist assistant state for security
      }),
    }
  )
);
