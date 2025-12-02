'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  options: Map<string, string>
  registerOption: (value: string, label: string) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined
)

const useSelectContext = () => {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within Select')
  }
  return context
}

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select = ({ value, defaultValue, onValueChange, children }: SelectProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '')
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState(new Map<string, string>())

  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }

  const registerOption = React.useCallback((value: string, label: string) => {
    setOptions((prev) => {
      const next = new Map(prev)
      next.set(value, label)
      return next
    })
  }, [])

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        options,
        registerOption,
      }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, disabled, ...props }, ref) => {
    const { open, setOpen } = useSelectContext()

    return (
      <button
        type="button"
        ref={ref}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            'h-4 w-4 opacity-50 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
    )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

interface SelectValueProps {
  placeholder?: string
  children?: React.ReactNode
}

const SelectValue = ({ placeholder, children }: SelectValueProps) => {
  const { value, options } = useSelectContext()
  
  // If children are provided, render them (for custom display)
  if (children) {
    return <>{children}</>
  }
  
  // Find the matching option label or show the value itself
  const displayText = value ? (options.get(value) || value) : (placeholder || 'Seçiniz...')
  
  return <span>{displayText}</span>
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelectContext()

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref && 'current' in ref && ref.current) {
          if (!ref.current.contains(event.target as Node)) {
            setOpen(false)
          }
        }
      }

      if (open) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [open, setOpen, ref])

    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-950 shadow-md',
          className
        )}
        {...props}
      >
        <div className="p-1">{children}</div>
      </div>
    )
  }
)
SelectContent.displayName = 'SelectContent'

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { onValueChange, registerOption } = useSelectContext()

    React.useEffect(() => {
      // Register this option so SelectValue can display it
      registerOption(value, typeof children === 'string' ? children : value)
    }, [value, children, registerOption])

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectItem.displayName = 'SelectItem'

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }

