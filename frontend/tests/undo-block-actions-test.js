import * as appTestUtils from './utils/edit-app-test-utils.js';
import {triggerUndo} from '../edit-app/src/SaveButton.jsx';
import {clickAddBlockButton, verifyAppendedParagraphAfter,
        verifyAppendedParagraphInside, clickContextMenuLink,
        simulateDragBlock, verifySectionChildTagsEqualInDom,
        simulateChangeParagraphTextInput, verifyUpdatedTextInDom} from './utils/render-blocks-test-utils.js';

QUnit.module('BlockTrees', () => {
    QUnit.test('user can undo changing paragraph text', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateChangeParagraphTextInput(s)
        )
        .then(() => {
            verifyUpdatedTextInDom(s, assert);
            return doTriggerUndo();
        })
        .then(() => {
            verifyUpdatedTextInDom(s, assert, 'Hello');
            done();
        });
    });
    QUnit.test('user can undo adding block', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () =>
            appTestUtils.simulatePageLoad(s)
        )
        .then(() =>
            clickAddBlockButton(s)
        )
        .then(() =>
            clickConfirmAddBlockButton(s)
        )
        .then(() => {
            verifyAppendedParagraphAfter(s, assert);
            return doTriggerUndo();
        })
        .then(() => {
            verifyRemovedParagraphAfter(s, assert);
            done();
        });
        function verifyRemovedParagraphAfter(s, assert) {
            const lastBlockDomEl = document.querySelector('.initial-section').nextElementSibling;
            const appendedPEl = lastBlockDomEl.nextElementSibling;
            assert.equal(appendedPEl, undefined);
        }
        function clickConfirmAddBlockButton(_s) {
            document.querySelector('.block-tree li .dashed .btn-primary').click();
            return Promise.resolve();
        }
    });
    QUnit.test('user can undo removing block', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () =>
            appTestUtils.simulatePageLoad(s)
        )
        .then(() =>
            //                                                          Section          Paragraph
            clickContextMenuLink(s, 'delete-block', '.block-tree > li:nth-of-type(2) li:nth-of-type(2)')
        )
        .then(() => {
            verifyRemovedParagraphInside(s, assert);
            return doTriggerUndo();
        })
        .then(() => {
            verifyRestoredParagraphToDom(s, assert);
            done();
        });
        function verifyRemovedParagraphInside(s, assert) {
            const appendedPEl = document.querySelector('.initial-section > * > p');
            assert.equal(appendedPEl, undefined);
        }
        function verifyRestoredParagraphToDom(s, assert) {
            verifyAppendedParagraphInside(s, assert, 'Hello');
        }
    });
    QUnit.test('user can undo reordering blocks', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateDragBlock(s, 'upwards', 3, 2)
        )
        .then(() => {
            verifySectionChildTagsEqualInDom(s, assert, ['p', 'h2']);
            return doTriggerUndo();
        })
        .then(() => {
            verifySectionChildTagsEqualInDom(s, assert, ['h2', 'p']);
            done();
        });
    });
    function doTriggerUndo() {
        triggerUndo();
        return Promise.resolve();
    }
});
