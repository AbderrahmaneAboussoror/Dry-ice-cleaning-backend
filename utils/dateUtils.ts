export const danishHolidays2025 = [
    '2025-01-01', // New Year's Day
    '2025-04-17', // Maundy Thursday
    '2025-04-18', // Good Friday
    '2025-04-21', // Easter Monday
    '2025-05-16', // Great Prayer Day
    '2025-05-29', // Ascension Day
    '2025-06-05', // Constitution Day
    '2025-06-09', // Whit Monday
    '2025-12-24', // Christmas Eve
    '2025-12-25', // Christmas Day
    '2025-12-26', // Boxing Day
    '2025-12-31'  // New Year's Eve
];

export type DateType = 'weekday' | 'weekend' | 'holiday';

export const getDateType = (date: Date): DateType => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if it's a Danish holiday
    if (danishHolidays2025.includes(dateString)) {
        return 'holiday';
    }

    // Check if it's weekend (Saturday = 6, Sunday = 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'weekend';
    }

    return 'weekday';
};

export const isWeekend = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
};

export const isDanishHoliday = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    return danishHolidays2025.includes(dateString);
};

export const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
};

export const getBusinessHours = () => {
    return {
        start: 14, // 2 PM
        end: 22,   // 10 PM
        slotDuration: 2 // 2 hours per slot
    };
};

export const getTimeSlots = (): string[] => {
    return ['14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'];
};

export const createDateTimeFromSlot = (date: Date, timeSlot: string): { startTime: Date, endTime: Date } => {
    const [startHour] = timeSlot.split(':').map(Number);

    const startTime = new Date(date);
    startTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(startHour + 2, 0, 0, 0);

    return { startTime, endTime };
};