import * as React from 'react'
import { createFormHookContexts, useStore } from '@tanstack/react-form'
import * as scn from '@/components/ui/field'
import { Slot } from '@radix-ui/react-slot'

const { useFieldContext, useFormContext, fieldContext, formContext } = createFormHookContexts()

function Form(props: React.ComponentProps<'form'>) {
  const form = useFormContext()

  return (
    <form
      onSubmit={e => {
        e.stopPropagation()
        e.preventDefault()
        form.handleSubmit()
      }}
      {...props}
    />
  )
}

const IdContext = React.createContext<string>(null as never)

function useFieldComponentContext() {
  const field = useFieldContext()
  const idContext = React.useContext(IdContext)

  if (typeof idContext !== 'string') {
    throw new Error('Form components should be used within <Field>')
  }

  const errors = useStore(field.store, state => state.meta.errors)
  const isTouched = useStore(field.store, state => state.meta.isTouched)
  const submissionAttempts = useStore(field.form.store, state => state.submissionAttempts)

  const fieldComponent = React.useMemo(() => {
    const showError = isTouched || submissionAttempts > 0

    let errorMessage: string | null = null
    if (showError && errors.length > 0) {
      const error = errors[0]

      if (typeof error === 'string') {
        errorMessage = error
      } else if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        }
      } else if (error !== null && error !== undefined) {
        errorMessage = String(error)
      }
    }

    return {
      formControlId: `${idContext}-form-item`,
      formDescriptionId: `${idContext}-form-item-description`,
      formMessageId: `${idContext}-form-item-message`,
      error: errorMessage,
      hasError: showError && errorMessage !== null
    }
  }, [idContext, isTouched, submissionAttempts, errors])

  return fieldComponent
}

function FormField({ className, ...props }: React.ComponentProps<typeof scn.Field>) {
  const id = React.useId()
  const field = useFieldContext()
  const errors = useStore(field.store, state => state.meta.errors)
  const isTouched = useStore(field.store, state => state.meta.isTouched)
  const submissionAttempts = useStore(field.form.store, state => state.submissionAttempts)
  const showError = isTouched || submissionAttempts > 0
  const hasError = showError && errors.length > 0

  return (
    <IdContext.Provider value={id}>
      <scn.Field
        data-slot="form-item"
        data-invalid={hasError ? 'true' : undefined}
        className={className}
        {...props}
      />
    </IdContext.Provider>
  )
}

function FormFieldLabel({ className, ...props }: React.ComponentProps<typeof scn.FieldLabel>) {
  const { formControlId, hasError } = useFieldComponentContext()

  return (
    <scn.FieldLabel
      data-slot="form-label"
      data-error={hasError ? 'true' : undefined}
      htmlFor={formControlId}
      className={className}
      {...props}
    />
  )
}

function FormFieldControl(props: React.ComponentProps<typeof Slot>) {
  const { formControlId, formDescriptionId, formMessageId, hasError } = useFieldComponentContext()

  const describedBy = [formDescriptionId, hasError ? formMessageId : null].filter(Boolean).join(' ')

  return (
    <Slot
      data-slot="form-control"
      id={formControlId}
      aria-describedby={describedBy || undefined}
      aria-invalid={hasError}
      {...props}
    />
  )
}

function FormFieldDescription({
  className,
  ...props
}: React.ComponentProps<typeof scn.FieldDescription>) {
  const { formDescriptionId } = useFieldComponentContext()

  return (
    <scn.FieldDescription
      data-slot="form-description"
      id={formDescriptionId}
      className={className}
      {...props}
    />
  )
}

function FormFieldGroup({ className, ...props }: React.ComponentProps<typeof scn.FieldGroup>) {
  return <scn.FieldGroup data-slot="form-group" className={className} {...props} />
}

function FormFieldError({ className, ...props }: React.ComponentProps<typeof scn.FieldError>) {
  const { error, formMessageId } = useFieldComponentContext()
  const body = error ?? props.children

  if (!body) {
    return null
  }

  return (
    <scn.FieldError data-slot="form-message" id={formMessageId} className={className} {...props}>
      {body}
    </scn.FieldError>
  )
}

export {
  Form,
  FormField,
  FormFieldLabel,
  FormFieldControl,
  FormFieldDescription,
  FormFieldGroup,
  FormFieldError,
  fieldContext,
  useFieldContext,
  formContext,
  useFormContext
}
