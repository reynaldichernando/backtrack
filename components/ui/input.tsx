import { cn } from "@/lib/utils"
import { InputHTMLAttributes } from "react"

export function Input
  ({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-foreground/50 bg-transparent px-3 py-1 text-md shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/45 focus:ring-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

