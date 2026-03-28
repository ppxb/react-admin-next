import { createFormHook } from '@tanstack/react-form'

import {
  FormField,
  fieldContext,
  FormFieldControl,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
  formContext
} from '@/components/ui/form'

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Field: FormField,
    Label: FormFieldLabel,
    Control: FormFieldControl,
    Description: FormFieldDescription,
    Error: FormFieldError
  },
  formComponents: {}
})
