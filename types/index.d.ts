interface SivujettiFrontendApi {
    getPageTypes(): Array<PageType>;
    getBlockRenderers(): Array<BlockRenderer>;
    getAvailableUpdatePackages(): () => Array<string>;
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
        can(doWhat: 'doAnything'|'editGlobalStylesVisually'|'editBlockCss'|'createPageTypes'|'createPages'|'createReusableBranches'|'createGlobalBlockTrees'|'specializeGlobalBlocks'|'editTheWebsitesBasicInfo'|'editTheWebsitesGlobalScripts'|'listUploads'): boolean;
        getRole(): number;
        ROLE_SUPER_ADMIN: number;
        ROLE_ADMIN: number;
        ROLE_ADMIN_EDITOR: number;
        ROLE_EDITOR: number;
        ROLE_AUTHOR: number;
        ROLE_CONTRIBUTOR: number;
        ROLE_FOLLOWER: number;
    };
    registerTranslationStrings(strings: {[key: string]: string}): void;
    webPagePreview: WebPagePreviewApp;
}

interface OpQueueOp {
    opName: string;
    command: {
        doHandle(): Promise<false|any>;
        doUndo?: () => void;
        args: Array<any>;
    };
}

interface WebPagePreviewApp {
    getEl(): HTMLIFrameElement;
    updateCss(/*compiledCss*/): todo;
    updateCssFast(/*blockId, css*/): todo;
    highlightBlock(block: Block): todo;
    unHighlightBlock(blockId: string): todo;
    unHighlightTextBlockChildEl(): todo;
    scrollToBlock(block: Block): todo;
    highlightTextBlockChildEl(elIdx: number, textBlockBlockId: string): todo;
    onReady(/*fn*/): todo;
}

type mainPanelSectionName = 'onThisPage'|'baseStyles';

interface MenuPanel {
    scrollTo(blockId: string, behavior: 'smooth'|'auto' = 'smooth');
    scrollToSection(name: mainPanelSectionName, behavior: 'smooth'|'auto' = 'smooth');
    getOuterEl(): HTMLElement;
    setSectionCmp(name: mainPanelSectionName, cmp: preact.Component);
    getSectionCmp(name: mainPanelSectionName): preact.Component|null;
    getSectionEl(name: mainPanelSectionName): HTMLElement;
    registerSection(name: string, Cls: preact.AnyComponent): void;
    getSection(name: string, doThrowIfNotFound: boolean = false): preact.AnyComponent;
    getSections(): Map<preact.AnyComponent>;
}

interface BlockTypesRegister {
    setup(defaultBlockTypes: Array<[string, BlockTypeDefinition]>): void;
    register(name: string, blockTypeFactory: () => BlockTypeDefinition): void;
    get(name: string): BlockTypeDefinition;
    getIconId(blockType: BlockTypeDefinition|string, fallback: string = 'box'): string;
    entries(): IterableIterator<string, BlockTypeDefinition>;
}

interface BlockData {
    [key: string]: any;
}

/**
 * @deprecated
 */
interface BlockType {
    //
}

interface BlockTypeDefinition {
    name: string;         // Examples 'Text'
    friendlyName: string; // Examples 'Text'
    editForm: preact.Component|null;
    stylesEditForm: 'default'|preact.Component|null;
    createOwnProps(defProps: {[key: string]: any;}): {[propName: string]: any};
    icon?: string;        // Examples 'blockquote'
}

interface ReusableBranch {
    id: string;
    blockBlueprints: Array<BlockBlueprint>;
}

interface BlockBlueprint {
    blockType: string;
    initialOwnData: {[key: string]: any;};
    initialDefaultsData: {
        title: string;
        renderer: string;
        styleClasses: string;
    };
    initialStyles: Array<StyleChunk>;
    initialChildren: Array<BlockBlueprint>;
}

interface BlockStub {
    id: string; // Example 'uowHqsCJ1Ji' (main tree blocks) or
                //         'uowHFoKTteV__uowHMRffw9e' (global block tree blocks, blockId  + '__' + gbRefBlockId)
    type: string; // 'Section', 'Button' etc.
    styleClasses: string; // Example 'j-Type-unit-3 j-Type-unit-12'
}

interface Block extends BlockStub {
    title: string;
    renderer: string; // Example 'sivujetti:block-auto'
    children: Array<Block>;
    [typeSpecificProps: string]: any;
}

