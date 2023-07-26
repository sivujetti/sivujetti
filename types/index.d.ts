interface SivujettiFrontendApi {
    blockTypes: BlockTypes;
    webPageIframe: WebPageIframe;
    mainPanel: MainPanel;
    inspectorPanel: {getEl(): HTMLElement;};
    registerTranslationStrings(strings: {[key: String]: String}): void;
    getPageTypes(): Array<PageType>;
    getBlockRenderers(): Array<BlockRenderer>;
    getActiveTheme(): {id: String;};
    user: {
        can(doWhat: 'doAnything'|'editThemeColours'|'editThemeCss'|'createPageTypes'|'createPages'|'createReusableBranches'|'createGlobalBlockTrees'|'specializeGlobalBlocks'|'editTheWebsitesBasicInfo'|'listUploads'): Boolean;
        getRole(): Number;
        ROLE_SUPER_ADMIN: Number;
        ROLE_ADMIN: Number;
        ROLE_ADMIN_EDITOR: Number;
        ROLE_EDITOR: Number;
        ROLE_AUTHOR: Number;
        ROLE_CONTRIBUTOR: Number;
        ROLE_FOLLOWER: Number;
    }
    saveButton: {
        triggerUndo(): void;
        setOnBeforeProcessQueueFn(fn: (queue: Array<OpQueueOp>) => Array<OpQueueOp>): void;
        setOnBeforeProcessQueueFn(fn: null): void;
    };
    events: todo;
    registerBlockTreeMutator(event: String, getMutationsFn: (event: String, theBlockTree: Array<RawBlock>, blockTreeUtils: blockTreeUtils) => Array<{blockId: String; changes: {[key: String]: any;};}>): a; 
    blockStyles: {
        registerDefaultVars(blockTypeName: String, getVars: (varNameToLabel: (varName: String) => String) => Array<CssVar & {wrap: String;}>): void;
        getDefaultVars(blockTypeName: String): Array<CssVar & {wrap: String;}>;
    };
}

interface OpQueueOp {
    opName: String;
    command: {
        doHandle(): Promise<false|any>;
        doUndo?: () => void;
        args: Array<any>;
    };
}

interface WebPageIframe {
    renderNormalPage(slug: String): Promise<EditAppAwareWebPage>;
    renderPlaceholderPage(pageTypeName: String, layoutId: String = '1', slug: String = ''): Promise<EditAppAwareWebPage>;
    goBack(): void;
    scrollTo(block: RawBlock): Boolean;
    highlight(block: RawBlock): void;
    unHighlight(blockId: String): void;
    getEl(): HTMLIFrameElement;
    registerWebPageDomUpdaterForBlockTree(trid: String): void;
    unRegisterWebPageDomUpdaterForBlockTree(trid: String): void;
}

type mainPanelSectionElName = 'onThisPage'|'baseStyles';

