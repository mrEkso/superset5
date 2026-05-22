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
import { ReactNode, useState, useEffect, useMemo } from 'react';
import {
  css,
  styled,
  t,
  useTheme,
  NO_TIME_RANGE,
  SupersetTheme,
  useCSSTextTruncation,
  fetchTimeRange,
} from '@superset-ui/core';
import { Global } from '@emotion/react';
import ControlHeader from 'src/explore/components/ControlHeader';
import Modal from 'src/components/Modal';
import Icons from 'src/components/Icons';
import { Tooltip } from 'src/components/Tooltip';
import { useDebouncedEffect } from 'src/explore/exploreUtils';
import { SLOW_DEBOUNCE } from 'src/constants';
import { noOp } from 'src/utils/common';
import ControlPopover from '../ControlPopover/ControlPopover';

import { DateFilterControlProps } from './types';
import {
  DateFilterTestKey,
  guessFrame,
  useDefaultTimeFilter,
  formatDateRangeDisplay,
} from './utils';
import {
  DateLabel,
  DateRangeFrame,
} from './components';



const IconWrapper = styled.span`
  span {
    margin-right: ${({ theme }) => 2 * theme.gridUnit}px;
    vertical-align: middle;
  }
  .text {
    vertical-align: middle;
  }
  .error {
    color: ${({ theme }) => theme.colors.error.base};
  }
`;

const getTooltipTitle = (
  isLabelTruncated: boolean,
  label: string | undefined,
  range: string | undefined,
) =>
  isLabelTruncated ? (
    <div>
      {label && <strong>{label}</strong>}
      {range && (
        <div
          css={(theme: SupersetTheme) => css`
            margin-top: ${theme.gridUnit}px;
          `}
        >
          {range}
        </div>
      )}
    </div>
  ) : (
    range || null
  );

