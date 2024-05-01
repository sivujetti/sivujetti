import {
    __,
    api,
    mediaScopes,
    ScreenSizesVerticalTabs,
    scssWizard,
} from '@sivujetti-commons-for-edit-app';
import ScssEditor from './ScssEditor.jsx';

const BODY_STYLE_ID = 'j-_body_';

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
            devStyleScopes: createStylesState(this.props)
        });
    }
    /**
     * @param {CodeBasedStylesListProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId)
            this.setState({devStyleScopes: createStylesState(props)});
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
    render({blockId}, {devStyleScopes, curScreenSizeTabIdx}) {
        const selectedScreenSizeStyles = devStyleScopes[curScreenSizeTabIdx];
        const styleScopes = selectedScreenSizeStyles || [];
        const selectedMediaScopeId = mediaScopes[curScreenSizeTabIdx];
        const isBodyStyle = blockId === BODY_STYLE_ID;
        return <ScreenSizesVerticalTabs
            curTabIdx={ curScreenSizeTabIdx }
            setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }>
                <ul class="list styles-list mb-2">{ styleScopes.length
                    ? styleScopes.map(ref => {
                        return <li class="open"><ScssEditor
                            handleInput={ newScss => {
                                const updatedAll = scssWizard.updateDevsExistingUniqueScopeChunkWithScssChunkAndReturnAllRecompiled(
                                    newScss,
                                    ref,
                                    selectedMediaScopeId
                                );
                                saveButtonInstance.pushOp('stylesBundle', updatedAll);
                            } }
                            scss={ ref.scss }/></li>;
                        })
                        : <li><span class="ml-2 pl-1">
                            { __('No styles for screen size %s', `"${selectedMediaScopeId}"`) }
                            { !isBodyStyle
                                ? [
                                    ', ',
                                    <a
                                        href="#"
                                        onClick={ e => (e.preventDefault(), doAddEmptyStyle(blockId, selectedMediaScopeId)) }
                                        class="color-dimmed">
                                            { __('Add style') }
                                        </a>,
                                    '.'
                                ]
                                : '.' }
                        </span></li>
                }</ul>
        </ScreenSizesVerticalTabs>;
    }
}

/**
 * @param {String} blockId
 * @param {mediaScope} selectedMediaScopeId
 */
function doAddEmptyStyle(blockId, selectedMediaScopeId) {
    const newAll = scssWizard.addNewDevsUniqueScopeScssChunkAndReturnAllRecompiled(
        `// ${__('Your code here ...') }\ncolor: red;`,
        blockId,
        selectedMediaScopeId
    );
    saveButtonInstance.pushOp('stylesBundle', newAll);
}

/**
 * @param {CodeBasedStylesListProps} props
 * @returns {Array<Array<StyleChunk>|null>}
 */
function createStylesState({blockId, stylesStateId}) {
    if (blockId === BODY_STYLE_ID) {
        const allEditableBodyStyles = scssWizard.getAllStyles(stylesStateId).filter(({scope, scss}) =>
            scope.layer === 'body-styles' && !scss.startsWith(':root')
        );
        return mediaScopes.map(scopeId => {
            const forThisScreenSize = allEditableBodyStyles.filter(({scope}) =>
                scope.media === scopeId
            );
            return forThisScreenSize.length ? forThisScreenSize : null;
        });
    }

    return mediaScopes.map(scopeId => {
        const forThisScreenSize = scssWizard.findStyles('single-block', blockId, ({scope}) =>
            scope.layer === 'dev-styles' && scope.media === scopeId
        );
        return forThisScreenSize.length ? forThisScreenSize : null;
    });
}

/**
 * @typedef CodeBasedStylesListProps
 * @prop {String} blockId
 * @prop {Number} stylesStateId
 */

export default CodeBasedStylesList;
