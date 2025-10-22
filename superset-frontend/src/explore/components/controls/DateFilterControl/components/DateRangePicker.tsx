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
import './daterangepicker.d';
import { useEffect, useRef } from 'react';
import { t, styled } from '@superset-ui/core';
import moment from 'moment';
import $ from 'jquery';

// Импортируем daterangepicker после jQuery
if (typeof window !== 'undefined') {
  require('daterangepicker');
  require('daterangepicker/daterangepicker.css');
}

const DateRangePickerWrapper = styled.div`
  width: 100%;
  margin-top: 8px;
  
  input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    background-color: ${({ theme }) => theme.colors.grayscale.light5};
    
    &:hover {
      border-color: ${({ theme }) => theme.colors.primary.base};
    }
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary.base};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.light3};
    }
  }
  
  .daterangepicker {
    z-index: 10000;
  }
`;

interface DateRangePickerProps {
  onChange: (startDate: string, endDate: string, label: string) => void;
  value?: { start: string; end: string };
}

export function DateRangePickerComponent(props: DateRangePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { onChange, value } = props;

  useEffect(() => {
    if (!inputRef.current || typeof window === 'undefined') return;

    const $input = $(inputRef.current);
    
    // Определяем начальные даты - 30 дней (29 дней назад + сегодня)
    const endDate = moment();
    const startDate = moment().subtract(29, 'days');

    // Конфигурация daterangepicker
    $input.daterangepicker({
      startDate: value?.start ? moment(value.start) : startDate,
      endDate: value?.end ? moment(value.end) : endDate,
      opens: 'left',
      locale: {
        format: 'DD.MM.YYYY',
        separator: ' - ',
        applyLabel: t('Apply'),
        cancelLabel: t('Cancel'),
        fromLabel: t('From'),
        toLabel: t('To'),
        customRangeLabel: t('Custom Range'),
        weekLabel: 'W',
        daysOfWeek: [
          t('Su'),
          t('Mo'),
          t('Tu'),
          t('We'),
          t('Th'),
          t('Fr'),
          t('Sa'),
        ],
        monthNames: [
          t('January'),
          t('February'),
          t('March'),
          t('April'),
          t('May'),
          t('June'),
          t('July'),
          t('August'),
          t('September'),
          t('October'),
          t('November'),
          t('December'),
        ],
        firstDay: 1,
      },
      ranges: {
        [t('Last 30 Days')]: [moment().subtract(29, 'days'), moment()],
        [t('Last 7 Days')]: [moment().subtract(6, 'days'), moment()],
        [t('This Month')]: [moment().startOf('month'), moment().endOf('month')],
        [t('Last Month')]: [
          moment().subtract(1, 'month').startOf('month'),
          moment().subtract(1, 'month').endOf('month'),
        ],
        [t('This Quarter')]: [moment().startOf('quarter'), moment().endOf('quarter')],
        [t('This Year')]: [moment().startOf('year'), moment().endOf('year')],
        [t('Last Year')]: [
          moment().subtract(1, 'year').startOf('year'),
          moment().subtract(1, 'year').endOf('year'),
        ],
        [t('All Time')]: [moment('2000-01-01'), moment()],
      },
      alwaysShowCalendars: true,
      showCustomRangeLabel: true,
    } as any);

    // Обработчик изменения диапазона
    $input.on('apply.daterangepicker', (ev: any, picker: any) => {
      const start = picker.startDate.format('YYYY-MM-DD');
      const end = picker.endDate.format('YYYY-MM-DD');
      const label = picker.chosenLabel || t('Custom Range');
      onChange(start, end, label);
    });

    // Cleanup
    return () => {
      if ($input.data('daterangepicker')) {
        $input.data('daterangepicker').remove();
      }
    };
  }, [onChange, value]);

  return (
    <DateRangePickerWrapper>
      <input
        ref={inputRef}
        type="text"
        name="daterange"
        placeholder={t('Select date range')}
        readOnly
      />
    </DateRangePickerWrapper>
  );
}
