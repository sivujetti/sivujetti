import {__, http, signals, env} from '../commons/main.js';
import {hookForm, InputGroupInline, Input, InputError} from '../commons/Form.jsx';
import toasters from '../commons/Toaster.jsx';
import {stringUtils, timingUtils} from '../commons/utils.js';
import store, {pushItemToOpQueue} from '../store.js';
import BlockTrees from '../BlockTrees.jsx';
import getWidget from '../FieldWidget/all.jsx';
import setFocusTo from './auto-focusers.js';

class PageInfoBlockEditForm extends preact.Component {
    // static internalSivujettiApi;
    // commitNewPageValuesDebounced;
    // currentPageIsPlaceholder;
    // titleInputWrapper;
    /**
     * @param {BlockEditFormProps} props
     */
    constructor(props) {
        super(props);
        this.commitNewPageValuesDebounced = timingUtils.debounce(this.commitNewPageValues.bind(this),
            env.normalTypingDebounceMillis);
        this.currentPageIsPlaceholder = null;
        this.pageType = null;
        this.titleInputWrapper = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const currentPage = BlockTrees.currentWebPage.data.page;
        this.currentPageIsPlaceholder = currentPage.isPlaceholderPage;
        this.pageType = PageInfoBlockEditForm.internalSivujettiApi.getPageTypes()
            .find(({name}) => name === currentPage.type);
        //
        const state = createState(currentPage, this.pageType);
        if (this.currentPageIsPlaceholder && state.slug === '-') {
            state.slug = makeSlug(state.title);
            currentPage.slug = state.slug; // Note: Mutates BlockTrees.currentWebPage.data.page
            emitValueChangedSignal(state);
        }
        //
        this.setState(hookForm(this, state));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.titleInputWrapper);
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
                    <label htmlFor="title" class="form-label">{ __('Page title') }</label>
                    <Input vm={ this } name="title" id="title" errorLabel={ __('Page title') }
                        validations={ [['required'], ['maxLength', 92]] } myOnChange={ newState => this.handleValueChanged(newState, 'title') } ref={ this.titleInputWrapper }/>
                    <InputError error={ errors.title }/>
                </InputGroupInline>
                <InputGroupInline classes={ classes.slug }>
                    <label htmlFor="slug" class="form-label">{ __('Url (slug)') }</label>
                    <Input vm={ this } name="slug" id="slug" errorLabel={ __('Url (slug)') }
                        validations={ [['required'], ['maxLength', 92], ['regexp', '^/[a-zA-Z0-9_\\-$.+!*\'():,]*$', __(' contains forbidden characters')]] } myOnChange={ newState => this.handleValueChanged(newState, 'slug') }/>
                    <InputError error={ errors.slug }/>
                </InputGroupInline>
                { this.pageType.ownFields.map(field => {
                    if (field.dataType === 'many-to-many')
                        return <p>todo (many-to-many)</p>;
                    const Widget = getWidget(field.dataType);
                    return <InputGroupInline classes={ classes[field.name] } key={ field.name }>
                        <label htmlFor={ field.name } class="form-label">{ __(field.friendlyName) }</label>
                        <Widget field={ field } parent={ this }/>
                    </InputGroupInline>;
                }) }
            </div>
        </>;
    }
    /**
     * @access private
     */
    commitNewPageValues() {
        const currentPage = BlockTrees.currentWebPage.data.page;
        const state = createState(this.state.values, this.pageType);
        Object.assign(currentPage, state); // Note: Mutates BlockTrees.currentWebPage.data.page
        //
        if (!this.currentPageIsPlaceholder) {
            store.dispatch(pushItemToOpQueue('update-page-basic-info', {
                doHandle: this.savePageToBackend.bind(this),
                args: [],
            }));
        } else {
            emitValueChangedSignal(state);
        }
    }
    /**
     * @access private
     */
    savePageToBackend() {
        const currentPage = BlockTrees.currentWebPage.data.page;
        const data = Object.assign({}, currentPage, createState(currentPage, this.pageType));
        delete data.blocks;
        delete data.isPlaceholderPage;
        //
        return http.put(`/api/pages/${currentPage.type}/${currentPage.id}`, data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
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

/**
 * @param {PageMetaRaw} titleSlugAndOwnFields
 */
function emitValueChangedSignal(titleSlugAndOwnFields) {
    signals.emit('on-page-info-form-value-changed', titleSlugAndOwnFields);
}

/**
 * @param {String} title
 * @returns {String}
 */
function makeSlug(title) {
    return `/${stringUtils.slugify(title) || '-'}`;
}

/**
 * @param {Page|Object} from
 * @param {PageType} pageType
 * @return {PageMetaRaw}
 */
function createState(from, pageType) {
    const out = {title: from.title, slug: from.slug};
    for (const field of pageType.ownFields) {
        if (field.dataType === 'many-to-many') {
            out[field.name] = '[]';
            continue;
        }
        const val = from[field.name];
        out[field.name] = val !== null ? val : field.defaultValue;
    }
    return out;
}

/**
 * @param {InternalSivujettiApi} internalSivujettiApi
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
        icon: 'file-info',
        reRender() { throw new Error('Not supported'); },
        editForm: PageInfoBlockEditForm,
    };
};
