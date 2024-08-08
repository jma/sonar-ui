import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, ViewChild, output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '@rero/ng-core';
import { NgxSpinnerService } from 'ngx-spinner';
import { map } from 'rxjs';

@Component({
  selector: 'sonar-deposit-editor-swisscovery',
  templateUrl: './swisscovery.component.html',
  styleUrl: './swisscovery.component.css'
})
export class SwisscoveryComponent {
    /** Swisscovery result */
    scResult: any = null;
    data = output<any>();
    types = [];
  searchTerms='';
    scType = {
      name:  "Everywhere",
      code: "all_for_ui"
    };

    /** DOM element for swisscovery search query */
    @ViewChild('scQuery') scQuery: ElementRef;

    constructor(
      private _spinner: NgxSpinnerService,
      private _apiService: ApiService,
      private _httpClient: HttpClient,
      private _translateService: TranslateService,
    ){
      this.types = [
        {
          name:  this._translateService.instant("Everywhere"),
          code: "all_for_ui"
        },{
          name:  this._translateService.instant("DOI"),
          code: "digital_object_identifier"
        },{
          name:  this._translateService.instant("ID swisscovery (MARC 001)"),
          code: "mms_id"
        },{
          name:  this._translateService.instant("ISBN"),
          code: "isbn"
        }, {
          name:  this._translateService.instant("ISSN"),
          code: "issn"
        }
    ];
    }
/**
   * Search record in swisscovery
   *
   * @returns void
   */
searchSwisscovery(): void {
  if (!this.searchTerms) {
    return;
  }

  this._spinner.show();

  const params = new HttpParams()
    .set('type', this.scType.code)
    .set('query', this.searchTerms)
    .set('format', 'deposit');

  this._httpClient
    .get(`${this._apiService.getEndpointByType('swisscovery', true)}/`, {
      params,
      observe: 'response',
    }).pipe(
      map((response: HttpResponse<any>) =>  response.status === 200 ? response.body : null)
    )
    .subscribe(data => {
      if (data === null) {
        this.scResult = null;
      }
      let result: any = {};
      if (data?.metadata) {
        result.metadata = data.metadata;
      }
      if (data?.contributors) {
        result.contributors = data.contributors.map(res => res.name).join(', ');
      }
      this.scResult = result;

      this._spinner.hide();
    });
}
  /**
   * Check if a result exists for a swisscovery search.
   *
   * @returns True if a search is done and a result is found.
   */
  get hasSwisscoveryResult(): boolean {
    return this.scResult && Object.keys(this.scResult).length > 0;
  }

save() {
  this.data.emit(this.scResult);
}

}
