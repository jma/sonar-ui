/*
 * SONAR User Interface
 * Copyright (C) 2021 RERO
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
import { HttpClient, HttpParams } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ActivatedRoute, ActivationStart, Router, RouterModule, Routes, UrlSegment, mapToCanActivate } from '@angular/router';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { ActionStatus, ApiService, DetailComponent, EditorComponent, RecordSearchPageComponent } from '@rero/ng-core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AdminComponent } from './_layout/admin/admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BriefViewComponent } from './deposit/brief-view/brief-view.component';
import { ConfirmationComponent } from './deposit/confirmation/confirmation.component';
import { EditorComponent as DepositEditorComponent } from './deposit/editor/editor.component';
import { UploadComponent } from './deposit/upload/upload.component';
import { CanAddGuard } from './guard/can-add.guard';
import { RoleGuard } from './guard/role.guard';
import { BriefViewComponent as CollectionBriefViewComponent } from './record/collection/brief-view/brief-view.component';
import { DetailComponent as CollectionDetailComponent } from './record/collection/detail/detail.component';
import { AggregationFilter } from './record/document/aggregation-filter';
import { DetailComponent as DocumentDetailComponent } from './record/document/detail/detail.component';
import { DocumentComponent } from './record/document/document.component';
import { DetailComponent as HepvsProjectDetailComponent } from './record/hepvs/project/detail/detail.component';
import { DetailComponent as OrganisationDetailComponent } from './record/organisation/detail/detail.component';
import { OrganisationComponent } from './record/organisation/organisation.component';
import { BriefViewComponent as ProjectBriefViewComponent } from './record/project/brief-view/brief-view.component';
import { DetailComponent as ProjectDetailComponent } from './record/project/detail/detail.component';
import { BriefViewComponent as SubdivisionBriefViewComponent } from './record/subdivision/brief-view/brief-view.component';
import { DetailComponent as SubdivisionDetailComponent } from './record/subdivision/detail/detail.component';
import { DetailComponent as UserDetailComponent } from './record/user/detail/detail.component';
import { UserComponent } from './record/user/user.component';
import { UserService } from './user.service';

const adminModeDisabled = (): Observable<ActionStatus> => {
  return of({
    can: false,
    message: ''
  });
};

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: '', component: DashboardComponent },
      {
        path: 'deposit/:id',
        canActivate: mapToCanActivate([RoleGuard]),
        data: {
          role: 'submitter'
        },
        children: [
          {
            path: 'create',
            component: UploadComponent
          },
          {
            path: 'confirmation',
            component: ConfirmationComponent
          },
          {
            path: ':step',
            component: DepositEditorComponent
          }
        ]
      }
    ]
  }
];
const fileConfig = {
  enabled: true,
  orderList: (a: any, b: any) => {
    return a.metadata.order - b.metadata.order;
  },
  infoExcludedFields: [
    'restriction',
    'type',
    'links',
    'thumbnail',
    'permissions',
  ],
  canAdd: () => of({ can: true, message: '' }),
  canRead: (record: any, file: any) => {
    if (file && file?.metadata?.permissions?.read) {
      return of({
        can: file.metadata.permissions.read,
        message: '',
      });
    }
    return of({ can: false, message: '' });
  },
  canUpdateMetadata: (record: any, file: any) => {
    if (file && file?.metadata?.permissions?.update) {
      return of({
        can: file.metadata.permissions.update,
        message: '',
      });
    }
    return of({ can: false, message: '' });
  },
  canUpdate: (record: any, file: any) => {
    if (file && file?.metadata?.permissions?.update) {
      return of({
        can: file.metadata.permissions.update,
        message: '',
      });
    }
    return of({ can: false, message: '' });
  },
  canDelete: (record: any, file: any) => {
    if (file && file?.metadata?.permissions?.delete) {
      return of({
        can: file.metadata.permissions.delete,
        message: '',
      });
    }
    return of({ can: false, message: '' });
  },
}

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule {
  /**
   * Constructor.
   *
   * Adds routes for resources
   *
   * @param _translateService Translate service.
   * @param _router Router service.
   * @param _route Activated route.
   * @param _userService User service.
   * @param _httpClient HTTP client.
   * @param _apiService API service.
   */
  constructor(
    private _translateService: TranslateService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _userService: UserService,
    private _httpClient: HttpClient,
    private _apiService: ApiService,
  ) {
    AggregationFilter.translateService = this._translateService;

    this._router.config.push({
      path: ':view/search',
      children: [
        { path: ':type', component: RecordSearchPageComponent },
        { path: ':type/detail/:pid', component: DetailComponent }
      ],
      data: {
        showSearchInput: false,
        adminMode: adminModeDisabled,
        types: [
          {
            showLabel: false,
            key: 'documents',
            label: 'Documents',
            component: DocumentComponent,
            aggregations: AggregationFilter.filter,
            aggregationsExpand: ['document_type', 'controlled_affiliation', 'year'],
            aggregationsOrder: this._documentAggregationsOrder(),
            aggregationsBucketSize: 10,
            searchFields: [
              {
                label: _('full-text'),
                path: 'fulltext'
              }
            ],
            searchFilters: [
              {
                label: _('Open access'),
                filter: 'open_access',
                value: 'true'
              }
            ],
            sortOptions: [
              {
                label: _('Relevance'),
                value: 'relevance',
                defaultQuery: true
              },
              {
                label: _('Date descending'),
                value: 'newest',
                defaultNoQuery: true
              },
              {
                label: _('Date ascending'),
                value: 'oldest',
              },
              {
                label: _('Title'),
                value: 'title'
              }
            ]
          }
        ]
      }
    });

    // Page for editing user profile.
    this._router.config.push({
      path: ':type/profile/:pid',
      component: EditorComponent,
      canActivate: mapToCanActivate([RoleGuard]),
      data: {
        types: [
          {
            key: 'users',
            redirectUrl: (record: any) => {
              return of(`/users/profile/${record.id}`);
            }
          }
        ]
      }
    });

    // Fallback page
    this._router.config.push({ path: '**', redirectTo: '' });

    this._updateSearchRouteData();

    // Observable to resolve projects detail component
    const projectDetail$ = this._userService.user$.pipe(map((user) => {
      if (user.organisation?.code === 'hepvs') {
        return HepvsProjectDetailComponent;
      }
      return ProjectDetailComponent;
    }));

    let recordsRoutesConfiguration = [
      {
        type: 'documents',
        briefView: DocumentComponent,
        detailView: DocumentDetailComponent,
        aggregations: AggregationFilter.filter,
        aggregationsExpand: ['document_type', 'controlled_affiliation', 'year'],
        aggregationsOrder: this._documentAggregationsOrder(),
        editorSettings: {
          longMode: true,
        },
        files: {...fileConfig,
          filterList: (item: any) => {
            return (
              item.metadata &&
              item.metadata.type &&
              item.metadata.type === 'file'
            );
          }
        },
        searchFields: [
          {
            label: _('full-text'),
            path: 'fulltext',
          },
        ],
        sortOptions: [
          {
            label: _('Relevance'),
            value: 'relevance',
            defaultQuery: true,
          },
          {
            label: _('Date descending'),
            value: 'newest',
            defaultNoQuery: true,
          },
          {
            label: _('Date ascending'),
            value: 'oldest',
          },
          {
            label: _('Title'),
            value: 'title',
          },
        ],
      },
      {
        type: 'users',
        briefView: UserComponent,
        detailView: UserDetailComponent,
        aggregationsOrder: ['subdivision'],
        editorSettings: {
          longMode: true,
        },
        sortOptions: [
          {
            label: _('Relevance'),
            value: 'relevance',
            defaultQuery: true,
          },
          {
            label: _('Name'),
            value: 'name',
            defaultNoQuery: true,
          },
        ],
      },
      {
        type: 'organisations',
        briefView: OrganisationComponent,
        detailView: OrganisationDetailComponent,
        files: fileConfig,
        sortOptions: [
          {
            label: _('Relevance'),
            value: 'relevance',
            defaultQuery: true,
          },
          {
            label: _('Name'),
            value: 'name',
            defaultNoQuery: true,
          },
        ],
      },
      {
        type: 'deposits',
        briefView: BriefViewComponent,
        aggregations: AggregationFilter.filter,
        aggregationsExpand: ['status', 'user', 'contributor'],
        aggregationsOrder: ['status', 'user', 'contributor', 'subdivision'],
        sortOptions: [
          {
            label: _('Relevance'),
            value: 'relevance',
            defaultQuery: true,
          },
          {
            label: _('Date descending'),
            value: 'newest',
            defaultNoQuery: true,
          },
          {
            label: _('Date ascending'),
            value: 'oldest',
          },
        ],
      },
      {
        type: 'projects',
        label: 'Research projects',
        briefView: ProjectBriefViewComponent,
        detailView: projectDetail$,
        editorSettings: {
          longMode: true,
        },
        recordResource: true,
        aggregationsExpand: ['organisation', 'user'],
        aggregationsOrder: ['organisation', 'user', 'status'],
        exportFormats: [
          {
            label: 'CSV',
            format: 'text/csv',
          },
        ],
        sortOptions: [
          {
            label: _('Relevance'),
            value: 'relevance',
            defaultQuery: true,
          },
          {
            label: _('Name'),
            value: 'name',
            defaultNoQuery: true,
          },
          {
            label: _('Date descending'),
            value: 'newest',
          },
          {
            label: _('Date ascending'),
            value: 'oldest',
          },
        ],
      },
      {
        type: 'collections',
        label: 'Collections',
        briefView: CollectionBriefViewComponent,
        detailView: CollectionDetailComponent,
        files: fileConfig,
        editorSettings: {
          longMode: true,
        },
        sortOptions: [
          {
            label: _('Relevance'),
            value: 'relevance',
            defaultQuery: true,
          },
          {
            label: _('Name'),
            value: 'name',
            defaultNoQuery: true,
          },
        ],
      },
      {
        type: 'subdivisions',
        label: 'Subdivisions',
        briefView: SubdivisionBriefViewComponent,
        detailView: SubdivisionDetailComponent,
        editorSettings: {
          longMode: true,
        },
        sortOptions: [
          {
            label: _('Relevance'),
            value: 'relevance',
            defaultQuery: true,
          },
          {
            label: _('Name'),
            value: 'name',
            defaultNoQuery: true,
          },
        ],
      },
    ];

    this._userService.user$.subscribe((user) => {
      if (user) {
        /** Removes collections and subdivisions routes on the organisation shared */
        if (!('isDedicated' in user.organisation) || !(user.organisation.isDedicated)) {
          recordsRoutesConfiguration =  recordsRoutesConfiguration
          .filter(route => !(['collections', 'subdivisions'].includes(route.type)));
        }

        recordsRoutesConfiguration.forEach((config: any) => {
          const route = {
            matcher: (url: any) => this._routeMatcher(url, config.type),
            canActivate: mapToCanActivate([RoleGuard]),
            children: [
              { path: '', component: RecordSearchPageComponent },
              { path: 'detail/:pid', component: DetailComponent },
              { path: 'edit/:pid', component: EditorComponent },
              { path: 'new', component: EditorComponent, canActivate: mapToCanActivate([CanAddGuard]) }
            ],
            data: {
              role: 'submitter',
              showSearchInput: true,
              types: [
                {
                  key: config.type,
                  label: config.label || config.type.charAt(0).toUpperCase() + config.type.slice(1),
                  component: config.briefView || null,
                  editorSettings: config.editorSettings || false,
                  detailComponent: config.detailView || null,
                  aggregations: config.aggregations || null,
                  aggregationsExpand: config.aggregationsExpand || [],
                  aggregationsOrder: config.aggregationsOrder || [],
                  aggregationsBucketSize: 10,
                  files: config.files || null,
                  searchFields: config.searchFields || null,
                  recordResource: config.recordResource || null,
                  exportFormats: config.exportFormats || null,
                  sortOptions: config.sortOptions || null,
                  canAdd: () => this._can(config.type, 'add'),
                  canUpdate: (record: any) => this._can(config.type, 'update', record),
                  canDelete: (record: any) => this._can(config.type, 'delete', record),
                  canRead: (record: any) => this._can(config.type, 'read', record)
                }
              ]
            }
          };

          this._router.config[0].children.push(route);
        });
      }
    });
  }

  /**
   * Updates route data properties which are depending to the view parameter.
   */
  private _updateSearchRouteData() {
    this._router.events.subscribe(e => {
      if (e instanceof ActivationStart &&
        e.snapshot.parent.routeConfig &&
        e.snapshot.parent.routeConfig.path === ':view/search'
      ) {
        AggregationFilter.view = e.snapshot.params.view;

        e.snapshot.data = {
          ...e.snapshot.data, ...{
            detailUrl: `/${e.snapshot.params.view}/:type/:pid`
          }
        };

        e.snapshot.data.types[0].preFilters = {
          view: e.snapshot.params.view
        };
      }
    });
  }

  /**
   * Check if resource of given type can do the given action.
   *
   * @param resource Resource type.
   * @param action Action to check.
   * @param record Record dict.
   * @return Observable
   */
  private _can(resource: string, action: string, record: any = null): Observable<ActionStatus> {
    if (resource === 'deposits' && ['add', 'update'].includes(action)) {
      return of({ can: false, message: '' });
    }

    if (record) {
      return of({ can: record.metadata.permissions[action], message: '' });
    }

    return this._userService.user$.pipe(
      map((user: any) => {
        return { can: user.permissions[resource][action], message: '' };
      })
    );
  }

  /**
   * Route matcher for matching route with a resource type.
   *
   * @param url URL parts for the route.
   * @param type Resource type.
   * @returns The matched URL if found or null.
   */
  private _routeMatcher(url: any, type: string) {
    if (url[0].path === 'records' && url[1].path === type) {
      return this._matchedUrl(url);
    }
    return null;
  }

  /**
   * Matched url
   *
   * @param url UrlSegment
   * @returns Object containing the matched URL.
   */
  private _matchedUrl(url: UrlSegment[]) {
    const segments = [
      new UrlSegment(url[0].path, {}),
      new UrlSegment(url[1].path, {})
    ];
    return {
      consumed: segments,
      posParams: { type: new UrlSegment(url[1].path, {}) }
    };
  }

  /**
   * Get the ordered list of aggregations.
   *
   * @returns An observable resolving the ordered list.
   */
  private _documentAggregationsOrder(): Observable<any> {
    return of(null).pipe(
      switchMap(() => {
        const view = this._route.snapshot.children[0].params.view;

        let params = new HttpParams();
        if (view) {
          params = params.set('view', view);
        }
        if (this._route.snapshot.children[0].queryParams.collection_view) {
          params = params.set('collection', '1');
        }

        return this._httpClient.get(
          `${this._apiService.getEndpointByType(
            'documents',
            true
          )}/aggregations`,
          { params }
        );
      })
    );
  }
}
