import {
    __,
    mediaScopes,
    ScreenSizesVerticalTabs,
} from '@sivujetti-commons-for-edit-app';
import ScssEditor from './ScssEditor.jsx';

class CodeBasedStylesList extends preact.Component {
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [];
        this.setState({
            curScreenSizeTabIdx: 0,
            devStyleRefs: createStylesState(this.props.stylesStateId)
        });
    }
    /**
     * @param {{blockId: String; stylesStateId: Number;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId)
            this.setState({devStyleRefs: createStylesState(props.stylesStateId)});
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
    render({stylesStateId}, {devStyleRefs, curScreenSizeTabIdx}) {
        const selectedScreenSizeStyles = devStyleRefs[curScreenSizeTabIdx];
        const styleRefs = selectedScreenSizeStyles || [];
        const selectedMediaScopeId = mediaScopes[curScreenSizeTabIdx];
        return [
            <ScreenSizesVerticalTabs
            curTabIdx={ curScreenSizeTabIdx }
            setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }>
                <ul class="list styles-list mb-2">{ styleRefs.length ? styleRefs.map((ref, i) =>
                    <li class="open"><ScssEditor
                        handleInput={ newScss => {
                            // todo
                        } }
                        key={ `${stylesStateId}-${i}` }
                        scss={ ref.scss }/></li>
                    ) : <li>No styles for screen size { selectedMediaScopeId }</li>
                }</ul>
            </ScreenSizesVerticalTabs>,
            <button
                onClick={ () => {
                   // todo
                } }
                class="btn btn-primary btn-sm mr-1"
                type="button">{ __('Add style') }</button>
        ];
    }
}

function createStylesState(stylesStateId) {
    // todo
    return [];
}

export default CodeBasedStylesList;
