/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {classNames} from '@react-spectrum/utils';
import React from 'react';
import {setDay} from 'date-fns'; // pull these out individually
import styles from '@adobe/spectrum-css-temp/components/calendar/vars.css';
import {useDateFormatter} from '@react-aria/i18n';

interface CalendarTableHeaderProps {
  weekStart: number
}

export function CalendarTableHeader({weekStart}: CalendarTableHeaderProps) {
  let dayFormatter = useDateFormatter({weekday: 'short'});

  return (
    <thead>
      <tr>
        {
          [...new Array(7).keys()].map(index => {
            let day = dayFormatter.format(setDay(Date.now(), (index + weekStart) % 7));
            return (
              <th
                key={index}
                className={classNames(styles, 'spectrum-Calendar-tableCell')}>
                <abbr className={classNames(styles, 'spectrum-Calendar-dayOfWeek')}>
                  {day}
                </abbr>
              </th>
            );
          })
        }
      </tr>
    </thead>
  );
}
