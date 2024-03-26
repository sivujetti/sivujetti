import {urlUtils} from '@sivujetti-commons-for-web-pages';
import {completeImageSrc} from '../../../shared-inline.js';
import setFocusTo from '../../auto-focusers.js';
import {__} from '../../edit-app-singletons.js';
import {FormGroupInline} from '../../Form.jsx';
import ImagePicker from '../../ImagePicker.jsx';
import {isUndoOrRedo} from '../../utils.js';

class SectionBlockEditForm extends preact.Component {
    // imagePicker;
    /**
     * @access protected
     */
    componentWillMount() {
        const {block} = this.props;
        this.imagePicker = preact.createRef();
        this.setState({bgImageSrc: block.bgImage});
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.imagePicker);
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.block !== this.props.block && isUndoOrRedo(props.lastBlockTreeChangeEventInfo.ctx) &&
            this.state.bgImageSrc !== props.block.bgImage) {
            this.setState({bgImageSrc: props.block.bgImage});
        }
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_, {bgImageSrc}) {
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="bgImageSrc" class="form-label">{ __('Background#image') }</label>
                <ImagePicker
                    src={ bgImageSrc }
                    onSrcCommitted={ this.emitNewBgImageSrc.bind(this) }
                    inputId="bgImageSrc"
                    ref={ this.imagePicker }/>
            </FormGroupInline>
        </div>;
    }
    /**
     * @param {String|null} src
     * @param {String|null} mime
     */
    emitNewBgImageSrc(src, mime) {
        const bgImageSrc = src ? completeImageSrc(src, urlUtils) : '';
        const wasTyped = !mime;
        if (!wasTyped)
            this.props.emitValueChanged(bgImageSrc, 'bgImage');
        else
            this.props.emitValueChangedThrottled(bgImageSrc, 'bgImage');
    }
}

export default SectionBlockEditForm;