import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // Not bg-muted: in light theme --muted is the same #EDEBE7 as the page, so a skeleton
      // drawn straight on the page (headers, loading.tsx frames) was invisible. A translucent
      // border tone reads on the page and on cards, in both themes.
      className={cn("animate-pulse rounded-md bg-border/60", className)}
      {...props}
    />
  )
}

export { Skeleton }
