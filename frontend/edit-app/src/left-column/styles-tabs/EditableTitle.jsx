import {__, Icon, hookForm, unhookForm, Input, FormGroup, InputErrors, hasErrors,
        validationConstraints} from '@sivujetti-commons-for-edit-app';
import {PopupPrerendered} from '../../block-types/listing/AddFilterPopup.jsx';
import store2 from '../../store2.js';
import {SPECIAL_BASE_UNIT_NAME, emitCommitStylesOp} from './styles-tabs-common.js';

class EditableTitle extends preact.Component {
    // popup;
    /**
     * @param {{unitId: String; unitIdReal: String|null; currentTitle: String; blockTypeName: String; allowEditing: Boolean; subtitle: String|null; subtitleMarginLeft?: Number;}} props
     */
    constructor(props) {
        super(props);
        this.popup = preact.createRef();
        this.state = {popupIsOpen: false};
    }
    /**
     * @access public
     */
    open() {
        this.setState(hookForm(this, [
            {name: 'title', value: this.props.currentTitle, validations: [['required'], ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Style name')},
        ], {
            popupIsOpen: true,
        }));
        this.popup.current.open();
    }
    /**
     * @returns {Boolean}
     * @access public
     */
    isOpen() {
        return this.timeout ? true : this.popup.current && this.popup.current.state.isOpen;
    }
    /**
     * @access protected
     */
    render({currentTitle, allowEditing, subtitle}, {popupIsOpen, values}) {
        return [
            <span class="text-ellipsis">
                { values ? values.title : currentTitle }
                { subtitle
                    ? <i style={ `font-size: .5rem; left: ${parseFloat(this.props.subtitleMarginLeft || 1.7)}rem; bottom: -6px;` } class="p-absolute color-dimmed3">
                        { subtitle }
                    </i>
                    : null
                }
            </span>,
            allowEditing ? <PopupPrerendered ref={ this.popup }>{ popupIsOpen
                ? <form onSubmit={ this.applyNewTitleAndClose.bind(this) } class="text-left pb-1">
                    <FormGroup>
                        <label htmlFor="styleTitle" class="form-label pt-1">{ __('Style name') }</label>
                        <Input vm={ this } prop="title" id="styleTitle"/>
                        <InputErrors vm={ this } prop="title"/>
                    </FormGroup>
                    <button class="btn btn-sm px-2" type="submit" disabled={ hasErrors(this) }>Ok</button>
                    <button onClick={ this.discardNewTitleAndClose.bind(this) } class="btn btn-sm btn-link ml-1" type="button">{ __('Cancel') }</button>
                </form>
                : null
            }
            </PopupPrerendered> : null,
            <span class="pl-2 pt-2 edit-icon-outer">
            <Icon iconId="dots" className={ `size-xs color-dimmed${allowEditing ? '' : ' d-none'}` }/>
            </span>
        ];
    }
    /**
     * @param {Event} e
     * @access private
     */
    applyNewTitleAndClose(e) {
        e.preventDefault();
        if (hasErrors(this)) return;
        const newTitle = this.state.values.title;
        const {currentTitle, subtitle} = this.props;
        const dataBefore = {title: currentTitle};
        const [blockTypeName, unitId] = !subtitle
            ? [this.props.blockTypeName, this.props.unitId]
            : [SPECIAL_BASE_UNIT_NAME, this.props.unitIdReal];
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, {title: newTitle}]);
        emitCommitStylesOp(blockTypeName, () => {
            store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, dataBefore]);
        });
        this.close();
    }
    /**
     * @access private
     */
    close() {
        this.popup.current.close();
        this.setState({popupIsOpen: false, values: null, errors: null});
        // Prevent @BlockStyleTab.render()'s handleLiClick from triggering
        this.timeout = 1;
        setTimeout(() => {
            this.timeout = false;
            unhookForm(this);
        }, 1);
    }
    /**
     * @access private
     */
    discardNewTitleAndClose() {
        this.close();
    }
}

export default EditableTitle;
