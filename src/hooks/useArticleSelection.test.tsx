import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useArticleSelection } from "./useArticleSelection";

describe("useArticleSelection", () => {
  it("selects all ids and clears via select-all", () => {
    const { result } = renderHook(() => useArticleSelection(["a", "b", "c"]));
    act(() => result.current.handleSelectAll(true));
    expect(result.current.selectedArticles).toEqual(["a", "b", "c"]);
    act(() => result.current.handleSelectAll(false));
    expect(result.current.selectedArticles).toEqual([]);
  });

  it("toggles a single id on and off", () => {
    const { result } = renderHook(() => useArticleSelection(["a", "b"]));
    act(() => result.current.handleArticleSelect("a", true));
    act(() => result.current.handleArticleSelect("b", true));
    expect(result.current.selectedArticles).toEqual(["a", "b"]);
    act(() => result.current.handleArticleSelect("a", false));
    expect(result.current.selectedArticles).toEqual(["b"]);
  });

  it("clearSelection empties the selection", () => {
    const { result } = renderHook(() => useArticleSelection(["a"]));
    act(() => result.current.handleArticleSelect("a", true));
    act(() => result.current.clearSelection());
    expect(result.current.selectedArticles).toEqual([]);
  });
});
