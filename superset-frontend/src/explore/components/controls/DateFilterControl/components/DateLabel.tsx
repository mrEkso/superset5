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

import { forwardRef, MouseEvent, ReactNode, RefObject } from 'react';

import { css, styled, t } from '@superset-ui/core';
import Icons from 'src/components/Icons';

export type DateLabelProps = {
  name?: string;
  label: ReactNode;
  isActive?: boolean;
  isPlaceholder?: boolean;
  onClick?: (event: MouseEvent) => void;
};

// Blue color for icons and text (matching mockup)
const LABEL_BLUE = '#1890ff';

const LabelContainer = styled.div<{
  isActive?: boolean;
  isPlaceholder?: boolean;
}>`
  ${({ theme, isActive, isPlaceholder }) => css`
    width: 100%;
    height: ${theme.gridUnit * 8}px;

    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: ${theme.gridUnit * 2}px;

    padding: 0 ${theme.gridUnit * 3}px;

    /* Light Blue background matching mockup */
    background-color: #E6F7FF;

    /* Subtle blue border or transparent */
    border: 1px solid #BAE7FF;
    border-radius: ${theme.borderRadius}px;

    cursor: pointer;

    transition: all 0.3s cubic-bezier(0.65, 0.05, 0.36, 1);
    :hover,
    :focus {
      background-color: #BAE7FF;
      border-color: #1890ff;
    }

    /* Calendar icon on left - blue */
    .calendar-icon {
      flex-shrink: 0;
      color: #1890ff;
    }

    /* Date text - blue color */
    .date-label-content {
      color: #1890ff;
      font-weight: ${theme.typography.weights.medium};
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      flex: 1;
      white-space: nowrap;
    }

    /* Dropdown arrow on right - blue */
    .dropdown-icon {
      flex-shrink: 0;
      color: ${LABEL_BLUE};
      margin-left: auto;
    }
  `}
`;

export const DateLabel = forwardRef(
  (props: DateLabelProps, ref: RefObject<HTMLSpanElement>) => {
    return (
      <LabelContainer {...props} tabIndex={0} role="button">
        {/* Calendar icon on left */}
        <Icons.CalendarOutlined
          className="calendar-icon"
          iconSize="s"
          iconColor={LABEL_BLUE}
        />
        {/* Date label text */}
        <span
          id={`date-label-${props.name}`}
          className="date-label-content"
          ref={ref}
        >
          {typeof props.label === 'string' ? t(props.label) : props.label}
        </span>
        {/* Dropdown arrow on right */}
        <Icons.CaretDownOutlined
          className="dropdown-icon"
          iconSize="s"
          iconColor={LABEL_BLUE}
        />
      </LabelContainer>
    );
  },
);