interface GlobalBlockTree {
    id: string;
    name: string;
    blocks: Array<Block>;
}

interface ContentTemplate {
    id: string;
    blockBlueprints: Array<BlockBlueprint>;
    title: string;
    previewImgSrc: string;
    category: 'headers'|'content'|'footers'|string;
}

interface Layout {
    id: string;
    friendlyName: string;
}

interface Theme {
    id: string; // Example '1'
}

interface CurrentPageData {
    page: Page;
    initialPageBlocksStyles: Array<StyleChunk>;
    layout: {
        friendlyName: string;
        structure: Array<LayoutPart>;
    };
    theme: Theme | (Theme & {
        styles: StylesBundle;
    });
}

interface StylesBundle {
    styleChunks: Array<StyleChunk>;
    cachedCompiledCss: string;
    cachedCompiledScreenSizesCssHashes?: Array<string>;
}

interface StylesBundleWithId extends StylesBundle {
    id: number;
}

interface LayoutPart {
    type: 'globalBlockTree'|'pageContents';
    globalBlockTreeId?: string;
}

interface PageTypeField {
    name: string;
    friendlyName: string;
    dataType: {
        type: 'text'|'json'|'int'|'uint';
        isNullable: boolean;
        length?: number;
        validationRules?: Array;
        canBeEditedBy?: number;
        rel?: string;
    };
    defaultValue: string|Array|Object|null;
}

interface PageTypeStub {
    name: string;
    friendlyName: string;
    friendlyNamePlural: string;
    description: string;
    slug: string;
    defaultLayoutId: string;
    status: number;
    isListable: boolean;
}

interface PageType extends PageTypeStub {
    initialBlocks: Array<BlockBlueprint>;
    ownFields: Array<PageTypeField>;
    defaultFields: {
        [key: string]: {
            defaultValue: string;
        };
    };
}

interface RelPage {
    id: string;
    title: string;
    slug: string;
    path: string;
    type: string;
}

interface Page extends RelPage {
    level: number;
    layoutId: string;
    status: number;
    isPlaceholderPage: boolean;
    [ownFieldName: string]: any; // Custom fields (PageType.ownFields)
}

interface BlockRenderer {
    fileId: string;
    friendlyName: string|null;
    associatedWith: string|null;
}

interface TheWebsite {
    name: string;
    langTag: string; // en_US
    description: string;
    hideFromSearchEngines: boolean;
    versionId: string;
    headHtml: string;
    footHtml: string;
}

interface TheWebsiteBundle {
    baseUrl: string;
    assetBaseUrl: string;
    currentPageSlug: string;
    website: TheWebsite;
    pageTypes: Array<PageType>;
    activeTheme: {id: string;};
    blockRenderers: Array<BlockRenderer>;
    userPermissions: {
        canDoAnything: boolean;
        canEditGlobalStylesVisually: boolean;
        canEditBlockStylesVisually: boolean;
        canEditBlockCss: boolean;
        canCreatePageTypes: boolean;
        canCreatePages: boolean;
        canCreateReusableBranches: boolean;
        canCreateGlobalBlockTrees: boolean;
        canSpecializeGlobalBlocks: boolean;
        canEditTheWebsitesBasicInfo: boolean;
        canEditTheWebsitesGlobalScripts: boolean;
        canListUploads: boolean;
    };
    userRole: number;
    showGoToDashboardMode?: boolean;
    dashboardUrl?: string;
    availableUpdatePackages: Array<string>;
}

interface TheWebsiteBundle2 {
    website: TheWebsite;
    pageTypes: Array<PageType>;
    activeTheme: {id: string;};
    userPermissions: {
        canDoAnything: boolean;
        canEditGlobalStylesVisually: boolean;
        canEditBlockStylesVisually: boolean;
        canEditBlockCss: boolean;
        canCreatePageTypes: boolean;
        canCreatePages: boolean;
        canCreateReusableBranches: boolean;
        canCreateGlobalBlockTrees: boolean;
        canSpecializeGlobalBlocks: boolean;
        canEditTheWebsitesBasicInfo: boolean;
        canEditTheWebsitesGlobalScripts: boolean;
        canListUploads: boolean;
    };
    userRole: number;
    showGoToDashboardMode?: boolean;
    dashboardUrl?: string;
    availableUpdatePackages: Array<string>;
}

