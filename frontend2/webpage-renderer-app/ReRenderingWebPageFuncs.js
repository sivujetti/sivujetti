import {traverseRecursively} from '../shared-inline.js';

/**
 * @param {Array<Block>} branch
 * @param {{[blockId: String]: String;}} map
 * @returns {Array<String>}
 */
function createBlockTreeHashes(branch, map) {
    const out = [];
    for (const block of branch) {
        if (map[block.id]) {
            out.push(map[block.id]);
            continue;
        }
        let hash;
        if (block.type !== 'GlobalBlockReference') {
            const childArrHash = !block.children.length ? '-' : createBlockTreeHashes(block.children, map).join(',');
            hash = createBlockHash(block, childArrHash).toString();
        } else {
            const subHashes = createBlockTreeHashes(block.__globalBlockTree.blocks, map);
            hash = subHashes.join(',');
        }
        map[block.id] = hash;
        out.push(hash);
    }
    return out;
}

/**
 * @param {Block} block
 * @param {String} childArrHash
 * @returns {Number}
 */
function createBlockHash(block, childArrHash) {
    return hashCode(JSON.stringify(block, (key, value) => {
        if (key === 'children')
            return childArrHash;
        if (key.startsWith('__'))
            return undefined;
        return value;
    }));
}

/**
 * https://stackoverflow.com/a/52171480
 *
 * @param {String} str
 * @param {Number} seed = 0
 * @returns {String}
 */
function hashCode(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * @param {Block} block
 */
function stringHtmlPropToVNodeArray(block) {
    if (block.type === 'GlobalBlockReference') {
        traverseRecursively(block.__globalBlockTree.blocks, stringHtmlPropToVNodeArray);
        return;
    }
    if (['Text', 'Button'].indexOf(block.type) > -1 && typeof block.html === 'string')
        block.html = htmlStringToVNodeArray(block.html);
}

/**
 * @param {String} htmlString
 * @returns {Array<preact.ComponentChild>}
 */
function htmlStringToVNodeArray(htmlString) {
    const container = document.createElement('div');
    container.innerHTML = htmlString;
    return domNodesToVNodes(container.childNodes);
}

/**
 * @param {NodeListOf<ChildNode>} nodes
 * @returns {Array<preact.ComponentChild>}
 */
function domNodesToVNodes(nodes) {
    return [...nodes].map(node => {
        if (node.nodeType === Node.TEXT_NODE)
            return node.textContent;
        if (node.nodeType === Node.COMMENT_NODE)
            return null;
        const El = node.tagName.toLowerCase();
        const attrs = [...node.attributes].reduce((mapped, {name, value}) =>
            ({...mapped, ...{[name]: value}}),
        {});
        return <El { ...attrs }>{
            node.childNodes.length ? domNodesToVNodes(node.childNodes) : null
        }</El>;
    });
}

export {
    htmlStringToVNodeArray,
    stringHtmlPropToVNodeArray,
    createBlockTreeHashes,
};
