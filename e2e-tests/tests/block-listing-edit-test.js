const {env, envUtils} = require('../utils/envUtils.js');
const {vars} = require('../vars.js');

describe('Listing block', () => {
    let testPage1Data;
    let testPage2Data;
    let testArticle2Data;

    beforeEach((browser, done) => {
        envUtils.setupTestSite('with-listing-block+another-page-type')
            .then(testDataBundles => {
                // [0] = layout, [1] = page1, [2] = page2, [3] = @create, [4] = article1, [5] = article2
                testPage1Data = testDataBundles[1].data;
                testPage2Data = testDataBundles[2].data;
                testArticle2Data = testDataBundles[5].data;
                browser.navigateTo(env.makeAutoLoginUrl(env.makeUrl('/_edit')), done);
            });
    });

    const firstListingPageHeadingLocator = '.listing > .list-item:nth-of-type(1) h2';
    const secondListingPageHeadingLocator = '.listing > .list-item:nth-of-type(2) h2';

    it('User can change page type', browser => {
        const pageTypeFilterPartGroupLocator = '#inspector-panel .instructions-list > .group-1';
        const testBlock = getListingBlock();

        //
        waitForMainMenuToAppear(browser);
        openListingBlockToInspectorPanel(browser, testBlock);
        openChangePageTypePopup(browser);
        selectAnotherPageType(browser);
        verifyReRenderedListingPagesInPreviewFrame(browser);
        saveChanges(browser);
        goToWebPageWhichListingBlockWeJustEdited(browser);
        verifyListingNowListsAnotherPageTypesPages(browser);

        //
        function openChangePageTypePopup(browser) {
            const openPopupLocator = `${pageTypeFilterPartGroupLocator} button`;
            return browser
                .waitForElementVisible(openPopupLocator)
                .click(openPopupLocator);
        }
        function selectAnotherPageType(browser) {
            // 1 = Pages, 2 = Page cateogories, 3 = Articles
            const radioItemLocator = `${pageTypeFilterPartGroupLocator} .form-radio:nth-of-type(3)`;
            return browser
                .waitForElementVisible(radioItemLocator)
                .click(radioItemLocator);
        }
        function verifyReRenderedListingPagesInPreviewFrame(browser) {
            browser
                .frame(0)
                .waitForElementPresent(firstListingPageHeadingLocator)
                .expect.element(firstListingPageHeadingLocator).text.to.equal(testArticle2Data.title);
            return browser.frame(null);
        }
        function verifyListingNowListsAnotherPageTypesPages(browser) {
            return browser
                .waitForElementPresent(firstListingPageHeadingLocator)
                .expect.element(firstListingPageHeadingLocator).text.to.equal(testArticle2Data.title);
        }
    });

    it('User can change limit', browser => {
        const limitFilterPartGroupLocator = '#inspector-panel .instructions-list > .group-2';
        const secondListingPageElLocator = '.listing > .list-item:nth-of-type(2)';
        const testBlock = getListingBlock();

        //
        waitForMainMenuToAppear(browser);
        openListingBlockToInspectorPanel(browser, testBlock);
        openDefineLimitPopup(browser);
        setLimitToSinglePage(browser);
        verifyReRenderedListingPagesInPreviewFrame(browser);
        saveChanges(browser);
        goToWebPageWhichListingBlockWeJustEdited(browser);
        verifyListingNowListsOnlyOnePage(browser);

        //
        function openDefineLimitPopup(browser) {
            const openPopupLocator = `${limitFilterPartGroupLocator} button`;
            return browser
                .waitForElementVisible(openPopupLocator)
                .click(openPopupLocator);
        }
        function setLimitToSinglePage(browser) {
            // 1 = all, 2 = single, 3 = atMost
            const radioItemLocator = `${limitFilterPartGroupLocator} .form-radio:nth-of-type(2)`;
            return browser
                .waitForElementVisible(radioItemLocator)
                .click(radioItemLocator);
        }
        function verifyReRenderedListingPagesInPreviewFrame(browser) {
            return browser
                .frame(0)
                .waitForElementNotPresent(secondListingPageElLocator)
                .frame(null);
        }
        function verifyListingNowListsOnlyOnePage(browser) {
            return browser
                .assert.not.elementPresent(secondListingPageElLocator);
        }
    });

    it('User can change listing order', browser => {
        const orderFilterPartGroupLocator = '#inspector-panel .instructions-list > .group-3';
        const testBlock = getListingBlock();

        //
        waitForMainMenuToAppear(browser);
        openListingBlockToInspectorPanel(browser, testBlock);
        openDefineOrderPopup(browser);
        changeOrderFromDescToAsc(browser);
        verifyReRenderedListingPagesInPreviewFrame(browser);
        saveChanges(browser);
        goToWebPageWhichListingBlockWeJustEdited(browser);
        verifyListingNowListsPagesFromOldestToNewest(browser);

        //
        function openDefineOrderPopup(browser) {
            const openPopupLocator = `${orderFilterPartGroupLocator} button`;
            return browser
                .waitForElementVisible(openPopupLocator)
                .click(openPopupLocator);
        }
        function changeOrderFromDescToAsc(browser) {
            // 1 = newest to oldert, 2 = oldest to newest, 3 = random
            const radioItemLocator = `${orderFilterPartGroupLocator} .form-radio:nth-of-type(2)`;
            return browser
                .waitForElementVisible(radioItemLocator)
                .click(radioItemLocator);
        }
        function verifyReRenderedListingPagesInPreviewFrame(browser) {
            const frame = browser
                .frame(0);
            frame.expect.element(firstListingPageHeadingLocator).text.to.equal(testPage1Data.title);
            frame.expect.element(secondListingPageHeadingLocator).text.to.equal(testPage2Data.title);
            return browser.frame(null);
        }
        function verifyListingNowListsPagesFromOldestToNewest(browser) {
            browser.expect.element(firstListingPageHeadingLocator).text.to.equal(testPage1Data.title);
            browser.expect.element(secondListingPageHeadingLocator).text.to.equal(testPage2Data.title);
            return browser;
        }
    });

    it('User can add urlStartsWith filter', browser => {
        const addAdditionalFilterBtnLocator = '#inspector-panel .instructions-list > .perhaps';
        const urlStartsWithFilterPartLocator = '#inspector-panel .instructions-list > [data-filter-part-kind="urlStartsWith"].group-2';
        const testBlock = getListingBlock();

        //
        waitForMainMenuToAppear(browser);
        openListingBlockToInspectorPanel(browser, testBlock);
        openAddAdditionalFilterPartsPopup(browser);
        selectUrlStartsWithFilterPart(browser);
        verifyAddedUrlStartsWithFilterPartToBuilder(browser);
        openDefineUrlStartsWithTermPopup(browser);
        typeNewUrlStartsWithTerm(browser);
        verifyReRenderedListingPagesInPreviewFrame(browser);
        saveChanges(browser);
        goToWebPageWhichListingBlockWeJustEdited(browser);
        verifyListingNowUsesUrlStartsWithFilter(browser);

        //
        function openAddAdditionalFilterPartsPopup(browser) {
            const openPopupLocator = `${addAdditionalFilterBtnLocator} button`;
            return browser
                .waitForElementVisible(openPopupLocator)
                .click(openPopupLocator);
        }
        function selectUrlStartsWithFilterPart(browser) {
            const chosenFilterBtnLocator = `${addAdditionalFilterBtnLocator} .group-2.poppable`;
            return browser
                .waitForElementVisible(chosenFilterBtnLocator)
                .click(chosenFilterBtnLocator);
        }
        function verifyAddedUrlStartsWithFilterPartToBuilder(browser) {
            return browser
                .waitForElementVisible(urlStartsWithFilterPartLocator);
        }
        function openDefineUrlStartsWithTermPopup(browser) {
            const openPopupLocator = `${urlStartsWithFilterPartLocator} .poppable`;
            return browser
                .waitForElementVisible(openPopupLocator)
                .click(openPopupLocator);
        }
        function typeNewUrlStartsWithTerm(browser) {
            const termInputLocator = `${urlStartsWithFilterPartLocator} input`;
            const validationErrorLocator = `${termInputLocator} + .has-error`;
            return browser
                .waitForElementVisible(termInputLocator)
                .setValue(termInputLocator, '%&€')
                .assert.elementPresent(validationErrorLocator)
                .setValue(termInputLocator, '/pag')
                .assert.not.elementPresent(validationErrorLocator);
        }
        function verifyReRenderedListingPagesInPreviewFrame(browser) {
            const frame = browser
                .frame(0);
            verifyListingNowUsesUrlStartsWithFilter(frame);
            return browser.frame(null);
        }
        function verifyListingNowUsesUrlStartsWithFilter(browserOrFrame) {
            browserOrFrame.assert.not.elementPresent(secondListingPageHeadingLocator);
            browserOrFrame.expect.element(firstListingPageHeadingLocator).text.to.equal(testPage2Data.title);
            return browser;
        }
    });

    //
    function getListingBlock() {
        return testPage1Data.blocks.find(({type}) => type === 'Listing');
    }
    function waitForMainMenuToAppear(browser) {
        return browser
            .waitForElementVisible(vars.editAppElLocator);
    }
    function openListingBlockToInspectorPanel(browser, testBlock) {
        const blockTreeBtnLocator = `.block-tree li[data-block-id="${testBlock.id}"] button`;
        return browser
            .waitForElementVisible(blockTreeBtnLocator)
            .click(blockTreeBtnLocator);
    }
    function saveChanges(browser) {
        return browser
            .waitForElementPresent(vars.saveButtonLocator)
            .click(vars.saveButtonLocator)
            .waitForElementNotPresent(vars.saveButtonLocator);
    }
    function goToWebPageWhichListingBlockWeJustEdited(browser) {
        return browser.navigateTo(env.makeUrl(testPage1Data.slug));
    }

    //
    afterEach((browser, done) => {
        envUtils.destroyTestSite()
            .then(_resp => {
                browser.end(done);
            });
        });
});
