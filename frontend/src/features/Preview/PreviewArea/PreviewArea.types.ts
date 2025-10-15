import type { ReactNode } from 'react'

export interface PreviewSection{
    id : string;
    title: string;
    content: ReactNode;
    required?: boolean;
    completed?: boolean;
}

export interface PreviewAreaProps {}


export interface PreviewAreaViewProps{
    sections: PreviewSection[];
    onBack: () => void;
    onNext: () => void;
    isNextEnabled: boolean;
}
