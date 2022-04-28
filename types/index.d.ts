interface SivujettiFrontendApi {
    blockTypes: BlockTypes;
    webPageIframe: WebPageIframe;
    mainPanel: MainPanel;
    registerTranslationStrings(strings: {[key: String]: String}): void;
    getPageTypes(): Array<PageType>;
    getBlockRenderers(): Array<BlockRenderer>;
    getActiveTheme(): {id: String;};
}

interface WebPageIframe {
    openPlaceholderPage(pageTypeName: String, layoutId: String = '1');
    goBack();
    scrollTo(block: Block);
    getEl(): HTMLElement;
}

interface MainPanel {
    scrollTo(block: Block|null, behavior: 'smooth'|'auto' = 'smooth');
    getEl(): HTMLElement;
    registerSection(name: String, Cls: preact.AnyComponent): void;
    getSection(name: String): preact.AnyComponent;
    getSections(): Map<preact.AnyComponent>;
}

interface BlockTypes {
    get(name: String): BlockType|undefined;
    register(name: String, blockTypeFactory: () => BlockType): void;
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
    createSnapshot: (from: Block|RawBlock) => RawBlockData;
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
    globalBlocksStyles: Array<RawBlockStyle>;
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
    dataType: {type: 'text'|'uint', length?: Number; validationRules?: Array};
    defaultValue: String|null;
    isNullable: Boolean;
}

interface PageType {
    name: String;
    friendlyName: String;
    friendlyNamePlural: String;
    description: String;
    slug: String;
    blockFields: Array<BlockBlueprint2>;
    ownFields: Array<PageTypeField>;
    defaultFields: {
        [key: String]: {
            defaultValue: String;
        };
    };
    defaultLayoutId: String;
    status: Number;
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
    blockStyles: Array<RawBlockStyle>;
    isPlaceholderPage: Boolean;
    [ownFieldName: String]: any; // Custom fields (PageType.ownFields)
}

interface RawBlockStyle {
    blockId: String;
    styles: String;
}

interface RawGlobalBlockTreeBlocksStyles {
    globalBlockTreeId: String;
    styles: Array<RawBlockStyle>;
}

interface RawBlockTypeBaseStyles {
    blockTypeName: String;
    styles: String;
}

interface PageMetaRaw {
    title: String;
    slug: String;
    path: String;
    meta: {description?: String;};
    [key: String]: any; // Own fields
}

interface BlockRenderer {
    fileId: String;
    friendlyName: String|null;
    associatedWith: String|null;
}

interface TheWebsite {
    baseUrl: String;
    assetBaseUrl: String;
    pageTypes: Array<PageType>;
    activeTheme: {id: String;};
    blockRenderers: Array<BlockRenderer>;
}

interface EditAwareWebPageEventHandlers {
    onHoverStarted(blockRef: BlockRefComment, rect: ClientRect): void;
    onClicked(blockRef: BlockRefComment|null): void;
    onHoverEnded(blockRef: BlockRefComment): void;
}

interface EditAppAwareWebPage {
    data: CurrentPageData;
    scanBlockRefComments(): Array<BlockRefComment>;
    registerEventHandlers(handlers: EditAwareWebPageEventHandlers, blockRefComments: Array<BlockRefComment>): void;
    getCombinedAndOrderedBlockTree(pageBlocks: Array<RawBlock>, blockRefComments: Array<BlockRefComment>, blockTreeUtils: blockTreeUtils): Array<RawBlock>;
    appendBlockToDom(block: Block, after: Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}): Promise<BlockRefComment>;
    appendClonedBlockBranchToDom(clonedBlock: Block, clonedFromBlock: Block, blockTreeUtils: blockTreeUtils): Promise<{[key: String]: BlockRefComment;}>;
    restoreBlockToDom(originalDomNodes: Array<HTMLElement>, after: Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}): Promise<void>;
    replaceBlockFromDomWith(currentBlock: Block, replacement: Block): Promise<BlockRefComment|{[blockId: String]: BlockRefComment;}>;
    deleteBlockFromDom(block: Block, doKeepBoundaryComments: Boolean = false): [Array, Array];
    reRenderBlockInPlace(block: Block): Promise<null>;
    reOrderBlocksInDom(blockToMove: Block, blockToMoveTo: Block, position: 'before'|'after'|'as-child'): void;
    convertToGlobal(globalBlockReference: Block, blockToConvert: Block): BlockRefComment;
    findEndingComment(block: Block): Commment|undefined;
    updateTitle(text: String): void;
    registerBlockMouseListeners(blockRef: BlockRefComment, nextEl: HTMLElement = null): void;
    setIsMouseListenersDisabled(isDisabled: Boolean): void;
    getBlockContents(block: Block, doIncludeBoundaryComments: Boolean = true): Array<HTMLElement>;
    setCssVarValue(varName: String, to: RawCssValue): void;
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
    blockTree: preact.Component; // BlockTree
    onValueChanged: (newValue: any, key: String, hasErrors: Boolean = false, debounceMillis: Number = 0, debounceType: 'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none' = 'debounce-none') => Promise<null>;
    onManyValuesChanged: (newValues: Object, hasErrors: Boolean = false, debounceMillis: Number = 0, debounceType: 'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none' = 'debounce-none') => Promise<null>;
    funcsOut: {resetValues?: (newSnapshot: RawBlockData) => void;};
}

interface UploadsEntry {
    baseDir: String;
    createdAt: Number;
    fileName: String;
    friendlyName: String;
    mime: String;
}

interface TranspileArgs {
    selectedLang: String;
}

interface RawCssRule {
    name: String;
    friendlyName: String;
    value: RawCscValue;
}

interface RawCssValue {
    type: 'color';
    value: [String, String, String, String];
}

interface FloatingDialog {
    open(Renderer: preact.ComponentType|string, settings: FloatingDialogSettingsInput & {[key: String]: any;}, rendererProps: Object): void;
    close(): void;
}

interface FloatingDialogSettingsInput {
    title: String;
    width?: Number;
    height?: Number;
}
