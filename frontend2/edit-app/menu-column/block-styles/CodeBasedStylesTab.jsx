import {
    __,
    api,
    mediaScopes,
    ScreenSizesVerticalTabs,
    scssWizard,
} from '@sivujetti-commons-for-edit-app';
import ScssEditor from './ScssEditor.jsx';

let saveButtonInstance;

class CodeBasedStylesList extends preact.Component {
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        saveButtonInstance = api.saveButton.getInstance();
        this.unregistrables = [];
        this.setState({
            curScreenSizeTabIdx: 0,
            styleScreens: createStylesState(this.props.scopeSettings)
        });
    }
    /**
     * @param {CodeBasedStylesListProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId ||
            props.scopeSettings.specifier !== this.props.scopeSettings.specifier)
            this.setState({styleScreens: createStylesState(props.scopeSettings)});
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render({scopeSettings}, {styleScreens, curScreenSizeTabIdx}) {
        const selectedScreenSizeStyles = styleScreens[curScreenSizeTabIdx] || [];
        const selectedMediaScopeId = mediaScopes[curScreenSizeTabIdx];
        return <ScreenSizesVerticalTabs
            populatedTabs={ styleScreens.map(s => s !== null) }
            curTabIdx={ curScreenSizeTabIdx }
            setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }
            allowOverflowX>
                <ul class="list styles-list mb-2">{ selectedScreenSizeStyles.length
                    ? selectedScreenSizeStyles.map(ref => {
                        return <li class="open"><ScssEditor
                            editorId={ scopeSettings.kind + '-styles' }
                            collapseOuterCode={ scopeSettings.kind === 'custom-class' }
                            onCommitInput={ scss => {
                                const updatedAll = scssWizard.updateDevsExistingChunkWithScssChunkAndReturnAllRecompiled(
                                    scss,
                                    ref,
                                    selectedMediaScopeId
                                );
                                saveButtonInstance.pushOp('stylesBundle', updatedAll);
                            } }
                            scss={ ref.scss }/></li>;
                        })
                        : <li class="mt-2"><span class="ml-2 pl-1">{ [
                            __('No styles for screen size %s', `"${selectedMediaScopeId}"`),
                            ', ',
                            <a
                                href="#"
                                onClick={ e => (e.preventDefault(), doAddEmptyStyle(scopeSettings, selectedMediaScopeId)) }
                                class="color-dimmed">
                                    { __('Add style').toLowerCase() }
                                </a>,
                            '.'
                        ] }</span></li>
                }</ul>
        </ScreenSizesVerticalTabs>;
    }
}

/**
 * @param {ScopeSettings} scopeSettings
 * @param {mediaScope} selectedMediaScopeId
 */
function doAddEmptyStyle(scopeSettings, selectedMediaScopeId) {
    const [initialScss, scopeSpeficier] = (({kind, specifier}) => {
        if (kind === 'custom-class') return [
            `// ${__('Your code here ...') }\ncolor: red;`,
            undefined,
        ];
        if (kind === 'single-block') return [
            `// ${__('Your code here ...') }\ncolor: red;`,
            specifier,
        ];
        return [
            `body {\n  // ${__('Your code here ...')}\n}`,
            undefined,
        ];
    })(scopeSettings);
    const newAll = scssWizard.addNewDevsScssChunkAndReturnAllRecompiled(
        initialScss,
        scopeSettings.kind,
        scopeSpeficier,
        selectedMediaScopeId,
    );
    saveButtonInstance.pushOp('stylesBundle', newAll);
}

/**
 * @param {ScopeSettings} scopeSettings
 * @returns {Array<Array<StyleChunk>|null>}
 */
function createStylesState({kind, specifier}) {
    if (kind === 'base') {
        return mediaScopes.map(mediaScopeId => {
            const forThisScreenSize = scssWizard.findStyles(kind, undefined, ({scope, scss}) =>
                scope.layer === 'base-styles' && !scss.startsWith(':root') && scope.media === mediaScopeId
            );
            return forThisScreenSize.length ? forThisScreenSize : null;
        });
    }
    return mediaScopes.map(mediaScopeId => {
        const forThisScreenSize = scssWizard.findStyles(kind, specifier, ({scope}) =>
            scope.layer === 'dev-styles' && scope.media === mediaScopeId
        );
        return forThisScreenSize.length ? forThisScreenSize : null;
    });
}

/**
 * @typedef {{stylesStateId: Number; scopeSettings: ScopeSettings;}} CodeBasedStylesListProps
 *
 * @typedef {{kind: styleScopeKind; specifier: String;}} ScopeSettings
 */

export default CodeBasedStylesList;
