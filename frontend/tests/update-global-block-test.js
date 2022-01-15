import * as commons from '@sivujetti-commons-for-edit-app';
import testUtils from './my-test-utils.js';
import * as appTestUtils from './edit-app-testutils.js';

QUnit.module('ParagraphBlock2', () => {
    QUnit.test('text can be edited and saved to backend', assert => {
        const done = assert.async();
        const s = createTestState();
        simulateHttpToReturnSuccesfully(s);
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            appTestUtils.simulatePageLoad(s, undefined, 'withGlobalBlockReference');
        })
        .then(() =>
            simulateChangeParagraphTextInput(s)
        )
        .then(() => {
            verifyUpdatedTextInDom(s, assert);
            return clickSaveChangesButton(s);
        })
        .then(() => {
            verifySavedBlockToBacked(s, assert);
            s.httpPutStub.restore();
            done();
        });
    });
    function createTestState() {
        return Object.assign(appTestUtils.createTestState(), {
            httpPutStub: null,
        });
    }
    function simulateHttpToReturnSuccesfully(s) {
        s.httpPutStub = window.sinon.stub(commons.http, 'put')
            .returns(Promise.resolve({ok: 'ok'}));
    }
    function simulateChangeParagraphTextInput(_s) {
        const els = document.querySelectorAll('.block-tree li .block-handle');
        const paragraphBlockHandle = els[els.length - 1];
        paragraphBlockHandle.click();
        //
        return new Promise((resolve) => {
            setTimeout(() => {
                testUtils.fillWysiwygInput('<p>Updated.</p>', 'paragraph-text');
                setTimeout(() => {
                    resolve();
                }, 1);
            }, 1);
        });
    }
    function verifyUpdatedTextInDom(s, assert) {
        const contentAfter = document.querySelector('.initial-section + p').textContent;
        assert.equal(contentAfter, 'Updated.');
    }
    function clickSaveChangesButton(_s) {
        const p = appTestUtils.waitUntiSaveButtonHasRunQueuedOps();
        setTimeout(() => {
            document.querySelector('#render-container-el button').click();
        }, 10);
        return p;
    }
    function verifySavedBlockToBacked(s, assert) {
        assert.ok(s.httpPutStub.called);
        const expectedCall = s.httpPutStub.getCall(0);
        assert.ok(expectedCall !== null, 'Should save block to backend');
        assert.equal(expectedCall.args[0], '/api/global-block-trees/10/blocks');
        const paragraphBlockData = expectedCall.args[1].blocks[0];
        assert.equal(paragraphBlockData.text, 'Updated.');
    }
});
