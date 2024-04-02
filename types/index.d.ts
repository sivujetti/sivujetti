interface SivujettiFrontendApi {
    blockTypes: BlockTypesRegister;
    webPageIframe: WebPageIframe;
    mainPanel: MainPanel;
    inspectorPanel: {
        getOuterEl(): HTMLElement;
        close(): void;
    };
    saveButton: {
        getInstance(): {
            pushOp(): todo;
            pushOpGroup(): todo;
            // todo
        };
    };
    registerTranslationStrings(strings: {[key: String]: String}): void;
    getPageTypes(): Array<PageType>;
    getBlockRenderers(): Array<BlockRenderer>;
    getActiveTheme(): {id: String;};
    user: {
        can(doWhat: 'doAnything'|'editGlobalStylesVisually'|'editBlockCss'|'createPageTypes'|'createPages'|'createReusableBranches'|'createGlobalBlockTrees'|'specializeGlobalBlocks'|'editTheWebsitesBasicInfo'|'editTheWebsitesGlobalScripts'|'listUploads'): Boolean;
        getRole(): Number;
        ROLE_SUPER_ADMIN: Number;
        ROLE_ADMIN: Number;
        ROLE_ADMIN_EDITOR: Number;
        ROLE_EDITOR: Number;
        ROLE_AUTHOR: Number;
        ROLE_CONTRIBUTOR: Number;
        ROLE_FOLLOWER: Number;
    }
    events: todo;
    registerBlockTreeMutator(event: String, getMutationsFn: (event: String, theBlockTree: Array<RawBlock>, blockTreeUtils: blockTreeUtils) => Array<{blockId: String; changes: {[key: String]: any;};}>): void;
    getAvailableUpdatePackages: () => Array<String>;
}

interface OpQueueOp {
    opName: String;
    command: {
        doHandle(): Promise<false|any>;
        doUndo?: () => void;
        args: Array<any>;
    };
}

interface WebPagePreviewApp {
    getEl(): HTMLIFrameElement;
    reRenderAllBlocks(theTree: Array<RawBlock>): void;
    reRenderAllBlocks(block: RawBlock, theTree: Array<RawBlock>): void;
    updateCss(allMediaScopesCss: [String, String, String, String, String]): void;
    updateCssFast(blockId: String, mediaScopeId: mediaScope, cssPropandval: String): void;
    highlightBlock(block: RawBlock, origin: 'web-page'|'block-tree', rect: DOMRect = null): void;
    unHighlightBlock(blockId: String): void;
    highlightTextBlockChildEl(elIdx: Number, textBlockBlockId: String): void;
    unHighlightTextBlockChildEl(): void;
    scrollToBlock(block: RawBlock): Boolean;
    scrollToTextBlockChildEl(childElemIdx: Number, textBlockBlockId: String): void;
}

