import type { ReactNode } from 'react'

export interface PreviewSection{
    id : string;
    title: string;
    content: ReactNode;
    required?: boolean;
    complete?: boolean;
}

export interface PreviewAreaProps {}


export interface PreviewAreaViewProps{
    sections: PreviewSection[];
    onPageBack: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onNext: () => void;
    isNextEnabled: boolean;
    undoAvailable: boolean;
    redoAvailable: boolean;
    onToggleEducation: () => void;
    isEducationCollapsed: boolean;
    onAddLink: () => void;
}
