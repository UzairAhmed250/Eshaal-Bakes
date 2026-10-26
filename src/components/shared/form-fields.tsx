"use client";

import * as React from "react";
import { Minus, Plus, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateKarachi, formatPakistaniPhoneDisplay } from "@/lib/format";
import {
  DELIVERY_SLOTS,
  evaluateDeliverySlotEligibility,
  getUpcomingKarachiDates,
} from "@/lib/lead-time";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  helperText,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none text-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const baseInputClasses =
  "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, id, required, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const inputEl = (
      <input
        id={inputId}
        ref={ref}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(
          baseInputClasses,
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    );

    if (!label) return inputEl;

    return (
      <FormField
        label={label}
        htmlFor={inputId}
        error={error}
        helperText={helperText}
        required={required}
      >
        {inputEl}
      </FormField>
    );
  }
);
TextInput.displayName = "TextInput";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, id, required, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const textareaEl = (
      <textarea
        id={inputId}
        ref={ref}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(
          "flex min-h-[90px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    );

    if (!label) return textareaEl;

    return (
      <FormField
        label={label}
        htmlFor={inputId}
        error={error}
        helperText={helperText}
        required={required}
      >
        {textareaEl}
      </FormField>
    );
  }
);
TextArea.displayName = "TextArea";

export interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value"
  > {
  label?: string;
  error?: string;
  helperText?: string;
  value: number | "";
  onChange: (value: number) => void;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    { label, error, helperText, id, required, value, onChange, className, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const inputEl = (
      <input
        id={inputId}
        ref={ref}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        }}
        aria-invalid={Boolean(error)}
        className={cn(
          baseInputClasses,
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    );

    if (!label) return inputEl;

    return (
      <FormField
        label={label}
        htmlFor={inputId}
        error={error}
        helperText={helperText}
        required={required}
      >
        {inputEl}
      </FormField>
    );
  }
);
NumberInput.displayName = "NumberInput";

export interface PriceInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  value: number;
  onChange: (valuePkr: number) => void;
  min?: number;
  max?: number;
  id?: string;
  disabled?: boolean;
}

/**
 * Integer PKR currency input with `PKR` prefix badge.
 */
export function PriceInput({
  label,
  error,
  helperText,
  required,
  value,
  onChange,
  min = 0,
  max = 500000,
  id,
  disabled,
}: PriceInputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const control = (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3 select-none text-xs font-semibold text-muted-foreground">
        PKR
      </span>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        step={1}
        min={min}
        max={max}
        disabled={disabled}
        value={Number.isFinite(value) ? Math.round(value) : 0}
        onChange={(e) => {
          const raw = Number.parseInt(e.target.value, 10);
          onChange(Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0);
        }}
        aria-invalid={Boolean(error)}
        className={cn(
          baseInputClasses,
          "pl-12 font-medium",
          error && "border-destructive focus-visible:ring-destructive"
        )}
      />
    </div>
  );

  if (!label) return control;

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      error={error}
      helperText={helperText}
      required={required}
    >
      {control}
    </FormField>
  );
}

