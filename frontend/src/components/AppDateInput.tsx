import type { InputHTMLAttributes } from "react";
import { displayDateToIso, isoToDisplayDate } from "../utils/date";

type AppDateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
};

function AppDateInput({
  value,
  onChange,
  inputMode = "numeric",
  maxLength = 10,
  pattern = "\\d{2}/\\d{2}/\\d{4}",
  placeholder = "DD/MM/YYYY",
  ...props
}: AppDateInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode={inputMode}
      maxLength={maxLength}
      pattern={pattern}
      placeholder={placeholder}
      value={isoToDisplayDate(value)}
      onChange={(event) => onChange(displayDateToIso(event.target.value))}
    />
  );
}

export default AppDateInput;
