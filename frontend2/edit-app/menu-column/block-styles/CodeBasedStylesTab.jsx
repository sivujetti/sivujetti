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
            devStyleScopes: createStylesState(this.props.stylesStateId || 0)
        });
    }
    /**
     * @param {{blockId: String; stylesStateId: Number;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId)
            this.setState({devStyleScopes: createStylesState(props.stylesStateId)});
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
    render({stylesStateId}, {devStyleScopes, curScreenSizeTabIdx}) {
        const selectedScreenSizeStyles = devStyleScopes[curScreenSizeTabIdx];
        const styleScopes = selectedScreenSizeStyles || [];
        const selectedMediaScopeId = mediaScopes[curScreenSizeTabIdx];
        return [
            <ScreenSizesVerticalTabs
                curTabIdx={ curScreenSizeTabIdx }
                setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }>
                    <ul class="list styles-list mb-2">{ styleScopes.length ? styleScopes.map((ref, i) =>
                        <li class="open"><ScssEditor
                            handleInput={ newScss => {
                                const updatedAll = scssWizard.updateDevsExistingUniqueScopeChunkWithScssChunkAndReturnAllRecompiled(
                                    newScss,
                                    ref,
                                    selectedMediaScopeId
                                );
                                saveButtonInstance.pushOp('stylesBundle', updatedAll);
                            } }
                            scss={ ref.scss }/></li>
                        ) : <li><span class="ml-2 pl-1">
                            { __('No styles for screen size %s', selectedMediaScopeId) }. <a
                                href="#"
                                onClick={ e => (e.preventDefault(), doAddEmptyStyle(this.props.blockId, selectedMediaScopeId)) }>
                                    { __('Add style') }
                                </a>.
                        </span></li>
                    }</ul>
            </ScreenSizesVerticalTabs>,
            <button
                onClick={ () => doAddEmptyStyle(this.props.blockId, selectedMediaScopeId) }
                class="btn btn-primary btn-sm mt-1 mr-1"
                type="button">{ __('Add style') }</button>
        ];
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
 * @param {Number} stylesStateId
 * @returns {Array<Array<StyleChunk>|null>}
 */
function createStylesState(stylesStateId) {
    const allStyles = scssWizard.getAllStyles(stylesStateId);
    return mediaScopes.map(scopeId => {
        const forThisScreenSize = allStyles.filter(({scope}) => scope.layer === 'dev-styles' && scope.media === scopeId);
        return forThisScreenSize.length ? forThisScreenSize : null;
    });
}

export default CodeBasedStylesList;
