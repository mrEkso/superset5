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
import { useState, useEffect } from 'react';
import { t } from '@superset-ui/core';
import { extendedDayjs } from 'src/utils/dates';
import { RangePicker } from 'src/components/DatePicker';
import { Dayjs } from 'dayjs';
import { FrameComponentProps } from 'src/explore/components/controls/DateFilterControl/types';
import { AntdThemeProvider } from 'src/components/AntdThemeProvider';
import { useLocale } from 'src/hooks/useLocale';
import Loading from 'src/components/Loading';
import Button from 'src/components/Button';

// Custom format without time for date range picker
const DATE_FORMAT = 'YYYY-MM-DD';

export function DateRangeFrame(props: FrameComponentProps) {
  const locale = useLocale();
  // Default: Last 30 days up to yesterday
  const [startDate, setStartDate] = useState<Dayjs | null>(
    extendedDayjs().subtract(30, 'days').startOf('day'),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    extendedDayjs().subtract(1, 'day').endOf('day'),
  );

  // Parse the incoming value to set initial dates
  useEffect(() => {
    if (props.value && props.value !== 'No filter') {
      if (props.value === 'Last 30 days' || props.value?.includes('DATEADD')) {
        const defaultStart = extendedDayjs().subtract(30, 'days').startOf('day');
        const defaultEnd = extendedDayjs().subtract(1, 'day').endOf('day');
        setStartDate(defaultStart);
        setEndDate(defaultEnd);
      } else {
        try {
          // Try to parse the value string
          const parts = props.value.split(' : ');
          if (parts.length === 2) {
            const start = parts[0].trim();
            const end = parts[1].trim();

            // Convert to dayjs
            if (start !== 'now' && start !== 'today' && start.match(/^\d{4}-\d{2}-\d{2}/)) {
              setStartDate(extendedDayjs(start));
            } else {
              setStartDate(null);
            }
            if (end !== 'now' && end !== 'today' && end.match(/^\d{4}-\d{2}-\d{2}/)) {
              setEndDate(extendedDayjs(end));
            } else {
              setEndDate(null);
            }
          }
        } catch (error) {
          // If parsing fails, use defaults (Last 30 days up to yesterday)
          console.error('Error parsing date range:', error);
          const defaultStart = extendedDayjs().subtract(30, 'days').startOf('day');
          const defaultEnd = extendedDayjs().subtract(1, 'day').endOf('day');
          setStartDate(defaultStart);
          setEndDate(defaultEnd);
        }
      }
    } else {
      // If no value or "No filter", set default and notify parent (Last 30 days up to yesterday)
      const defaultStart = extendedDayjs().subtract(30, 'days').startOf('day');
      const defaultEnd = extendedDayjs().subtract(1, 'day').endOf('day');
      setStartDate(defaultStart);
      setEndDate(defaultEnd);

      const startStr = defaultStart.format(DATE_FORMAT);
      const endStr = defaultEnd.format(DATE_FORMAT);
      const value = `${startStr} : ${endStr}`;
      props.onChange(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  const handleChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates) {
      props.onChange('');
      return;
    }

    const [start, end] = dates;

    // Preserve previous counterpart if the user only changed one side
    const newStart = start ?? startDate;
    const newEnd = end ?? endDate;

    // Update local state only for the sides explicitly changed
    if (start) setStartDate(start);
    if (end) setEndDate(end);

    let value = '';
    if (newStart && newEnd) {
      const startStr = newStart.format(DATE_FORMAT);
      const endStr = newEnd.format(DATE_FORMAT);
      value = `${startStr} : ${endStr}`;

      // Auto-apply when range is fully selected
      if (props.onSave) {
        // We need to call onChange first to update the parent state, then onSave to close/apply
        props.onChange(value);
        props.onSave(value);
        return;
      }
    } else if (newStart && !newEnd) {
      const startStr = newStart.format(DATE_FORMAT);
      value = `${startStr} :`;
    } else if (!newStart && newEnd) {
      const endStr = newEnd.format(DATE_FORMAT);
      value = `: ${endStr}`;
    }

    props.onChange(value);
  };

  // Handle calendar change for single-click date selection
  const handleCalendarChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates) {
      return;
    }

    const [start, end] = dates;

    // When first date is selected and second is not yet selected
    if (start && !end) {
      // Update only the start date and CLEAR the end date to force user to pick it
      setStartDate(start);
      setEndDate(null);

      const startStr = start.format(DATE_FORMAT);
      const value = `${startStr} :`;
      props.onChange(value);
    } else if (start && end) {
      // Both dates selected, update normally
      setStartDate(start);
      setEndDate(end);
      const startStr = start.format(DATE_FORMAT);
      const endStr = end.format(DATE_FORMAT);
      props.onChange(`${startStr} : ${endStr}`);
    } else if (!start && end) {
      // Only end selected from calendar change
      setEndDate(end);
      const startStr = startDate ? startDate.format(DATE_FORMAT) : '';
      const endStr = end.format(DATE_FORMAT);
      props.onChange(`${startStr} : ${endStr}`);
    }
  };

  const ranges = {
    // Keep only the requested presets
    [t('Yesterday')]: [
      extendedDayjs().subtract(1, 'day').startOf('day'),
      extendedDayjs().subtract(1, 'day').endOf('day'),
    ] as [Dayjs, Dayjs],
    [t('Last 30 Days')]: [
      extendedDayjs().subtract(30, 'days').startOf('day'),
      extendedDayjs().subtract(1, 'day').endOf('day'),
    ] as [Dayjs, Dayjs],
    [t('This Month')]: [
      extendedDayjs().startOf('month'),
      extendedDayjs().endOf('month'),
    ] as [Dayjs, Dayjs],
    [t('Last Month')]: [
      extendedDayjs().subtract(1, 'month').startOf('month'),
      extendedDayjs().subtract(1, 'month').endOf('month'),
    ] as [Dayjs, Dayjs],
    [t('All Time')]: [
      // Use a wide range for 'All Time'
      extendedDayjs().subtract(100, 'years').startOf('year'),
      extendedDayjs().endOf('day'),
    ] as [Dayjs, Dayjs],
  };

  if (locale === null) {
    return <Loading position="inline-centered" />;
  }

  return (
    <AntdThemeProvider locale={locale}>
      <div data-test="daterange-frame">
        <div className="section-title">{t('Select Date Range')}</div>
        <div style={{ marginBottom: 8 }}>
          <Button
            buttonSize="small"
            buttonStyle={props.value?.includes('DATEADD') ? 'primary' : 'secondary'}
            onClick={() => {
              const defaultStart = extendedDayjs().subtract(30, 'days').startOf('day');
              const defaultEnd = extendedDayjs().subtract(1, 'day').endOf('day');
              setStartDate(defaultStart);
              setEndDate(defaultEnd);

              // Use explicit DATEADD string to force dynamic calculation relative to "today"
              // Start: 30 days ago, End: 1 day ago (yesterday)
              const dynamicValue = 'DATEADD(DATETIME("today"), -30, day) : DATEADD(DATETIME("today"), -1, day)';

              props.onChange(dynamicValue);
              if (props.onSave) {
                props.onSave(dynamicValue);
              }
            }}
            placement="top"
          >
            {t('Last 30 days (Dynamic)')}
          </Button>
        </div>
        <RangePicker
          value={[startDate, endDate]}
          onChange={handleChange}
          onCalendarChange={handleCalendarChange}
          showTime={false}
          format="YYYY-MM-DD"
          ranges={ranges}
          style={{ width: '100%' }}
          // Show 2 months side by side: previous month on left, current month on right
          // Use initialPickerValue so it doesn't reset when user selects different dates
          picker="date"
          mode={['date', 'date']}
          open={true}
        />
      </div>
    </AntdThemeProvider>
  );
}
