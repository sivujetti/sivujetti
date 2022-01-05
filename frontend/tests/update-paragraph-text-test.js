import * as commons from '../edit-app/src/commons/main.js';
import * as appTestUtils from './edit-app-testutils.js';
import {simulateChangeParagraphTextInput, verifyUpdatedTextInDom} from './render-blocks-testutils.js';

QUnit.module('ParagraphBlock', () => {
    QUnit.test('text can be edited and saved to backend', assert => {
        const done = assert.async();
        const s = createTestState();
        simulateHttpToReturnSuccesfully(s);
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            appTestUtils.simulatePageLoad(s);
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
        assert.equal(expectedCall.args[0], '/api/pages/Pages/1/blocks');
        const paragraphBlockData = expectedCall.args[1].blocks[1].children[1];
        assert.equal(paragraphBlockData.text, 'Updated.');
    }
});
