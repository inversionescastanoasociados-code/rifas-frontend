'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminUsuariosApi, type AdminUsuario } from '@/lib/adminUsuariosApi'

type FormState = {
  nombre: string
  email: string
  password: string
  activo: boolean
}

const emptyForm: FormState = {
  nombre: '',
  email: '',
  password: '',
  activo: true,
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdministradoresPage() {
  const router = useRouter()
  const [lista, setLista] = useState<AdminUsuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<AdminUsuario | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminUsuariosApi.listar()
      setLista(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const raw = localStorage.getItem('user')
    if (!token || !raw) {
      router.replace('/login')
      return
    }
    try {
      const u = JSON.parse(raw)
      if (String(u.rol).toUpperCase() !== 'SUPER_ADMIN') {
        router.replace('/dashboard')
        return
      }
    } catch {
      router.replace('/login')
      return
    }
    cargar()
  }, [router, cargar])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(emptyForm)
    setModalAbierto(true)
  }

  const abrirEditar = (a: AdminUsuario) => {
    setEditando(a)
    setForm({
      nombre: a.nombre,
      email: a.email,
      password: '',
      activo: a.activo,
    })
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (guardando) return
    setModalAbierto(false)
    setEditando(null)
    setForm(emptyForm)
  }

  const guardar = async () => {
    setGuardando(true)
    setError('')
    try {
      if (editando) {
        await adminUsuariosApi.actualizar(editando.id, {
          nombre: form.nombre,
          email: form.email,
          activo: form.activo,
          ...(form.password.trim() ? { password: form.password } : {}),
        })
      } else {
        if (!form.password.trim()) {
          setError('La contraseña es obligatoria al crear')
          setGuardando(false)
          return
        }
        await adminUsuariosApi.crear({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
        })
      }
      cerrarModal()
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administradores</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crear y editar cuentas con rol ADMIN (solo superadmin).
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          Nuevo admin
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Cargando…</p>
      ) : lista.length === 0 ? (
        <p className="text-slate-500 text-sm">No hay administradores registrados.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left py-3 px-4">Nombre</th>
                <th className="text-left py-3 px-4">Correo</th>
                <th className="text-left py-3 px-4">Estado</th>
                <th className="text-left py-3 px-4">Último acceso</th>
                <th className="text-right py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(a => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-800">{a.nombre}</td>
                  <td className="py-3 px-4 text-slate-600">{a.email}</td>
                  <td className="py-3 px-4">
                    {a.activo ? (
                      <span className="text-emerald-700 text-xs font-semibold">Activo</span>
                    ) : (
                      <span className="text-slate-400 text-xs font-semibold">Inactivo</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{fmtDate(a.ultimo_login)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => abrirEditar(a)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editando ? 'Editar administrador' : 'Nuevo administrador'}
            </h2>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Nombre</span>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Correo</span>
                <input
                  type="email"
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  {editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                </span>
                <input
                  type="password"
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                />
              </label>
              {editando && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                  />
                  Cuenta activa
                </label>
              )}
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando || !form.nombre.trim() || !form.email.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
