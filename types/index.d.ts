interface SivujettiFrontendApi {
    blockTypes: BlockTypes;
}

interface BlockTypes {
    get(name: String): BlockType|undefined;
    register(name: String, blockType: BlockType): void;
    entries(): IterableIterator<String, BlockType>;
}

interface RawBlockData {
    [key: String]: any;
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
    createSnapshot?: () => RawBlockData;
}

interface Block {
    id: String;
    type: 'Columns'|'Heading'|'Paragraph'|'Section'|String;
    _cref: BlockRefComment;
    toHtml(): String;
    overwritePropsData(newPropsData: {[key: String]: any;}): void;
    static fromObject(data: RawBlock|Object): Block;
    static fromType(blockType: BlockType|String, data?: Object, id?: String, globalBlockTreeId?: String|null): Block;
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
    isStoredTo?: 'page'|'globalBlockTree';
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

interface RawGlobalBlockTree {
    id: String;
    name: String;
    blocks: Array<RawBlock>;
}

interface Layout {
    id: String;
    friendlyName: String;
}

interface CurrentPageData {
    page: Page;
    layout: {
        friendlyName: String;
        structure: Array<LayoutPart>;
    };
}

interface LayoutPart {
    type: 'globalBlockTree'|'pageContents';
    globalBlockTreeId?: String;
}

interface BlockBlueprint2 {
    type: String;
    title: String;
    defaultRenderer: String;
    initialData: {[key: String]: String;};
    children: Array<BlockBlueprint2>;
}

interface PageTypeField {
    name: String;
    friendlyName: String;
    dataType: 'text'|'uint';
    defaultValue: String|null;
}

interface PageType {
    name: String;
    slug: String;
    ownFields: Array<PageTypeField>;
    blockFields: Array<BlockBlueprint2>;
    defaultFields: {
        [key: String]: {
            defaultValue: String;
        };
    };
    defaultLayoutId: String;
    isListable: Boolean;
}

interface Page {
    id: String;
    slug: String;
    path: String;
    level: Number;
    type: String;
    title: String;
    layoutId: String;
    status: Number;
    blocks: Array<RawBlock>;
    isPlaceholderPage: Boolean;
    [ownFieldName: String]: any; // Custom fields (PageType.ownFields)
}

interface PageMetaRaw {
    title: String;
    slug: String;
    [key: String]: any; // Own fields
}

interface TheWebsite {
    baseUrl: String;
    assetBaseUrl: String;
    pageTypes: Array<PageType>;
}

interface EditAwareWebPageEventHandlers {
    onHoverStarted(blockRef: BlockRefComment, rect: ClientRect): void;
    onClicked(blockRef: BlockRefComment): void;
    onHoverEnded(blockRef: BlockRefComment): void;
}

interface EditAppAwareWebPage {
    data: CurrentPageData;
    scanBlockRefComments(): Array<BlockRefComment>;
    registerEventHandlers(handlers: EditAwareWebPageEventHandlers, blockRefComments: Array<BlockRefComment>): void;
    getCombinedAndOrderedBlockTree(pageBlocks: Array<RawBlock>, blockRefComments: Array<BlockRefComment>, blockTreeUtils: blockTreeUtils): Array<RawBlock>;
    appendBlockToDom(block: Block, after: Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}): Promise<BlockRefComment>;
    appendClonedBlockBranchToDom(clonedBlock: Block, clonedFromBlock: Block, blockTreeUtils: blockTreeUtils): Promise<{[key: String]: BlockRefComment;}>;
    replaceBlockFromDomWith(currentBlock: Block, replacement: Block): Promise<BlockRefComment|{[blockId: String]: BlockRefComment;}>;
    deleteBlockFromDom(block: Block, doKeepBoundaryComments: Boolean = false): [Array, Array];
    reRenderBlockInPlace(block: Block): Promise<null>;
    reOrderBlocksInDom(blockToMove: Block, blockToMoveTo: Block, position: 'before'|'after'|'as-child'): void;
    convertToGlobal(globalBlockReference: Block, blockToConvert: Block): BlockRefComment;
    findEndingComment(block: Block): Commment|undefined;
    updateTitle(text: String): void;
    registerBlockMouseListeners(blockRef: BlockRefComment, nextEl: HTMLElement = null): void;
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
}

interface BlockEditFormProps2 {
    block: Block;
    funcsIn: {onValueChanged: (newValue: any, key: String, hasErrors: Boolean = false) => Promise<null>;};
    funcsOut: {resetValues?: (newSnapshot: {[key: String]: any;}) => void;};
}

interface InternalSivujettiApi {
    getPageTypes(): Array<PageType>;
}

interface UploadsEntry {
    baseDir: String;
    createdAt: Number;
    fileName: String;
    friendlyName: String;
    mime: String;
}
