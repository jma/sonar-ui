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
import { Pipe, PipeTransform } from '@angular/core';
import { IContribution } from '../record/document/contribution.interface';

@Pipe({
    name: 'contributors',
    standalone: false
})
export class ContributorsPipe implements PipeTransform {

  /** Sort priority */
  private SORT_CONTRIBUTOR_PRIORITY = ['cre', 'ctb', 'dgs', 'edt', 'prt'];

  /**
   * Transform
   *
   * @param contributors - array of contributions
   * @param meeting - true: extract only meeting, false: extract person and organization
   * @returns array of sorted contributors
   */
  transform(contributors?: IContribution[], meeting = false): any[] {
    if (!contributors) {
      return [];
    }

    contributors = contributors.filter((contributor: IContribution) => {
      if (meeting) {
        return contributor.agent.type === 'bf:Meeting';
      } else {
        return contributor.agent.type !== 'bf:Meeting';
      }
    });

    return contributors.sort(
      (a: any, b: any) => {
        const aIndex = this.SORT_CONTRIBUTOR_PRIORITY.findIndex(
          (role) => a.role[0] === role
        );
        const bIndex = this.SORT_CONTRIBUTOR_PRIORITY.findIndex(
          (role) => b.role[0] === role
        );
        if (aIndex === bIndex) {
          return 0;
        }
        return aIndex < bIndex ? -1 : 1;
      }
    );
  }
}
