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
import { t } from '@superset-ui/core';
import { FrameComponentProps } from '../types';
import { DateRangePickerComponent } from './DateRangePicker';
import { useMemo } from 'react';

export function DateRangeFrame(props: FrameComponentProps) {
  const { value, onChange } = props;

  // Парсим текущее значение для извлечения дат
  const currentValue = useMemo(() => {
    // Формат: "DATEADD(DATETIME('2024-09-24'), 0, DAY) : DATEADD(DATETIME('2024-10-23'), 0, DAY)"
    const regex = /DATETIME\('([^']+)'\)[^:]*:\s*DATETIME\('([^']+)'\)/;
    const match = value?.match(regex);
    
    if (match) {
      return {
        start: match[1],
        end: match[2],
      };
    }
    
    return undefined;
  }, [value]);

  const handleDateRangeChange = (startDate: string, endDate: string, label: string) => {
    // Формируем строку в формате, который ожидает Superset
    const timeRange = `DATEADD(DATETIME('${startDate}'), 0, DAY) : DATEADD(DATETIME('${endDate}'), 0, DAY)`;
    onChange(timeRange);
  };

  return (
    <>
      <div className="section-title">
        {t('Select Date Range')}
      </div>
      <DateRangePickerComponent
        onChange={handleDateRangeChange}
        value={currentValue}
      />
    </>
  );
}
