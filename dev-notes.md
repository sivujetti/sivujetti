# Dev-notes

Some semi-internal notes.

## Bundling frontend

Bundle | Command | Main file
--- | --- | ---
All | `npm start -- --configBundle all` | -
Edit app | `npm start -- --configBundle main` | frontend/edit-app/main.js
Website | `npm start -- --configBundle webpage` | frontend/webpage/main.js
Translations | `npm start -- --configBundle lang --configLang fi` | frontend/translations/${selectedLang}.js
Tests | `npm start -- --configBundle tests` | frontend/tests/main.js

## Running frontend tests

1. Bundle tests `npm start -- --configBundle test`
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
