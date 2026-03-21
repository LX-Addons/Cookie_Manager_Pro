import { memo } from "react";

interface Props<T extends string> {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
    description?: string;
  }>;
  variant?: "default" | "card";
}

const RadioGroupInner = <T extends string>({
  name,
  value,
  onChange,
  options,
  variant = "default",
}: Props<T>) => {
  return (
    <div className={`radio-group radio-group-${variant}`} role="radiogroup">
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={`radio-control ${value === option.value ? "checked" : ""}`}
          >
            <input
              id={id}
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-label={option.label}
            />
            <span className="radio-indicator" aria-hidden="true" />
            <span className="radio-content">
              <span className="radio-title">{option.label}</span>
              {option.description && (
                <span className="radio-description">{option.description}</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
};

RadioGroupInner.displayName = "RadioGroup";

export const RadioGroup = memo(RadioGroupInner) as typeof RadioGroupInner;
