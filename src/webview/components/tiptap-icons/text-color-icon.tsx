import { memo, type ComponentPropsWithoutRef } from 'react'

export const TextColorIcon = memo(({ color = 'currentColor', ...props }: ComponentPropsWithoutRef<'svg'>) => (
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
    <path d="m5 16 7-13 7 13M8 11h8" />
    <path d="M4 21h16" stroke={color} strokeWidth="3" />
  </svg>
))

TextColorIcon.displayName = 'TextColorIcon'
