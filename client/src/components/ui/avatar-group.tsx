import * as React from "react"
import { AvatarProps, Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items: AvatarGroupItem[]
  limit?: number
}

interface AvatarGroupItem {
  avatar: React.ReactNode
}

export function AvatarGroup({
  items,
  limit = 4,
  className,
  ...props
}: AvatarGroupProps) {
  const itemsToShow = items.slice(0, limit)
  const overflowCount = items.length - limit

  return (
    <div
      className={cn("flex items-center -space-x-2", className)}
      {...props}
    >
      {itemsToShow.map((item, i) => (
        <div
          key={i}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-background"
        >
          {item.avatar}
        </div>
      ))}
      {overflowCount > 0 && (
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-medium text-primary-foreground">
          +{overflowCount}
        </div>
      )}
    </div>
  )
}
