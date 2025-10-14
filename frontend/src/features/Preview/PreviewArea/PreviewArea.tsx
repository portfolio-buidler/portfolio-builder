import React from 'react';
import type { PreviewAreaProps } from './PreviewArea.types';
import { PreviewAreaView } from './PreviewArea.view';

const PreviewArea: React.FC<PreviewAreaProps> = (props) => {
  return <PreviewAreaView {...props} />;
};

export default PreviewArea;
