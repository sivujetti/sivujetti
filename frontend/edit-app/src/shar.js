import {api} from '@sivujetti-commons-for-edit-app';
import {CHILDREN_START, CHILD_CONTENT_PLACEHOLDER, CHILDREN_END, noop} from './shar2.js';

/**
 * @param {String|Promise<String>} result
 * @param {(result: BlockRendctor) => void} to
 */
function getBlockReRenderResult(result, to) {
    if (typeof result === 'string') {
        to({html: result, onAfterInsertedToDom: noop});
        return;
    }
    if (typeof result !== 'object') {
        throw new TypeError('Invalid argumnt');
    }
    if (typeof result.then === 'function') {
        result.then(html => { to({html, onAfterInsertedToDom: noop}); });
        return;
    }
    to(result);
}

/**
 * @param {RawBlock} block
 * @param {(result: BlockRendctor) => void} then
 * @param {Boolean} shouldBackendRender = false
 */
function renderBlockAndThen(block, then, shouldBackendRender = false) {
    const stringOrPromiseOrObj = api.blockTypes.get(block.type).reRender(
        block,
        () => `<!--${CHILDREN_START}-->${CHILD_CONTENT_PLACEHOLDER}<!--${CHILDREN_END}-->`,
        shouldBackendRender
    );
    getBlockReRenderResult(stringOrPromiseOrObj, then);
}

export {renderBlockAndThen};
