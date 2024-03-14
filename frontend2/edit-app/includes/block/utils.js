import {
    api,
    blockTreeUtils,
    objectUtils,
    writeBlockProps,
} from '../../../sivujetti-commons-unified.js';
import {generatePushID} from '../../includes/utils.js';

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

/**
 * @param {{type: String; renderer: String; id?: String; title?: String;}} defProps
 * @param {{[key: String]: any;}} ownProps
 * @returns {RawBlock}
 */
function createBlock(defProps, ownProps) {
    const out = {
        ...{
            id: defProps.id || generatePushID(),
            type: defProps.type,
            title: defProps.title || '',
            children: [],
            renderer: defProps.renderer,
            propsData: [],
            styleClasses: '',
        },
        ...(Object.keys(defProps).reduce((cleaned, key) => {
            if (key === 'propsData' || key === 'children')
                throw new Error(`defProps can't contain key ${key}`);
            if (key !== 'id' && key !== 'type') cleaned[key] = defProps[key];
            return cleaned;
        }, {}))
    };
    writeBlockProps(out, ownProps); // block.foo + block.propsData.*
    return out;
}

export {
    createBlock,
    getIsStoredToTreeIdFrom,
    isMetaBlock,
    treeToTransferable,
};
