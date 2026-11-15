import { memo, type ComponentPropsWithoutRef } from 'react'

export const ParagraphIcon = memo((props: ComponentPropsWithoutRef<'svg'>) => (
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
    <path d="M13 4H9a5 5 0 0 0 0 10h4M13 4v16M13 4h7M18 4v16" />
  </svg>
))

ParagraphIcon.displayName = 'ParagraphIcon'
