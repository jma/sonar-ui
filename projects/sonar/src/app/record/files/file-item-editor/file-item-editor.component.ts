import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions } from '@ngx-formly/core';
import { FormlyJsonschema } from '@ngx-formly/core/json-schema';
import { JSONSchemaService, processJsonSchema, resolve$ref } from '@rero/ng-core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
@Component({
  selector: 'sonar-file-item-editor',
  templateUrl: './file-item-editor.component.html',
  standalone: false
})
export class FileItemEditorComponent implements OnInit{
  // formly jsonschema service
  formlyJSONSchema = inject(FormlyJsonschema);
  // ng-core jsonschema service
  jsonschemaService = inject(JSONSchemaService);
  dynamicDialogConfig = inject(DynamicDialogConfig);
  dynamicDialogRef = inject(DynamicDialogRef);

 // editor JSONSchema
  schema:any;
 // the formly form
  form: FormGroup = new FormGroup({});
  file: any;
  // editor value
  model: any = {};
  // editor options
  options: FormlyFormOptions = {};
  // formly editor fields
  fields = [];

  ngOnInit(): void {
    this.schema = this.dynamicDialogConfig.data.schema;
    this.file = this.dynamicDialogConfig.data.file;
    this.model = this.file.metadata;
    this.fields = this.createForm();
  }
  /**
   * Create the form editor.
   *
   * @param schema editor JSONSchema
   * @returns the formly fields.
   */
  private createForm() {
    let schema = processJsonSchema(resolve$ref(this.schema, this.schema.properties));
    // form configuration
    const editorConfig = {
      longMode: false,
    };
    return [
      this.formlyJSONSchema.toFieldConfig(schema, {
        map: (field: any, fieldSchema: any) => {
          field = this.jsonschemaService.processField(field, fieldSchema);
          field.props.editorConfig = editorConfig;
          field.props.getRoot = () => this.fields[0];
          return field;
        },
      }),
    ];
  }

  save() {
    this.dynamicDialogRef.close(this.model);
  }
}
