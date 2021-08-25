import blockTypes from '../edit-app/src/block-types/block-types.js';
import * as treeTestUtils from './block-tree-mutating-testutils.js';

QUnit.module('BlockTrees', () => {
    QUnit.test('user can add block to inner branch', assert => {
        const done = assert.async();
        const s = treeTestUtils.createTestState();
        treeTestUtils.renderBlockTreeIntoDom(s, () => {
            treeTestUtils.simulatePageLoad(s);
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
        const s = treeTestUtils.createTestState();
        treeTestUtils.renderBlockTreeIntoDom(s, () => {
            treeTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            clickAddChildBlockButton(s)
        )
        .then(() => {
            verifyAppendedParagraphInside(s, assert);
            done();
        });
    });
    function clickAddChildBlockButton(s) {
        return new Promise(resolve => {
            const contextNavToggleBtn = document.querySelector('.block-tree > li:first-child .more-toggle');
            contextNavToggleBtn.click();
            setTimeout(() => {
            const addChildCtxNavEl = document.querySelector('.popup-menu a');
            addChildCtxNavEl.click();
            resolve();
            }, 0);
        });
    }
    function clickAddBlockButton(s) {
        return new Promise(resolve => {
            setTimeout(() => {
                const btn = document.querySelector('.block-tree').parentElement.previousElementSibling;
                btn.click();
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
});