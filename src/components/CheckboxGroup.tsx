import { memo } from "react";

interface OptionWithOnChange {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

interface OptionWithValue {
  value: string;
  label: string;
  checked: boolean;
}

interface PropsWithIndividualOnChange {
  options: OptionWithOnChange[];
  onChange?: never;
}

interface PropsWithUnifiedOnChange {
  options: OptionWithValue[];
  onChange: (values: string[]) => void;
}

type Props = PropsWithIndividualOnChange | PropsWithUnifiedOnChange;

export const CheckboxGroup = memo(({ options, onChange }: Props) => {
  // Check if using unified onChange API (options have value property)
  const isUnifiedApi = options.length > 0 && "value" in options[0];

  if (isUnifiedApi && onChange) {
    // Unified API mode
    const unifiedOptions = options as OptionWithValue[];
    
    const handleChange = (value: string, checked: boolean) => {
      const currentValues = unifiedOptions
        .filter((opt) => opt.checked)
        .map((opt) => opt.value);
      
      if (checked) {
        onChange([...currentValues, value]);
      } else {
        onChange(currentValues.filter((v) => v !== value));
      }
    };

    return (
      <div className="checkbox-group" role="group">
        {unifiedOptions.map((option) => (
          <label key={option.value} className="checkbox-label">
            <input
              type="checkbox"
              checked={option.checked}
              onChange={(e) => handleChange(option.value, e.target.checked)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  // Individual onChange API mode
  const individualOptions = options as OptionWithOnChange[];
  
  return (
    <div className="checkbox-group" role="group">
      {individualOptions.map((option) => (
        <label key={option.label} className="checkbox-label">
          <input
            type="checkbox"
            checked={option.checked}
            onChange={(e) => option.onChange(e.target.checked)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
});

CheckboxGroup.displayName = "CheckboxGroup";
