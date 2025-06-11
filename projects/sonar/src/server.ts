// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AppServerModule from './main.server';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');
import { createProxyMiddleware } from 'http-proxy-middleware';
let myappSessionValidationCookie = "";
const commonEngine = new CommonEngine();
const app = express();

app.use(
    '/static',
    createProxyMiddleware({
      target: 'https://localhost:5000/static',
      changeOrigin: true,
      secure: false
    })
  );

app.use(
    '/documents',
    createProxyMiddleware({
      target: 'https://localhost:5000/documents',
      changeOrigin: true,
      secure: false
    })
  );

app.use(
    '/logged-user',
    createProxyMiddleware({
      target: 'https://localhost:5000/logged-user',
      changeOrigin: true,
      secure: false,
      logger: console,
      // cookieDomainRewrite: 'localhost',
      cookiePathRewrite: '/logged-user',
      on: {
        proxyReq: ((proxyReq, req, res) => {
          console.log('proxy req', proxyReq.getHeaders(), req.headers, res.getHeaders());
          if (myappSessionValidationCookie) {
              proxyReq.setHeader('cookie', myappSessionValidationCookie);
          }
        }),
        proxyRes: ((proxyRes, req, res) => {
          console.log('proxy', proxyRes.headers, req.headers, res.getHeaders());
      })
      }
    })
  );

  app.use(
    '/schemas',
    createProxyMiddleware({
      target: 'https://localhost:5000/schemas',
      changeOrigin: true,
      secure: false,
    })
  );

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://localhost:5000/api',
      changeOrigin: true,
      secure: false,
    })
  );

/**
 * Serve static files from /browser
 */
app.get(
  '**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html'
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;
  console.log('render', req.headers);
  myappSessionValidationCookie = req?.headers?.cookie;
  if (req.url.startsWith('/documents') || req.url.startsWith('/static') || req.url.startsWith('/api') || req.url.startsWith('/logged-user')) {
    return next();
  }
  commonEngine
    .render({
      bootstrap: AppServerModule,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
