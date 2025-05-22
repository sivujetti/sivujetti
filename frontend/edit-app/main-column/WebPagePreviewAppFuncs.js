import {
    __,
    api,
    blockTreeUtils,
} from '@sivujetti-commons-for-edit-app';
import {createBlockFromType} from '../includes/block/utils.js';
import AddContentPopup from './popups/IncontextAddContentPopup.jsx';
import AddRowPopup from './popups/IncontextAddRowPopup.jsx';
import AddRootSectionPopup from './popups/IncontextAddRootSectionPopup.jsx';
import {openAsDialog} from './popups/IncontextSaveBlockToLibraryPopup.jsx';

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
        if (parentBlock.type === 'Columns' && parentBlock.numColumns > 1 &&
            !(refBlock.type === 'Wrapper' && refBlock.isCell)) {
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
    let clickedLinkId = null;
    api.contextMenu.open(tempArrowRefEl, {
        getLinks: () => [
            {text: __('Move up ↑'), title: __('Move up ↑'), id: 'move-up'},
            {text: __('Move down ↓'), title: __('Move down ↓'), id: 'move-down'},
            {text: __('Save to library'), title: __('Save to library'), id: 'save-to-library'},
        ],
        onItemClicked: (link, _e) => {
            clickedLinkId = link.id;
            if (link.id === 'move-up') {
                alert('Move ' + blockId + ' up todo');
            } else if (link.id === 'move-down') {
                alert('Move ' + blockId + ' down todo');
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

export {
    showAddContentOrRowPopup,
    showAddRootSectionPopup,
    showMoreMenu,
};
