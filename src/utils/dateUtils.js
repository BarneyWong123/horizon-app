/**
 * Formats a date to YYYY-MM-DD in the local timezone.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export const getLocalISODate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Gets the start of the current day in local time.
 * @returns {Date}
 */
export const getLocalStartOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Gets the start of the current week (Sunday) in local time.
 * @returns {Date}
 */
export const getLocalStartOfWeek = () => {
    const today = getLocalStartOfToday();
    const day = today.getDay(); // 0 is Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    return start;
};

/**
 * Gets the start of the current month in local time.
 * @returns {Date}
 */
export const getLocalStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Gets the start of the current year in local time.
 * @returns {Date}
 */
export const getLocalStartOfYear = () => {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1);
};
