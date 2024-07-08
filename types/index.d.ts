interface SivujettiFrontendApi {
    getPageTypes(): Array<PageType>;
    getBlockRenderers(): Array<BlockRenderer>;
    getAvailableUpdatePackages(): () => Array<String>;
    menuPanel: MenuPanel;
    blockTypes: BlockTypesRegister;
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
    };
    registerTranslationStrings(strings: {[key: String]: String}): void;
    webPagePreview: WebPagePreviewApp;
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
    updateCss(/*allMediaScopesCss*/): todo;
    updateCssFast(/*blockId, css, mediaScopeId = 'all'*/): todo;
    highlightBlock(block: Block): todo;
    unHighlightBlock(blockId: String): todo;
    unHighlightTextBlockChildEl(): todo;
    scrollToBlock(block: Block): todo;
    highlightTextBlockChildEl(elIdx: Number, textBlockBlockId: String): todo;
    onReady(/*fn*/): todo;
}

type mainPanelSectionName = 'onThisPage'|'baseStyles';

interface MenuPanel {
    scrollTo(blockId: String, behavior: 'smooth'|'auto' = 'smooth');
    scrollToSection(name: mainPanelSectionName, behavior: 'smooth'|'auto' = 'smooth');
    getOuterEl(): HTMLElement;
    setSectionCmp(name: mainPanelSectionName, cmp: preact.Component);
    getSectionCmp(name: mainPanelSectionName): preact.Component|null;
    getSectionEl(name: mainPanelSectionName): HTMLElement;
    registerSection(name: String, Cls: preact.AnyComponent): void;
    getSection(name: String, doThrowIfNotFound: Boolean = false): preact.AnyComponent;
    getSections(): Map<preact.AnyComponent>;
}

interface BlockTypesRegister {
    setup(defaultBlockTypes: Array<[String, BlockTypeDefinition]>): void;
    register(name: String, blockTypeFactory: () => BlockTypeDefinition): void;
    get(name: String): BlockTypeDefinition;
    getIconId(blockType: BlockTypeDefinition|String, fallback: String = 'box'): String;
    entries(): IterableIterator<String, BlockTypeDefinition>;
}

interface BlockData {
    [key: String]: any;
}

/**
 * @deprecated
 */
interface BlockType {
    //
}

type editFormType = 'content'|'content+user-styles';

interface BlockTypeDefinition {
    name: String;         // Examples 'Text'
    friendlyName: String; // Examples 'Text'
    editForm: preact.Component;
    editFormType?: editFormType;
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
    initialDefaultsData: {
        title: String;
        renderer: String;
        styleClasses: String;
        styleGroup: String;
    };
    initialStyles: Array<StyleChunk>;
    initialChildren: Array<BlockBlueprint>;
}

interface BlockStub {
    id: String; // Example 'unit-12' or 'j-Type-unit-12'
    type: String; // 'Section', 'Button' etc.
    styleClasses: String; // Example 'j-Type-unit-3 j-Type-unit-12'
    styleGroup: String; // Example 'ubGrFbpaKF7'
}

interface Block extends BlockStub {
    title: String;
    renderer: String; // Example 'sivujetti:block-auto'
    children: Array<Block>;
    [typeSpecificProps: String]: any;
}

interface GlobalBlockTree {
    id: String;
    name: String;
    blocks: Array<Block>;
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
    initialPageBlocksStyles: Array<StyleChunk>;
    layout: {
        friendlyName: String;
        structure: Array<LayoutPart>;
    };
    theme: Theme | (Theme & {
        styles: StylesBundle;
    });
}

interface StylesBundle {
    styleChunks: Array<StyleChunk>;
    cachedCompiledScreenSizesCss: compiledMediaScopesCss;
    cachedCompiledScreenSizesCssHashes?: Array<string>;
}

interface StylesBundleWithId extends StylesBundle {
    id: Number;
}

interface LayoutPart {
    type: 'globalBlockTree'|'pageContents';
    globalBlockTreeId?: String;
}

interface PageTypeField {
    name: String;
    friendlyName: String;
    dataType: {
        type: 'text'|'json'|'int'|'uint';
        isNullable: Boolean;
        length?: Number;
        validationRules?: Array;
        canBeEditedBy?: Number;
        rel?: String;
    };
    defaultValue: String|Array|Object|null;
}

interface PageTypeStub {
    name: String;
    friendlyName: String;
    friendlyNamePlural: String;
    description: String;
    slug: String;
    defaultLayoutId: String;
    status: Number;
    isListable: Boolean;
}

