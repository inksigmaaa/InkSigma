export function formatRelativeDate(value) {
    if (!value) {
        return "Just now";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Just now";
    }

    const difference = date.getTime() - Date.now();
    const absoluteDifference = Math.abs(difference);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (absoluteDifference < hour) {
        return formatter.format(Math.round(difference / minute), "minute");
    }

    if (absoluteDifference < day) {
        return formatter.format(Math.round(difference / hour), "hour");
    }

    return formatter.format(Math.round(difference / day), "day");
}

export function formatBlogTimestamp(blog) {
    if (blog.status === "scheduled") {
        return `Scheduled ${formatRelativeDate(blog.scheduledFor)}`;
    }

    if (blog.status === "published") {
        return `Published ${formatRelativeDate(blog.publishedAt ?? blog.updatedAt)}`;
    }

    return `Updated ${formatRelativeDate(blog.updatedAt ?? blog.createdAt)}`;
}

export function buildScheduledForIso(dateValue, timeValue) {
    if (!dateValue || !timeValue) {
        return null;
    }

    const [day, month, year] = dateValue.split("-");

    if (!day || !month || !year) {
        return null;
    }

    const isoValue = new Date(`${year}-${month}-${day}T${timeValue}:00`);

    if (Number.isNaN(isoValue.getTime())) {
        return null;
    }

    return isoValue.toISOString();
}

export function splitScheduledForValue(value) {
    if (!value) {
        return {
            date: "",
            time: "",
        };
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return {
            date: "",
            time: "",
        };
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return {
        date: `${day}-${month}-${year}`,
        time: `${hours}:${minutes}`,
    };
}
