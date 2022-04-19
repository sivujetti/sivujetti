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
        const testBlock = testPageData.blocks.find(({type}) => type === 'Paragraph');
        const globalStylesMainPanelSectionLocator = '#main-panel .panel-section:nth-of-type(3)';
        const stylesSectionTitleBtnLocator = `${globalStylesMainPanelSectionLocator} > button`;
        const stylesSectionStylesTabLocator = `${globalStylesMainPanelSectionLocator} > div .global-styles + div`;
        const paragraphBlockTypeStyleAccordionLocator = `${stylesSectionStylesTabLocator} .accordion:nth-child(2)`;
        const paragraphBaseStylesTextareaLocator = `${paragraphBlockTypeStyleAccordionLocator} textarea`;
        const validationErrorLocator = `${paragraphBaseStylesTextareaLocator} + *`;
        const testBlockInPageLocator = `body [data-block-type="${testBlock.type}"]`;

        //
        waitForMainMenuToAppear(browser);
        openGlobalStylesMainMenuSection(browser);
        switchToBlockTypeBaseStylesTab(browser);
        openParagraphBaseStylesAccordion(browser);
        typeToStylesTextarea(browser, '"#€%€#&?€ 52€"');
        verifyValidationErrorIsVisible(browser);
        typeToStylesTextarea(browser, '[[scope]] { color: red; }');
        verifyValidationErrorIsNotVisible(browser);
        verifyChangedStylesInWebpageIframe(browser, testBlockInPageLocator);
        saveChanges(browser);
        goToWebPageWhichStylesWeJustSaved(browser);
        verifyBlockHasNowBlockTypesBaseStyles(browser);

        //
        function waitForMainMenuToAppear(browser) {
            return browser
                .waitForElementVisible(vars.editAppElLocator);
        }
        function openGlobalStylesMainMenuSection(browser) {
            return browser
                .waitForElementVisible(stylesSectionTitleBtnLocator)
                .click(stylesSectionTitleBtnLocator);
        }
        function switchToBlockTypeBaseStylesTab(browser) {
            const stylesSectionStylesTabBtnLocator = `${globalStylesMainPanelSectionLocator} > div .tab-item:nth-child(2)`;
            return browser
                .waitForElementVisible(stylesSectionStylesTabBtnLocator)
                .click(stylesSectionStylesTabBtnLocator);
        }
        function openParagraphBaseStylesAccordion(browser) {
            const paragraphBaseStylesAccordionLabelLocator = `${paragraphBlockTypeStyleAccordionLocator} label`;
            browser
                .waitForElementVisible(paragraphBaseStylesAccordionLabelLocator)
                .click(paragraphBaseStylesAccordionLabelLocator);
        }
        function typeToStylesTextarea(browser, css) {
            return browser
                .waitForElementVisible(paragraphBaseStylesTextareaLocator)
                .setValue(paragraphBaseStylesTextareaLocator, css);
        }
        function verifyValidationErrorIsVisible(browser) {
            return browser.assert.elementPresent(validationErrorLocator);
        }
        function verifyValidationErrorIsNotVisible(browser) {
            return browser.assert.not.elementPresent(validationErrorLocator);
        }
        function verifyChangedStylesInWebpageIframe(browser, testBlockInPageLocator) {
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
        function verifyBlockHasNowBlockTypesBaseStyles(browser) {
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
