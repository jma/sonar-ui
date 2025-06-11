import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';
import { provideServerRouting, RenderMode } from '@angular/ssr';

@NgModule({
  imports: [AppModule, ServerModule],
  providers: [
    provideServerRouting([
      {
        path: ':view/search/**', // All other routes will be rendered on the server (SSR)
        renderMode: RenderMode.Server,
      },
      {
        path: '**', // All other routes will be rendered on the server (SSR)
        renderMode: RenderMode.Client,
      },
    ])
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
