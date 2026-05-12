import { create } from 'zustand'

interface AppState {
  selectedBotId: string | null
  setSelectedBotId: (id: string | null) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

// Renombrado a useTeleBridgeStore para evitar conflictos de nombres genéricos
export const useTeleBridgeStore = create<AppState>((set) => ({
  selectedBotId: null,
  setSelectedBotId: (id) => set({ selectedBotId: id, activeTab: 'overview' }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
