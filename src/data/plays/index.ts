import type { Play } from '../../domain/play/models'

// Vite auto-discovers all JSON files in this folder at build time.
// To add a new predefined template, drop a .json file here that matches the Play interface.
const modules = import.meta.glob<{ default: Play }>('./*.json', { eager: true })
export const predefinedPlays: Play[] = Object.values(modules).map((m) => m.default)
