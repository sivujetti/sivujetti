interface Block {
    id: String;
    type: 'Heading'|'Listing'|'Paragraph'|String;
    _cref: BlockRefComment;
    toHtml(block: Block): String;
    static fromObject(data: Object): Block;
    static fromType(blockType: BlockType, id: String): Block;
}

interface BlockType {
    name: String;
    friendlyName: String;
    initialData: {[key: String]: any;};
    defaultRenderer: string;
}

interface BlockRefComment {
    blockId: String;
    blockType: String;
    startingCommentNode: Comment;   
}

interface CurrentPageData {
    page: {
        id: string;
        blocks: Array<Object>;
    }
    layoutBlocks: Array<Object>;
}

interface EditAppAwareWebPage {
    data: CurrentPageData;
    scanBlockRefComments(): Array<BlockRefComment>;
    appendBlockToDom(block: Block, parentBranch: Array<Block>): BlockRefComment;
    deleteBlockFromDom(block: Block);
}
