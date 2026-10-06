'use client'

import { useState, useEffect, useRef } from 'react'
import { Rifa, RifaCreateRequest, RifaUpdateRequest } from '@/types/rifa'
import { uploadApi } from '@/lib/uploadApi'
import { getStorageImageUrl } from '@/lib/storageImageUrl'

interface RifaFormProps {
  rifa?: Rifa | null
  onSubmit: (data: RifaCreateRequest | RifaUpdateRequest) => void
  onCancel: () => void
}

export default function RifaForm({ rifa, onSubmit, onCancel }: RifaFormProps) {
  const [formData, setFormData] = useState<RifaCreateRequest>({
    titulo: '',
    descripcion: '',
    precio_boleta: 0,
    total_boletas: 0,
    fecha_sorteo: '',
    estado: 'BORRADOR'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [precioFormateado, setPrecioFormateado] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cachedImageFile, setCachedImageFile] = useState<File | null>(null)
  const [imagenRemoved, setImagenRemoved] = useState(false)
  const [currentImagenUrl, setCurrentImagenUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Función para formatear número a formato pesos colombianos
  const formatearPesos = (valor: number): string => {
    if (valor === 0) return ''
    return valor.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  // Función para parsear el formato pesos colombianos a número
  const parsearPesos = (texto: string): number => {
    if (!texto) return 0
    // Remover puntos y otros caracteres no numéricos excepto decimales
    const numeroLimpio = texto.replace(/[^\d]/g, '')
    return numeroLimpio ? parseInt(numeroLimpio, 10) : 0
  }

  useEffect(() => {
    if (rifa) {
      const precioBoleta = parseFloat(rifa.precio_boleta)
      setFormData({
        titulo: rifa.nombre,
        descripcion: rifa.descripcion,
        precio_boleta: precioBoleta,
        total_boletas: rifa.total_boletas,
        fecha_sorteo: rifa.fecha_sorteo ? new Date(rifa.fecha_sorteo).toISOString().slice(0, 16) : '',
        estado: rifa.estado
      })
      setPrecioFormateado(formatearPesos(precioBoleta))
      const img = rifa.imagen_url
        ? getStorageImageUrl(rifa.imagen_url) ?? rifa.imagen_url
        : null
      setCurrentImagenUrl(img)
      setImagePreview(null)
      setCachedImageFile(null)
      setImagenRemoved(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } else {
      setCurrentImagenUrl(null)
      setImagePreview(null)
      setCachedImageFile(null)
      setImagenRemoved(false)
    }
  }, [rifa])

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        imagen: 'Solo JPG, PNG o WEBP',
      }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        imagen: 'Máximo 5 MB',
      }))
      return
    }

    setErrors((prev) => {
      const next = { ...prev }
      delete next.imagen
      return next
    })
    setImagenRemoved(false)

    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setCachedImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setCachedImageFile(null)
    setImagePreview(null)
    setImagenRemoved(true)
    setCurrentImagenUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const previewSrc =
    imagePreview ||
    (!imagenRemoved && currentImagenUrl ? currentImagenUrl : null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (name === 'total_boletas') {
      // Solo permitir números para total_boletas
      const valorNumerico = value === '' ? 0 : parseInt(value.replace(/[^\d]/g, ''), 10)
      setFormData(prev => ({
        ...prev,
        [name]: valorNumerico
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
      }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    const valorNumerico = parsearPesos(valor)
    
    setPrecioFormateado(formatearPesos(valorNumerico))
    setFormData(prev => ({
      ...prev,
      precio_boleta: valorNumerico
    }))
    
    if (errors.precio_boleta) {
      setErrors(prev => ({
        ...prev,
        precio_boleta: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido'
    } else if (formData.titulo.trim().length < 3) {
      newErrors.titulo = 'El título debe tener al menos 3 caracteres'
    } else if (formData.titulo.trim().length > 200) {
      newErrors.titulo = 'El título no puede exceder los 200 caracteres'
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida'
    } else if (formData.descripcion.trim().length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres'
    } else if (formData.descripcion.trim().length > 1000) {
      newErrors.descripcion = 'La descripción no puede exceder los 1000 caracteres'
    }

    if (!formData.precio_boleta || formData.precio_boleta <= 0) {
      newErrors.precio_boleta = 'El precio de la boleta debe ser mayor a 0'
    }

    // Solo validar total_boletas cuando se está creando una nueva rifa
    if (!rifa) {
      if (!formData.total_boletas || formData.total_boletas <= 0 || !Number.isInteger(formData.total_boletas)) {
        newErrors.total_boletas = 'El total de boletas debe ser un número entero positivo'
      }
    }

    if (!formData.fecha_sorteo.trim()) {
      newErrors.fecha_sorteo = 'La fecha de sorteo es requerida'
    } else {
      const sorteoDate = new Date(formData.fecha_sorteo)
      const now = new Date()
      if (sorteoDate <= now) {
        newErrors.fecha_sorteo = 'La fecha de sorteo debe ser futura'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Formatear la fecha en formato ISO para el backend
      const submissionData = {
        ...formData,
        fecha_sorteo: new Date(formData.fecha_sorteo).toISOString()
      }
      
      // Si estamos editando, eliminar total_boletas del objeto a enviar
      if (rifa) {
        const { total_boletas, ...dataParaActualizar } = submissionData
        let updatePayload: RifaUpdateRequest = dataParaActualizar

        if (cachedImageFile) {
          setUploadingImage(true)
          const uploadResponse = await uploadApi.uploadImagen(cachedImageFile)
          updatePayload = { ...updatePayload, imagen_url: uploadResponse.url }
          setUploadingImage(false)
        } else if (imagenRemoved) {
          updatePayload = { ...updatePayload, imagen_url: null }
        }

        await onSubmit(updatePayload)
      } else {
        // Si es creación, enviar todos los campos
        await onSubmit(submissionData)
      }
    } finally {
      setLoading(false)
      setUploadingImage(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light text-slate-900">
          {rifa ? 'Editar Rifa' : 'Nueva Rifa'}
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="titulo" className="block text-sm font-bold text-black mb-2">
              Título de la Rifa *
            </label>
            <div className="relative">
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                maxLength={200}
                className={`w-full px-4 py-2 pr-20 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all duration-200 text-slate-900 placeholder-slate-400 ${
                  errors.titulo ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                }`}
                placeholder="Rifa de PlayStation 5"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
                {formData.titulo.length}/200
              </span>
            </div>
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="descripcion" className="block text-sm font-bold text-black mb-2">
              Descripción *
            </label>
            <div className="relative">
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                maxLength={1000}
                rows={4}
                className={`w-full px-4 py-2 pr-20 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all duration-200 text-slate-900 placeholder-slate-400 resize-none ${
                  errors.descripcion ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                }`}
                placeholder="Describe los premios y detalles de la rifa..."
              />
              <span className="absolute right-3 bottom-3 text-xs text-slate-500">
                {formData.descripcion.length}/1000
              </span>
            </div>
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
            )}
          </div>

          <div>
            <label htmlFor="precio_boleta" className="block text-sm font-bold text-black mb-2">
              Precio por Boleta (COP) *
            </label>
            <input
              type="text"
              id="precio_boleta"
              name="precio_boleta"
              value={precioFormateado}
              onChange={handlePrecioChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all duration-200 text-slate-900 placeholder-slate-400 ${
                errors.precio_boleta ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
              }`}
              placeholder="120.000"
            />
            {errors.precio_boleta && (
              <p className="mt-1 text-sm text-red-600">{errors.precio_boleta}</p>
            )}
          </div>

          <div>
            <label htmlFor="total_boletas" className="block text-sm font-bold text-black mb-2">
              Total de Boletas *
              {rifa && <span className="ml-2 text-xs text-slate-500">(No modificable)</span>}
            </label>
            <input
              type="text"
              id="total_boletas"
              name="total_boletas"
              value={formData.total_boletas === 0 ? '' : formData.total_boletas.toString()}
              onChange={handleInputChange}
              readOnly={!!rifa}
              disabled={!!rifa}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all duration-200 text-slate-900 placeholder-slate-400 ${
                errors.total_boletas ? 'border-red-300 bg-red-50' : 
                rifa ? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed' : 
                'border-slate-300 bg-white'
              }`}
              placeholder="1000"
              inputMode="numeric"
              pattern="[0-9]*"
            />
            {errors.total_boletas && (
              <p className="mt-1 text-sm text-red-600">{errors.total_boletas}</p>
            )}
            {rifa && (
              <p className="mt-1 text-xs text-slate-500">
                El total de boletas no se puede modificar después de crear la rifa
              </p>
            )}
          </div>

          <div>
            <label htmlFor="fecha_sorteo" className="block text-sm font-bold text-black mb-2">
              Fecha de Sorteo *
            </label>
            <input
              type="datetime-local"
              id="fecha_sorteo"
              name="fecha_sorteo"
              value={formData.fecha_sorteo}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all duration-200 text-slate-900 placeholder-slate-400 ${
                errors.fecha_sorteo ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.fecha_sorteo && (
              <p className="mt-1 text-sm text-red-600">{errors.fecha_sorteo}</p>
            )}
          </div>

          <div>
            <label htmlFor="estado" className="block text-sm font-bold text-black mb-2">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-slate-900 bg-white"
            >
              {/* Crear nueva rifa: solo BORRADOR y ACTIVA */}
              {!rifa ? (
                <>
                  <option value="BORRADOR">Borrador</option>
                  <option value="ACTIVA">Activa</option>
                </>
              ) : (
                /* Editar rifa existente - basado en estado actual */
                rifa.estado === 'BORRADOR' ? (
                  <option value="ACTIVA">Activa</option>
                ) : rifa.estado === 'ACTIVA' ? (
                  <>
                    <option value="ACTIVA">Activa</option>
                    <option value="PAUSADA">Pausada</option>
                    <option value="TERMINADA">Terminada</option>
                  </>
                ) : rifa.estado === 'PAUSADA' ? (
                  <>
                    <option value="ACTIVA">Activa</option>
                    <option value="PAUSADA">Pausada</option>
                    <option value="TERMINADA">Terminada</option>
                  </>
                ) : (
                  <option value="TERMINADA">Terminada</option>
                )
              )}
            </select>
          </div>
        </div>

        {rifa && (
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-black mb-2">Imagen de la boleta</h3>
            <p className="text-sm text-slate-600 mb-4">
              Al guardar, la plantilla se aplica a <strong>todas</strong> las boletas de esta rifa
              (impresión, descarga y vista pública).
            </p>

            {errors.imagen && (
              <p className="mb-3 text-sm text-red-600">{errors.imagen}</p>
            )}

            {previewSrc ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full max-w-xs border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <img
                    src={previewSrc}
                    alt="Plantilla boleta"
                    className="w-full h-auto object-contain max-h-64"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || uploadingImage}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                  >
                    Cambiar imagen
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={loading || uploadingImage}
                    className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-sm"
                  >
                    Quitar imagen
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadingImage}
                className="px-4 py-2 border border-dashed border-slate-400 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
              >
                Subir imagen de plantilla
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleImageFileChange}
              disabled={loading || uploadingImage}
            />
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading || uploadingImage ? 'Guardando...' : (rifa ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  )
}
