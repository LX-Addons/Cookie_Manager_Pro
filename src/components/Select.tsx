import { memo, useState, useRef, useEffect, useCallback } from "react";

interface Props<T extends string> {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
  }>;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

const SelectInner = <T extends string>({
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  label,
  description,
}: Props<T>) => {
  const id = `${name}-select`;
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const selectedOption = options.find((opt) => opt.value === value);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prevIsOpen) => {
        const newIsOpen = !prevIsOpen;
        if (newIsOpen) {
          const selectedIndex = options.findIndex((opt) => opt.value === value);
          setFocusedIndex(selectedIndex !== -1 ? selectedIndex : 0);
        } else {
          setFocusedIndex(-1);
        }
        return newIsOpen;
      });
    }
  }, [disabled, options, value]);

  const handleOptionClick = useCallback(
    (optionValue: T) => {
      if (!disabled) {
        onChange(optionValue);
        setIsOpen(false);
      }
    },
    [disabled, onChange]
  );

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const handleClosedKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const openSelect = (startIndex: number) => {
        const selectedIndex = options.findIndex((opt) => opt.value === value);
        setFocusedIndex(selectedIndex !== -1 ? selectedIndex : startIndex);
        setIsOpen(true);
      };

      switch (e.key) {
        case "Enter":
        case " ":
        case "ArrowDown":
          e.preventDefault();
          openSelect(0);
          break;
        case "ArrowUp":
          e.preventDefault();
          openSelect(options.length - 1);
          break;
      }
    },
    [options, value]
  );

  const handleOpenKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const closeSelect = () => {
        setIsOpen(false);
        setFocusedIndex(-1);
      };

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % options.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            onChange(options[focusedIndex].value);
            closeSelect();
          }
          break;
        case "Escape":
        case "Tab":
          closeSelect();
          break;
      }
    },
    [options, onChange, focusedIndex]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (!isOpen) {
        handleClosedKeyDown(e);
      } else {
        handleOpenKeyDown(e);
      }
    },
    [disabled, isOpen, handleClosedKeyDown, handleOpenKeyDown]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className="select-wrapper">
      {label && (
        <label htmlFor={id} className="select-label">
          {label}
        </label>
      )}
      {description && <p className="select-description">{description}</p>}
      <div ref={wrapperRef} className="custom-select-wrapper">
        <button
          id={id}
          name={name}
          type="button"
          className={`custom-select-trigger ${disabled ? "disabled" : ""} ${isOpen ? "open" : ""}`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="custom-select-value">{selectedOption?.label || placeholder || ""}</span>
          <span className="custom-select-arrow" aria-hidden="true"></span>
        </button>
        {isOpen && (
          <ul className="custom-select-dropdown" role="listbox" aria-label={label || name}>
            {placeholder && (
              <li className="custom-select-option disabled" role="option" aria-disabled="true" aria-selected="false">
                {placeholder}
              </li>
            )}
            {options.map((option, index) => (
              <li
                key={option.value}
                ref={(el) => { optionRefs.current[index] = el; }}
                className={`custom-select-option ${option.value === value ? "selected" : ""} ${focusedIndex === index ? "focused" : ""}`}
                role="option"
                aria-selected={option.value === value}
                tabIndex={focusedIndex === index ? 0 : -1}
                onClick={() => handleOptionClick(option.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOptionClick(option.value);
                  }
                }}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

SelectInner.displayName = "Select";

export const Select = memo(SelectInner) as typeof SelectInner;
