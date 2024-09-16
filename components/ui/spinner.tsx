import { cn } from "@/lib/utils";

export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("animate-spin inline-block size-4 border-[2px] border-current border-t-transparent rounded-full", className)} role="status" aria-label="loading">
      <span className="sr-only">Loading...</span>
    </div>
  )
}
