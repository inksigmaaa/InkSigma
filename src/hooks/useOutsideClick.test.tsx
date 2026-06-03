import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useOutsideClick } from "./useOutsideClick";

function Dropdown({
  onOutside,
  enabled = true,
}: {
  onOutside: () => void;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onOutside, enabled);
  return (
    <div>
      <div ref={ref} data-testid="inside">
        inside
      </div>
      <button data-testid="outside">outside</button>
    </div>
  );
}

describe("useOutsideClick", () => {
  it("fires when mousedown happens outside the ref element", () => {
    const onOutside = vi.fn();
    render(<Dropdown onOutside={onOutside} />);
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it("does not fire when mousedown happens inside the ref element", () => {
    const onOutside = vi.fn();
    render(<Dropdown onOutside={onOutside} />);
    fireEvent.mouseDown(screen.getByTestId("inside"));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it("does not listen while disabled", () => {
    const onOutside = vi.fn();
    render(<Dropdown onOutside={onOutside} enabled={false} />);
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onOutside).not.toHaveBeenCalled();
  });
});
