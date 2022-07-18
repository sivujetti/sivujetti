interface SivujettiFrontendApi {
    blockTypes: BlockTypes;
    webPageIframe: WebPageIframe;
    mainPanel: MainPanel;
    registerTranslationStrings(strings: {[key: String]: String}): void;
    getPageTypes(): Array<PageType>;
    getBlockRenderers(): Array<BlockRenderer>;
    getActiveTheme(): {id: String;};
    user: {
        can(doWhat: 'doAnything'|'editCssStyles'|'editThemeStyles'|'createPageTypes'|'createPages'|'specializeGlobalBlocks'): Boolean;
    }
    editApp: {
        addBlockTree(trid: String, blocks: Array<RawBlock2>): void;
        registerWebPageDomUpdaterForBlockTree(trid: String): void;
        unRegisterWebPageDomUpdaterForBlockTree(trid: String): void;
        removeBlockTree(trid: String): void;
    };
}

interface WebPageIframe {
    openPlaceholderPage(pageTypeName: String, layoutId: String = '1'): void;
    goBack(): void;
    scrollTo(block: Block);
    getEl(): HTMLIFrameElement;
}

interface MainPanel {
    scrollTo(block: Block, isNew: Boolean = false, behavior: 'smooth'|'auto' = 'smooth');
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
    isStoredTo?: 'page'|'globalBlockTree';
    isStoredToTreeId: String;
    [key: String]: mixed;
}

interface RawBlock2 {
    id: String;
    type: String;
    isStoredTo?: 'page'|'globalBlockTree';
    isStoredToTreeId: String;
    children: Array<RawBlock>;
    // todo
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
    dataType: {type: 'text'|'json'|'int'|'uint'; isNullable: Boolean; length?: Number; validationRules?: Array; canBeEditedBy?: Number;};
    defaultValue: String|null;
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
    userPermissions: {
        canDoAnything: Boolean;
        canEditCssStyles: Boolean;
        canEditThemeStyles: Boolean;
        canCreatePageTypes: Boolean;
        canCreatePages: Boolean;
        canCreateGlobalBlockTrees: Boolean;
        canSpecializeGlobalBlocks: Boolean;
    };
    showGoToDashboardMode?: Boolean;
    dashboardUrl?: String;
}

interface EditAwareWebPageEventHandlers {
    onHoverStarted(blockRef: BlockRefComment, rect: ClientRect): void;
    onClicked(blockRef: BlockRefComment|null): void;
    onHoverEnded(blockRef: BlockRefComment): void;
}

interface EditAwareWebPageEventHandlers2 {
    onHoverStarted(blockEl: HTMLElement, rect: ClientRect): void;
    onClicked(blockEl: HTMLElement|null): void;
    onHoverEnded(blockEl: HTMLElement): void;
}

interface EditAppAwareWebPage {
    data: CurrentPageData;
    scanBlockRefComments(): Array<BlockRefComment>;
    scanBlockElements(): Array<HTMLElement>;
    registerEventHandlers(handlers: EditAwareWebPageEventHandlers, blockRefComments: Array<BlockRefComment>): void;
    registerEventHandlers2(handlers: EditAwareWebPageEventHandlers2): void;
    addRootBoundingEls(lastBlock: RawBlock2): void;
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
    setTridAttr(blockId: String, trid: String): void;
}

interface EditAppAwareWebPage2 {
    scanBlockRefComments(): Array<BlockRefComment>;
    scanBlockElements(): Array<HTMLElement>;
    registerEventHandlers(handlers: EditAwareWebPageEventHandlers, blockRefComments: Array<BlockRefComment>): void;
    registerEventHandlers2(handlers: EditAwareWebPageEventHandlers2): void;
    addRootBoundingEls(lastBlock: RawBlock2): void;
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
    setTridAttr(blockId: String, trid: String): void;
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

type blockChangeEvent = 'init'|'update-single-value'|'undo-update-single-value'|'add-single-block'|'undo-add-single-block'|'delete-single-block'|'undo-delete-single-block'|'swap-blocks'|'undo-swap-blocks'|'commit-add-single-block'|'convert-block-to-global'|'undo-convert-block-to-global';

interface BlockEditFormProps2 {
    getBlockCopy(): RawBlock2;
    grabChanges(withFn: (block: RawBlock2, origin: blockChangeEvent, isUndo: Boolean) => void): void;
    emitValueChanged(val: any, key: String, hasErrors: Boolean, debounceMillis: Number = 0, debounceType: 'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none' = 'debounce-none'): void;
    emitManyValuesChanged(partialData: {[key: String]: any;}, hasErrors: Boolean, debounceMillis: Number = 0, debounceType: 'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none' = 'debounce-none'): void;
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
    setTitle(title: String): void;
    setOnBeforeClose(fn: () => void): void;
    setHeight(height: Number, instructions: 'animate'|'' = ''): void;
}

interface FloatingDialogSettingsInput {
    title: String;
    width?: Number;
    height?: Number;
}

interface BlockTreeItemState {
    isSelected: Boolean;
    isCollapsed: Boolean;
    isNew: Boolean;
}

interface BlockTreeReduxState {
    tree: Array<RawBlock2>;
    // [eventName, eventData, eventOrigin, preRender]
    context: [blockChangeEvent, DefaultChangeEventData|SwapChangeEventData|DeleteOrConvertChangeEventData|AddChangeEvent|{}, 'dnd-spawner'?, String?];
}

interface DefaultChangeEventData {
    blockId: String;
    blockType: String;
    trid: String;
    cloneOf?: String;
}

interface SwapChangeEventData {
    dragBlock: RawBlock2;
    dropBlock: RawBlock2;
    position: 'before'|'after'|'as-child';
    doRevert(): void;
}

interface DeleteOrConvertChangeEventData extends DefaultChangeEventData {
    isRootOfOfTrid: String|null;
}

interface AddChangeEvent extends DefaultChangeEventData {
    cloneOf: String|null;
}

interface DragEventReceiver {
    draggedOverFirstTime(block: RawBlock2): {blockId: String; trid: String;}|null;
    swappedBlocks(mutationInfos: [SwapChangeEventData, SwapChangeEventData|null]): void;
    dropped(): void;
}

interface BlockRendctor {
    html: String;
    onAfterInsertedToDom(html: String): void;
}
