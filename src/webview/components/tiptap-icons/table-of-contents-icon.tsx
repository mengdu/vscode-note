import { memo, type ComponentPropsWithoutRef } from 'react'

export const TableOfContentsIcon = memo((props: ComponentPropsWithoutRef<'svg'>) => (
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
    <path d="M8 6h13M13 12h8M13 18h8M3 6v12h4M3 12h4" />
  </svg>
))

TableOfContentsIcon.displayName = 'TableOfContentsIcon'
