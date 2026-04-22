/**
 * FormField — react-hook-form + shared `Input` wrapper.
 *
 * Pulls the field state out of the form's `control` and forwards it
 * into our custom `Input`. RTL-aware, shows a red asterisk next to
 * the label when `required`, and renders a red error message or grey
 * helper text under the field.
 *
 * Usage:
 *   <FormField control={control} name="email" label={t('forms.email')} required />
 */

import React from 'react';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';

import { Input } from '../common/Input';

type Capitalize = TextInputProps['autoCapitalize'];

export interface FormFieldProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  label?: string;
  placeholder?: string;
  rules?: Omit<
    RegisterOptions<TValues, FieldPath<TValues>>,
    'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
  >;
  helperText?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: Capitalize;
  secureTextEntry?: boolean;
  editable?: boolean;
  maxLength?: number;
  errorMessage?: string;
}

export const FormField = <TValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  rules,
  helperText,
  required,
  multiline,
  numberOfLines,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  editable,
  maxLength,
  errorMessage,
}: FormFieldProps<TValues>): React.ReactElement => (
  <Controller
    control={control}
    name={name}
    rules={rules}
    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
      <Input
        label={label}
        placeholder={placeholder}
        value={typeof value === 'string' ? value : value == null ? '' : String(value)}
        onChangeText={onChange}
        onBlur={onBlur}
        error={errorMessage ?? error?.message}
        helperText={helperText}
        required={required}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        editable={editable}
        maxLength={maxLength}
      />
    )}
  />
);

export default FormField;
