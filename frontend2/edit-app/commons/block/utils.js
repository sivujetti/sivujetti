import {api} from '@sivujetti-commons-for-edit-app';
import {objectUtils} from '../utils.js';
import blockTreeUtils from './tree-utils.js';

/**
 * @param {RawBlock} block
 * @param {Boolean} includePrivates = false
 * @returns {{[key: String]: any;}}
 */
function toTransferableSingle(block, includePrivates = false) {
    const allKeys = Object.keys(block);
    const onlyTheseKeys = allKeys.filter(key => {
        if (key === 'children')
            return false;
        if (includePrivates === false && key.startsWith('__'))
            return false;
        return true;
    });
    return objectUtils.clonePartially(onlyTheseKeys, block);
}

/**
 * @param {Array<RawBlock>} tree
 * @param {Boolean} includePrivates = false
 * @returns {Array<{[key: String]: any;}>}
 */
function treeToTransferable(tree, includePrivates = false) {
    return blockTreeUtils.mapRecursively(tree, block => toTransferableSingle(block, includePrivates));
}

/**
 * @param {RawBlock} block
 * @returns {Boolean}
 */
function isMetaBlock({type}) {
    return type === 'PageInfo';
}

// ??
/**
 * @param {String} blockId
 * @param {'mainTree'|Array<RawBlock>} from
 * @returns {[RawBlock|null, Array<RawBlock>|null, RawBlock|null, RawGlobalBlockTree|Array<RawBlock>|null]}
 */
function findBlockFrom(blockId, from) {
    return blockTreeUtils.findBlockSmart(blockId, from === 'mainTree' ? getCurrentBlockTreeState() : from);
}

/**
 * @param {String} blockId
 * @param {'mainTree'|Array<RawBlock>} from
 * @returns {String|null}
 */
function getIsStoredToTreeIdFrom(blockId, from) {
    return blockTreeUtils.getIsStoredToTreeId(blockId, from === 'mainTree' ? getCurrentBlockTreeState() : from);
}

/**
 * @returns {Array<RawBlock>}
 */
function getCurrentBlockTreeState() {
    return api.saveButton.getInstance().getChannelState('theBlockTree');
}
// ??

export {
    findBlockFrom,
    isMetaBlock,
    treeToTransferable,
};
