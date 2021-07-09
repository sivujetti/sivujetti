class EditAppAwareWebPage {
    /**
     * @param {CurrentPageData} dataFromAdminBackend
     * @returns {Array<BlockRefComment>}
     * @access public
     */
    getBlockRefComments(dataFromAdminBackend) {
        return dataFromAdminBackend.blocks && dataFromAdminBackend.blocks.length
            ? getBlockRefCommentsFromCurrentPage()
            : [];
    }
}

function getBlockRefCommentsFromCurrentPage() {
    const L1 = /* <!-- */ ' block-start '.length;
    const L2 = ' '.length /* --> */;
    const out = [];
    for (const c of getAllComments(document.body)) {
        if (!c.nodeValue.startsWith(' block-start '))
            continue;
        const pair = c.nodeValue.substr(L1, c.nodeValue.length - L1 - L2);
        const [blockId, blockType] = pair.split(':');
        const PUSH_ID_LENGTH = 20;
        if (!(blockId.length === PUSH_ID_LENGTH || !isNaN(parseInt(blockId))))
            continue;
        //
        out.push({
            blockId,
            blockType,
            startingCommentNode: c,
        });
    }
    return out;
}

function filterNone() {
    return NodeFilter.FILTER_ACCEPT;
}

/**
 * https://stackoverflow.com/a/13364065
 */
function getAllComments(rootElem) {
    const comments = [];
    const iterator = document.createNodeIterator(rootElem, NodeFilter.SHOW_COMMENT, filterNone, false);
    let curNode;
    while (curNode = iterator.nextNode()) // eslint-disable-line
        comments.push(curNode);
    return comments;
}

export default EditAppAwareWebPage;
