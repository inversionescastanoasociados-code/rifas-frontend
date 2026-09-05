'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import AppSidebar from '@/components/layout/AppSidebar'
import { getActiveModule, normalizeRole, shouldShowSidebar } from '@/config/modules'

interface StoredUser {
  id: string
  email: string
  nombre: string
  rol: string
}

export default function ModuleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const showSidebar = shouldShowSidebar(pathname)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        setUser(JSON.parse(raw))
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }, [pathname])

  if (!showSidebar) {
    return <>{children}</>
  }

  const role = normalizeRole(user?.rol)
  const activeModule = getActiveModule(pathname, role)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar
        user={user}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Barra superior móvil / tablet */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Abrir menú de módulos"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {activeModule?.label ?? 'Módulo'}
            </p>
            <p className="truncate text-[11px] text-slate-400">Sistema de Rifas</p>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