interface MainPanel {
    scrollTo(blockId: String, behavior: 'smooth'|'auto' = 'smooth');
    scrollToSection(name: mainPanelSectionElName, behavior: 'smooth'|'auto' = 'smooth');
    getEl(): HTMLElement;
    getSectionEl(name: mainPanelSectionElName): HTMLElement;
    registerSection(name: String, Cls: preact.AnyComponent): void;
    getSection(name: String, doThrowIfNotFound: Boolean = false): preact.AnyComponent;
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
    ownPropNames?: Array<String>;
    initialData: {[key: String]: any}|(() => {[key: String]: any});
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
    theme: {
        id: String; // Example '1'
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

interface RelPage {
    id: String;
    title: String;
    slug: String;
    path: String;
}

interface Page extends RelPage {
    level: Number;
    type: String;
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

interface TheWebsiteBasicInfo {
    name: String;
    langTag: String; // en_US
    description: String;
    hideFromSearchEngines: Boolean;
    versionId: String;
}

interface TheWebsiteBundle {
    baseUrl: String;
    assetBaseUrl: String;
    website: TheWebsiteBasicInfo;
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
        canEditTheWebsitesBasicInfo: Boolean;
        canListUploads: Boolean;
    };
    userRole: Number;
    showGoToDashboardMode?: Boolean;
    dashboardUrl?: String;
}

interface EditAwareWebPageEventHandlers {
    onHoverStarted(blockEl: HTMLElement, rect: DOMRect): void;
    onClicked(blockEl: HTMLElement|null): void;
    onHoverEnded(blockEl: HTMLElement): void;
}

interface EditAppAwareWebPage {
    data: CurrentPageData;
    reRenderer: WebPageReRenderer;
    metaKeyIsPressed: Boolean;
    init(renderBlockAndThen: (block: RawBlock, then: (result: BlockRendctor) => void, shouldBackendRender: Boolean = false) => void, toTransferable: (block: RawBlock, includePrivates: Boolean = false) => {[key: String]: any;}, blockTreeUtils: blockTreeUtils): void;
    scanBlockElements(): Array<HTMLElement>;
    addRootBoundingEls(lastBlock: RawBlock): void;
    createThemeStylesChangeListener(): (state: {themeStyles: Array<ThemeStyle>; [key: String]: any;}, eventInfo: ['themeStyles/addStyle'|'themeStyles/removeStyle'|'themeStyles/addUnitTo'|'themeStyles/removeUnitFrom', [String]|[ThemeStyle, String], Object]) => void;
    getGlobalListenerCreateCallables(): Array<[String, (...args: any) => void]>;
    setIsMouseListenersDisabled(isDisabled: Boolean): void;
    fastOverrideStyleUnitVar(selector: String, varName: String, varValue: String|(() => String), valueType: 'color'): void;
    setCssVarValue(varName: String, to: RawCssValue): void;
    getBlockEl(blockId: String): HTMLElement|null;
    setOnReRenderOrUpdateStyles(fn: () => void): void;
}

interface WebPageReRenderer {
    new(_renderBlockAndThen: (block: RawBlock, then: (result: BlockRendctor) => void, shouldBackendRender: Boolean = false) => void, _toTransferable: (block: RawBlock, includePrivates: Boolean = false) => {[key: String]: any;}, _blockTreeUtils: blockTreeUtils): WebPageReRenderer;
    createBlockTreeChangeListeners(): {fast: (event: blockChangeEvent, data: Array<any>) => void; slow: (blockId: String) => void;};
    setOnReRender(fn: () => void): void;
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

type blockChangeEvent = 'theBlockTree/init'|'theBlockTree/swap'|'theBlockTree/applySwap'|'theBlockTree/applyAdd(Drop)Block'|'theBlockTree/undo'|'theBlockTree/undoUpdateDefPropsOf'|'theBlockTree/deleteBlock'|'theBlockTree/addBlockOrBranch'|'theBlockTree/undoAdd(Drop)Block'|'theBlockTree/updatePropsOf'|'theBlockTree/updateDefPropsOf'|'theBlockTree/cloneItem'|'theBlockTree/convertToGbt';

interface BlockEditFormProps {
    getBlockCopy(): RawBlock;
    grabChanges(withFn: (block: RawBlock, origin: blockChangeEvent, isUndo: Boolean) => void): void;
    emitValueChanged(val: any, key: String, hasErrors: Boolean, debounceMillis: Number = 0, debounceType: 'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none' = 'debounce-none'): void;
    emitManyValuesChanged(partialData: {[key: String]: any;}, hasErrors: Boolean, debounceMillis: Number = 0, debounceType: 'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none' = 'debounce-none'): void;
}

interface UploadsEntry {
    fileName: String;
    baseDir: String;
    mime: String;
    friendlyName: String;
    createdAt: Number;
    updatedAt: Number;
    ext?: String;
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
    isHidden: Boolean;
    isNew: Boolean;
}

interface DragDropEventController {
    begin(info: DragDropInfo): Boolean;
    swap(info: DragDropInfo, infoPrev: DragDropInfo, startLi: HTMLLIElement|null): Boolean|undefined;
    dragOut(info: DragDropInfo): void;
    drop(info: DragDropInfo, startLi: HTMLLIElement|null): void;
    end(lastAcceptedSwapIdx: Number|null): void;
    setExternalOriginData(data: Object|null): void;
}

interface DragDropInfo {
    li: HTMLLIElement;
    pos: 'initial'|dropPosition;
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
    origin: String;
    specifier: String;
    isDerivable: Boolean;
    derivedFrom: String|null;
}

type leftPanelName = 'Default'|'CreatePage'|'CreatePageType';

interface BlockDescriptor {
    blockId: String;
    isStoredToTreeId: String;
    isGbtRef: Boolean;
    data: {refTreesRootBlockId: String; refTreeId: String;}|null; // If isGbtRef === true
}

interface SpawnDescriptor {
    block: RawBlock;
    isReusable: Boolean|null;
}

interface PartialMenuLink {
    text: String;
    slug: String;
    [key: String]: any;
}

interface Path {
    pathname: String;
    search: String;
    hash: String;
}

type dropPosition = 'before'|'after'|'as-child';

type treeTransferType = 'none'|'out-of-gbt'|'into-gbt';

type urlMode = 'pick-url'|'pick-file'|'type-external-url';

interface CssVar {
    type: 'length'|'color'|'option';
    value: LengthValue|ColorValue|OptionValue|null;
    varName: String;
    label: String;
    args: String[];
    __idx: Number;
}

interface LengthValue {
    num: String;
    unit: 'rem'|'px';
}

interface ColorValue {
    data: String;
    type: 'hexa';
}

interface OptionValue {
    selected: any;
}

interface TheBlockTreeReducerContext {
    clone: Array<RawBlock>;
    reRenderThese: Array<String>;
}

interface StylisAstNode {
    children: String|Array<StylisAstNode>;
    value: String;
    line: Number;
    column: Number;
    [more: String]: any;
}

type extractedVars = [Array<CssVar>, Array<StylisAstNode>];
