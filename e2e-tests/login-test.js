const env = {
    baseUrl: 'http://localhost/sivujetti/index.php?q='
};

const TEST_USER_USERNAME = 'test-user';
const TEST_USER_PASSWORD = 'test-pass';

describe('Test', function() {
    before(browser => browser.navigateTo(`${env.baseUrl}/jet-login`));

    it('Demo test ecosia.org', function(browser) {
        browser
            .waitForElementVisible('#login-app')
            .assert.visible('input[name=username]')
            .setValue('input[name=username]', TEST_USER_USERNAME)
            .assert.visible('input[name=password]')
            .setValue('input[name=password]', TEST_USER_PASSWORD)
            .assert.visible('button[type=submit]');
            // todo
    });

    after(browser => browser.end());
});
