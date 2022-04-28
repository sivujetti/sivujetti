const {env, envUtils} = require('../utils/envUtils.js');
const {vars} = require('../vars.js');

describe('Block', () => {
    let testPageData;

    before((browser, done) => {
        envUtils.setupTestSite('minimal')
            .then(testDataBundles => {
                testPageData = testDataBundles[1].data; // [0] = layout, [1] = page
                browser.navigateTo(env.makeAutoLoginUrl(env.makeUrl('/_edit')), done);
            });
    });

    it('User can edit styles', browser => {
        const testBlock = testPageData.blocks.find(({type}) => type === 'Paragraph');
        const testBlockBlockTreeBtnLocator = `.block-tree li[data-block-id="${testBlock.id}"] button`;
        const ownStylesTabNth = 2;
        const ownStylesTabBtnLocator = `${vars.inspectorPanelLocator} > ul .tab-item:nth-child(${ownStylesTabNth})`;
        const headingNth = 1;
        const ownStylesTextareaLocator = `${vars.inspectorPanelLocator} > div:nth-of-type(${ownStylesTabNth+headingNth}) textarea`;
        const validationErrorLocator = `${ownStylesTextareaLocator} + *`;
        const testBlockInPageLocator = `body [data-block="${testBlock.id}"]`;

        //
        waitForMainMenuToAppear(browser);
        openTestBlockToInspectorPanel(browser);
        switchToOwnStylesTab(browser);
        typeTestCssToStyleInput(browser, '"#€%€#&?€ 52€"');
        verifyValidationErrorIsVisible(browser);
        typeTestCssToStyleInput(browser, '[[scope]] { color: red; }');
        verifyValidationErrorIsNotVisible(browser);
        verifyChangedStylesInWebpageIframe(browser);
        saveChanges(browser);
        goToWebPageWhichStylesWeJustSaved(browser);
        verifyBlockNowHasNewStyles(browser);

        //
        function waitForMainMenuToAppear(browser) {
            return browser
                .waitForElementVisible(vars.editAppElLocator);
        }
        function openTestBlockToInspectorPanel(browser) {
            return browser
                .waitForElementVisible(testBlockBlockTreeBtnLocator)
                .click(testBlockBlockTreeBtnLocator);
        }
        function switchToOwnStylesTab(browser) {
            return browser
                .waitForElementVisible(ownStylesTabBtnLocator)
                .click(ownStylesTabBtnLocator);
        }
        function typeTestCssToStyleInput(browser, testCss) {
            return browser
                .waitForElementVisible(ownStylesTextareaLocator)
                .setValue(ownStylesTextareaLocator, testCss);
        }
        function verifyValidationErrorIsVisible(browser) {
            browser.assert.elementPresent(validationErrorLocator);
            return browser;
        }
        function verifyValidationErrorIsNotVisible(browser) {
            browser.assert.not.elementPresent(validationErrorLocator);
            return browser;
        }
        function verifyChangedStylesInWebpageIframe(browser) {
            return browser
                .frame(0)
                .execute(testBlockLocator =>
                    window.getComputedStyle(document.querySelector(testBlockLocator)).color
                , [testBlockInPageLocator], result => {
                    browser.assert.equal(result.value, 'rgb(255, 0, 0)');
                })
                .frameParent();
        }
        function saveChanges(browser) {
            return browser
                .waitForElementPresent(vars.saveButtonLocator)
                .click(vars.saveButtonLocator)
                .waitForElementNotPresent(vars.saveButtonLocator);
        }
        function goToWebPageWhichStylesWeJustSaved(browser) {
            return browser.navigateTo(env.makeUrl(testPageData.slug));
        }
        function verifyBlockNowHasNewStyles(browser) {
            return browser
                .waitForElementPresent(testBlockInPageLocator)
                .execute(testBlockLocator =>
                    window.getComputedStyle(document.querySelector(testBlockLocator)).color
                , [testBlockInPageLocator], result => {
                    browser.assert.equal(result.value, 'rgb(255, 0, 0)');
                });
        }
    });

    after((browser, done) => {
        envUtils.destroyTestSite()
            .then(_resp => {
                browser.end(done);
            });
        });
});
