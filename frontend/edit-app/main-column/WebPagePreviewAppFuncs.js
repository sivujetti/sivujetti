import {
    __,
    api,
    blockTreeUtils,
    objectUtils,
} from '@sivujetti-commons-for-edit-app';
import {createBlockFromType, isCellBlock, isRowBlock} from '../includes/block/utils.js';
import {deleteBlock, isBlockOrItsChildOpenInDialog} from '../menu-column/block/BlockTreeFuncs.js';
import BlockEditPopup from './popups/BlockEditPopup.jsx';
import AddContentPopup from './popups/IncontextAddContentPopup.jsx';
import AddRowPopup from './popups/IncontextAddRowPopup.jsx';
import AddRootSectionPopup from './popups/IncontextAddRootSectionPopup.jsx';
import {openAsDialog} from './popups/IncontextSaveBlockToLibraryPopup.jsx';
import {createMoveWithinMainTreeOp} from '../includes/block/tree-dnd-controller-funcs.js';

/**
 * @param {string} blockId
 * @param {boolean} addAfter
 * @param {DOMRect} buttonRect
 * @param {(newRootSectionBlock: Block) => void} onAfterInsertedBlock
 */
function showAddRootSectionPopup(blockId, addAfter, buttonRect, onAfterInsertedBlock) {
    const {tempArrowRefEl, removeEl} = createPopupRefEl(buttonRect);
    //
    api.mainPopper.open(
        // @ts-ignore
        AddRootSectionPopup,
        tempArrowRefEl,
        {
            blockId,
            insertPos: addAfter ? 'after' : 'before',
            isReplace: false,
            onAfterInsertedBlock
        },
        {onClose: removeEl},
    );
}

/**
 * @param {{insertType: insertType; addAfter?: boolean;}} instructions
 * @param {string} blockId
 * @param {DOMRect} buttonRect
 * @param {(newBlock: Block) => void} onAfterInsertedBlock
 */
function showAddContentOrRowPopup(instructions, blockId, buttonRect, onAfterInsertedBlock) {
    const {tempArrowRefEl, removeEl} = createPopupRefEl(buttonRect);
    //
    const isPlaceholderReplace = (instructions.insertType === 'row' && !instructions.addAfter) ||
                                  instructions.insertType === 'content';
    let props = {
        blockId,
        insertPos: isPlaceholderReplace ? 'as-child' : instructions.addAfter ? 'after' : 'before',
        isReplace: isPlaceholderReplace,
        onAfterInsertedBlock
    };
    if (!isPlaceholderReplace) {
        const [refBlock, _branch, parentBlock] = blockTreeUtils.findBlock(blockId, blockTreeUtils.getMainTree());
        if (parentBlock.type === 'Columns' && parentBlock.numColumns > 1 && !isCellBlock(refBlock)) {
            props.insertPos = 'as-child';
            props.isReplace = true;
            props.onCreateBlock = block => ({
                ...createBlockFromType('Wrapper', undefined, {isCell: 1}),
                children: props.insertPos === 'after' ? [block, refBlock] : [refBlock, block]
            });
        }
    }
    if (instructions.insertType === 'content') {
        props.onlyContent = true;
    }
    api.mainPopper.open(
        // @ts-ignore
        instructions.insertType !== 'row' ? AddContentPopup : AddRowPopup,
        tempArrowRefEl,
        props,
        {onClose: removeEl},
    );
}

/**
 * @param {string} blockId
 * @param {DOMRect} buttonRect
 * @param {(linkId: string|null) => void} onMenuClosed
 */
function showMoreMenu(blockId, buttonRect, onMenuClosed) {
    const {tempArrowRefEl, removeEl} = createPopupRefEl(() => ({
        x: buttonRect.x - api.contextMenu.marginDefault,
        y: buttonRect.y + buttonRect.height - api.contextMenu.marginDefault,
    }));
    const [links, swap1, swap2] = createMoreLinks(blockId);
    let clickedLinkId = null;
    api.contextMenu.open(tempArrowRefEl, {
        getLinks: () => links,
        onItemClicked: (/** @type {ContextMenuLink & {data?: string;}} */ link, _e) => {
            clickedLinkId = link.id;
            const isDown = link.id === 'move-down';
            if (isDown || link.id === 'move-up') {
                const {prev, next, blockId} = link.data !== 'is-cell' ? swap1 : swap2;
                const op = createMoveWithinMainTreeOp(blockId, (isDown ? next : prev).id, isDown ? 'after' : 'before');
                api.saveButton.getInstance().pushOp(...op);
                onMenuClosed(clickedLinkId);
            } else if (link.id === 'save-to-library') {
                openAsDialog(blockId);
            }
        },
        onMenuClosed: () => {
            removeEl();
            onMenuClosed(clickedLinkId);
            clickedLinkId = null;
        },
    });
}

/**
 * @param {string} blockId
 * @returns {[Array<ContextMenuLink & {data?: string;}>, {prev: Block|null; next: Block|null; blockId: string;}, {prev: Block|null; next: Block|null; blockId: string;}]}
 */
