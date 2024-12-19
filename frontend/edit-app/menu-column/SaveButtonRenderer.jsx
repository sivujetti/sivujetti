import {
    __,
    events,
    Icon,
    isUndoOrRedo,
    scssWizard,
} from '@sivujetti-commons-for-edit-app';

const useStickiedClsChangeUpdater = false;

/** @extends {preact.Component<{editAppOuterEl: HTMLElement; saveButton: SaveButton;}, any>} */
class SaveButtonRenderer extends preact.Component {
    /**
     * @access public
     */
    resetState() {
        this.setState(createInitialState());
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.resetState();
        const {saveButton} = this.props;
        saveButton.linkRenderer(this);
        // Refresh ScssWizard's styles every time new styles (page) are loaded
        // into the preview iframe, or when an undo|redo event happens
        saveButton.subscribeToChannel('stylesBundle', (bundle, _userCtx, ctx) => {
            if (ctx === 'initial' || isUndoOrRedo(ctx))
                scssWizard.replaceStylesState(bundle);
        });
        // Update ScssWizard's 'currentPageIdPair' every time a new page is
        // loaded into the preview iframe
        events.on('webpage-preview-iframe-loaded', () => {
            // See also ./menu-column/page/PageCreateState.jsx.componentWillMount() (if pageData.isPlaceholderPage === true)
            scssWizard.setCurrentPageInfo(saveButton.getChannelState('currentPageData'));
        });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        if (useStickiedClsChangeUpdater)
            this.props.editAppOuterEl.addEventListener('scroll', e => {
                if (e.target.scrollTop > 21 && !this.state.isStickied)
                    this.renderer.setState({isStickied: true});
                else if (e.target.scrollTop < 21 && this.state.isStickied)
                    this.renderer.setState({isStickied: false});
            });
    }
    /**
     * @access protected
     */
    render({saveButton}, {isVisible, canUndo, canRedo, isSubmitting, isStickied}) {
        if (!isVisible) return;
        const cls = !isStickied ? '' : ' stickied pl-1';
        const icon = <Icon iconId="arrow-back-up" className={ `${!isStickied ? 'size-sm' : 'size-xs'} color-dimmed3` }/>;
        const canSave = !canUndo && canRedo ? false : true;
        return <div class={ `save-button d-flex col-ml-auto flex-centered${cls}` }>
            <button
                onClick={ () => saveButton.doUndo() }
                class="btn btn-link px-1 pt-2"
                title={ __('Undo latest change') }
                disabled={ !canUndo }>
                <span class="d-flex">{ icon }</span>
            </button>
            <button
                onClick={ () => saveButton.doRedo() }
                class="btn btn-link px-1 pt-2"
                title={ __('Redo') }
                disabled={ !canRedo }>
                <span class="d-flex flipped-undo-icon">{ icon }</span>
            </button>
            <button
                onClick={ () => saveButton.syncQueuedOpsToBackend() }
                class="btn btn-link flex-centered px-2"
                title={ __('Save changes') }
                disabled={ !canSave || isSubmitting }>
                <Icon iconId="device-floppy" className={ !isStickied ? '' : 'size-sm' }/>
                <span class="mt-1 ml-1">*</span>
            </button>
        </div>;
    }
}

/**
 * @returns {Object}
 */
function createInitialState() {
    return {
        isVisible: false,
        isSubmitting: false,
        canUndo: false,
        canRedo: false,
    };
}

export default SaveButtonRenderer;
