import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'
import { PreviewView } from './Preview.view'
import type { PreviewViewProps } from './Preview.types'

function Preview() {
  const viewProps: PreviewViewProps = {
    backgroundUrl: backgroundImage
  }
  return <PreviewView {...viewProps} />
}

export default Preview
