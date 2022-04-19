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
        const stylesTabBtnLocator = `${vars.inspectorPanelLocator} > ul .tab-item:nth-child(2)`;
        const stylesTextareaLocator = `${vars.inspectorPanelLocator} > div:last-of-type textarea`;
        const validationErrorLocator = `${stylesTextareaLocator} + *`;
        const testBlockInPageLocator = `body [data-block="${testBlock.id}"]`;

        //
        browser
            .waitForElementVisible(vars.editAppElLocator)
            .waitForElementVisible(testBlockBlockTreeBtnLocator)
            .click(testBlockBlockTreeBtnLocator)
            .waitForElementVisible(stylesTabBtnLocator)
            .click(stylesTabBtnLocator)
            .waitForElementVisible(stylesTextareaLocator)
            .setValue(stylesTextareaLocator, '"#€%€#&?€ 52€"')
            .assert.elementPresent(validationErrorLocator)
            .setValue(stylesTextareaLocator, '[[scope]] { color: red; }')
            .assert.not.elementPresent(validationErrorLocator)
            //
            .frame(0)
            .execute(testBlockLocator =>
                window.getComputedStyle(document.querySelector(testBlockLocator)).color
            , [testBlockInPageLocator], result => {
                browser.assert.equal(result.value, 'rgb(255, 0, 0)');
            })
            .frameParent()
            //
            .waitForElementPresent(vars.saveButtonLocator)
            .click(vars.saveButtonLocator)
            .waitForElementNotPresent(vars.saveButtonLocator)
            //
            .navigateTo(env.makeUrl(testPageData.slug))
            .waitForElementPresent(testBlockInPageLocator)
            .execute(testBlockLocator =>
                window.getComputedStyle(document.querySelector(testBlockLocator)).color
            , [testBlockInPageLocator], result => {
                browser.assert.equal(result.value, 'rgb(255, 0, 0)');
            });
    });

    after((browser, done) => {
        envUtils.destroyTestSite()
            .then(_resp => {
                browser.end(done);
            });
        });
});
