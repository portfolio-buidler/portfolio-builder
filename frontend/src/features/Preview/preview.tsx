import { useNavigate } from 'react-router-dom'
import { PreviewView } from './Preview.view'
import type { PreviewViewProps } from './preview.types'

function Preview() {
  const navigate = useNavigate()

  const handleBack = (): void => {
    navigate('/')
  }

  const viewProps: PreviewViewProps = {
    onBack: handleBack
  }

  return <PreviewView {...viewProps} />
}

export default Preview
