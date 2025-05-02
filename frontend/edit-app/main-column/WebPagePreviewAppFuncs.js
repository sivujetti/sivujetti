import {
    __,
    api,
} from '@sivujetti-commons-for-edit-app';
import AddRowPopup from './popups/IncontextAddRowPopup.jsx';
import AddContentPopup from './popups/IncontextAddContentPopup.jsx';

/**
 * @param {{isContent: boolean; pos?: 'before'|'after';}} instructions
 * @param {string} blockId
 * @param {{x: number; y: number;}} at
 */
function showAddContentOrRowPopup(instructions, blockId, {x, y}) {
    const tempArrowRefEl = document.createElement('div');
    tempArrowRefEl.style.cssText = [
        'position: absolute;',
        'left: calc(var(--menu-column-width-computed) + ', x, 'px);',
        'top:', y, 'px;',
    ].join('');
    document.body.appendChild(tempArrowRefEl);
    //
    const {isContent} = instructions;
    api.mainPopper.open(
        isContent ? AddContentPopup : AddRowPopup,
        tempArrowRefEl,
        {blockId, ...(isContent ? {insertPos: instructions.pos} : {})},
        {onClose: () => tempArrowRefEl.remove()},
    );
}

export {
    showAddContentOrRowPopup,
};
