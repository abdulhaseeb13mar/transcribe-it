import * as React from 'react'

import { cn } from '@/lib/utils'

function Form({ className, ...props }: React.ComponentProps<'form'>) {
  return <form className={cn('space-y-6', className)} {...props} />
}

interface FormFieldProps {
  children: React.ReactNode
  className?: string
}

function FormField({ children, className }: FormFieldProps) {
  return <div className={cn('space-y-2', className)}>{children}</div>
}

interface FormErrorProps {
  children: React.ReactNode
  className?: string
}

function FormError({ children, className }: FormErrorProps) {
  return <p className={cn('text-sm text-destructive', className)}>{children}</p>
}

export { Form, FormField, FormError }
