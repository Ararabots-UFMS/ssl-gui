<script setup lang="ts">
export type RailTab = 'robots' | 'ai' | 'strategy' | 'referee' | 'config' | 'logs'

interface Tab {
  id: RailTab
  label: string
}

const tabs: Tab[] = [
  { id: 'robots',   label: 'Robôs' },
  { id: 'ai',       label: 'IA' },
  { id: 'strategy', label: 'Estratégia' },
  { id: 'referee',  label: 'Juiz' },
  { id: 'config',   label: 'Config' },
  { id: 'logs',     label: 'Logs' },
]

defineProps<{
  active: RailTab | null
}>()

const emit = defineEmits<{
  (e: 'select', v: RailTab): void
  (e: 'collapse'): void
}>()

const onClick = (id: RailTab, isActive: boolean) => {
  if (isActive) emit('collapse')
  else emit('select', id)
}
</script>

<template>
  <nav class="icon-rail">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="rail-button"
      :class="{ active: active === tab.id }"
      :title="tab.label"
      @click="onClick(tab.id, active === tab.id)"
    >
      <!-- Icons: Lucide-style monochrome strokes, currentColor -->
      <svg v-if="tab.id === 'robots'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="8" width="16" height="12" rx="2"/>
        <path d="M12 4v4"/>
        <circle cx="12" cy="3" r="1"/>
        <path d="M9 13h.01"/>
        <path d="M15 13h.01"/>
        <path d="M9 17h6"/>
        <path d="M2 14v3"/>
        <path d="M22 14v3"/>
      </svg>
      <svg v-else-if="tab.id === 'ai'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5a3 3 0 0 0-3 3v.5a3 3 0 0 0-2 5.5 3 3 0 0 0 .5 5A3 3 0 0 0 12 21V5Z"/>
        <path d="M12 5a3 3 0 0 1 3 3v.5a3 3 0 0 1 2 5.5 3 3 0 0 1-.5 5A3 3 0 0 1 12 21"/>
        <path d="M9 11h.01"/>
        <path d="M15 11h.01"/>
      </svg>
      <svg v-else-if="tab.id === 'strategy'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      </svg>
      <svg v-else-if="tab.id === 'referee'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 4v17"/>
        <path d="M5 21h14"/>
        <path d="M5 7h14"/>
        <path d="M5 7l-3 6a4 4 0 0 0 6 0Z"/>
        <path d="M19 7l-3 6a4 4 0 0 0 6 0Z"/>
      </svg>
      <svg v-else-if="tab.id === 'config'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>
      </svg>
      <svg v-else-if="tab.id === 'logs'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/>
        <path d="M14 3v5h5"/>
        <path d="M9 13h6"/>
        <path d="M9 17h6"/>
        <path d="M9 9h2"/>
      </svg>
      <span class="rail-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.icon-rail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-1);
  background: var(--fundo-gradiente-painel, var(--fundo-secundario));
  border-radius: var(--border-radius-md);
  width: 68px;
  flex-shrink: 0;
  align-items: stretch;
}

.rail-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 0;
  background: transparent;
  border: var(--border-width) solid transparent;
  border-radius: var(--border-radius-sm);
  color: var(--texto-secundario);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.rail-button:hover {
  background: var(--fundo-terciario);
  color: var(--texto-principal);
}

.rail-button.active {
  background: var(--cor-destaque);
  color: var(--texto-principal);
  border-color: var(--cor-destaque);
}

.rail-button svg {
  width: 22px;
  height: 22px;
}

.rail-label {
  font-size: 9px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
