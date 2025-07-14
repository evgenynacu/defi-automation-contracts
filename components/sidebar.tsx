"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BarChart3 } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      name: "Strategies",
      href: "/strategies",
      icon: LayoutDashboard
    },
    {
      name: "Positions",
      href: "/positions",
      icon: BarChart3
    }
  ]

  return (
    <div className="h-screen w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">DeFi Automation</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-muted text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
