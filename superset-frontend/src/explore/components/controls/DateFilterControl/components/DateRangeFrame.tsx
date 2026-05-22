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
import { css, t } from '@superset-ui/core';
import { extendedDayjs } from 'src/utils/dates';
import { RangePicker } from 'src/components/DatePicker';
import { Input } from 'src/components/Input';
import { Dayjs } from 'dayjs';
import { FrameComponentProps } from 'src/explore/components/controls/DateFilterControl/types';
import { AntdThemeProvider } from 'src/components/AntdThemeProvider';
import { useLocale } from 'src/hooks/useLocale';
import Loading from 'src/components/Loading';

// Custom format without time for date range picker
import { Global } from '@emotion/react';

const DATE_FORMAT = 'YYYY-MM-DD';
const INPUT_DATE_FORMAT = 'DD.MM.YYYY';

// Dynamic preset label for special handling
const DYNAMIC_PRESET_LABEL = 'Last 30 days (Dynamic)';

export function DateRangeFrame(props: FrameComponentProps) {
  const locale = useLocale();
  // Default: Last 30 days up to yesterday
  const [startDate, setStartDate] = useState<Dayjs | null>(
    extendedDayjs().subtract(30, 'days').startOf('day'),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    extendedDayjs().subtract(1, 'day').endOf('day'),
  );

  const [startInput, setStartInput] = useState<string>('');
  const [endInput, setEndInput] = useState<string>('');
  const [inputError, setInputError] = useState<boolean>(false);

  // Sync inputs with state
  useEffect(() => {
    setStartInput(startDate ? startDate.format(INPUT_DATE_FORMAT) : '');
  }, [startDate]);

  useEffect(() => {
    setEndInput(endDate ? endDate.format(INPUT_DATE_FORMAT) : '');
  }, [endDate]);

  useEffect(() => {
    if (startInput.length === 10 && endInput.length === 10) {
      if (extendedDayjs(startInput, INPUT_DATE_FORMAT).isAfter(extendedDayjs(endInput, INPUT_DATE_FORMAT))) {
        setInputError(true);
      } else {
        setInputError(false);
      }
    } else {
      setInputError(false);
    }
  }, [startInput, endInput]);

  const handleInputMask = (value: string) => {
    let val = value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2) + '.' + val.slice(2);
    if (val.length > 5) val = val.slice(0, 5) + '.' + val.slice(5, 9);
    return val;
  };

  const applyManualInput = (start: Dayjs | null, end: Dayjs | null) => {
    setStartDate(start);
    setEndDate(end);
    
    // Basic check for correct range
    if (start && end && start.isAfter(end)) {
       return;
    }

    if (start && end) {
       props.onChange(`${start.format(DATE_FORMAT)} : ${end.format(DATE_FORMAT)}`);
    } else if (start) {
       props.onChange(`${start.format(DATE_FORMAT)} :`);
    } else if (end) {
       props.onChange(`: ${end.format(DATE_FORMAT)}`);
    }
  };

  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = handleInputMask(e.target.value);
    setStartInput(masked);
    const parsed = extendedDayjs(masked, INPUT_DATE_FORMAT);
    if (masked.length === 10 && parsed.isValid()) {
      applyManualInput(parsed, endDate);
    }
  };

  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = handleInputMask(e.target.value);
    setEndInput(masked);
    const parsed = extendedDayjs(masked, INPUT_DATE_FORMAT);
    if (masked.length === 10 && parsed.isValid()) {
      applyManualInput(startDate, parsed);
    }
  };




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

    // Check if the dynamic preset was clicked (indicated by 1ms marker)
    if (start && start.millisecond() === 1) {
      const dynamicValue = 'DATEADD(DATETIME("today"), -30, day) : DATEADD(DATETIME("today"), -1, day)';
      props.onChange(dynamicValue);
      if (props.onSave) {
        props.onSave(dynamicValue);
      }
      return;
    }

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

  // Presets array for antd v5 RangePicker
  const presets = [
    {
      label: t('Yesterday'),
      value: [
        extendedDayjs().subtract(1, 'day').startOf('day'),
        extendedDayjs().subtract(1, 'day').endOf('day'),
      ] as [Dayjs, Dayjs],
    },
    {
      label: t('Last 30 Days'),
      value: [
        extendedDayjs().subtract(30, 'days').startOf('day'),
        extendedDayjs().subtract(1, 'day').endOf('day'),
      ] as [Dayjs, Dayjs],
    },
    {
      label: t('This Month'),
      value: [
        extendedDayjs().startOf('month'),
        extendedDayjs().endOf('month'),
      ] as [Dayjs, Dayjs],
    },
    {
      label: t('Last Month'),
      value: [
        extendedDayjs().subtract(1, 'month').startOf('month'),
        extendedDayjs().subtract(1, 'month').endOf('month'),
      ] as [Dayjs, Dayjs],
    },
    {
      label: t('All Time'),
      value: [
        // Use a wide range for 'All Time'
        extendedDayjs().subtract(100, 'years').startOf('year'),
        extendedDayjs().endOf('day'),
      ] as [Dayjs, Dayjs],
    },
    {
      label: t(DYNAMIC_PRESET_LABEL),
      value: () => {
        return [
          extendedDayjs().subtract(30, 'days').startOf('day').add(1, 'ms'),
          extendedDayjs().subtract(1, 'day').endOf('day'),
        ] as [Dayjs, Dayjs];
      },
    },
  ];

  if (locale === null) {
    return <Loading position="inline-centered" />;
  }

  return (
    <AntdThemeProvider locale={locale}>
      <Global
        styles={css`
            .date-filter-range-picker-popup {
               /* Use a specific selector to target the dropdown content */
               .ant-picker-presets,
               .antd5-picker-presets {
                  position: relative;
                  min-height: 350px; 
                  min-width: 200px !important;
                  width: auto !important;
                 
                 ul {
                   display: flex;
                   flex-direction: column;
                   height: 100%;
                   width: 100%;
                   padding-bottom: 50px; 
                   
                   li {
                     white-space: nowrap;
                     padding-right: 20px; 
                   }
                   
                   li:last-child {
                     position: absolute;
                     bottom: 0;
                     left: 0;
                     width: 100%;
                     padding: 12px;
                     border-top: 1px solid #ebedf0;
                     background-color: #fff;
                     
                     color: #1890ff;
                     font-weight: 500;
                     
                     &:hover {
                       color: #40a9ff;
                       background-color: #e6f7ff;
                     }
                   }
                 }
               }
               
               /* Mobile landscape mode fix - prevent calendar from escaping viewport */
               @media screen and (max-height: 500px) and (orientation: landscape) {
                 position: fixed !important;
                 top: 5px !important;
                 left: 5px !important;
                 right: 5px !important;
                 bottom: 5px !important;
                 max-height: calc(100vh - 10px) !important;
                 max-height: calc(100dvh - 10px) !important;
                 overflow: auto !important;
                 z-index: 9999 !important;
                 background: #fff !important;
                 border-radius: 8px !important;
                 box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
                 
                 .ant-picker-panels,
                 .antd5-picker-panels {
                   flex-wrap: nowrap !important;
                   justify-content: flex-start !important;
                   overflow-x: auto !important;
                 }
                 
                 .ant-picker-panel,
                 .antd5-picker-panel {
                   flex-shrink: 0 !important;
                 }
                 
                 /* Presets - vertical list with scroll */
                 .ant-picker-presets,
                 .antd5-picker-presets {
                   min-height: auto !important;
                   max-height: calc(100vh - 30px) !important;
                   max-height: calc(100dvh - 30px) !important;
                   height: auto !important;
                   min-width: 140px !important;
                   width: 140px !important;
                   overflow-y: auto !important;
                   overflow-x: hidden !important;
                   padding: 8px 0 !important;
                   
                   ul {
                     display: flex !important;
                     flex-direction: column !important;
                     gap: 2px !important;
                     padding: 0 !important;
                     padding-bottom: 0 !important;
                     margin: 0 !important;
                     height: auto !important;
                     
                     li {
                       white-space: nowrap !important;
                       padding: 6px 12px !important;
                       margin: 0 !important;
                       font-size: 12px !important;
                       line-height: 1.4 !important;
                       cursor: pointer !important;
                       position: static !important;
                       background: transparent !important;
                       border: none !important;
                       width: auto !important;
                       
                       &:hover {
                         background: #f5f5f5 !important;
                       }
                     }
                     
                     /* Dynamic preset */
                     li:last-child {
                       position: static !important;
                       color: #1890ff !important;
                       font-weight: 500 !important;
                       margin-top: 4px !important;
                       padding-top: 8px !important;
                       border-top: 1px solid #ebedf0 !important;
                       
                       &:hover {
                         background: #e6f7ff !important;
                       }
                     }
                   }
                 }
               }
               
               /* Smaller mobile devices in landscape - more compact */
               @media screen and (max-height: 400px) and (orientation: landscape) {
                 .ant-picker-date-panel,
                 .antd5-picker-date-panel {
                   font-size: 11px !important;
                 }
                 
                 .ant-picker-cell,
                 .antd5-picker-cell {
                   min-width: 22px !important;
                   height: 22px !important;
                   line-height: 22px !important;
                   padding: 0 !important;
                 }
                 
                 .ant-picker-cell-inner,
                 .antd5-picker-cell-inner {
                   min-width: 20px !important;
                   height: 20px !important;
                   line-height: 20px !important;
                 }
                 
                 .ant-picker-content th,
                 .ant-picker-content td,
                 .antd5-picker-content th,
                 .antd5-picker-content td {
                   min-width: 22px !important;
                   padding: 1px !important;
                 }
                 
                 .ant-picker-header,
                 .antd5-picker-header {
                   padding: 2px 6px !important;
                 }
                 
                 .ant-picker-presets,
                 .antd5-picker-presets {
                   min-width: 120px !important;
                   width: 120px !important;
                 }
                 
                 .ant-picker-presets ul li,
                 .antd5-picker-presets ul li {
                   padding: 4px 8px !important;
                   font-size: 11px !important;
                 }
               }
           }
        `}
      />
      <RangePicker
        value={[startDate, endDate]}
        onChange={handleChange}
        onCalendarChange={handleCalendarChange}
        renderExtraFooter={() => (
           <div style={{ padding: '10px 16px', borderTop: '1px solid #ebedf0', display: 'flex', gap: '8px', alignItems: 'center' }}>
             <Input 
               placeholder="DD.MM.YYYY" 
               value={startInput} 
               onChange={handleStartInputChange}
               style={{ width: '120px', borderColor: inputError ? '#ff4d4f' : undefined }}
             />
             <span> - </span>
             <Input 
               placeholder="DD.MM.YYYY" 
               value={endInput} 
               onChange={handleEndInputChange}
               style={{ width: '120px', borderColor: inputError ? '#ff4d4f' : undefined }}
             />
             {inputError && <span style={{ color: '#ff4d4f', fontSize: '12px' }}>{t('Start > End')}</span>}
           </div>
        )}
        showTime={false}
        format="YYYY-MM-DD"
        presets={presets}
        style={{ width: '100%' }}
        popupClassName="date-filter-range-picker-popup"
        css={css`
            /* Make the input bar visually disappear */
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            border: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            position: absolute !important;
            top: 0;
            left: 0;
            overflow: hidden !important;

            /* Ensure the dropdown itself is visible and styled */
            & + .ant-picker-dropdown, 
            & ~ .ant-picker-dropdown,
            .ant-picker-dropdown,
            .antd5-picker-dropdown {
               position: static !important;
               display: block !important;
               background-color: #fff;
               border-radius: 4px;
               box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05) !important;
            }
        `}
        picker="date"
        mode={['date', 'date']}
        open={true}
        getPopupContainer={trigger => trigger.parentNode as HTMLElement}
      />
    </AntdThemeProvider>
  );
}