interface WebPageIframe {
    renderNormalPage(slug: String): Promise<EditAppAwareWebPage>;
    renderPlaceholderPage(pageTypeName: String, layoutId: String = '1', slug: String = ''): Promise<EditAppAwareWebPage>;
    goBack(): void;
    scrollToBlock(block: RawBlock): Boolean;
    scrollToTextBlockChildEl(childElemIdx: Number, textBlockBlockId: String): void;
    highlightBlock(block: RawBlock): void;
    unHighlightBlock(blockId: String): void;
    highlightTextBlockChildEl(elIdx: Number, textBlockBlockId: String);
    unHighlightTextBlockChildEl();
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

interface BlockTypesRegister {
    setup(defaultBlockTypes: Array<[String, BlockTypeDefinition]>): void;
    register(name: String, blockTypeFactory: () => BlockTypeDefinition): void;
    get(name: String): BlockTypeDefinition;
    getIconId(blockType: BlockTypeDefinition|String, fallback: String = 'box'): String
    entries(): IterableIterator<String, BlockTypeDefinition>;
}

interface RawBlockData {
    [key: String]: any;
}

/**
 * @deprecated
 */
interface BlockType {
    //
}

interface BlockTypeDefinition {
    name: String;         // Examples 'Text'
    friendlyName: String; // Examples 'Text'
    editForm: preact.Component;
    stylesEditForm: preact.Component|null;
    createOwnProps(defProps: {[key: String]: any;}): {[propName: String]: any};
    icon?: String;        // Examples 'blockquote'
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

interface BlockStub {
    id: String; // Example 'unit-12' or 'j-Type-unit-12'
    type: String; // 'Section', 'Button' etc.
    styleClasses: String; // Example 'j-Type-unit-3 j-Type-unit-12'
}

interface RawBlock extends BlockStub {
    title: String;
    renderer: String; // Example 'sivujetti:block-auto'
    __duplicatedFrom?: String; // Example 'unit-3'
    children: Array<RawBlock>;
    [typeSpecificProps: String]: any;
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

interface Theme {
    id: String; // Example '1'
}

interface CurrentPageData {
    page: Page;
    layout: {
        friendlyName: String;
        structure: Array<LayoutPart>;
    };
    theme: Theme | (Theme & {
        styles: Array<ThemeStyle>;
    });
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
    type: String;
}

interface Page extends RelPage {
    level: Number;
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
    name: String;
    langTag: String; // en_US
    description: String;
    hideFromSearchEngines: Boolean;
    versionId: String;
    headHtml: String;
    footHtml: String;
}

interface TheWebsiteBundle {
    baseUrl: String;
    assetBaseUrl: String;
    currentPageSlug: String;
    website: TheWebsite;
    pageTypes: Array<PageType>;
    activeTheme: {id: String;};
    blockRenderers: Array<BlockRenderer>;
    userPermissions: {
        canDoAnything: Boolean;
        canEditGlobalStylesVisually: Boolean;
        canEditBlockStylesVisually: Boolean;
        canEditBlockCss: Boolean;
        canCreatePageTypes: Boolean;
        canCreatePages: Boolean;
        canCreateReusableBranches: Boolean;
        canCreateGlobalBlockTrees: Boolean;
        canSpecializeGlobalBlocks: Boolean;
        canEditTheWebsitesBasicInfo: Boolean;
        canEditTheWebsitesGlobalScripts: Boolean;
        canListUploads: Boolean;
    };
    userRole: Number;
    showGoToDashboardMode?: Boolean;
    dashboardUrl?: String;
    availableUpdatePackages: Array<String>;
}

interface TheWebsiteBundle2 {
    website: TheWebsite;
    pageTypes: Array<PageType>;
    activeTheme: {id: String;};
    userPermissions: {
        canDoAnything: Boolean;
        canEditGlobalStylesVisually: Boolean;
        canEditBlockStylesVisually: Boolean;
        canEditBlockCss: Boolean;
        canCreatePageTypes: Boolean;
        canCreatePages: Boolean;
        canCreateReusableBranches: Boolean;
        canCreateGlobalBlockTrees: Boolean;
        canSpecializeGlobalBlocks: Boolean;
        canEditTheWebsitesBasicInfo: Boolean;
        canEditTheWebsitesGlobalScripts: Boolean;
        canListUploads: Boolean;
    };
    userRole: Number;
    showGoToDashboardMode?: Boolean;
    dashboardUrl?: String;
    availableUpdatePackages: Array<String>;
}

interface EnvConfig {
    baseUrl: String;
    assetBaseUrl: String;
    cacheBustStr: String;
}

interface EditAwareWebPageEventHandlers {
    onBlockHoverStarted(blockEl: HTMLElement, rect: DOMRect): void;
    onClicked(blockEl: HTMLElement|null): void;
    onBlockHoverEnded(blockEl: HTMLElement): void;
    onTextBlockChildElHoverStarted(childIdx: Number, textBlockBlockId: String): void;
    onTextBlockChildElHoverEnded(): void;
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
    fastOverrideStyleUnitVar(selector: String, varName: String, varValue: String|(() => {supportingCss: String; mediaQueryWrap: String|null; varVal: String;}), valueType: 'color'): void;
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

type blockChangeEvent = 'theBlockTree/init'|'theBlockTree/applySwap'|'theBlockTree/applyAdd(Drop)Block'|'theBlockTree/undoUpdateDefPropsOf'|'theBlockTree/deleteBlock'|'theBlockTree/addBlockOrBranch'|'theBlockTree/updatePropsOf'|'theBlockTree/updateDefPropsOf'|'theBlockTree/cloneItem';

type blockPropValueChangeFlags = 'is-throttled'|'is-group'|null;

interface BlockEditFormProps {
    getBlockCopy(): RawBlock;
    blockId: String;
    grabChanges(withFn: (block: RawBlock, origin: blockChangeEvent, isUndo: Boolean) => void): void;
    emitValueChanged(val: any, key: String, hasErrors: Boolean, debounceMillis: Number = 0, debounceType: 'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none' = 'debounce-none'): void;
    emitManyValuesChanged(partialData: {[key: String]: any;}, hasErrors: Boolean, debounceMillis: Number = 0, debounceType: 'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none' = 'debounce-none'): void;
    observeStore(namespace: String, fn: (state: Object, eventInfo: [String, Array<any>, Object]) => void): void;
    serializeTree(tree: Array<RawBlock>): String;
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
    optimizedScss?: String|null;
    optimizedGeneratedCss?: String|null;
    origin: String;
    specifier: String;
    isDerivable: Boolean;
    derivedFrom: String|null;
}

interface UnitVarInsights {
    baseValueLiteral: String; // '#00ff00ff', '1px', 'initial'
    hasBaseValue: Boolean;
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
    styles: {[blockId: String]: Array<StyleChunk>;}|null;
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

type cssValType = LengthValue|ColorValue|OptionValue;

interface CssVar {
    type: 'length'|'color'|'option';
    value: cssValType|null;
    valueLiteral: String;
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

interface StylesListProps {
    blockCopy: RawBlock;
    userCanEditVisualStyles: Boolean;
    userCanEditCss: Boolean;
    useVisualStyles: Boolean;
}

type extractedVars = [Array<CssVar>, Array<StylisAstNode>];

interface ValueInputProps<T> {
    varName: String;
    valueReal: T;
    argsCopy: Array<String>;
    data: ColorValueInputPropsData|null;
    isClearable: Boolean;
    labelTranslated: String;
    onVarValueChanged: (newValAsString: String|null) => void;
    showNotice: Boolean;
    noticeDismissedWith: (accepted: Boolean) => void;
}

interface ColorValueInputPropsData {
    selector: String;
    mediaQueryWrap: String|null;
    supportingCss?: String;
}

interface SaveButton {
    // todo

interface StyleChunk {
    scss: String;
    scope: {
        block: 'todo';
        layer: sasdsid;
        media: 'todo';
    };
}

type mediaScope = 'all'|'960'|'840'|'600'|'480'|String;

type stateChangeContext = 'initial'|'push'|'undo'|'redo';

interface StateChangeUserContext {
    event?: String;
    [otherData: String]; any;
}

interface StateHistory {
    channelName: String;
    initial: any;
    first: any|null;
    latest: any|null;
}

interface SaveButtonChannelHandler {
    handleStateChange(state: any, userCtx: StateChangeUserContext|null, context: stateChangeContext): any;
    syncToBackend(stateHistory: StateHistory, otherHistories: Array<StateHistory>): Promise<Boolean|any>;
}

interface BlockRendererProps {
    block: RawBlock;
    createDefaultProps(customClasses: String = null): {[attrName: String]: String;};
    renderChildren(): preact.ComponentChildren;
}

interface WebPagePreviewRendererAppApi {
    registerRenderer(name: String, Cls: preact.AnyComponent): void;
}
