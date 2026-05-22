/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { extendedDayjs } from 'src/utils/dates';

/**
 * Formats a date range for display in the trigger.
 * 
 * Rules for year display:
 * - Same year: "Nov 3 – Dec 2, 2025" (year only on right)
 * - Different years: "Dec 25, 2024 – Jan 5, 2025" (year on both)
 * 
 * @param value - Date range string in format "YYYY-MM-DD : YYYY-MM-DD" or DATEADD expressions
 * @returns Formatted string like "Nov 3 – Dec 2, 2025"
 */
export function formatDateRangeDisplay(value: string | undefined): string {
    if (!value || value === 'No filter') {
        return 'No filter';
    }

    // Handle DATEADD expressions - show as "Last 30 days"
    if (value.includes('DATEADD')) {
        // Calculate the actual dates for display
        const start = extendedDayjs().subtract(30, 'days');
        const end = extendedDayjs().subtract(1, 'day');
        return formatTwoDates(start, end);
    }

    // Parse the value string
    const parts = value.split(' : ');
    if (parts.length !== 2) {
        return value; // Return as-is if format is unexpected
    }

    const startStr = parts[0].trim();
    const endStr = parts[1].trim();

    // Parse dates - handle various formats
    const start = parseDateString(startStr);
    const end = parseDateString(endStr);

    if (!start || !end) {
        return value; // Return as-is if parsing fails
    }

    return formatTwoDates(start, end);
}

/**
 * Parse a date string that might be in various formats
 */
function parseDateString(dateStr: string): ReturnType<typeof extendedDayjs> | null {
    if (!dateStr || dateStr === 'now' || dateStr === 'today') {
        return extendedDayjs();
    }

    // Try parsing as ISO date (YYYY-MM-DD)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parsed = extendedDayjs(dateStr);
        return parsed.isValid() ? parsed : null;
    }

    return null;
}

/**
 * Format two dayjs dates according to the display rules
 */
function formatTwoDates(
    start: ReturnType<typeof extendedDayjs>,
    end: ReturnType<typeof extendedDayjs>
): string {
    const startYear = start.year();
    const endYear = end.year();

    if (startYear === endYear) {
        // Same year: "Nov 3 – Dec 2, 2025"
        const startFormatted = start.format('MMM D');
        const endFormatted = end.format('MMM D, YYYY');
        return `${startFormatted} – ${endFormatted}`;
    } else {
        // Different years: "Dec 25, 2024 – Jan 5, 2025"
        const startFormatted = start.format('MMM D, YYYY');
        const endFormatted = end.format('MMM D, YYYY');
        return `${startFormatted} – ${endFormatted}`;
    }
}
