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
import {
  NO_TIME_RANGE,
  JsonObject,
  customTimeRangeDecode,
} from '@superset-ui/core';
import { useSelector } from 'react-redux';
import {
  COMMON_RANGE_VALUES_SET,
  CALENDAR_RANGE_VALUES_SET,
  CURRENT_RANGE_VALUES_SET,
} from '.';
import { FrameType } from '../types';

export const guessFrame = (timeRange: string): FrameType => {
  if (COMMON_RANGE_VALUES_SET.has(timeRange)) {
    return 'Common';
  }
  if (CALENDAR_RANGE_VALUES_SET.has(timeRange)) {
    return 'Calendar';
  }
  if (CURRENT_RANGE_VALUES_SET.has(timeRange)) {
    return 'Current';
  }
  if (timeRange === NO_TIME_RANGE) {
    return 'No filter';
  }
  if (customTimeRangeDecode(timeRange).matchedFlag) {
    return 'Custom';
  }
  // Проверяем, является ли это DateRange форматом (содержит DATEADD и DATETIME)
  if (timeRange.includes('DATEADD') && timeRange.includes('DATETIME')) {
    return 'DateRange';
  }
  return 'Advanced';
};

export function useDefaultTimeFilter() {
  const configValue = useSelector(
    (state: JsonObject) => state?.common?.conf?.DEFAULT_TIME_FILTER,
  );
  
  // Если конфигурационное значение не установлено, возвращаем дефолтное значение 30 дней
  if (!configValue || configValue === NO_TIME_RANGE) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29); // 29 дней назад + сегодня = 30 дней
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return `DATEADD(DATETIME('${formatDate(startDate)}'), 0, DAY) : DATEADD(DATETIME('${formatDate(endDate)}'), 0, DAY)`;
  }
  
  return configValue;
}
