/*
 * SONAR User Interface
 * Copyright (C) 2022 RERO
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Component, Input } from '@angular/core';
import { IContribution } from '../contribution.interface';

@Component({
    selector: 'sonar-contribution',
    templateUrl: './contribution.component.html',
    standalone: false
})
export class ContributionComponent {

  @Input() contributor: IContribution;

  @Input() view?: string;

  @Input() viewType: 'brief' | 'detail' = 'brief';

  get route(): string[] {
    return !this.view
      ? ['/records', 'documents']
      : ['/', this.view, 'search', 'documents'];
  }

  /**
   * Format meeting data
   * @return formatted meeting string
   */
  get meetingInfo(): string | null {
    const agent = this.contributor.agent;
    const meeting = [];
    ['number', 'date', 'place'].forEach((key: string) => {
      if (key in agent) {
        meeting.push(agent[key]);
      }
    });

    return meeting.length > 0 ? meeting.join(' : ') : null;
  }
}
