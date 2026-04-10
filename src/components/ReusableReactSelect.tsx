import { FormikProps } from 'formik';
import { ReactNode } from 'react';
import Select, { StylesConfig } from 'react-select';

export type SelectOption = {
  label: string;
  value: string;
};

type FormValues = Record<string, unknown>;

type ReusableReactSelectProps<TValues extends FormValues> = {
  name: keyof TValues & string;
  label: string;
  formik: FormikProps<TValues>;
  options: SelectOption[];
  placeholder?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  helperText?: string;
  noOptionsMessage?: string;
  labelAction?: ReactNode;
};

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    borderColor: state.isFocused ? '#14523F' : '#D1D5DB',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(20, 82, 63, 0.2)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#14523F' : '#9CA3AF',
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 30,
  }),
};

export function ReusableReactSelect<TValues extends FormValues>({
  name,
  label,
  formik,
  options,
  placeholder,
  isDisabled,
  isLoading,
  helperText,
  noOptionsMessage,
  labelAction,
}: ReusableReactSelectProps<TValues>) {
  const currentValue = String(formik.values[name] ?? '');
  const selectedOption = options.find((option) => option.value === currentValue) ?? null;

  const isTouched = Boolean(formik.touched[name]);
  const errorMessage = isTouched && typeof formik.errors[name] === 'string' ? (formik.errors[name] as string) : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {labelAction ? <div>{labelAction}</div> : null}
      </div>
      <Select
        inputId={name}
        name={name}
        options={options}
        value={selectedOption}
        onChange={(selected) => {
          formik.setFieldValue(name, selected?.value ?? '', true);
          formik.setFieldTouched(name, true, true);
        }}
        onBlur={() => {
          formik.setFieldTouched(name, true, false);
        }}
        isSearchable
        isClearable
        isDisabled={isDisabled}
        isLoading={isLoading}
        placeholder={placeholder}
        noOptionsMessage={() => noOptionsMessage ?? 'No options found'}
        styles={selectStyles}
      />
      {!errorMessage && helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
      {errorMessage && <p className="text-xs text-red-600 mt-1">{errorMessage}</p>}
    </div>
  );
}
