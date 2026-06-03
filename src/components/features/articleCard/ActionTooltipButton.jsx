import { NightTooltip } from "@/components/ui/tooltip";

/**
 * Icon button with a tooltip + accessible label, used for the card action row.
 * Shared by ArticleContainer and PersonalArticleContainer.
 */
export function ActionTooltipButton({ label, children, ...props }) {
  return (
    <NightTooltip content={label}>
      <button aria-label={label} {...props}>
        {children}
      </button>
    </NightTooltip>
  );
}
