import {env, urlUtils} from '@sivujetti-commons-for-web-pages';
import {__, api} from '../../edit-app-singletons.js';
import {
    FormGroup,
    FormGroupInline,
    hookForm,
    Input,
    InputError,
    InputErrors,
    reHookValues,
    Textarea,
    unhookForm,
} from '../../Form.jsx';
import setFocusTo from '../../auto-focusers.js';
import {isUndoOrRedo, objectUtils, timingUtils} from '../../utils.js';
import {makePath, makeSlug} from '../../local-url-utils.js';
import {urlValidatorImpl} from '../../validation.js';
import ImagePicker from '../../ImagePicker.jsx';
import {completeImageSrc} from '../../../shared-inline.js';
import ManyToManyField from './ManyToManyField.jsx';

class PageInfoBlockEditForm extends preact.Component {
    // titleEl;
    // descriptionEl;
    // pageType;
    // ownFields;
    /**
     * @access protected
     */
    componentWillMount() {
        const saveButton = api.saveButton.getInstance();
        const curPage = saveButton.getChannelState('currentPageData');
        this.titleEl = preact.createRef();
        this.descriptionEl = preact.createRef();
        this.pageType = api.getPageTypes().find(({name}) => name === curPage.type);
        this.ownFields = this.pageType.ownFields.filter(({dataType}) => dataType.type === 'many-to-many');

        const throttler = createThrottler(handleValuesChanged);

        const initialFormState = createFormState(curPage);
        this.setState(hookForm(this, [
            {name: 'title', value: initialFormState[0].value, validations: [['required'], ['maxLength', 92]],
             label: __('Page title'), onAfterValueChanged: (value, hasErrors, source) => {
                throttler({
                    ...{title: value},
                    ...(curPage.isPlaceholderPage ? createSlugAndPath(makeSlug(value), this.pageType): {})
                }, hasErrors, source);
            }},
            {name: 'slug', value: initialFormState[1].value, validations: [['required'], ['maxLength', 92],
                [urlValidatorImpl, {allowExternal: false, allowEmpty: true}]],
             label: __('Url (slug)'), onAfterValueChanged: (value, hasErrors, source) => {
                throttler(createSlugAndPath(value, this.pageType), hasErrors, source);
            }},
            {name: 'description', value: initialFormState[2].value, validations: [['maxLength', 300]],
             label: __('Meta description'), onAfterValueChanged: (value, hasErrors, source) => {
                throttler(mut => { mut.meta.description = value; }, hasErrors, source);
             }},
        ], {
            socialImageSrc: getNormalizedMetaImageSrc(curPage),
            status: curPage.status.toString(),
        }));

        this.unregistrables = [saveButton.subscribeToChannel('currentPageData', (page, _userCtx, _ctx) => {
            const newCandidate = createFormState(page);
            if (newCandidate[0].value !== this.state.values.title ||
                newCandidate[1].value !== this.state.values.slug ||
                newCandidate[2].value !== this.state.values.description) {
                reHookValues(this, newCandidate);
            }
            const srcCandidate = getNormalizedMetaImageSrc(page);
            const statusCandidate = page.status.toString();
            if (this.state.socialImageSrc !== srcCandidate || this.state.status !== statusCandidate)
                this.setState({socialImageSrc: srcCandidate, status: statusCandidate});
        })];
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.titleEl);
        window.autosize(this.descriptionEl.current.inputEl.current);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_, {socialImageSrc, metaImgLoadError, status}) {
        const wrap = input => !this.pageType || this.pageType.name === 'Pages'
            ? input
            : <div class="input-group">
                <span class="input-group-addon addon-sm">{ this.pageType.slug }</span>
                { input }
            </div>;
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="pageTitle" class="form-label">{ __('Page title') }</label>
                <Input vm={ this } prop="title" id="pageTitle" ref={ this.titleEl }/>
                <InputErrors vm={ this } prop="title"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="pageSlug" class="form-label">{ __('Url (slug)') }</label>
                { wrap(<Input vm={ this } prop="slug" id="pageSlug"/>) }
                <InputErrors vm={ this } prop="slug"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="pageSlug" class="form-label">{ __('Status') }</label>
                <select
                    onChange={ e => handleValuesChanged({status: parseInt(e.target.value, 10)}) }
                    value={ status }
                    class="form-select"
                    name="pageStatus">
                    <option value="1">{ `${__('Hidden')} (${__('draft')})` }</option>
                    <option value="0">{ `${__('Public')} (${__('published')})` }</option>
                </select>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="socialImageSrc" class="form-label">{ __('Social image') }</label>
                <ImagePicker
                    src={ socialImageSrc }
                    onSrcCommitted={ this.emitNewSocialImageSrc.bind(this) }
                    inputId="socialImageSrc"/>
                <InputError errorMessage={ metaImgLoadError }/>
            </FormGroupInline>
            <FormGroup>
                <label htmlFor="pageDescription" class="form-label">{ __('Meta description') }</label>
                <Textarea vm={ this } prop="description" id="pageDescription" ref={ this.descriptionEl }/>
                <InputErrors vm={ this } prop="description"/>
            </FormGroup>
            { this.ownFields ? this.ownFields.map(field =>
                <ManyToManyField
                    field={ field }
                    emitChanges={ handleValuesChanged }
                    key={ field.name }/>
            ) : null }
        </div>;
    }
    /**
     * @param {string|null} newSrc
     * @param {string|null} mime
     * @param {boolean} _srcWasTyped
     */
    emitNewSocialImageSrc(newSrc, mime, _srcWasTyped) {
        if (newSrc) {
            const tmp = new Image();
            tmp.onload = () => {
                this.setState({metaImgLoadError: null, socialImageSrc: newSrc});
                handleValuesChanged(mut => {
                    mut.meta.socialImage = {src: newSrc, mime,
                        width: tmp.naturalWidth, height: tmp.naturalHeight};
                }, false, null);
            };
            tmp.onerror = () => {
                this.setState({metaImgLoadError: __('Failed to load image'),
                    socialImageSrc: newSrc});
            };
            tmp.src = completeImageSrc(newSrc, urlUtils);
        } else {
            handleValuesChanged(mut => {
                mut.meta.socialImage = null;
            }, false, null);
        }
    }
}