export default function DateFilterLabel(props: DateFilterControlProps) {
  const {
    name,
    onChange,
    onOpenPopover = noOp,
    onClosePopover = noOp,
    overlayStyle = 'Popover',
    isOverflowingFilterBar = false,
  } = props;
  const defaultTimeFilter = useDefaultTimeFilter();

  const value = props.value ?? defaultTimeFilter;
  const [actualTimeRange, setActualTimeRange] = useState<string>(value);

  const [show, setShow] = useState<boolean>(false);
  const guessedFrame = useMemo(() => guessFrame(value), [value]);
  const [lastFetchedTimeRange, setLastFetchedTimeRange] = useState(value);
  const [timeRangeValue, setTimeRangeValue] = useState(value);
  const [validTimeRange, setValidTimeRange] = useState<boolean>(false);
  const [evalResponse, setEvalResponse] = useState<string>(value);
  const [tooltipTitle, setTooltipTitle] = useState<ReactNode | null>(value);
  const theme = useTheme();
  const [labelRef, labelIsTruncated] = useCSSTextTruncation<HTMLSpanElement>();

  useEffect(() => {
    if (value === NO_TIME_RANGE) {
      setActualTimeRange(NO_TIME_RANGE);
      setTooltipTitle(null);
      setValidTimeRange(true);
      return;
    }
    fetchTimeRange(value).then(({ value: actualRange, error }) => {
      if (error) {
        setEvalResponse(error || '');
        setValidTimeRange(false);
        setTooltipTitle(value || null);
      } else {
        /*
          HRT == human readable text
          ADR == actual datetime range
          +--------------+------+----------+--------+----------+-----------+
          |              | Last | Previous | Custom | Advanced | No Filter |
          +--------------+------+----------+--------+----------+-----------+
          | control pill | HRT  | HRT      | ADR    | ADR      |   HRT     |
          +--------------+------+----------+--------+----------+-----------+
          | tooltip      | ADR  | ADR      | HRT    | HRT      |   ADR     |
          +--------------+------+----------+--------+----------+-----------+
        */
        if (
          guessedFrame === 'Common' ||
          guessedFrame === 'Calendar' ||
          guessedFrame === 'Current' ||
          guessedFrame === 'No filter'
        ) {
          setActualTimeRange(value);
          setTooltipTitle(
            getTooltipTitle(labelIsTruncated, value, actualRange),
          );
        } else {
          setActualTimeRange(actualRange || '');
          setTooltipTitle(
            getTooltipTitle(labelIsTruncated, actualRange, value),
          );
        }
        setValidTimeRange(true);
      }
      setLastFetchedTimeRange(value);
      setEvalResponse(actualRange || value);
    });
  }, [guessedFrame, labelIsTruncated, labelRef, value]);

  useDebouncedEffect(
    () => {
      if (timeRangeValue === NO_TIME_RANGE) {
        setEvalResponse(NO_TIME_RANGE);
        setLastFetchedTimeRange(NO_TIME_RANGE);
        setValidTimeRange(true);
        return;
      }
      if (lastFetchedTimeRange !== timeRangeValue) {
        fetchTimeRange(timeRangeValue).then(({ value: actualRange, error }) => {
          if (error) {
            setEvalResponse(error || '');
            setValidTimeRange(false);
          } else {
            setEvalResponse(actualRange || '');
            setValidTimeRange(true);
          }
          setLastFetchedTimeRange(timeRangeValue);
        });
      }
    },
    SLOW_DEBOUNCE,
    [timeRangeValue],
  );

  function onSave(val?: string) {
    // If the user edited only one side (start or end), preserve the other side
    // from the currently applied `value` so Apply keeps the unchanged bound.
    const separator = ' : ';
    const parseRange = (s: string | undefined) => {
      if (!s) return [null, null];
      const parts = s.split(separator);
      const a = parts[0]?.trim();
      const b = parts[1]?.trim();
      return [a === '' ? null : a, b === '' ? null : b];
    };
    const [origStart, origEnd] = parseRange(value);
    // Use provided value or fall back to state
    const [editStart, editEnd] = parseRange(typeof val === 'string' ? val : timeRangeValue);

    const finalStart = editStart ?? origStart ?? '';
    const finalEnd = editEnd ?? origEnd ?? '';

    const merged = `${finalStart}${separator}${finalEnd}`.trim();
    onChange(merged);
    setShow(false);
    onClosePopover();
  }

  function onOpen() {
    setTimeRangeValue(value);
    setShow(true);
    onOpenPopover();
  }

  function onHide() {
    onSave(timeRangeValue);
  }

  const toggleOverlay = () => {
    if (show) {
      onHide();
    } else {
      onOpen();
    }
  };

  const overlayContent = (
    <>
      {/* Only show DateRangeFrame calendar - all other controls are removed */}
      <DateRangeFrame value={timeRangeValue} onChange={setTimeRangeValue} onSave={onSave} />
    </>
  );

  const title = (
    <IconWrapper>
      <Icons.EditAlt iconColor={theme.colors.grayscale.base} />
      <span className="text">{t('Edit time range')}</span>
    </IconWrapper>
  );

  const popoverContent = (
    <ControlPopover
      placement="bottomLeft"
      trigger="click"
      content={overlayContent}
      title={null}
      defaultVisible={show}
      visible={show}
      align={{ offset: [0, -8] }}
      onVisibleChange={toggleOverlay}
      overlayClassName="date-filter-popover-transparent"
      overlayStyle={{ width: 'auto', padding: 0 }}
      overlayInnerStyle={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}
      getPopupContainer={triggerNode =>
        isOverflowingFilterBar
          ? (triggerNode.parentNode as HTMLElement)
          : document.body
      }
      destroyTooltipOnHide
    >
      <Tooltip placement="top" title={tooltipTitle}>
        <DateLabel
          name={name}
          aria-labelledby={`filter-name-${props.name}`}
          aria-describedby={`date-label-${props.name}`}
          label={formatDateRangeDisplay(value)}
          isActive={show}
          isPlaceholder={actualTimeRange === NO_TIME_RANGE}
          data-test={DateFilterTestKey.PopoverOverlay}
          ref={labelRef}
        />
      </Tooltip>
    </ControlPopover>
  );

  const modalContent = (
    <>
      <Tooltip placement="top" title={tooltipTitle}>
        <DateLabel
          name={name}
          aria-labelledby={`filter-name-${props.name}`}
          aria-describedby={`date-label-${props.name}`}
          onClick={toggleOverlay}
          label={formatDateRangeDisplay(value)}
          isActive={show}
          isPlaceholder={actualTimeRange === NO_TIME_RANGE}
          data-test={DateFilterTestKey.ModalOverlay}
          ref={labelRef}
        />
      </Tooltip>
      {/* the zIndex value is from trying so that the Modal doesn't overlay the AdhocFilter */}
      <Modal
        title={title}
        show={show}
        onHide={toggleOverlay}
        width="600px"
        hideFooter
        zIndex={1030}
      >
        {overlayContent}
      </Modal>
    </>
  );

  return (
    <>
      <ControlHeader {...props} />
      <Global
        styles={css`
          .date-filter-popover-transparent .ant-popover-inner,
          .date-filter-popover-transparent .ant-popover-arrow {
            background-color: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          .date-filter-popover-transparent .ant-popover-inner-content {
            padding: 0 !important;
          }
          
          /* Mobile landscape mode - fix popover positioning */
          @media screen and (max-height: 500px) and (orientation: landscape) {
            .date-filter-popover-transparent {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 100% !important;
              height: 100% !important;
              transform: none !important;
              
              .ant-popover-content {
                height: 100%;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding: 10px;
                overflow: auto;
              }
              
              .ant-popover-inner-content {
                max-height: calc(100vh - 20px) !important;
                max-height: calc(100dvh - 20px) !important;
                overflow: auto !important;
              }
            }
          }
        `}
      />
      {overlayStyle === 'Modal' ? modalContent : popoverContent}
    </>
  );
}
