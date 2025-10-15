import React from 'react';
import { useNavigate } from 'react-router-dom'
import type { PreviewSection } from './PreviewArea.types';
import { PreviewAreaView } from './PreviewArea.view';

const PreviewArea: React.FC = () => {
  const navigate = useNavigate()

  // Define the content for each section of the preview. In the real app
  // these values should come from the user's uploaded CV or manually
  // entered data. The `required` flag determines whether the section
  // must be complete before allowing the user to proceed to the next
  // step. The `complete` flag would be computed based on whether
  // required fields are filled in.
  const sections: PreviewSection[] = [
    {
      id: 'about',
      title: 'About Me',
      content: (
        <p>
          I’m a full‑stack developer from <strong>Israel</strong> passionate
          about building beautiful and performant web applications.
        </p>
      ),
      required: true,
      completed: true,
    },
    {
      id: 'education',
      title: 'Education',
      content: (
        <div>
          <p>B.Sc. in Computer Science – Tel Aviv University (2017–2020)</p>
          <ul>
            <li>Specialized in software engineering, algorithms and system design</li>
            <li>Completed projects in distributed systems and AI applications</li>
            <li>
              Active member of the university’s programming club, participating in
              hackathons and coding competitions
            </li>
          </ul>
        </div>
      ),
      required: true,
      completed: true,
    },
    {
      id: 'skills',
      title: 'Skills',
      content: (
        <div className="preview-skills">
          <p>
            <strong>Languages:</strong> Hebrew, English
          </p>
          <p>
            <strong>Technologies:</strong> React.js, Next.js, TypeScript, Redux,
            TailwindCSS, Node.js, Express, MongoDB, PostgreSQL, Firebase
          </p>
        </div>
      ),
      required: true,
      completed: true,
    },
    {
      id: 'communication',
      title: 'Communication',
      content: (
        <div>
          <p>
            <strong>Mobile:</strong> +972 8887657
          </p>
          <p>
            <strong>Email:</strong> yoadmadmonoj@gmail.com
          </p>
          <p>
            <strong>Links:</strong> GitHub, LinkedIn, Instagram
          </p>
        </div>
      ),
      required: true,
      completed: true,
    },
    {
      id: 'experience',
      title: 'Work Experience',
      content: (
        <div>
          <p>
            <strong>Full‑Stack Developer – TechWave Solutions (2021–Present)</strong>
          </p>
          <ul>
            <li>
              Designed and implemented a customer portal that serves over ten
              thousand active users
            </li>
            <li>
              Led the transition from a monolithic PHP system to a microservices
              architecture with Node.js
            </li>
            <li>
              Collaborated with UX/UI designers to craft responsive, accessible
              interfaces
            </li>
          </ul>
        </div>
      ),
      // Work experience is not considered required according to the
      // specification text. The Next button should still be enabled
      // regardless of the completion state of this section.
      required: false,
      completed: true,
    },
  ]

  // Compute whether all required sections are complete. If any required
  // section is missing or incomplete the user won’t be able to proceed.
  const isNextEnabled = sections
    .filter((s) => s.required)
    .every((s) => s.completed)

  const handleBack = () => {
    // Navigate one step back in the browser history. In the real app
    // this would return the user to the CV upload page.
    navigate(-1)
  }

  const handleNext = () => {
    // Navigate to the next step in the wizard. For the purpose of this
    // example we simply push a placeholder route. Replace with your
    // actual route name when integrating.
    navigate('/next-step')
  }

  return (
    <PreviewAreaView
      sections={sections}
      onBack={handleBack}
      onNext={handleNext}
      isNextEnabled={isNextEnabled}
    />
  )
}

export default PreviewArea