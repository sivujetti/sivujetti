interface Block {
    id: string;
    type: 'Heading'|'Listing'|'Paragraph'|string;
    _cref: BlockRefComment;
    toHtml(block: Block): string;
    static fromObject(data: Object): Block;
}

interface BlockType {
    friendlyName: string;
}

interface BlockRefComment {
    blockId: string;
    blockType: string;
    startingCommentNode: Comment;   
}

interface CurrentPageData {
    blocks: Array<Object>;
    layoutBlocks: Array<Object>;
}

interface EditAppAwareWebPage {

}
