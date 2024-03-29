import {api} from '@sivujetti-commons-for-edit-app';
import testUtils from './my-test-utils.js';

/**
 * @param {any} _s
 * @returns {Promise<void>}
 */
function clickAddBlockButton(_s) {
    const btn = document.querySelector('.block-tree').parentElement.previousElementSibling;
    btn.click();
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 0);
    });
}

/**
 * @param {any} s
 * @param {Assert} assert
 * @param {String} expectedText = ''
 */
function verifyAppendedParagraphAfter(s, assert, expectedText = '') {
    const lastBlockElInDom = document.querySelector('.initial-section').nextElementSibling;
    const expectedNewPEl = lastBlockElInDom.nextElementSibling;
    assert.equal(expectedNewPEl.tagName, 'P');
    if (!expectedText) {
        const paragraphType = api.blockTypes.get('Paragraph');
        expectedText = paragraphType.initialData.text;
    }
    assert.equal(expectedNewPEl.textContent, expectedText);
}

/**
 * @param {any} s
 * @param {Assert} assert
 * @param {String} expectedText = ''
 */
function verifyAppendedParagraphInside(s, assert, expectedText = '') {
    const initialSectionElDiv = document.querySelector('.initial-section').children[0];
    const expectedNewPEl = initialSectionElDiv.children[initialSectionElDiv.children.length - 1];
    assert.equal(expectedNewPEl.tagName, 'P');
    assert.equal(expectedNewPEl.textContent, expectedText || api.blockTypes.get('Paragraph').initialData.text);
}

/**
 * @param {any} s
 * @param {'add-child'|'clone-block'|'delete-block'} linkId
 * @returns {Promise<void>}
 */
function clickContextMenuLink(s, linkId, treeItemSelector = null) {
    return new Promise(resolve => {
        const contextNavToggleBtn = document.querySelector(`${treeItemSelector || '.block-tree > li:nth-of-type(2)'} .more-toggle`);
        contextNavToggleBtn.click();
        setTimeout(() => {
            const linkEl = Array.from(document.querySelectorAll('.popup-menu a'))
                .find(el => el.href.split('#')[1] === linkId);
            if (!linkEl)
                throw new Error(`Invalid link id ${linkId} (should be 'add-child',` +
                                `'clone-block' or 'delete-block')`);
            linkEl.click();
            resolve();
        }, 0);
    });
}

/**
 * @param {any} s
 * @param {'downwards'|'upwards'} direction
 * @param {Number} dragIdx = -1 Index of the li element to drag
 * @param {Number} otherIdx = -2 Index of the li element to drag to
 * @param {'as-child'?} t = null
 * @returns {Promise<void>}
 */
function simulateDragBlock(s, direction, dragIdx = -1, otherIdx = -2, t = null) {
    const simulateDragStarted = liEl => {
        const fakeDragStartEvent = {target: liEl};
        s.blockTreesCmp.blockTree.current.dragDrop.handleDragStarted(fakeDragStartEvent);
    };
    const simulateDraggedOver = (liEl, simulatedMousePosition) => {
        const fakeDragOverEvent = {target: liEl,
                                   clientY: simulatedMousePosition,
                                   preventDefault: () => null};
        s.blockTreesCmp.blockTree.current.dragDrop.handleDraggedOver(fakeDragOverEvent);
    };
    const simulateDropped = () => {
        s.blockTreesCmp.blockTree.current.dragDrop.handleDraggableDropped();
    };
    return new Promise(resolve => {
        const lis = document.querySelectorAll('.block-tree li');
        //
        if (direction === 'upwards') {
            const dragBlockLi = lis[dragIdx < 0 ? lis.length + dragIdx : dragIdx];
            const otherBlockLi = lis[otherIdx < 0 ? lis.length + otherIdx : otherIdx];
            simulateDragStarted(dragBlockLi);
            if (t !== 'as-child')
                simulateDraggedOver(otherBlockLi,
                                    // Simulate that mouse is above target li's center
                                    -Infinity);
            else
                simulateDraggedOver(otherBlockLi,
                                    // Simulate that mouse is below target li's bottom treshold
                                    Infinity);
        } else {
            const dragBlockLi = lis[dragIdx < 0 ? lis.length + dragIdx : dragIdx];
            const otherBlockLi = lis[otherIdx < 0 ? lis.length + otherIdx : otherIdx];
            const edge = 10;
            const treshold = otherBlockLi.querySelector('.d-flex').getBoundingClientRect().top + edge + 2;
            //
            simulateDragStarted(dragBlockLi);
            if (t !== 'as-child')
                simulateDraggedOver(otherBlockLi,
                                    // Simulate that mouse is below target li's center
                                    Infinity);
            else
                simulateDraggedOver(otherBlockLi,
                                    // Simulate that mouse is above target li's center treshold
                                    // and below its "above" treshold
                                    treshold);
        }
        simulateDropped();
        resolve();
    });
}

/**
 * @param {any} _s
 * @param {Assert} assert
 * @param {Array<String>} expectedTagNames
 */
function verifyRootChildTagsEqualInDom(_s, assert, expectedTagNames) {
    const domBranchAfter = document.querySelector('.initial-section').parentElement.children;
    assert.equal(domBranchAfter.length, expectedTagNames.length);
    expectedTagNames.forEach((tagName, i) => {
        assert.equal(domBranchAfter[i].tagName, tagName.toUpperCase());
    });
}

/**
 * @param {any} _s
 * @param {Assert} assert
 * @param {Array<String>} expectedTagNames
 */
function verifySectionChildTagsEqualInDom(_s, assert, expectedTagNames) {
    const domBranchAfter = document.querySelector('.initial-section').children[0].children;
    assert.equal(domBranchAfter.length, expectedTagNames.length);
    expectedTagNames.forEach((tagName, i) => {
        assert.equal(domBranchAfter[i].tagName, tagName.toUpperCase());
    });
}

/**
 * @param {any} _s
 * @returns {Promise<void>}
 */
function simulateChangeParagraphTextInput(_s) {
    const els = document.querySelectorAll('.block-tree li .block-handle');
    const paragraphBlockHandle = els.at(-2);
    paragraphBlockHandle.click();
    //
    return new Promise((resolve) => {
        setTimeout(() => {
            testUtils.fillWysiwygInput('<p>Updated.</p>', 'paragraph-text');
            setTimeout(() => {
                resolve();
            }, 100);
        }, 1);
    });
}

/**
 * @param {any} s
 * @param {Assert} assert
 * @param {String} expectedText = ''
 */
function verifyUpdatedTextInDom(s, assert, expectedText = '') {
    const contentAfter = document.querySelector('.initial-section > * > p').textContent;
    assert.equal(contentAfter, expectedText || 'Updated.');
}

export {clickAddBlockButton, verifyAppendedParagraphAfter, verifyAppendedParagraphInside,
        clickContextMenuLink, simulateDragBlock, verifySectionChildTagsEqualInDom,
        verifyRootChildTagsEqualInDom, simulateChangeParagraphTextInput,
        verifyUpdatedTextInDom};
