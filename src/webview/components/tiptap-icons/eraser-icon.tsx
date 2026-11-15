import { memo, type ComponentPropsWithoutRef } from 'react'

export const EraserIcon = memo((props: ComponentPropsWithoutRef<'svg'>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <path d="m15 3 6 6a2 2 0 0 1 0 3l-9 9H7l-5-5a2 2 0 0 1 0-3L12 3a2 2 0 0 1 3 0Z" />
    <path d="m7 8 9 9M12 21h10" />
  </svg>
))

EraserIcon.displayName = 'EraserIcon'
