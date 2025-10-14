import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import { PreviewView } from './Preview.view'
import type { PreviewViewProps } from './Preview.types'

import PreviewArea from './PreviewArea/PreviewArea';

function Preview() {
  const viewProps: PreviewViewProps = {
    backgroundUrl: backgroundImage,
    previewArea: <PreviewArea />
  };
  return <PreviewView {...viewProps} />;
}

export default Preview
