/**
 * Central export for all custom hooks
 */
export { useScrollToSection } from './useScrollToSection'
export { useForm } from './useForm'
export { useLocalStorage } from './useLocalStorage'
export { useExclusivePopup } from './useExclusivePopup'
export { useOutsideClick } from './useOutsideClick'
export { useArticleSelection } from './useArticleSelection'

// Data fetching lives in the Zustand store + services (articleStore,
// PublicationContext). The only surviving React Query hook is the profile read.
export { useProfile } from './useQueries.js';
