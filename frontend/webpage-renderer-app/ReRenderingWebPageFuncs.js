import {traverseRecursively} from '../shared-inline.js';

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
};
