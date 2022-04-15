const {env, envUtils} = require('../utils/envUtils.js');
const {vars} = require('../vars.js');

describe('PageInfo block', () => {
    let testPageData;

    before((browser, done) => {
        envUtils.setupTestSite('minimal')
            .then(testDataBundles => {
                testPageData = testDataBundles[1].data; // [0] = layout, [1] = page
                browser.navigateTo(env.makeAutoLoginUrl(env.makeUrl('/_edit')), done);
            });
    });

    it('User can edit description', browser => {
        const blockTreeBtnLocator = `.block-tree li[data-block-type="PageInfo"] button`;
        const descrTextareaLocator = `${vars.inspectorPanelLocator} textarea[name="description"]`;
        const validationErrorLocator = locateWith(By.tagName('span')).below(By.css(descrTextareaLocator));

        const descrMetaEl1Locator = 'head meta[name="description"]';
        const descrMetaEl2Locator = 'head meta[property="og:description"]';
        //
        browser
            .waitForElementVisible(vars.editAppElLocator)
            .waitForElementVisible(blockTreeBtnLocator)
            .click(blockTreeBtnLocator)
            .waitForElementVisible(descrTextareaLocator)
            .setValue(descrTextareaLocator, 'a'.repeat(207))
            .assert.elementPresent(validationErrorLocator)
            .setValue(descrTextareaLocator, 'Updated descr')
            .waitForElementPresent(vars.saveButtonLocator)
            .assert.not.elementPresent(validationErrorLocator)
            .click(vars.saveButtonLocator)
            .waitForElementNotPresent(vars.saveButtonLocator)
            //
            .navigateTo(env.makeUrl(testPageData.slug))
            .waitForElementPresent(descrMetaEl1Locator)
            .assert.attributeEquals(descrMetaEl1Locator, 'content', 'Updated descr')
            .assert.attributeEquals(descrMetaEl2Locator, 'content', 'Updated descr');
    });

    after((browser, done) => {
        envUtils.destroyTestSite()
            .then(_resp => {
                browser.end(done);
            });
        });
});
