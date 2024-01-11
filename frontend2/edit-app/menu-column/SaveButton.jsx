import {__, Icon} from '../../sivujetti-commons-unified.js';

class SaveButton extends preact.Component {
    /**
     * @param {SaveButtonProps} props
     */
    constructor(props) {
        super(props);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.props.editAppOuterEl.addEventListener('scroll', e => {
            if (e.target.scrollTop > 21 && !this.state.isStickied)
                this.setState({isStickied: true});
            else if (e.target.scrollTop < 21 && this.state.isStickied)
                this.setState({isStickied: false});
        });
    }
    /**
     * @param {SaveButtonProps} props
     * @access protected
     */
    render(_, {isStickied}) {
        const undoButtonIsDisabled = true;
        const redoButtonIsDisabled = true;
        const saveBtnIsDisabled = false;
        const cls = !isStickied ? '' : ' stickied pl-1';
        const icon = <Icon iconId="arrow-back-up" className={ `${!isStickied ? 'size-sm' : 'size-xs'} color-dimmed3` }/>;
        return <div class={ `save-button d-flex col-ml-auto flex-centered${cls}` }>
            <button
                onClick={ this.doUndo.bind(this) }
                class="btn btn-link px-1 pt-2"
                title={ __('Undo latest change') }
                disabled={ undoButtonIsDisabled }>
                <span class="d-flex">{ icon }</span>
            </button>
            <button
                onClick={ this.doRedo.bind(this) }
                class="btn btn-link px-1 pt-2"
                title={ __('Redo previous undo') }
                disabled={ redoButtonIsDisabled }>
                <span class="d-flex flipped-undo-icon">{ icon }</span>
            </button>
            <button
                onClick={ this.syncQueuedOpsToBackend.bind(this) }
                class="btn btn-link flex-centered px-2"
                title={ __('Save changes') }
                disabled={ saveBtnIsDisabled }>
                <Icon iconId="device-floppy" className={ !isStickied ? '' : 'size-sm' }/>
                <span class="mt-1 ml-1">*</span>
            </button>
        </div>;
    }
    /**
     * @access private
     */
    doUndo() {
        //
    }
    /**
     * @access private
     */
    doRedo() {
        //
    }
    /**
     * @access private
     */
    syncQueuedOpsToBackend() {
        //
    }
}

/**
 * @typedef SaveButtonProps
 * @prop {HTMLElement} editAppOuterEl
 */

export default SaveButton;
