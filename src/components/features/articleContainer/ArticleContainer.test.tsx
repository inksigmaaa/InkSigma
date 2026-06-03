/**
 * Characterization tests for ArticleContainer — lock the current behavior
 * before extracting the shared ArticleCard. After the extraction these must
 * stay green (behavior preserved).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ArticleContainer from "./ArticleContainer";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, prefetch: vi.fn() }),
}));
vi.mock("@/contexts/PublicationContext", () => ({
  usePublication: () => ({
    currentPublication: { id: "pub1", isOwner: true },
  }),
}));
vi.mock("@/stores/articleStore", () => ({
  useArticleStore: (selector: (s: { prefetchArticle: () => Promise<void> }) => unknown) =>
    selector({ prefetchArticle: () => Promise.resolve() }),
}));
vi.mock("@/components/ui/tooltip", () => ({
  NightTooltip: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("../articleDropdown/ArticleDropdown.jsx", () => ({
  default: () => <div data-testid="article-dropdown" />,
}));

const handlers = {
  onSelect: vi.fn(),
  onDelete: vi.fn(),
  onPublish: vi.fn(),
  onUnpublish: vi.fn(),
  onDraft: vi.fn(),
  onRestore: vi.fn(),
  onRepublish: vi.fn(),
};

const baseProps = {
  id: "a1",
  title: "My Title",
  description: "My description",
  categories: ["Tech", "News"],
  publicationId: "pub1",
  createdAt: new Date().toISOString(),
  ...handlers,
};

afterEach(() => vi.clearAllMocks());

describe("ArticleContainer", () => {
  it("renders the title, description and category chips", () => {
    render(<ArticleContainer {...baseProps} status="published" />);
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("My description")).toBeInTheDocument();
    expect(screen.getAllByText("Tech").length).toBeGreaterThan(0);
  });

  it("shows the status badge label for the given status", () => {
    render(<ArticleContainer {...baseProps} status="published" />);
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);
  });

  it("wires draft actions: Publish, Delete, and Edit navigation", () => {
    render(<ArticleContainer {...baseProps} status="draft" />);
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(handlers.onPublish).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(pushMock).toHaveBeenCalledTimes(1);
  });

  it("wires trash actions: Restore and Delete Permanently", () => {
    render(<ArticleContainer {...baseProps} status="trash" />);
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(handlers.onRestore).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Delete Permanently" }));
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it("wires Unpublish for published articles", () => {
    render(<ArticleContainer {...baseProps} status="published" />);
    fireEvent.click(screen.getByRole("button", { name: "Unpublish" }));
    expect(handlers.onUnpublish).toHaveBeenCalledTimes(1);
  });

  it("toggles selection via the checkbox", () => {
    render(
      <ArticleContainer {...baseProps} status="published" isSelected={false} />,
    );
    // The checkbox input is visually hidden (display:none) but still togglable.
    fireEvent.click(screen.getByRole("checkbox", { hidden: true }));
    expect(handlers.onSelect).toHaveBeenCalledWith("a1", true);
  });

  it("disables the delete button when canDelete is false", () => {
    render(
      <ArticleContainer {...baseProps} status="draft" canDelete={false} />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });
});
