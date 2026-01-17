import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md bg-white px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        style={{
          ...style,
          backgroundColor: 'white',
          color: 'rgb(15, 23, 42)',
          border: '1px solid rgb(219, 234, 254)',
          borderRadius: '0.375rem',
          outline: 'none',
          WebkitBoxShadow: '0 0 0 1000px white inset',
          WebkitTextFillColor: 'rgb(15, 23, 42)',
          transition: 'background-color 5000s ease-in-out 0s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgb(14, 165, 233)';
          e.target.style.boxShadow = '0 0 0 2px rgba(14, 165, 233, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgb(219, 234, 254)';
          e.target.style.boxShadow = 'none';
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