interface PageType extends PageTypeStub {
    initialBlocks: Array<BlockBlueprint>;
    ownFields: Array<PageTypeField>;
    defaultFields: {
        [key: String]: {
            defaultValue: String;
        };
    };
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

interface Env {
    window: Window;
    document: Document;
}

interface ContextMenuController {
    getLinks(): Array<ContextMenuLink>;
    onItemClicked(item: ContextMenuLink): void;
    onMenuClosed(): void;
    placement?: 'right';
}

interface ContextMenuLink {
    text: String;
    title: String;
    id: String;
}

type blockChangeEvent = 'theBlockTree/init'|'theBlockTree/applySwap'|'theBlockTree/applyAdd(Drop)Block'|'theBlockTree/undoUpdateDefPropsOf'|'theBlockTree/addBlockOrBranch'|'theBlockTree/updatePropsOf'|'theBlockTree/updateDefPropsOf';

type blockPropValueChangeFlags = 'is-throttled'|'is-group'|'is-initial'|null;

interface BlockEditFormProps {
    block: Block;
    lastBlockTreeChangeEventInfo: {
        ctx: stateChangeContext;
        flags: blockPropValueChangeFlags;
        isUndoOrRedo: Boolean;
    };
    emitValueChanged(val: any, key: String, ...varargs): void;
    emitValueChangedThrottled(val: any, key: String, hasErrors: Boolean = false, source: 'default'|'undo'|null = null): void;
    emitManyValuesChanged(changes: {[key: String]: any;}, hasErrors: Boolean = false, flags: blockPropValueChangeFlags = null);
    stylesStateId?: Number;
}

interface BlockStylesEditFormProps {
    blockId: String;
    blockStyleGroup: String;
    stateId: Number;
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
    bundles: Array<String>;
}

interface CssRule {
    name: String;
    friendlyName: String;
    value: CscValue;
}

interface CssValue {
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
    block: Block;
    isReusable: Boolean|null;
    styles?: Array<StyleChunk>;
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

interface ColorValue {
    data: String;
    type: 'hexa';
}

interface ImageValue {
    src: String;
}

interface LengthValue {
    num: String;
    unit: 'rem'|'px';
}

interface OptionValue {
    selected: any|null;
}

interface TheBlockTreeReducerContext {
    clone: Array<Block>;
    reRenderThese: Array<String>;
}

interface StylisAstNode {
    children: String|Array<StylisAstNode>;
    value: String;
    line: Number;
    column: Number;
    [more: String]: any;
}

interface StylisAstInspector {
    findNodeByDeclName(declName: String): StylisAstNode|null;
    findNodeByDeclNameFromScope(declName: String, scope: String): StylisAstNode|null;
    findNode(fn: (node: StylisAstNode, parentNode: StylisAstNode) => any): StylisAstNode|null;
    getAst(): Array<StylisAstNode>;
}

interface StylesListProps {
    blockCopy: Block;
    userCanEditVisualStyles: Boolean;
    userCanEditCss: Boolean;
    useVisualStyles: Boolean;
}

type extractedVars = [Array<CssVar>, Array<StylisAstNode>];

interface ValueInputProps<T> {
    value: T;
    labelTranslated: String;
    onValueChanged: (newValAsString: String|null) => void;
    isClearable?: Boolean;
    inputId?: String;
    showNotice?: Boolean;
    noticeDismissedWith?: (accepted: Boolean) => void;
    additionalUnits?: Array<String>; // Example: ['fr']
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
        kind: styleScopeKind;
        media: mediaScope;
        layer: stylesLayer;
    };
}

interface CssVarsMap {
    [varName: String]: String;
}

type stylesLayer = 'user-styles'|'dev-styles'|'base-styles';

type mediaScope = 'all'|'960'|'840'|'600'|'480'|String;

type compiledMediaScopesCss = [String, String, String, String, String];

type styleScopeKind = 'single-block'|'custom-class'|'optimized-class'|'base';

type stateChangeContext = 'initial'|'push'|'undo'|'redo';

interface StateChangeUserContext {
    event?: String;
    [otherData: String]; any;
}

interface StateHistory<T = any> {
    channelName: String;
    initial: T;
    first: T|null;
    latest: T|null;
}

interface SaveButtonChannelHandler<T = any> {
    handleStateChange(state: T, userCtx: StateChangeUserContext|null, context: stateChangeContext): void;
    syncToBackend(stateHistory: StateHistory<T>, otherHistories: Array<StateHistory>): Promise<Boolean|any>;
}

interface BlockRendererProps {
    block: Block;
    createDefaultProps(customClasses: String = null): {[attrName: String]: String;};
    renderChildren(): preact.ComponentChildren;
}

interface WebPagePreviewRendererAppApi {
    registerRenderer(name: String, Cls: preact.AnyComponent): void;
}

interface VisualStylesFormVarDefinition {
    varName: String;             // Example 'textAlign'
    cssProp: String;             // Example 'text-align'
    cssSubSelector: String|null; // Example '>img'
    widgetSettings: VisualStylesFormVarDefinitionWidgetSettings & {[possibleExtras: String]: any;};
}

interface VisualStylesFormVarDefinitionWidgetSettings {
    valueType?: String;          // 'color'|'option' etc.
    renderer?: preact.Component; // ColorValueInput|OptionValueInput etc.
    label: String;               // Example 'Text align'
    inputId: String;             // Example 'textTextAlign'
    defaultThemeValue?:          // Example {num: '6', unit: 'rem'}
        ColorValue |
        ImageValue |
        LengthValue |
        OptionValue |
        String;
}

type scssCodeInput = String|Array<String>;

type translateVarInputToScssCodeTemplateFn = (varName: String, value: String, valueNorm: String) => scssCodeInput;