function createMoreLinks(blockId) {
    const s1 = createSwapStuff(blockId);
    const s2 = !isCellBlock(s1.parentBlock) ? null : createSwapStuff(s1.parentBlock.id, 'column ');
    const {parentCell, nextCell, prevCell, moveCellUpLink, moveCellDownLink} = !s2 ? {
        parentCell: null,
        prevCell: null,
        nextCell: null,
        moveCellUpLink: null,
        moveCellDownLink: null,
    } : {
        parentCell: s1.parentBlock,
        prevCell: s2.prev,
        nextCell: s2.next,
        moveCellUpLink: {...s2.moveUpLink, data: 'is-cell'},
        moveCellDownLink: {...s2.moveDownLink, data: 'is-cell'},
    };
    const links = [
        ...(s1.prev ? [s1.moveUpLink] : []),
        ...(s1.next ? [s1.moveDownLink] : []),
        ...(prevCell ? [moveCellUpLink] : []),
        ...(nextCell ? [moveCellDownLink] : []),
        {text: __('Save to library'), title: __('Save to library'), id: 'save-to-library'},
    ];
    return [
        links,
        {prev: s1.prev, next: s1.next, blockId},
        {next: nextCell, prev: prevCell, blockId: parentCell?.id},
    ];
}

/**
 * @param {string} blockId
 * @param {string} c = ''
 * @returns {{prev: Block|null; next: Block|null; moveUpLink: ContextMenuLink; moveDownLink: ContextMenuLink; parentBlock: Block;}}
 */
function createSwapStuff(blockId, c = '') {
    const [block, br, parentBlock] = blockTreeUtils.findBlock(blockId, blockTreeUtils.getMainTree());
    const idx = br.indexOf(block);
    const prev = idx > 0 ? br.at(idx - 1) : null;
    const next = br.at(idx + 1);
    const [prevText, nextText] = (prev || next) && parentBlock && isRowBlock(parentBlock) && parentBlock.numColumns > 1
        ? ['left ←', 'right →']
        : ['up ↑', 'down ↓'];
    return {
        prev,
        next,
        moveUpLink: {text: __(`Move ${c}${prevText}`), title: __(`Move ${c}${prevText}`), id: 'move-up'},
        moveDownLink: {text: __(`Move ${c}${nextText}`), title: __(`Move ${c}${nextText}`), id: 'move-down'},
        parentBlock,
    };
}

/**
 * @param {DOMRect|(() => Position)} rectOrCreatePos
 * @returns {{tempArrowRefEl: HTMLElement; removeEl: () => void;}} Cleanup
 */
function createPopupRefEl(rectOrCreatePos) {
    const tempArrowRefEl = document.createElement('div');
    const {x, y} = rectOrCreatePos instanceof DOMRect ? createPlacementForPopup(rectOrCreatePos) : rectOrCreatePos();
    tempArrowRefEl.style.cssText = [
        'position: absolute;',
        'left: calc(var(--menu-column-width-computed) + ', x, 'px);',
        'top:', y, 'px;',
    ].join('');
    document.body.appendChild(tempArrowRefEl);

    return {
        tempArrowRefEl,
        removeEl: () => tempArrowRefEl.remove(),
    };
}

/**
 * @param {DOMRect} buttonRect
 * @returns {Position}
 */
function createPlacementForPopup(buttonRect) {
    return {
        x: buttonRect.x + buttonRect.width / 2,
        y: buttonRect.y + buttonRect.height
    };
}

/**
 * @param {string} blockId
 * @param {'RootSection'|'Row'|'Content'} type
 * @param {boolean} wasOpenInDialog = null
 */
function handleDeleteBlock(blockId, type, wasOpenInDialog = null) {
    const mainTree = blockTreeUtils.getMainTree();
    const [block, _, parentBlock] = blockTreeUtils.findBlock(blockId, mainTree);

    let replaceWith = null;
    if (type === 'Content' && isRowBlock(parentBlock)) {
        replaceWith = 'Columns';
    } else if (type === 'Row' && parentBlock.type === 'RootSection' && parentBlock.children.length === 1) {
        replaceWith = 'RootSection';
    } else if (type === 'Content' && parentBlock.type === 'RootSection') {
        handleDeleteBlock(parentBlock.id, 'RootSection', isBlockOrItsChildOpenInDialog2(block));
        return;
    }

    wasOpenInDialog ??= isBlockOrItsChildOpenInDialog2(block);

    if (!replaceWith) {
        deleteBlock(blockId, 'main', wasOpenInDialog);
    } else {
        const newTree = objectUtils.cloneDeep(mainTree);
        const [b2, br2] = blockTreeUtils.findBlock(blockId, newTree);
        // mutates $newTree
        br2[br2.indexOf(b2)] = createBlockFromType('ContentOrRowPlaceholder', undefined, {outerBlockType: replaceWith});
        api.saveButton.getInstance().pushOp(
            'theBlockTree',
            newTree,
            {event: 'replace-block', wasCurrentlySelectedBlock: wasOpenInDialog}
        );
    }
}

/**
 * @param {Block} block
 * @returns {boolean}
 */
function isBlockOrItsChildOpenInDialog2(block) {
    const {Renderer, rendererProps} = api.floatingDialog2.getCurrentDialogInfo();
    return Renderer === BlockEditPopup && isBlockOrItsChildOpenInDialog(block, rendererProps.block.id);
}

export {
    handleDeleteBlock,
    showAddContentOrRowPopup,
    showAddRootSectionPopup,
    showMoreMenu,
};
