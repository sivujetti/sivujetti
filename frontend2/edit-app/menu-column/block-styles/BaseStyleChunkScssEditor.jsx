import {api, env, scssWizard, timingUtils} from '@sivujetti-commons-for-edit-app';
import ScssEditor from '../block-styles/ScssEditor.jsx';

let saveButtonInstance;

class BaseStyleChunkScssEditor extends preact.Component {
    // handleScssChangedThrottled;
    /**
     * @access protected
     */
    componentWillMount() {
        saveButtonInstance = api.saveButton.getInstance();
        this.handleScssChangedThrottled = timingUtils.debounce(
            handleBaseChunkScssChanged,
            env.normalTypingDebounceMillis
        );
        //
        this.setState({styleChunk: findFreeformBaseStyleChunk()});
    }
    /**
     * @param {{stylesStateId: number;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId)
            this.setState({styleChunk: findFreeformBaseStyleChunk()});
    }
    /**
     * @access protected
     */
    shouldComponentUpdate() {
        return false;
    }
    /**
     * @access protected
     */
    render(_, {styleChunk}) {
        return <ScssEditor
            editorId="base-freeform-styles"
            onInput={ scss => {
                this.handleScssChangedThrottled(scss, styleChunk);
            } }
            scss={ styleChunk.scss }/>;
    }
}

/**
 * @param {string} updatedScss
 * @param {StyleChunk} chunk
 */
function handleBaseChunkScssChanged(updatedScss, chunk) {
    const updatedAll = scssWizard.updateDevsExistingChunkWithScssChunkAndReturnAllRecompiled(
        {scss: updatedScss},
        chunk,
    );
    saveButtonInstance.pushOp('stylesBundle', updatedAll);
}

/**
 * @returns {StyleChunk|null}
 */
function findFreeformBaseStyleChunk() {
    return scssWizard.findStyle('base-freeform', undefined, 'all', 'base-styles');
}

export default BaseStyleChunkScssEditor;
