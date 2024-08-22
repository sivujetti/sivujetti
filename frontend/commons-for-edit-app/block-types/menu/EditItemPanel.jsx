import PickUrlInputGroup from '../../includes-internal/PickUrlInputGroup.jsx';
import {validationConstraints} from '../../constants.js';
import CrudList from '../../CrudList.jsx';
import {__} from '../../edit-app-singletons.js';
import {
    FormGroupInline,
    hasErrors,
    hookForm,
    Input,
    InputErrors,
    reHookValues,
    unhookForm,
} from '../../Form.jsx';
import {Icon} from '../../Icon.jsx';

class EditItemPanel extends preact.Component {
    // crudListRef;
    /**
     * @param {{item: MenuLink; onValueChanged: (value: string, key: keyof MenuLink) => void; done: () => void; menuForm?: MenuBlockEditForm;}} props
     */
    componentWillMount() {
        this.crudListRef = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'linkText', value: this.props.item.text, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Link text'),
            onAfterValueChanged: (value, hasErrors, _source) => {
                if (!hasErrors) this.props.onValueChanged(value, 'text');
            }},
        ]));
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.item.text !== this.state.values.linkText)
            reHookValues(this, [{name: 'linkText', value: props.item.text}]);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    /**
     * @access protected
     */
    render({item, done, menuForm}) {
        const linkChildren = item.children;
        return <div class="form-horizontal">
            <button
                onClick={ () => done() }
                class="btn btn-sm"
                disabled={ hasErrors(this) }
                title={ __('Done') }
                type="button">&lt;</button>
            <FormGroupInline className="mt-1">
                <label htmlFor="linkText" class="form-label">{ __('Link text') }</label>
                <Input vm={ this } prop="linkText" id="linkText"/>
                <InputErrors vm={ this } prop="linkText"/>
            </FormGroupInline>
            <PickUrlInputGroup linkTo={ item.slug } onUrlPicked={ normalized => {
                this.props.onValueChanged(normalized, 'slug');
            } }/>
            { menuForm ? [<div class="pt-1">{/*collapse margin*/}</div>, <div class="fieldset">
                <div class="form-label legend">{ __('Submenu') }</div>
                { !linkChildren.length
                    ? <div><button
                        onClick={ () => {
                            menuForm.updateSubLinkAndEmitChanges(
                                this.props.item.id,
                                'children',
                                [menuForm.linkCreator.makeLinkItem()],
                            );
                        } }
                        title={ __('Add submenu') }
                        class="btn btn-sm btn-link color-dimmed mb-1 with-icon-inline"
                        type="button">
                        <Icon iconId="plus" className="size-xs mr-1"/>
                        { __('Add submenu') }
                    </button></div>
                    : <div class="form-horizontal text-tinyish styles-list pt-0">
                        <label class="form-switch d-inline-flex mt-0" style="opacity: .8;">
                            <input type="checkbox" checked={ !!item.includeToggleButton } onClick={ () => {
                                menuForm.updateSubLinkAndEmitChanges(
                                    this.props.item.id,
                                    'includeToggleButton',
                                    !item.includeToggleButton,
                                );
                            } }/>
                            <i class="form-icon"></i> { __('Include arrow button') }
                        </label>
                        <CrudList
                            items={ linkChildren }
                            itemTitleKey="text"
                            onCreateCtxMenuCtrl={ menuForm ? this.createCtxMenuCtrl.bind(this) : undefined }
                            onListMutated={ (newArr, prop) => {
                                menuForm.updateSubLinkAndEmitChanges(
                                    this.props.item.id,
                                    'children',
                                    newArr,
                                    prop === 'text'
                                );
                            } }
                            createNewItem={ () =>
                                menuForm.linkCreator.makeLinkItem()
                            }
                            editForm={ EditItemPanel }
                            editFormProps={ {menuForm: null} }
                            itemTypeFriendlyName={ __('link') }
                            ref={ this.crudListRef }/>
                    </div> }
            </div>] : null }
        </div>;
    }
    /**
     * @param {ContextMenuController} ctrl
     * @returns {ContextMenuController}
     * @access private
     */
    createCtxMenuCtrl(ctrl) {
        const {menuForm} = this.props;
        const origOnClicked = ctrl.onItemClicked;
        return {
            ...ctrl,
            getLinks: menuForm.currentCtxMenuController.getLinks,
            onItemClicked: link => {
                if (link.id === 'duplicate') {
                    const newChildren = menuForm.createNewBranchWithLinkDuplicated(
                        this.crudListRef.current.itemWithNavOpened.id,
                        this.state.linkChildren
                    );
                    menuForm.updateSubLinkAndEmitChanges(
                        this.props.item.id,
                        'children',
                        newChildren
                    );
                } else {
                    origOnClicked.call(ctrl, link);
                }
            },
        };
    }
}

/**
 * @typedef {{
 *   text: string;
 *   slug: string;
 *   id: string;
 *   children: Array<MenuLink>;
 *   includeToggleButton?: boolean;
 * }} MenuLink
 */

export default EditItemPanel;