interface EnvConfig {
    baseUrl: string;
    assetBaseUrl: string;
    cacheBustStr: string;
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
    zIndex?: number;
}

interface ContextMenuLink {
    text: string;
    title: string;
    id: string;
}

type blockPropValueChangeFlags = 'is-throttled'|'is-group'|'is-initial'|null;

interface BlockEditFormProps {
    block: Block;
    lastBlockTreeChangeEventInfo: {
        ctx: stateChangeContext;
        flags: blockPropValueChangeFlags;
        isUndoOrRedo: boolean;
    };
    emitValueChanged(val: any, key: string, ...varargs): void;
    emitValueChangedThrottled(val: any, key: string, hasErrors: boolean = false, source: 'default'|'undo'|null = null): void;
    emitManyValuesChanged(changes: {[key: string]: any;}, hasErrors: boolean = false, flags: blockPropValueChangeFlags = null);
}

interface BlockStylesEditFormProps {
    blockId: string;
    stateId: number;
}

interface UploadsEntry {
    fileName: string;
    baseDir: string;
    mime: string;
    friendlyName: string;
    createdAt: number;
    updatedAt: number;
    ext?: string;
}

interface TranspileArgs {
    selectedLang: string;
    bundles: Array<string>;
}

interface CssRule {
    name: string;
    friendlyName: string;
    value: CscValue;
}

interface CssValue {
    type: 'color';
    value: [string, string, string, string];
}

interface FloatingDialog {
    open(Renderer: preact.ComponentType|string, settings: FloatingDialogSettingsInput & {[key: string]: any;}, rendererProps: Object): void;
    isOpen(): boolean;
    updateRendererProps(newProps: Object): void;
    close(): void;
    setTitle(title: string): void;
    setOnBeforeClose(fn: () => void): void;
    setHeight(height: number, instructions: 'animate'|'' = ''): void;
}

interface FloatingDialogSettingsInput {
    title: string;
    width?: number;
    height?: number;
}

interface BlockTreeItemState {
    isSelected: boolean;
    isCollapsed: boolean;
    isHidden: boolean;
    isNew: boolean;
}

interface DragDropEventController {
    begin(info: DragDropInfo): boolean;
    swap(info: DragDropInfo, infoPrev: DragDropInfo, startLi: HTMLLIElement|null): boolean|undefined;
    dragOut(info: DragDropInfo): void;
    drop(info: DragDropInfo, startLi: HTMLLIElement|null): void;
    end(lastAcceptedSwapIdx: number|null): void;
    setExternalOriginData(data: Object|null): void;
}

interface DragDropInfo {
    li: HTMLLIElement;
    pos: 'initial'|dropPosition;
}

interface ThemeStyle {
    units: Array<ThemeStyleUnit>;
    blockTypeName: string;
}

interface ThemeStyleUnit {
    title: string;
    id: string;
    scss: string;
    generatedCss: string;
    optimizedScss?: string|null;
    optimizedGeneratedCss?: string|null;
    origin: string;
    specifier: string;
    isDerivable: boolean;
    derivedFrom: string|null;
}

interface UnitVarInsights {
    baseValueLiteral: string; // '#00ff00ff', '1px', 'initial'
    hasBaseValue: boolean;
}

type leftPanelName = 'Default'|'CreatePage'|'CreatePageType';

interface BlockDescriptor {
    blockId: string;
    isStoredToTreeId: string;
    isGbtRef: boolean;
    data: {refTreesRootBlockId: string; refTreeId: string;}|null; // If isGbtRef === true
}

interface SpawnDescriptor {
    block: Block;
    isReusable: boolean|null;
    styles?: Array<StyleChunk>;
}

interface PartialMenuLink {
    text: string;
    slug: string;
    [key: string]: any;
}

interface Path {
    pathname: string;
    search: string;
    hash: string;
}

type dropPosition = 'before'|'after'|'as-child';

type treeTransferType = 'none'|'out-of-gbt'|'into-gbt';

type urlMode = 'pick-url'|'pick-file'|'type-external-url';

type cssValType = ColorValue|ImageValue|GridColumnsValue|LengthValue|OptionValue;

