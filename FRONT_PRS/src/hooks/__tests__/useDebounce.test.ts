import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";

describe("useDebounce Hook", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("should update the debounced value after the specified delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    // Act: Update the value prop
    rerender({ value: "updated", delay: 500 });
    
    // Assert: Value should not have updated yet
    expect(result.current).toBe("initial");

    // Act: Advance timers by 499ms
    act(() => {
      jest.advanceTimersByTime(499);
    });
    
    // Assert: Value still shouldn't update
    expect(result.current).toBe("initial");

    // Act: Advance the remaining 1ms
    act(() => {
      jest.advanceTimersByTime(1);
    });

    // Assert: Now it should update
    expect(result.current).toBe("updated");
  });

  it("should reset the timeout if value changes before the delay passes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    rerender({ value: "changed-1", delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(250);
    });
    
    expect(result.current).toBe("initial"); // Hasn't updated yet

    // Change value again before first timeout finishes
    rerender({ value: "changed-2", delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // We are at 500ms total, but the timer was reset at 250ms, so it shouldn't be "changed-1" nor "changed-2" yet
    expect(result.current).toBe("initial");

    act(() => {
      jest.advanceTimersByTime(250); // Total 500ms since the LAST change
    });
    
    expect(result.current).toBe("changed-2");
  });
});
