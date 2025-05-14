import {
    __,
    api,
    blockTreeUtils,
} from '@sivujetti-commons-for-edit-app';
import {createBlockFromType} from '../includes/block/utils.js';
import {pushInserBlockOp} from '../menu-column/block/AddContentPopup.jsx';
import AddContentPopup from './popups/IncontextAddContentPopup.jsx';
import AddRowPopup from './popups/IncontextAddRowPopup.jsx';

/**
 * @param {string} targetBlockId
 * @param {boolean} addAfter
 * @returns {Block}
 */
function insertRootSection(targetBlockId, addAfter) {
    const targetTrid = 'main';
    const insertPos = addAfter ? 'after' : 'before';
    const isReplace = false;
    const wasCurrentlySelectedBlock = false;
    const newBlockDescriptor = {
        block: {
            ...createBlockFromType('RootSection'),
            children: [
                createBlockFromType('ContentOrRowPlaceholder', undefined, {outerBlockType: 'RootSection'})
            ],
        },
        isReusable: false,
        styles: null,
    };
    pushInserBlockOp(newBlockDescriptor, targetBlockId, targetTrid, insertPos, isReplace, wasCurrentlySelectedBlock);
    return newBlockDescriptor.block;
}

/**
 * @param {{insertType: insertType; addAfter: boolean;}} instructions
 * @param {string} blockId
 * @param {DOMRect} buttonRect
 * @param {(newBlock: Block) => void} onAfterInsertedBlock
 */
function showAddContentOrRowPopup(instructions, blockId, buttonRect, onAfterInsertedBlock) {
    const tempArrowRefEl = document.createElement('div');
    const {x, y} = createPlacementForPopup(buttonRect);
    tempArrowRefEl.style.cssText = [
        'position: absolute;',
        'left: calc(var(--menu-column-width-computed) + ', x, 'px);',
        'top:', y, 'px;',
    ].join('');
    document.body.appendChild(tempArrowRefEl);
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
        const [refBlock, _branch, parentBlock] = blockTreeUtils.findBlock(blockId, blockTreeUtils.getTree('main'));
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
        {onClose: () => tempArrowRefEl.remove()},
    );
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
    createPlacementForPopup,
    showAddContentOrRowPopup,
    insertRootSection,
};
