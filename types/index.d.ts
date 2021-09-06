interface SivujettiFrontendApi {
    blockTypes: BlockTypes;
}

interface BlockTypes {
    get(name: String): BlockType|undefined;
    register(name: String, blockType: BlockType): void;
    entries(): IterableIterator<String, BlockType>;
}

interface BlockType {
    name: String;
    friendlyName: String;
    ownPropNames: Array<String>;
    initialData: {[key: String]: any}|BlockBlueprint,
    defaultRenderer: String,
    reRender(props: {[key: String]: any}, renderChildren: () => String): String;
    editForm: preact.ComponentConstructor;
    infoFromBackend: {associatedRenderers: Array<String>;};
}

interface Block {
    id: String;
    type: 'Columns'|'Heading'|'Paragraph'|'Section'|String;
    _cref: BlockRefComment;
    toHtml(): String;
    overwritePropsData(newPropsData: Object): void;
    static fromObject(data: RawBlock|Object): Block;
    static fromType(blockType: BlockType|String, data?: Object, id?: String): Block;
    static clone(from: RawBlock|Object): Block;
}

interface BlockBlueprint {
    blockType: String;
    data: Object;
    children: Array<BlockBlueprint>;
}

interface RawBlock {
    id: String;
    type: String;
    title: String;
    renderer: String;
    propsData: Array<{key: String; value: String;}>;
    children: Array<RawBlock>;
    parentBlockIdPath: String; // e.g. '/grand-parent/parent'
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
        slug: String;
        path: String;
        level: Number;
        type: String;
        title: String;
        id: String;
        layoutId: String;
        status: Number;
        blocks: Array<RawBlock>;
        isPlaceholderPage: Boolean;
    };
    layoutBlocks: Array<RawBlock>;
    layouts: Array<Object>;
}

interface BlockBlueprint2 {
    type: String;
    title: String;
    defaultRenderer: String;
    initialData: {[key: String]: String;};
    children: Array<BlockBlueprint2>;
}

interface PageType {
    name: String;
    slug: String;
    ownFields: Array<{name: String; dataType: String; friendlyName: String;}>;
    blockFields: Array<BlockBlueprint2>;
    defaultFields: {[key: String]: {defautlValue: String;};};
    isListable: Boolean;
}

interface TheWebsite {
    baseUrl: String;
    assetBaseUrl: String;
    pageTypes: Array<PageType>;
}

interface EditAppAwareWebPage {
    data: CurrentPageData;
    scanBlockRefComments(doRegisterEventListeners: Boolean = false): Array<BlockRefComment>;
    appendBlockToDom(block: Block, after: Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}): Promise<BlockRefComment>;
    replaceBlockFromDomWith(currentBlock: Block, replacement: Block): Promise<BlockRefComment>;
    deleteBlockFromDom(block: Block, doKeepBoundaryComments: Boolean = false): [Array, Array];
    reRenderBlockInPlace(block: Block): Promise<null>;
    reOrderBlocksInDom(blockToMove: Block, blockToMoveTo: Block, position: 'before'|'after'|'as-child'): void;
    findEndingComment(block: Block): Commment|undefined;
    updateTitle(text: String): void;
}

interface WebPageIframe {
    openPlaceholderPage(pageType: String, layoutId: String = '1'): void;
    goBack(): void;
    getEl(): HTMLIFrameElement;
}

interface Env {
    window: Window;
    document: Document;
}

interface ContextMenuLink {
    text: String;
    title: String;
    id: String;
}

interface BlockEditFormProps {
    block: Block;
    onValueChanged: (newBlockData: {[key: String]: any;}, debounceMillis: Number = 0, debounceType: 'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none' = 'debounce-none') => Promise<null>;
    autoFocus: Boolean;
}

interface InternalSivujettiApi {
    getPageTypes(): Array<PageType>;
}
