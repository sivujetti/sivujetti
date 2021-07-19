interface Block {
    id: String;
    type: 'Heading'|'Listing'|'Paragraph'|String;
    _cref: BlockRefComment;
    toHtml(block: Block): String;
    static fromObject(data: RawBlock|Object): Block;
    static fromType(blockType: BlockType, id: String): Block;
}

interface RawBlock {
    id: String;
    type: String;
    title: String;
    renderer: String;
    propsData: Array<{key: String; value: String;}>;
    children: Array<RawBlock>;
    [key: String]: mixed;
}

interface BlockType {
    name: String;
    friendlyName: String;
    initialData: {[key: String]: any;};
    defaultRenderer: String;
}

interface BlockRefComment {
    blockId: String;
    blockType: String;
    startingCommentNode: Comment;   
}

interface CurrentPageData {
    page: {
        id: String;
        blocks: Array<RawBlock>;
        isPlaceholderPage: Boolean;
    };
    layoutBlocks: Array<RawBlock>;
    layouts: Array<Object>;
}

interface EditAppAwareWebPage {
    data: CurrentPageData;
    scanBlockRefComments(): Array<BlockRefComment>;
    after(block: Block, after: Block): BlockRefComment;
    deleteBlockFromDom(block: Block);
    updateTitle(text: String);
}

interface WebPageIframe {
    openPlaceholderPage(pageType: String, layoutId: String = '1');
    goBack();
}

interface Env {
    window: Window;
    document: Document;
}
