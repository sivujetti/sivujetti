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

export {treeToTransferable};
