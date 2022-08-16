const {env, envUtils} = require('../utils/envUtils.js');
const {vars} = require('../vars.js');

describe('PageInfo block', () => {
    let testPageData;

    beforeEach((browser, done) => {
        envUtils.setupTestSite('minimal+page-categories')
            .then(testDataBundles => {
                testPageData = testDataBundles[1].data; // [0] = layout, [1] = page, [2] = another page, [3] = page category
                browser.navigateTo(env.makeAutoLoginUrl(env.makeUrl('/_edit')), done);
            });
    });

    it('User can edit description', browser => {
        const blockTreeBtnLocator = `.block-tree li[data-block-type="PageInfo"] button`;
        const textAreaOuterElLocator = `${vars.inspectorPanelLocator} .form-group:nth-of-type(3)`; // (1) = url, (2) = slug
        const descrTextareaLocator = `${textAreaOuterElLocator} textarea[name="description"]`;
        const validationErrorLocator = `${textAreaOuterElLocator} .has-error`;

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

    it('User can add page to existing category', browser => {
        const blockTreeBtnLocator = `.block-tree li[data-block-type="PageInfo"] button`;
        const categoriesInputLocator = `${vars.inspectorPanelLocator} .prop-widget-many-to-many`;
        const firstCategoryCheckboxLabelLocator = `${categoriesInputLocator} .form-checkbox`;
        const firstCategoryCheckboxLocator = `${firstCategoryCheckboxLabelLocator} input`;
        //
        browser
            .waitForElementVisible(vars.editAppElLocator)
            .waitForElementVisible(blockTreeBtnLocator)
            .click(blockTreeBtnLocator)
            .waitForElementVisible(firstCategoryCheckboxLabelLocator)
            .verify.elementNotPresent(`${firstCategoryCheckboxLocator}:checked`)
            .click(firstCategoryCheckboxLabelLocator)
            .assert.elementPresent(`${firstCategoryCheckboxLocator}:checked`)
            .waitForElementPresent(vars.saveButtonLocator)
            // verify what here ??
            ;
    });

    afterEach((browser, done) => {
        envUtils.destroyTestSite()
            .then(_resp => {
                browser.end(done);
            });
        });
});
