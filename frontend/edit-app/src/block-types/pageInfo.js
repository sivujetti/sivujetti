import {__, http, signals, env} from '@sivujetti-commons';
import {hookForm, InputGroupInline, Input, InputError} from '../../../commons/Form.jsx';
import toasters from '../../../commons/Toaster.jsx';
import store, {pushItemToOpQueue} from '../store.js';
import BlockTrees from '../BlockTrees.jsx';
import {stringUtils, timingUtils} from '../utils.js';

class PageInfoBlockEditForm extends preact.Component {
    // static internalSivujettiApi;
    // commitNewPageValuesDebounced;
    // currentPageIsPlaceholder;
    /**
     * @param {BlockEditFormProps} props
     */
    constructor(props) {
        super(props);
        this.commitNewPageValuesDebounced = timingUtils.debounce(this.commitNewPageValues.bind(this),
            env.normalTypingDebounceMillis);
        this.currentPageIsPlaceholder = null;
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const currentPage = BlockTrees.currentWebPage.data.page;
        this.currentPageIsPlaceholder = currentPage.isPlaceholderPage;
        let slug = currentPage.slug;
        if (this.currentPageIsPlaceholder) {
            slug = makeSlug(currentPage.title);
            emitValueChangedSignal(currentPage);
        }
        this.setState(hookForm(this, {
            title: currentPage.title,
            slug,
        }));
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.form.destroy();
    }
    /**
     * @access protected
     */
    render(_, {classes, errors}) {
        return <>
            <div class="form-horizontal pt-0">
                <InputGroupInline classes={ classes.title }>
                    <label htmlFor="title" class="form-label">{ __('Title') }</label>
                    <Input vm={ this } name="title" id="title" errorLabel={ __('Title') }
                        validations={ [['required'], ['maxLength', 92]] } myOnChange={ newState => this.handleValueChanged(newState, 'title') }/>
                    <InputError error={ errors.title }/>
                </InputGroupInline>
                <InputGroupInline classes={ classes.slug }>
                    <label htmlFor="slug" class="form-label">{ __('Url (slug)') }</label>
                    <Input vm={ this } name="slug" id="slug" errorLabel={ __('Url (slug)') }
                        validations={ [['required'], ['maxLength', 92], ['regexp', '^/[a-zA-Z0-9_\\-$.+!*\'():,]*$', __(' contains forbidden characters')]] } myOnChange={ newState => this.handleValueChanged(newState, 'slug') }/>
                    <InputError error={ errors.slug }/>
                </InputGroupInline>
            </div>
        </>;
    }
    /**
     * @access private
     */
    commitNewPageValues() {
        const currentPage = BlockTrees.currentWebPage.data.page;
        currentPage.title = this.state.values.title;
        currentPage.slug = this.state.values.slug;
        if (!this.currentPageIsPlaceholder) {
            store.dispatch(pushItemToOpQueue('update-page-basic-info', {
                doHandle: this.savePageToBackend.bind(this),
                args: [this.state.values.title, this.state.values.slug],
            }));
        } else {
            emitValueChangedSignal(currentPage);
        }
    }
    /**
     * @param {String} title
     * @param {String} slug
     * @access private
     */
    savePageToBackend(title, slug) {
        const currentPage = BlockTrees.currentWebPage.data.page;
        const data = Object.assign({}, currentPage, {title, slug});
        delete data.blocks;
        delete data.isPlaceholderPage;
        const pageType = PageInfoBlockEditForm.internalSivujettiApi.getPageTypes()
            .find(({name}) => name === currentPage.type);
        for (const fieldDef of pageType.ownFields) // todo
            data[fieldDef.name] = fieldDef.defaultValue;
        //
        return http.put(`/api/pages/${currentPage.type}/${currentPage.id}`, data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'));
                return false;
            });
    }
    /**
     * @param {Object} state
     * @param {'title'|'slug'} prop
     * @access private
     */
    handleValueChanged(state, prop) {
        const value = state.values[prop];
        if (value) {
            this.setState({[prop]: value});
            if (prop === 'title')
                BlockTrees.currentWebPage.updateTitle(value);
            this.commitNewPageValuesDebounced();
        }
        return state;
    }
}

function emitValueChangedSignal(currentPage) {
    signals.emit('on-page-info-form-value-changed', {title: currentPage.title,
                                                     slug: currentPage.slug});
}

function makeSlug(title) {
    return `/${stringUtils.slugify(title) || '-'}`;
}

/**
 * @param {PageType} internalSivujettiApi
 */
export default internalSivujettiApi => {
    const initialData = {overrides: '[]'};
    PageInfoBlockEditForm.internalSivujettiApi = internalSivujettiApi;
    return {
        name: 'PageInfo',
        friendlyName: 'PageInfo',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        reRender() { throw new Error('Not supported'); },
        editForm: PageInfoBlockEditForm,
    };
};
