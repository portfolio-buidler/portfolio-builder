import {useRef, useState} from 'react'
import backgroundImage from '../../assets/aea027abbda7eb6100dda02bdd2e253f3a73b6c8.jpg'


function PreviewCV() {
  return (
    <div
      style={{
        backgroundImage: `url(${backgroundImage})`,
        height: '100vh',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <h1>Preview</h1>
    </div>
  )
}