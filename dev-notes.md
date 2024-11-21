# Dev-notes

Some semi-internal notes.

## Bundling frontend

### All

npm start -- --configBundle all

### Specific bundles

`npm start -- --configBundle bundle,bundle2` where "bundle" is one of:

```typescript
type bundleName =
    'webpage-commons' |
    'webpage-renderer-app' |
    'edit-app-commons' |
    'edit-app' |
    'auth-apps' |
    'lang' |
    'tests';
```

Example:

`npm start -- --configBundle webpage-commons,edit-app-commons,edit-app`

### Translation files

`npm start -- --configBundle lang --configLang fi`

## Building frontent

Same as above, but replace `npm start` with `npm run-script build`

## Running frontend tests

1. Bundle tests with `todo`
1. Open browser [localhost:8888/sivujetti/public/tests/index.html](http://localhost:8888/sivujetti/public/tests/index.html)

## Running backend tests

1. `cd backend`
1. `composer test -- ./sivujetti/tests`
1. `composer test -- ./sivujetti/tests/src/dir`
1. `composer test -- ./cli/tests/src/dir`

## Running e2e tests

Note: These tests are temporarily out of date.

npm test -- e2e-tests/tests/block-styles-edit-test.js

## Installing required php extensions

### Ubuntu + php-fpm

- `sudo apt update`
- `sudo apt install php8.2-fpm php8.2-curl php8.2-mbstring php8.2-sqlite3 php8.2-zip`
- _There's no need to uncomment ;extension=curl etc. from /etc/php/8.2/fpm/php.ini_
- `sudo systemctl restart php8.2-fpm.service`

### Alpine + php-fpm

- `apk add php83 php83-fpm php83-curl php83-mbstring php83-pdo_sqlite php83-zip php83-session php83-ctype php83-pdo php83-openssl php83-sodium php83-fileinfo`