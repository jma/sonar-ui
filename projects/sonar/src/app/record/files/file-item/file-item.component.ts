/*
 * SONAR User Interface
 * Copyright (C) 2024 RERO
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

import {
  Component,
  inject,
  input,
  output
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'primeng/dynamicdialog';
import { AppConfigService } from '../../../app-config.service';
import { FileItemEditorComponent } from '../file-item-editor/file-item-editor.component';
@Component({
    selector: 'sonar-file-item',
    templateUrl: './file-item.component.html',
    standalone: false
})
export class FileItemComponent {
  // file to display
  file = input.required<any>();

  schema = input.required<any>();

  // event when a file should be deleted
  delete = output<any>();
  // event when the file metadata should be updated
  update = output<any>();
  // event when a new version of the file should be saved
  upload = output<any>();

  // maximum upload file size
  maxFileSize: number;

  // application configuration service
  appConfigService = inject(AppConfigService);

  dialogService = inject(DialogService);
  translateService = inject(TranslateService);

  /**
   * constructor
   */
  constructor() {
    this.maxFileSize = this.appConfigService.maxFileSize;
  }

  showEditor() {
     let modalRef = this.dialogService.open(FileItemEditorComponent, {
        header: this.translateService.instant('Metadata Editor'),
        modal: true,
        data: {
          file: this.file(),
          schema: this.schema()
        },
        closable: true,
        width: '60vw'
      });
    modalRef.onClose.subscribe(model => model ? this.update.emit(model): null);
  }
  /**
   * Get the download URL for a given file
   *
   * @param file to generate the URL
   * @returns the URL as string
   */
  downloadURL(file): string {
    const urlObj = new URL(file.links.self);
    let baseUrl = urlObj.pathname;
    return `${baseUrl}/${file.key}?download&versionId=${file.version_id}`;
  }

  /**
   * Delete a given file.
   *
   * @param file to delete
   */
  deleteFile() {
    this.delete.emit(this.file());
  }

  /**
   * Upload a new version of a file
   *
   * @param event
   */
  uploadHandler(event) {
    this.upload.emit({ file: this.file(), fileUpload: event.files[0] });
  }

}