/**
 * @param {Page} page
 * @returns {[{name: string; value: string;}, {name: string; value: string;}, {name: string; value: string;}]}
 */
function createFormState(page) {
    return [
        {name: 'title', value: page.title},
        {name: 'slug', value: page.slug},
        {name: 'description', value: !page.meta ? page.description : getNormalizedDescription(page.meta.description)}
    ];
}

/**
 * @param {{[prop: string]: any;}|(current: Page) => {[prop: string]: any;}} changesOrMutator
 * @param {boolean} _hasErrors = false
 * @param {blockPropValueChangeFlags} flags = null
 */
function handleValuesChanged(changesOrMutator, _hasErrors = false, flags = null) {
    const saveButton = api.saveButton.getInstance();
    const page = saveButton.getChannelState('currentPageData');
    saveButton.pushOp(
        'currentPageData',
        objectUtils.cloneDeepWithChanges(page, pageCopy => {
            if (typeof changesOrMutator !== 'function')
                Object.assign(pageCopy, changesOrMutator);
            else
                changesOrMutator(pageCopy);
            return pageCopy;
        }),
        {event: 'update-basic-info'},
        flags
    );
}

/**
 * @param {string|undefined} value
 * @returns {string}
 */
function getNormalizedDescription(value) {
    return value || '';
}

/**
 * @param {Page} page
 * @returns {string}
 */
function getNormalizedMetaImageSrc(page) {
    return page.meta?.socialImage?.src || null;
}

/**
 * @param {string} slug
 * @param {PageType} pageType
 * @returns {slug: string; path: string;}
 */
function createSlugAndPath(slug, pageType) {
    return {slug, path: makePath(slug, pageType)};
}

function createThrottler(fn) {
    let doFnThrottled = null;
    return (changesOrMutator, hasErrors = false, source = null) => {
        if (!doFnThrottled)
            doFnThrottled = timingUtils.debounce(changes => {
                fn(changes, false, null);
            }, env.normalTypingDebounceMillis);

        if (!isUndoOrRedo(source)) {
            if (hasErrors) throw new Error('todo');
            // Emit "fast"/mergeable op
            fn(changesOrMutator, false, 'is-throttled');
            // Call throttled func, which emits the "slow"/commit op
            doFnThrottled(changesOrMutator);
        }
    };
}

export default {
    name: 'PageInfo',
    friendlyName: 'PageInfo',
    icon: 'file-info',
    editForm: PageInfoBlockEditForm,
    stylesEditForm: null,
    createOwnProps(/*defProps*/) {
        return {
            overrides: '[]',
        };
    }
};