interface CssVar {
    type: 'backgroundImage'|'color'|'gridColumns'|'length'|'option';
    value: cssValType|null;
    valueLiteral: string;
    varName: string;
    label: string;
    args: string[];
    __idx: number;
}

interface ImageValue {
    src: string|null;
}

interface ColorValue {
    data: string;
    type: 'hexa';
}

interface GridColumnsValue {
    decl: string;
}

interface LengthValue {
    num: string;
    unit: 'rem'|'px';
}

interface OptionValue {
    selected: any|null;
}

interface TheBlockTreeReducerContext {
    clone: Array<Block>;
    reRenderThese: Array<string>;
}

interface StylisAstNode {
    children: string|Array<StylisAstNode>;
    value: string;
    line: number;
    column: number;
    [more: string]: any;
}

interface StylisAstInspector {
    findNodeByDeclName(declName: string): StylisAstNode|null;
    findNodeByDeclNameFromScope(declName: string, scope: string): StylisAstNode|null;
    findNode(fn: (node: StylisAstNode, parentNode: StylisAstNode) => any): StylisAstNode|null;
    getAst(): Array<StylisAstNode>;
}

interface StylesListProps {
    blockCopy: Block;
    userCanEditVisualStyles: boolean;
    userCanEditCss: boolean;
    useVisualStyles: boolean;
}

type extractedVars = [Array<CssVar>, Array<StylisAstNode>];

interface ValueInputProps<T> {
    value: T;
    labelTranslated: string;
    onValueChanged: (newValAsString: string|null) => void;
    inputId: string;
    isClearable?: boolean;
    additionalUnits?: Array<string>; // Example: ['fr']
}

interface ColorValueInputPropsData {
    selector: string;
    mediaQueryWrap: string|null;
    supportingCss?: string;
}

interface StyleChunk {
    scss: string;
    scope: {
        kind: styleScopeKind;
        layer: stylesLayer;
        page?: string; // Example '-NGLsmQwm7aOSH-lS1-J:Pages'
    };
    data?: CustomClassStyleChunkData;
}

interface CustomClassStyleChunkData {
    title?: string;
    customizationSetting?: {
        varDefs: Array<VisualStylesFormVarDefinition>;
    };
    associatedBlockTypes?: Array<string>;
}

interface CssVarsMap {
    [varName: string]: string;
}

type stylesLayer = 'user-styles'|'dev-styles'|'base-styles';

type styleScopeKind = 'single-block'|'custom-class'|'base-vars'|'base-freeform';

type stateChangeContext = 'initial'|'push'|'undo'|'redo';

interface StateChangeUserContext {
    event?: string;
    [otherData: string]; any;
}

interface StateHistory<T = any> {
    channelName: string;
    initial: T;
    first: T|null;
    latest: T|null;
}

interface SaveButtonChannelHandler<T = any> {
    handleStateChange(state: T, userCtx: StateChangeUserContext|null, context: stateChangeContext): void;
    syncToBackend(stateHistory: StateHistory<T>, otherHistories: Array<StateHistory>): Promise<boolean|any>;
}

interface BlockRendererProps {
    block: Block;
    createDefaultProps(customClasses: string = null): {[attrName: string]: string;};
    renderChildren(): preact.ComponentChildren;
}

interface WebPagePreviewRendererAppApi {
    registerRenderer(name: string, Cls: preact.AnyComponent): void;
}

interface VisualStylesFormVarDefinition {
    varName: string;             // Example 'textAlign'
    cssProp: string;             // Example 'text-align'
    cssTemplate: string|null;    // Example 'border: 1px solid %s'
    cssSubSelector: string|null; // Example '>img'
    widgetSettings: VisualStylesFormVarDefinitionWidgetSettings & {[possibleExtras: string]: any;};
}

interface VisualStylesFormVarDefinitionWidgetSettings {
    valueType?: string;          // 'color'|'option' etc.
    renderer?: preact.Component; // ColorValueInput|OptionValueInput etc.
    label: string;               // Example 'Text align'
    defaultThemeValue?:          // Example {num: '6', unit: 'rem'}
        ColorValue |
        GridColumnsValue |
        ImageValue |
        LengthValue |
        OptionValue |
        string;
}

type scssCodeInput = string|Array<string>;

type translateVarInputToScssCodeTemplateFn = (varName: string, value: string, valueNorm: string) => scssCodeInput;
