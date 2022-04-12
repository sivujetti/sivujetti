import * as commons from '@sivujetti-commons-for-edit-app';
import testUtils from './utils/my-test-utils.js';
import * as appTestUtils from './utils/edit-app-test-utils.js';
import {simulatePlaceholderPageLoad, clickSubmitButton} from './utils/create-stuff-test-utils.js';

QUnit.module('PageCreateMainPanelView', () => {
    QUnit.test('user can create page', assert => {
        const done = assert.async();
        const s = createTestState();
        simulateHttpToReturnSuccesfully(s);
        appTestUtils.renderMockEditAppIntoDom('AddPageView', _cmp =>
            simulatePlaceholderPageLoad()
        )
        .then(() =>
            openPageMetaBlockInputs(s)
        )
        .then(() =>
            fillPageTitleAndSlugInputs(s)
        )
        .then(() =>
            clickSaveChangesButton(s)
        )
        .then(() => {
            verifySavedPageToBacked(s, assert);
            s.httpPostStub.restore();
            done();
        });
    });
    function createTestState() {
        return Object.assign(appTestUtils.createTestState(), {
            testInput: {
                title: 'My page',
                slug: '/my-page',
            },
            httpPostStub: null,
        });
    }
    function simulateHttpToReturnSuccesfully(s) {
        s.httpPostStub = window.sinon.stub(commons.http, 'post')
            .returns(Promise.resolve({ok: 'ok'}));
    }
    function openPageMetaBlockInputs(_s) {
        return new Promise(resolve => {
            const pageMetaBlockHandle = document.querySelector('.block-tree li[data-block-type="PageInfo"] .block-handle');
            pageMetaBlockHandle.click();
            resolve();
        });
    }
    function fillPageTitleAndSlugInputs({testInput}) {
        return new Promise(resolve => {
            const unreg = commons.signals.on('on-page-info-form-value-changed', (_, isInit) => {
                if (isInit) return;
                resolve();
                unreg();
            });
            testUtils.fillInput(testInput.title, document.querySelector('input[name="title"]'));
            testUtils.fillInput(testInput.slug, document.querySelector('input[name="slug"]'));
        });
    }
    function clickSaveChangesButton(_s) {
        return clickSubmitButton();
    }
    function verifySavedPageToBacked(s, assert) {
        assert.ok(s.httpPostStub.called);
        const expectedCall = s.httpPostStub.getCall(0);
        assert.ok(expectedCall !== null, 'Should save page to backend');
        assert.equal(expectedCall.args[0], '/api/pages/Pages');
        const data = expectedCall.args[1];
        assert.equal(data.title, s.testInput.title);
        assert.equal(data.slug, s.testInput.slug);
        assert.equal(data.path, `${s.testInput.slug.substr(1)}/`);
        assert.equal(data.level, 1);
        assert.equal(data.layoutId, '1');
        assert.equal(data.blocks.length, 3);
    }
});
