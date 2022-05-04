const {env, envUtils} = require('../utils/envUtils.js');
const {vars} = require('../vars.js');

describe('Block type', () => {
    let testPageData;

    before((browser, done) => {
        envUtils.setupTestSite('minimal')
            .then(testDataBundles => {
                testPageData = testDataBundles[1].data; // [0] = layout, [1] = page
                browser.navigateTo(env.makeAutoLoginUrl(env.makeUrl('/_edit')), done);
            });
    });

    it('User can edit styles', browser => {
        const firstParagraphBlock = testPageData.blocks.find(({type}) => type === 'Paragraph');
        const testBlockBlockTreeBtnLocator = `.block-tree li[data-block-id="${firstParagraphBlock.id}"] button`;
        const baseStylesTabNth = 3;
        const baseStylesTabBtnLocator = `${vars.inspectorPanelLocator} > ul .tab-item:nth-child(${baseStylesTabNth})`;
        const headingNth = 1;
        const baseStylesTextareaLocator = `${vars.inspectorPanelLocator} > div:nth-of-type(${baseStylesTabNth+headingNth}) textarea`;
        const validationErrorLocator = `${baseStylesTextareaLocator} + .has-error`;
        const testBlocksInPageLocator = `body [data-block-type="Paragraph"]`;

        //
        waitForMainMenuToAppear(browser);
        openTestBlockToInspectorPanel(browser);
        switchToBaseStylesTab(browser);
        typeTestCssToStyleInput(browser, '"#€%€#&?€ 52€"');
        verifyValidationErrorIsVisible(browser);
        typeTestCssToStyleInput(browser, ':self { color: red; }');
        verifyValidationErrorIsNotVisible(browser);
        verifyChangedStylesInWebpageIframe(browser);
        saveChanges(browser);
        goToWebPageWhichStylesWeJustSaved(browser);
        verifyAllParagraphBlocksNowHaveNewStyles(browser);

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
        function switchToBaseStylesTab(browser) {
            return browser
                .waitForElementVisible(baseStylesTabBtnLocator)
                .click(baseStylesTabBtnLocator);
        }
        function typeTestCssToStyleInput(browser, testCss) {
            return browser
                .waitForElementVisible(baseStylesTextareaLocator)
                .setValue(baseStylesTextareaLocator, testCss);
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
                .execute(testBlocksLocator =>
                    Array.from(document.querySelectorAll(testBlocksLocator))
                        .map(el => window.getComputedStyle(el).color)
                , [testBlocksInPageLocator], result => {
                    browser.assert.equal(result.value[0], 'rgb(255, 0, 0)');
                    browser.assert.equal(result.value[1], 'rgb(255, 0, 0)');
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
        function verifyAllParagraphBlocksNowHaveNewStyles(browser) {
            return browser
                .waitForElementPresent(testBlocksInPageLocator)
                .execute(testBlocksLocator =>
                    Array.from(document.querySelectorAll(testBlocksLocator))
                        .map(el => window.getComputedStyle(el).color)
                , [testBlocksInPageLocator], result => {
                    browser.assert.equal(result.value[0], 'rgb(255, 0, 0)');
                    browser.assert.equal(result.value[1], 'rgb(255, 0, 0)');
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
