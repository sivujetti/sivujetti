import {__} from '../../commons/main.js';
import {hookForm, InputGroupInline, Input, InputError} from '../../commons/Form.jsx';
import {formValidation} from '../../constants.js';

class EditItemPanel extends preact.Component {
    // treeCopy;
    // treeCopyItemRef;
    /**
     * @param {{link: MenuLink; cssClass: String; parent: MenuBlockEditForm; panelAHeight: Number;}} props
     * @access proctected
     */
    componentWillReceiveProps(props) {
        if (props.cssClass === 'reveal-from-right') {
            this.setState(hookForm(this, {
                linkText: props.link.text,
                linkSlug: props.link.slug,
            }));
            this.treeCopy = JSON.parse(JSON.stringify(props.parent.state.parsedTree));
            this.treeCopyItemRef = findLinkItem(this.treeCopy, props.link.id);
        } else if (props.cssClass === 'fade-to-right') {
            this.componentWillUnmount();
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (this.form)
            this.form.destroy();
    }
    /**
     * @access protected
     */
    render({cssClass, panelAHeight}, {classes, errors}) {
        return <div class={ cssClass } style={ `top: -${panelAHeight + 8}px` }>
            { cssClass == 'reveal-from-right' ? [
                <button onClick={ () => this.props.parent.endEditMode(this.treeCopy) } class="btn btn-sm" type="button"> &lt; </button>,
                <div class="form-horizontal pt-0">
                <InputGroupInline classes={ classes.linkText }>
                    <label class="form-label" htmlFor="linkText" title={ __('Text') }>{ __('Text') }</label>
                    <Input vm={ this } name="linkText" id="linkText" errorLabel={ __('Text') } validations={ [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ this.emitChange.bind(this) }/>
                    <InputError error={ errors.linkText }/>
                </InputGroupInline>
                <InputGroupInline classes={ classes.linkSlug }>
                    <label class="form-label" htmlFor="linkSlug" title={ __('Url') }>{ __('Url') }</label>
                    <Input vm={ this } name="linkSlug" id="linkSlug" errorLabel={ __('Url') } placeholder={ __('e.g. %s or %s', '/my-page', 'https://page.com') }
                        validations={ [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ this.emitChange.bind(this) }/>
                    <InputError error={ errors.linkSlug }/>
                </InputGroupInline>
                </div>
            ] : null }
        </div>;
    }
    /**
     * @param {Object} newState
     * @access private
     */
    emitChange(newState) {
        // Mutates this.treeCopy
        this.treeCopyItemRef.text = newState.values.linkText;
        this.treeCopyItemRef.slug = newState.values.linkSlug;
        this.props.parent.onTreeUpdated(this.treeCopy);
        return newState;
    }
}

function findLinkItem(branch, id) {
    for (const link of branch) {
        if (link.id === id) return link;
        if (link.children.length) {
            const sub = findLinkItem(link.children, id);
            if (sub) return sub;
        }
    }
    return null;
}

export default EditItemPanel;
