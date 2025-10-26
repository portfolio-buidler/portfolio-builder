export interface SkillsSectionProps {
  title: string
  complete?: boolean
  languages: string[]
  technologies: string[]
  onAddLanguage: () => void
  onAddTechnology: () => void
  onRemoveLanguage: (index: number) => void
  onRemoveTechnology: (index: number) => void
}
