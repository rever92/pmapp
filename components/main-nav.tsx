"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  BarChart3,
  Settings 
} from "lucide-react"

const routes = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/consultants",
    label: "Consultants",
    icon: Users,
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    href: "/workload",
    label: "Workload",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-8">
          <Link href="/" className="flex items-center space-x-2">
            <FolderKanban className="h-6 w-6" />
            <span className="font-bold">PMS</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {routes.map((route) => {
            const Icon = route.icon
            return (
              <Button
                key={route.href}
                variant={pathname === route.href ? "default" : "ghost"}
                className="flex items-center"
                asChild
              >
                <Link href={route.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}