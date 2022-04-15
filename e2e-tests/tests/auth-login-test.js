const {env, envUtils} = require('../utils/envUtils.js');

const TEST_USER_USERNAME = 'test-user';
const TEST_USER_PASSWORD = 'test-pass';

describe('Auth', () => {
    before((browser, done) => {
        envUtils.setupTestSite('minimal')
            .then(_testDataBundles => {
                browser.navigateTo(env.makeUrl('/jet-login'), done);
            });
    });

    it('Visitor can log in', browser => {
        browser
            .waitForElementVisible('#login-app')
            .assert.visible('input[name=username]')
            .setValue('input[name=username]', TEST_USER_USERNAME)
            .assert.visible('input[name=password]')
            .setValue('input[name=password]', TEST_USER_PASSWORD)
            .assert.visible('button[type=submit]');
            // todo
    });

    after((browser, done) => {
        envUtils.destroyTestSite()
            .then(_resp => {
                browser.end(done);
            });
        });
});
