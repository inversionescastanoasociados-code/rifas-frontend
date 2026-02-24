'use client'

import { useState, useCallback } from 'react'

interface ErrorState {
  id: string
  message: string
  type: 'warning' | 'error' | 'info' | 'success'
  timestamp: Date
  autoClose?: boolean
  actions?: Array<{
    label: string
    action: () => void
    primary?: boolean
  }>
}

interface UseErrorHandlerProps {
  maxErrors?: number
  autoCloseTime?: number
  onCriticalError?: (error: ErrorState) => void
}

export function useErrorHandler({ 
  maxErrors = 5, 
  autoCloseTime = 5000,
  onCriticalError 
}: UseErrorHandlerProps = {}) {
  const [errors, setErrors] = useState<ErrorState[]>([])

  const addError = useCallback((
    message: string, 
    type: ErrorState['type'] = 'error',
    options: Partial<ErrorState> = {}
  ) => {
    const newError: ErrorState = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
      autoClose: type !== 'error', // Los errores no se cierran automáticamente
      ...options
    }

    setErrors(prev => {
      const updated = [newError, ...prev].slice(0, maxErrors)
      
      // Notificar error crítico
      if (type === 'error' && onCriticalError) {
        onCriticalError(newError)
      }
      
      return updated
    })

    // Auto cerrar si es necesario
    if (newError.autoClose && autoCloseTime > 0) {
      setTimeout(() => {
        removeError(newError.id)
      }, autoCloseTime)
    }
  }, [maxErrors, autoCloseTime, onCriticalError])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Métodos de conveniencia para tipos específicos de errores
  const showError = useCallback((message: string, options?: Partial<ErrorState>) => {
    addError(message, 'error', options)
  }, [addError])

  const showWarning = useCallback((message: string, options?: Partial<ErrorState>) => {
    addError(message, 'warning', options)
  }, [addError])

  const showInfo = useCallback((message: string, options?: Partial<ErrorState>) => {
    addError(message, 'info', options)
  }, [addError])

  const showSuccess = useCallback((message: string, options?: Partial<ErrorState>) => {
    addError(message, 'success', options)
  }, [addError])

  // Manejo de errores de API con reintentos automáticos
  const handleApiError = useCallback(async (
    error: any,
    retryAction?: () => Promise<any>,
    maxRetries: number = 3
  ) => {
    const errorMessage = error?.message || 'Error desconocido'
    
    if (retryAction && maxRetries > 0) {
      showWarning(`${errorMessage}. Reintentando...`, {
        actions: [
          {
            label: 'Reintentar ahora',
            action: () => retryAction(),
            primary: true
          },
          {
            label: 'Cancelar',
            action: () => removeError(Date.now().toString())
          }
        ]
      })
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        await retryAction()
        showSuccess('Operación completada exitosamente')
        return true
      } catch (retryError) {
        return handleApiError(retryError, retryAction, maxRetries - 1)
      }
    } else {
      showError(errorMessage, {
        actions: retryAction ? [
          {
            label: 'Reintentar',
            action: () => retryAction(),
            primary: true
          }
        ] : undefined
      })
      return false
    }
  }, [showWarning, showSuccess, showError, removeError])

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    showError,
    showWarning,
    showInfo,
    showSuccess,
    handleApiError
  }
}

// Componente para mostrar notificaciones de error
interface ErrorNotificationsProps {
  errors: ErrorState[]
  onRemoveError: (id: string) => void
}

export function ErrorNotifications({ errors, onRemoveError }: ErrorNotificationsProps) {
  const getErrorStyles = (type: ErrorState['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800'
    }
  }

  const getErrorIcon = (type: ErrorState['type']) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  if (errors.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`p-4 rounded-lg border ${getErrorStyles(error.type)} shadow-lg`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getErrorIcon(error.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{error.message}</p>
              {error.actions && error.actions.length > 0 && (
                <div className="mt-3 flex space-x-2">
                  {error.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.action()
                        onRemoveError(error.id)
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        action.primary
                          ? 'bg-current text-white hover:opacity-90'
                          : 'border border-current hover:bg-current hover:text-white'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onRemoveError(error.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Hook para manejar desconexión y recuperación automática
export function useConnectionManager(rifaId: string) {
  const [isOnline, setIsOnline] = useState(true)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const { showError, showSuccess, showWarning } = useErrorHandler()

  const handleConnectionLost = useCallback(() => {
    setIsOnline(false)
    setReconnectAttempts(prev => prev + 1)
    
    showError('Conexión perdida. Intentando reconectar...', {
      autoClose: false
    })
    
    // Intentar reconexión
    setTimeout(() => {
      // Aquí iría la lógica de reconexión
      if (Math.random() > 0.3) { // Simular éxito
        setIsOnline(true)
        setReconnectAttempts(0)
        showSuccess('Conexión restaurada')
      } else {
        handleConnectionLost()
      }
    }, 2000 * reconnectAttempts)
  }, [reconnectAttempts, showError, showSuccess])

  const handleConnectionRestored = useCallback(() => {
    setIsOnline(true)
    setReconnectAttempts(0)
    showSuccess('Conexión restaurada')
  }, [showSuccess])

  return {
    isOnline,
    reconnectAttempts,
    handleConnectionLost,
    handleConnectionRestored
  }
}
