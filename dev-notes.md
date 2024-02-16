# Dev-notes

Some semi-internal notes.

## Bundling frontend (new)

Bundle | Command | Out files
--- | --- | ---
All | `bun build --entrypoints ./frontend2/sivujetti-commons-for-web-pages.js ./frontend2/sivujetti-commons-for-edit-app.js ./frontend2/sivujetti-edit-app-main.jsx ./frontend2/sivujetti-webpage-renderer-app-main.js ./frontend2/translations/lang-fi.js --outdir ./public/v2 --entry-naming '[name].[ext]' --external preact --external '@sivujetti-commons-for-web-pages' --external '@sivujetti-commons-for-edit-app' --external '@sivujetti-env-config' --watch` | -
Edit app | `bun build --entrypoints ./frontend2/sivujetti-commons-for-edit-app.js ./frontend2/sivujetti-edit-app-main.jsx --outdir ./public/v2 --entry-naming '[name].[ext]' --external preact --external '@sivujetti-commons-for-web-pages' --external '@sivujetti-commons-for-edit-app' --external '@sivujetti-env-config' --watch` | public/v2/sivujetti-edit-app-main.js, public/v2/sivujetti-commons-for-edit-app.js
Web page preview app | `bun build --entrypoints ./frontend2/sivujetti-webpage-renderer-app-main.js --outdir ./public/v2 --entry-naming '[name].[ext]' --external preact--external '@sivujetti-commons-for-web-pages' --external '@sivujetti-env-config' --watch` | public/v2/sivujetti-webpage-renderer-app-main.js
Auth apps | `bun build --entrypoints ./frontend2/sivujetti-auth-apps-main.jsx ./frontend2/translations/lang-auth-apps-fi.js --outdir ./public/v2 --entry-naming '[name].[ext]' --external preact --external '@sivujetti-commons-for-web-pages' --external '@sivujetti-commons-for-edit-app' --external '@sivujetti-env-config' --watch` | public/v2/sivujetti-auth-apps-main.js, public/v2/lang-auth-apps-fi.js
Commons for web pages | `bun build --entrypoints ./frontend2/sivujetti-commons-for-web-pages.js --outdir ./public/v2 --entry-naming '[name].[ext]'  --external '@sivujetti-env-config' --watch` | public/v2/sivujetti-commons-for-web-pages.js
Translations | `bun build --entrypoints ./frontend2/translations/lang-fi.js ./frontend2/translations/lang-auth-apps-fi.js --outdir ./public/v2 --entry-naming '[name].[ext]' --watch` | public/v2/lang-fi.js, public/v2/lang-auth-apps-fi.js
Custom | `cd backend/plugins/MyPlugin && bun build --entrypoints ./plugin-sjorg-support-client-edit-app-bundle.js ./plugin-sjorg-support-client-edit-app-lang-fi.js --outdir ../../../../public/v2 --external preact --external '@sivujetti-commons-for-web-pages' --external '@sivujetti-commons-for-edit-app' --external '@sivujetti-env-config' --watch` | todo
Tests | `todo` | todo

## Building frontent

todo
Same as above, but replace ` --watch` with `--minify`

## Running frontend tests

1. Bundle tests with `todo`
1. Open browser [localhost:8888/sivujetti/public/tests/index.html](http://localhost:8888/sivujetti/public/tests/index.html)

## Running backend tests

> **Important**: remeber to add `--exclude-group intensives` when running multiple tests.

1. `cd backend`
1. `composer test -- ./sivujetti/tests --exclude-group intensives`
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

- `apk add php82 php82-fpm php82-curl php82-mbstring php82-pdo_sqlite php82-zip php82-session php82-ctype php82-pdo php82-openssl php82-sodium php82-fileinfo
`