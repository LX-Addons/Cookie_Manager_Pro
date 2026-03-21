import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "@/components/Select";

describe("Select", () => {
  it("should render options correctly", () => {
    const options = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ];

    render(<Select name="test-select" value="option1" onChange={vi.fn()} options={options} />);

    expect(screen.getByText("Option 1")).toBeTruthy();
    expect(screen.getByText("Option 2")).toBeTruthy();
  });

  it("should render with placeholder", () => {
    const options = [{ value: "option1", label: "Option 1" }];

    render(
      <Select
        name="test-select"
        value=""
        onChange={vi.fn()}
        options={options}
        placeholder="Select an option"
      />
    );

    expect(screen.getByText("Select an option")).toBeTruthy();
  });

  it("should render with label", () => {
    const options = [{ value: "option1", label: "Option 1" }];

    render(
      <Select
        name="test-select"
        value="option1"
        onChange={vi.fn()}
        options={options}
        label="Test Label"
      />
    );

    expect(screen.getByText("Test Label")).toBeTruthy();
  });

  it("should render with description", () => {
    const options = [{ value: "option1", label: "Option 1" }];

    render(
      <Select
        name="test-select"
        value="option1"
        onChange={vi.fn()}
        options={options}
        description="Test description"
      />
    );

    expect(screen.getByText("Test description")).toBeTruthy();
  });

  it("should render disabled state", () => {
    const options = [{ value: "option1", label: "Option 1" }];

    render(
      <Select
        name="test-select"
        value="option1"
        onChange={vi.fn()}
        options={options}
        disabled={true}
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it("should call onChange when selection changes", () => {
    const mockOnChange = vi.fn();
    const options = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ];

    render(<Select name="test-select" value="option1" onChange={mockOnChange} options={options} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "option2" } });

    expect(mockOnChange).toHaveBeenCalledWith("option2");
  });

  it("should display selected value correctly", () => {
    const options = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ];

    render(<Select name="test-select" value="option2" onChange={vi.fn()} options={options} />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("option2");
  });

  it("should render label with correct htmlFor attribute", () => {
    const options = [{ value: "option1", label: "Option 1" }];

    render(
      <Select
        name="test-select"
        value="option1"
        onChange={vi.fn()}
        options={options}
        label="Test Label"
      />
    );

    const label = screen.getByText("Test Label");
    const select = screen.getByRole("combobox");
    expect(label.getAttribute("for")).toBe(select.getAttribute("id"));
  });
});
