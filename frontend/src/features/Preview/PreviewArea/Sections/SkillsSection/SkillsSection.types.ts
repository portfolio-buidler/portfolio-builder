export interface SkillsSectionProps {
  title: string
  complete?: boolean
  languages: string[]
  technologies: string[]
  onAddLanguage: () => void
  onAddTechnology: () => void
  onRemoveLanguage: (index: number) => void
  onRemoveTechnology: (index: number) => void
  onChangeLanguage: (index: number, value: string) => void
  onChangeTechnology: (index: number, value: string) => void
}