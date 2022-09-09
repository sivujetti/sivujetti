interface SivujettiFrontendApi {
    blockTypes: BlockTypes;
    webPageIframe: WebPageIframe;
    mainPanel: MainPanel;
    registerTranslationStrings(strings: {[key: String]: String}): void;
    getPageTypes(): Array<PageType>;
    getBlockRenderers(): Array<BlockRenderer>;
    getActiveTheme(): {id: String;};
    user: {
        can(doWhat: 'doAnything'|'editThemeColours'|'editThemeCss'|'createPageTypes'|'createPages'|'createReusableBranches'|'createGlobalBlockTrees'|'specializeGlobalBlocks'): Boolean;
        getRole(): Number;
    }
    editApp: {
        addBlockTree(trid: String, blocks: Array<RawBlock>): void;
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
    scrollToSection(section: 'onThisPage'|'baseStyles', behavior: 'smooth'|'auto' = 'smooth');
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
    initialData: {[key: String]: any};
    initialChildren?: Array<BlockBlueprint>;
    defaultRenderer: String,
    reRender(props: {[key: String]: any}, renderChildren: () => String): String;
    editForm: preact.ComponentConstructor;
    infoFromBackend: {associatedRenderers: Array<String>;};
    createSnapshot: (from: RawBlock) => RawBlockData;
}

interface ReusableBranch {
    id: String;
    blockBlueprints: Array<BlockBlueprint>;
}

interface BlockBlueprint {
    blockType: String;
    initialOwnData: {[key: String]: any;};
    initialDefaultsData: {title: String; renderer: String; styleClasses: String};
    initialChildren: Array<BlockBlueprint>;
}

interface RawBlock {
    id: String;
    type: String;
    isStoredTo?: 'page'|'globalBlockTree';
    isStoredToTreeId: String;
    children: Array<RawBlock>;
    // todo
    [key: String]: mixed;
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
    isPlaceholderPage: Boolean;
    [ownFieldName: String]: any; // Custom fields (PageType.ownFields)
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
        canEditThemeColours: Boolean;
        canEditThemeVars: Boolean;
        canEditThemeCss: Boolean;
        canCreatePageTypes: Boolean;
        canCreatePages: Boolean;
        canCreateReusableBranches: Boolean;
        canCreateGlobalBlockTrees: Boolean;
        canSpecializeGlobalBlocks: Boolean;
    };
    userRole: Number;
    showGoToDashboardMode?: Boolean;
    dashboardUrl?: String;
}

interface EditAwareWebPageEventHandlers {
    onHoverStarted(blockEl: HTMLElement, rect: ClientRect): void;
    onClicked(blockEl: HTMLElement|null): void;
    onHoverEnded(blockEl: HTMLElement): void;
}

interface EditAppAwareWebPage {
    data: CurrentPageData;
    scanBlockElements(): Array<HTMLElement>;
    addRootBoundingEls(lastBlock: RawBlock): void;
    setTridAttr(blockId: String, trid: String): void;
    createBlockTreeChangeListener(trid: String, blockTreeUtils: blockTreeUtils, blockToTransferable: (block: RawBlock) => {[key: String]: any;}, blockTypes: BlockTypes, getTree: (trid: String) => Array<RawBlock>, t: Object): (blockTreeState: BlockTreeReduxState) => void;
    createThemeStylesChangeListener(): (state: {themeStyles: Array<ThemeStyle>; [key: String]: any;}, eventInfo: ['themeStyles/addStyle'|'themeStyles/removeStyle'|'themeStyles/addUnitTo'|'themeStyles/removeUnitFrom', [String]|[ThemeStyle, String], Object]) => void;
    setIsMouseListenersDisabled(isDisabled: Boolean): void;
    fastOverrideStyleUnitVar(unitCls: String, varNam: String, varValue: String, valueType: 'color'): void;
    setCssVarValue(varName: String, to: RawCssValue): void;
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

type blockChangeEvent = 'init'|'update-single-value'|'undo-update-single-value'|'add-single-block'|'undo-add-single-block'|'delete-single-block'|'undo-delete-single-block'|'swap-blocks'|'undo-swap-blocks'|'commit-add-single-block'|'convert-block-to-global'|'undo-convert-block-to-global';

interface BlockEditFormProps {
    getBlockCopy(): RawBlock;
    grabChanges(withFn: (block: RawBlock, origin: blockChangeEvent, isUndo: Boolean) => void): void;
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
    tree: Array<RawBlock>;
    // [eventName, eventData, eventOrigin, preRender]
    context: [blockChangeEvent, DefaultChangeEventData|SwapChangeEventData|DeleteOrConvertChangeEventData|AddChangeEvent|{}, 'dnd-spawner'?, String?];
}

interface DefaultChangeEventData {
    blockId: String;
    blockType: String;
    trid: String;
    cloneOf?: String;
}

type SwapChangeEventData = [SwapChangeEventEntry, SwapChangeEventEntry|null];

interface SwapChangeEventEntry {
    blockToMove: RawBlock;
    blockToMoveTo: RawBlock;
    position: 'before'|'after'|'as-child';
    doRevert(): void;
}

interface DeleteOrConvertChangeEventData extends DefaultChangeEventData {
    isRootOfOfTrid: String|null;
}

interface AddChangeEvent extends DefaultChangeEventData {
    cloneOf: String|null;
}

interface DragDropEventController {
    begin(info: DragDropInfo, originIsExternal: Boolean): void;
    fromExternalDragOverFirstTime(info: DragDropInfo): Boolean;
    swap(from: DragDropInfo, to: DragDropInfo|null, originIsExternal: Boolean): void;
    dragOut(info: DragDropInfo, originIsExternal: Boolean): void;
    drop(originIsExternal: Boolean): void;
    end(): void;
}

interface BlockDragDataInfo {
    blockId: String;
    blockType: String;
    trid: String;
    globalBlockTreeId?: String;
}

interface BlockRendctor {
    html: String;
    onAfterInsertedToDom(html: String): void;
}

interface ThemeStyle {
    units: Array<ThemeStyleUnit>;
    blockTypeName: String;
}

interface ThemeStyleUnit {
    title: String;
    id: String;
    scss: String;
    generatedCss: String;
}

interface DragDropInfo {
    li: HTMLLIElement;
    pos: 'initial'|'before'|'after'|'as-child';
}