export interface PhoneInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  value: string;
  onChange: (maskedPhone: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Pakistani mobile phone input with automatic `03XX-XXXXXXX` masking.
 */
export function PhoneInput({
  label,
  error,
  helperText,
  required,
  value,
  onChange,
  id,
  placeholder = "0300-1234567",
  disabled,
}: PhoneInputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatPakistaniPhoneDisplay(e.target.value);
    onChange(masked);
  };

  const control = (
    <input
      id={inputId}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder={placeholder}
      disabled={disabled}
      value={value}
      onChange={handleChange}
      aria-invalid={Boolean(error)}
      className={cn(
        baseInputClasses,
        "font-mono tracking-wide",
        error && "border-destructive focus-visible:ring-destructive"
      )}
    />
  );

  if (!label) return control;

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      error={error}
      helperText={helperText}
      required={required}
    >
      {control}
    </FormField>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectField({
  label,
  error,
  helperText,
  required,
  value,
  onChange,
  options,
  placeholder,
  id,
  disabled,
  className,
}: SelectFieldProps) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;

  const selectEl = (
    <select
      id={selectId}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={Boolean(error)}
      className={cn(
        baseInputClasses,
        error && "border-destructive focus-visible:ring-destructive",
        className
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  if (!label) return selectEl;

  return (
    <FormField
      label={label}
      htmlFor={selectId}
      error={error}
      helperText={helperText}
      required={required}
    >
      {selectEl}
    </FormField>
  );
}

export interface DatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  value: string;
  onChange: (dateStr: string) => void;
  minLeadTimeHours: number;
  samedayCutoffTime: string;
  daysAhead?: number;
  id?: string;
}

/**
 * DatePicker tailored for Karachi bakery orders — respects lead time and same-day cutoff.
 */
export function DatePicker({
  label = "Delivery Date",
  error,
  helperText,
  required,
  value,
  onChange,
  minLeadTimeHours,
  samedayCutoffTime,
  daysAhead = 14,
  id,
}: DatePickerProps) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const dates = React.useMemo(() => getUpcomingKarachiDates(daysAhead), [daysAhead]);

  const options: SelectOption[] = dates.map((dateStr, index) => {
    const anySlotValid = DELIVERY_SLOTS.some(
      (slot) =>
        evaluateDeliverySlotEligibility({
          deliveryDate: dateStr,
          deliverySlot: slot.id,
          minLeadTimeHours,
          samedayCutoffTime,
        }).valid
    );
    const prefix = index === 0 ? "Today — " : index === 1 ? "Tomorrow — " : "";
    return {
      value: dateStr,
      label: `${prefix}${formatDateKarachi(dateStr)}${
        !anySlotValid ? " (Cutoff Passed)" : ""
      }`,
      disabled: !anySlotValid,
    };
  });

  return (
    <SelectField
      id={selectId}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Choose a delivery date"
    />
  );
}

export interface TimeSlotPickerProps {
  label?: string;
  error?: string;
  required?: boolean;
  deliveryDate: string;
  value: string;
  onChange: (slotId: string) => void;
  minLeadTimeHours: number;
  samedayCutoffTime: string;
  showSameDayBadge?: boolean;
}

/**
 * TimeSlotPicker that evaluates every slot against `minLeadTimeHours` and `samedayCutoffTime`
 * and displays "Same-day delivery available" only when the selected slot qualifies.
 */
export function TimeSlotPicker({
  label = "Preferred Delivery Time Slot (PKT)",
  error,
  required,
  deliveryDate,
  value,
  onChange,
  minLeadTimeHours,
  samedayCutoffTime,
  showSameDayBadge = true,
}: TimeSlotPickerProps) {
  const selectedEligibility = React.useMemo(() => {
    if (!deliveryDate || !value) return null;
    return evaluateDeliverySlotEligibility({
      deliveryDate,
      deliverySlot: value,
      minLeadTimeHours,
      samedayCutoffTime,
    });
  }, [deliveryDate, value, minLeadTimeHours, samedayCutoffTime]);

  return (
    <FormField label={label} error={error} required={required}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DELIVERY_SLOTS.map((slot) => {
          const eligibility = evaluateDeliverySlotEligibility({
            deliveryDate,
            deliverySlot: slot.id,
            minLeadTimeHours,
            samedayCutoffTime,
          });
          const isSelected = value === slot.id;

          return (
            <button
              key={slot.id}
              type="button"
              disabled={!eligibility.valid}
              onClick={() => onChange(slot.id)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 font-semibold text-primary ring-1 ring-primary"
                  : "border-input bg-card text-foreground hover:bg-accent/50",
                !eligibility.valid &&
                  "cursor-not-allowed bg-muted/60 text-muted-foreground opacity-55"
              )}
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{slot.label}</span>
              </span>
              {!eligibility.valid && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  Unavailable
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showSameDayBadge && selectedEligibility?.sameDayDeliveryAvailable && (
        <div
          data-testid="sameday-available-badge"
          className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Same-day delivery available for this slot!</span>
        </div>
      )}
    </FormField>
  );
}

export interface QuantityStepperProps {
  value: number;
  onChange: (nextQuantity: number) => void;
  min?: number;
  max?: number | null;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = null,
  size = "md",
  disabled = false,
}: QuantityStepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && (max === null || value < max);

  return (
    <div className="inline-flex items-center rounded-lg border border-input bg-card">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={!canDecrement}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          "flex items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40",
          size === "sm" ? "h-8 w-8" : "h-10 w-10"
        )}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span
        aria-live="polite"
        className={cn(
          "min-w-[2.25rem] select-none text-center font-semibold",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={!canIncrement}
        onClick={() =>
          onChange(max !== null ? Math.min(max, value + 1) : value + 1)
        }
        className={cn(
          "flex items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40",
          size === "sm" ? "h-8 w-8" : "h-10 w-10"
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export interface SubmitButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export function SubmitButton({
  isLoading = false,
  loadingText = "Saving...",
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      isLoading={isLoading}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? loadingText : children}
    </Button>
  );
}
