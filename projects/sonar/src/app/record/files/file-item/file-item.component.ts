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
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions } from '@ngx-formly/core';
import { FormlyJsonschema } from '@ngx-formly/core/json-schema';
import {
  JSONSchemaService,
  processJsonSchema,
  resolve$ref,
} from '@rero/ng-core';
import { AppConfigService } from '../../../app-config.service';
@Component({
  selector: 'sonar-file-item',
  templateUrl: './file-item.component.html'
})
export class FileItemComponent {
  // file to display
  file = input.required<any>();
  // editor JSONSchema
  schema = input.required<any>();
  // event when a file should be deleted
  delete = output<any>();
  // event when the file metadata should be updated
  update = output<any>();
  // event when a new version of the file should be saved
  upload = output<any>();

  // maximum upload file size
  maxFileSize: number;

  // formly jsonschema service
  formlyJSONSchema = inject(FormlyJsonschema);
  // ng-core jsonschema service
  jsonschemaService = inject(JSONSchemaService);
  // application configuration service
  appConfigService = inject(AppConfigService);

  // the formly form
  form: FormGroup = new FormGroup({});
  // editor value
  model: any = {};
  // editor options
  options: FormlyFormOptions = {};
  // formly editor fields
  fields = computed(() => this.createForm(this.schema()));

  /**
   * constructor
   */
  constructor() {
    this.maxFileSize = this.appConfigService.maxFileSize;
    effect(() => {
      // set the form model from the file content
      this.model = this.file().metadata;
    });
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
  deleteFile(file) {
    this.delete.emit(file);
  }

  /**
   * Update the file metadata.
   */
  save() {
    this.update.emit(this.model);
  }

  /**
   * Upload a new version of a file
   *
   * @param event
   */
  uploadHandler(event) {
    this.upload.emit({ file: this.file(), fileUpload: event.files[0] });
  }

  /**
   * Create the form editor.
   *
   * @param schema editor JSONSchema
   * @returns the formly fields.
   */
  private createForm(schema: any) {
    schema = processJsonSchema(resolve$ref(schema, schema.properties));
    // form configuration
    const editorConfig = {
      longMode: false,
    };
    return [
      this.formlyJSONSchema.toFieldConfig(schema, {
        map: (field: any, fieldSchema: any) => {
          field = this.jsonschemaService.processField(field, fieldSchema);
          field.props.editorConfig = editorConfig;
          field.props.getRoot = () => this.fields()[0];
          return field;
        },
      }),
    ];
  }
}
