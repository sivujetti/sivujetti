// cd backend/installer/sample-content/basic-site/frontend/
// npm --prefix ../../../../../ start -- --configInput backend/installer/sample-content/basic-site/frontend/rollup.config.js
module.exports = {
    input: 'backend/installer/sample-content/basic-site/frontend/main.js',
    output: {
        file: 'backend/installer/sample-content/basic-site/public/basic-site-bundled.js',
    }
};
