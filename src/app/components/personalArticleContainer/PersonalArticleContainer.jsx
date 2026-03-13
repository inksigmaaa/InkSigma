import ArticleDropdown from "../articleDropdown/ArticleDropdown.jsx";

const STATUS_CONFIG = {
    draft: { bg: "#FFEADB", color: "#A34200", text: "Draft" },
    published: { bg: "#D5F2D4", color: "#267F24", text: "Published" },
    scheduled: { bg: "#D6EEFB", color: "#0048B5", text: "Scheduled" },
    trash: { bg: "#FEE2E2", color: "#DC2626", text: "Trash" },
    unpublished: { bg: "#FEF3C7", color: "#D97706", text: "Unpublished" },
};

function ActionButton({ children, onClick, title }) {
    return (
        <button
            className="w-9 h-9 bg-white border border-[#EAEAEA] rounded-lg p-2 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:border-gray-300"
            title={title}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function buildMenuItems({
    onDelete,
    onEdit,
    onPublish,
    onRestore,
    onUnpublish,
    status,
}) {
    const iconClassName = "w-5 h-5";

    return [
        {
            hidden: !onPublish,
            icon: <img src="/images/icons/share.svg" alt="" className={iconClassName} />,
            label: status === "scheduled" ? "Publish now" : "Publish",
            onClick: onPublish,
        },
        {
            hidden: !onUnpublish,
            icon: <img src="/images/icons/copy.svg" alt="" className={iconClassName} />,
            label: "Unpublish",
            onClick: onUnpublish,
        },
        {
            hidden: !onEdit,
            icon: <img src="/images/icons/edit.svg" alt="" className={iconClassName} />,
            label: "Edit",
            onClick: onEdit,
        },
        {
            hidden: !onRestore,
            icon: <img src="/images/icons/restore.svg" alt="" className={iconClassName} />,
            label: "Restore",
            onClick: onRestore,
        },
        {
            danger: status === "trash",
            hidden: !onDelete,
            icon: <img src="/images/icons/trash1.svg" alt="" className={iconClassName} />,
            label: status === "trash" ? "Delete permanently" : "Move to trash",
            onClick: onDelete,
        },
    ];
}

export default function PersonalArticleContainer({
    categories = [],
    description,
    id,
    isSelected,
    onDelete,
    onEdit,
    onPublish,
    onRestore,
    onSelect,
    onUnpublish,
    postedTime,
    status,
    title,
}) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
    const menuItems = buildMenuItems({
        onDelete,
        onEdit,
        onPublish,
        onRestore,
        onUnpublish,
        status,
    });

    return (
        <div className="relative bg-white border border-gray-200 rounded-lg p-5 max-md:pt-10 max-md:p-4">
            <div
                className="absolute top-0 left-0 min-w-[88px] h-[26px] px-4 py-1 rounded-tl-lg rounded-br-lg font-['Public_Sans'] font-normal text-xs leading-[150%] flex items-center justify-center"
                style={{ background: config.bg, color: config.color }}
            >
                {config.text}
            </div>

            <div className="absolute top-2 right-2 hidden max-md:block">
                <ArticleDropdown items={menuItems} />
            </div>

            <div className="flex justify-between items-start gap-4 mt-6 max-md:flex-col max-md:mt-0">
                <div className="flex gap-4 flex-1 max-md:w-full max-md:gap-3">
                    <input
                        type="checkbox"
                        className="w-5 h-5 mt-0.5 cursor-pointer accent-purple-500 shrink-0 max-md:hidden"
                        checked={Boolean(isSelected)}
                        onChange={(event) => onSelect?.(id, event.target.checked)}
                    />
                    <div className="flex-1 min-w-0 max-md:w-full">
                        <h3 className="font-['Public_Sans'] font-semibold text-base leading-[140%] text-black m-0 mb-2 max-md:text-sm">
                            {title}
                        </h3>
                        <p className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-[#A4A4A4] m-0 mb-4 max-md:mb-3">
                            {description}
                        </p>

                        <div className="flex justify-between items-center gap-4 flex-wrap max-md:flex-col max-md:items-start max-md:gap-2">
                            <div className="flex gap-2 flex-wrap shrink-0 items-center">
                                {categories.map((category) => (
                                    <span
                                        key={`${id}-${category}`}
                                        className="h-7 px-3 py-1 bg-[#F4F4F4] rounded-md font-['Public_Sans'] font-normal text-xs leading-[150%] text-gray-600 inline-flex items-center"
                                    >
                                        {category}
                                    </span>
                                ))}
                            </div>

                            {postedTime && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <circle cx="8" cy="8" r="7" stroke="#A4A4A4" strokeWidth="1.5" />
                                        <path
                                            d="M8 4V8L11 10"
                                            stroke="#A4A4A4"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-[#A4A4A4] whitespace-nowrap">
                                        {postedTime}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 shrink-0 self-start max-md:w-full max-md:justify-end max-md:hidden">
                    {onPublish && (
                        <ActionButton onClick={onPublish} title={status === "scheduled" ? "Publish now" : "Publish"}>
                            <img src="/images/icons/share.svg" alt="" className="w-5 h-5" />
                        </ActionButton>
                    )}
                    {onUnpublish && (
                        <ActionButton onClick={onUnpublish} title="Unpublish">
                            <img src="/images/icons/copy.svg" alt="" className="w-5 h-5" />
                        </ActionButton>
                    )}
                    {onEdit && (
                        <ActionButton onClick={onEdit} title="Edit">
                            <img src="/images/icons/edit.svg" alt="" className="w-5 h-5" />
                        </ActionButton>
                    )}
                    {onRestore && (
                        <ActionButton onClick={onRestore} title="Restore">
                            <img src="/images/icons/restore.svg" alt="" className="w-5 h-5" />
                        </ActionButton>
                    )}
                    {onDelete && (
                        <ActionButton
                            onClick={onDelete}
                            title={status === "trash" ? "Delete permanently" : "Move to trash"}
                        >
                            <img src="/images/icons/trash1.svg" alt="" className="w-5 h-5" />
                        </ActionButton>
                    )}
                </div>
            </div>
        </div>
    );
}
