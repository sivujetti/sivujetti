import blockTypes from '../edit-app/src/block-types/block-types.js';
import {blockUtils} from './my-test-utils.js';
import * as appTestUtils from './edit-app-testutils.js';

QUnit.module('BlockTrees', () => {
    QUnit.test('user can add block to inner branch', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () => {
            appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            clickAddBlockButton(s)
        )
        .then(() => {
            verifyAppendedParagraphAfter(s, assert);
            done();
        });
    });
    QUnit.test('user can add block to inner branch by using the context menu', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () => {
            appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            clickContextMenuLink(s, 'add-child')
        )
        .then(() => {
            verifyAppendedParagraphInside(s, assert);
            done();
        });
    });
    QUnit.test('user can clone block using the context menu', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () => {
            appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            clickContextMenuLink(s, 'clone-block')
        )
        .then(() => {
            verifyRecirsivelyClonedSectionAfter(s, assert);
            verifyUpdatedChildBlockRefs(s, assert);
            done();
        });
    });
    function clickAddBlockButton(_s) {
        return new Promise(resolve => {
            const btn = document.querySelector('.block-tree').parentElement.previousElementSibling;
            btn.click();
            resolve();
        });
    }
    function clickContextMenuLink(s, linkId) {
        return new Promise(resolve => {
            const contextNavToggleBtn = document.querySelector('.block-tree > li:nth-of-type(2) .more-toggle');
            contextNavToggleBtn.click();
            setTimeout(() => {
                const linkEl = Array.from(document.querySelectorAll('.popup-menu a'))
                    .find(el => el.href.split('#')[1] === linkId);
                if (!linkEl) throw new Error(`Invalid link id ${linkId} (should be 'add-child','clone-block' or 'delete-block')`);
                linkEl.click();
                resolve();
            }, 0);
        });
    }
    function verifyAppendedParagraphAfter(s, assert) {
        const initialSectionEl = document.getElementById('initial-section');
        const expectedNewPEl = initialSectionEl.nextElementSibling;
        assert.equal(expectedNewPEl.tagName, 'P');
        const paragraphType = blockTypes.get('Paragraph');
        assert.equal(expectedNewPEl.textContent, paragraphType.initialData.text);
    }
    function verifyAppendedParagraphInside(s, assert) {
        const initialSectionEl = document.getElementById('initial-section');
        const expectedNewPEl = initialSectionEl.children[initialSectionEl.children.length - 1];
        assert.equal(expectedNewPEl.tagName, 'P');
        const paragraphType = blockTypes.get('Paragraph');
        assert.equal(expectedNewPEl.textContent, paragraphType.initialData.text);
    }
    function verifyRecirsivelyClonedSectionAfter(s, assert) {
        const initialSectionEl = document.getElementById('initial-section');
        const expectedClonedSectionEl = initialSectionEl.nextElementSibling;
        assert.equal(expectedClonedSectionEl.nodeName, 'SECTION');
        //
        const expectedClonedH2El = expectedClonedSectionEl.children[0];
        assert.equal(expectedClonedH2El.textContent,
                     initialSectionEl.children[0].textContent);
        const expectedClonedPEl = expectedClonedSectionEl.children[1];
        assert.equal(expectedClonedPEl.textContent,
                     initialSectionEl.children[1].textContent);
    }
    function verifyUpdatedChildBlockRefs(s, assert) {
        const initialSectionEl = document.getElementById('initial-section');
        const clonedSectionEl = initialSectionEl.nextElementSibling;
        //
        const h2BlockRefAfter = blockUtils.getBlockRefId(clonedSectionEl.children[0]);
        const h2BlockRefBefore = blockUtils.getBlockRefId(initialSectionEl.children[0]);
        assert.equal(typeof h2BlockRefAfter.blockId, 'string');
        assert.notEqual(h2BlockRefAfter.blockId,
                        h2BlockRefBefore.blockId);
        const pBlockRefAfter = blockUtils.getBlockRefId(clonedSectionEl.children[0]);
        const pBlockRefBefore = blockUtils.getBlockRefId(initialSectionEl.children[0]);
        assert.equal(typeof pBlockRefAfter.blockId, 'string');
        assert.notEqual(pBlockRefAfter.blockId,
                        pBlockRefBefore.blockId);
    }
});