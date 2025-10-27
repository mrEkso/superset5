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
import { DAYJS_FORMAT } from 'src/explore/components/controls/DateFilterControl/utils';
import { AntdThemeProvider } from 'src/components/AntdThemeProvider';
import { useLocale } from 'src/hooks/useLocale';
import Loading from 'src/components/Loading';

export function DateRangeFrame(props: FrameComponentProps) {
  const locale = useLocale();
  const [startDate, setStartDate] = useState<Dayjs>(
    extendedDayjs().subtract(29, 'days').startOf('day'),
  );
  const [endDate, setEndDate] = useState<Dayjs>(
    extendedDayjs().endOf('day'),
  );

  // Parse the incoming value to set initial dates
  useEffect(() => {
    if (props.value && props.value !== 'No filter') {
      try {
        // Try to parse the value string
        const parts = props.value.split(' : ');
        if (parts.length === 2) {
          const start = parts[0].trim();
          const end = parts[1].trim();
          
          // Convert to dayjs
          if (start !== 'now' && start !== 'today' && start.match(/^\d{4}-\d{2}-\d{2}/)) {
            setStartDate(extendedDayjs(start));
          }
          if (end !== 'now' && end !== 'today' && end.match(/^\d{4}-\d{2}-\d{2}/)) {
            setEndDate(extendedDayjs(end));
          }
        }
      } catch (error) {
        // If parsing fails, use defaults (Last 30 days)
        console.error('Error parsing date range:', error);
        setStartDate(extendedDayjs().subtract(29, 'days').startOf('day'));
        setEndDate(extendedDayjs().endOf('day'));
      }
    }
  }, [props.value]);

  const handleChange = (dates: [Dayjs, Dayjs] | null) => {
    if (!dates) {
      return;
    }
    
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    
    // Convert dayjs to the format expected by Superset
    const startStr = start.format(DAYJS_FORMAT);
    const endStr = end.format(DAYJS_FORMAT);
    
    // Use the custom format expected by Superset
    const value = `${startStr} : ${endStr}`;
    props.onChange(value);
  };

  const ranges = {
    [t('Last 30 Days')]: [
      extendedDayjs().subtract(29, 'days').startOf('day'),
      extendedDayjs().endOf('day'),
    ] as [Dayjs, Dayjs],
    [t('Last 7 Days')]: [
      extendedDayjs().subtract(6, 'days').startOf('day'),
      extendedDayjs().endOf('day'),
    ] as [Dayjs, Dayjs],
    [t('Last Week')]: [
      extendedDayjs().subtract(1, 'week').startOf('week'),
      extendedDayjs().subtract(1, 'week').endOf('week'),
    ] as [Dayjs, Dayjs],
    [t('Last Month')]: [
      extendedDayjs().subtract(1, 'month').startOf('month'),
      extendedDayjs().subtract(1, 'month').endOf('month'),
    ] as [Dayjs, Dayjs],
    [t('Last Quarter')]: [
      extendedDayjs().subtract(3, 'months').startOf('month'),
      extendedDayjs().subtract(1, 'month').endOf('month'),
    ] as [Dayjs, Dayjs],
    [t('Last Year')]: [
      extendedDayjs().subtract(1, 'year').startOf('year'),
      extendedDayjs().subtract(1, 'year').endOf('year'),
    ] as [Dayjs, Dayjs],
    [t('This Month')]: [
      extendedDayjs().startOf('month'),
      extendedDayjs().endOf('month'),
    ] as [Dayjs, Dayjs],
    [t('This Year')]: [
      extendedDayjs().startOf('year'),
      extendedDayjs().endOf('year'),
    ] as [Dayjs, Dayjs],
    [t('All Time')]: [
      extendedDayjs().subtract(10, 'years').startOf('year'),
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
        <RangePicker
          value={[startDate, endDate]}
          onChange={handleChange}
          showTime={{ format: 'HH:mm:ss' }}
          format="YYYY-MM-DD HH:mm:ss"
          ranges={ranges}
          style={{ width: '100%' }}
        />
      </div>
    </AntdThemeProvider>
  );
}
