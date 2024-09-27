import {validationConstraints} from '../../constants.js';
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
import ImagePicker from '../../ImagePicker.jsx';
/** @typedef {import('../../Form.jsx').InputDef} InputDef */

class RendererPartEditForm extends preact.Component {
    // crudListRef;
    /**
     * @param {{item: RendererPart; onValueChanged: (value: string, key: keyof RendererPart, key2: keyof HeadingPartData | keyof ImagePartData | keyof LinkPartData | keyof ExcerptPartData) => void; done: () => void;}} props
     */
    componentWillMount() {
        this.crudListRef = preact.createRef();
        this.setState(hookForm(this, ...this.createHookFormArgs(this.props.item.kind, this.props.item.data)));
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        const maybeNext = this.createHookFormArgs(props.item.kind, props.item.data);
        if (JSON.stringify(this.state.data) !== JSON.stringify(maybeNext[1].data))
            this.setState(reHookValues(this, ...maybeNext));
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
    render({done}, {kind}) {
        return <div class="form-horizontal">
            <button
                onClick={ () => done() }
                class="btn btn-sm"
                disabled={ hasErrors(this) }
                title={ __('Done') }
                type="button">&lt;</button>
            { this.renderDataInputs(kind) }
        </div>;
    }
    /**
     * @param {string} kind
     * @returns {preact.VNode|Array<preact.VNode>}
     * @access private
     */
    renderDataInputs(kind) {
        if (kind === 'heading')
            return <FormGroupInline className="my-1">
                <label class="form-label">{ __('Level') }</label>
                <select
                    onChange={ e => this.emitPartDataChange(parseInt(e.target.value[1], 10), 'level') }
                    value={ this.state.headingLevel }
                    class="form-select"
                    name="headingLevel">
                    { ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(level =>
                        <option value={ level }>{ level }</option>
                    ) }
                </select>
            </FormGroupInline>;
        if (kind === 'image')
            return [
                <FormGroupInline className="my-1">
                    <label class="form-label">
                        { __('Primary source') }
                        <span
                            class="tooltip tooltip-right tooltip-auto-width p-absolute mt-1 ml-1"
                            data-tooltip={ __('Choose where to retrieve the image from:\n\n%s: Use the first image found in the page content.\n%s: Use the %s defined in the page\'s metadata.', __('Page content'), __('PageInfo'), __('Social image').toLowerCase()) }>
                            <Icon iconId="info-circle" className="color-dimmed3 size-xs"/>
                        </span>
                    </label>
                    <div class="pl-2">
                    <select
                        onChange={ e => this.emitPartDataChange(e.target.value, 'primarySource') }
                        value={ this.state.primarySource }
                        class="form-select"
                        name="primarySource">
                        <option value="content">{ __('Page content') }</option>
                        <option value="meta">{ `${__('PageInfo')} (${__('Social image').toLowerCase()})` }</option>
                    </select>
                    </div>
                </FormGroupInline>,
                <FormGroupInline className="my-1">
                    <label htmlFor="fallbackImageSrc" class="form-label">{ __('Fallback') }</label>
                    <div class="pl-2"><ImagePicker
                        src={ this.state.fallbackImageSrc }
                        onSrcCommitted={
                        /**
                        * @param {String|null} src
                        * @param {String|null} _mime
                        * @param {Boolean} srcWasTyped
                        */
                        (src, _mime, srcWasTyped) => {
                            if (!srcWasTyped)
                                this.props.onValueChanged({...this.state.data, fallbackImageSrc: src}, 'data', 'ignore-this');
                            else
                                this.emitPartDataChange(src || '', 'fallbackImageSrc');
                        } }
                        inputId="fallbackImageSrc"/></div>
                </FormGroupInline>,
            ];
        if (kind === 'link')
            return <FormGroupInline className="my-1">
                <label htmlFor="text" class="form-label">{ __('Text') }</label>
                <Input vm={ this } prop="text" id="text"/>
                <InputErrors vm={ this } prop="text"/>
            </FormGroupInline>;
        if (kind === 'excerpt')
            return [
                <FormGroupInline className="my-1">
                    <label class="form-label">
                        { __('Primary source') }
                        <span
                            class="tooltip tooltip-right tooltip-auto-width p-absolute mt-1 ml-1"
                            data-tooltip={ __('Choose where to retrieve the text from:\n\n%s: Use the first text from the page\'s content.\n%s: Use the %s from the page metadata.', __('Page content'), __('PageInfo'), __('Meta description').toLowerCase()) }>
                            <Icon iconId="info-circle" className="color-dimmed3 size-xs"/>
                        </span>
                    </label>
                    <div class="pl-2">
                    <select
                        onChange={ e => this.emitPartDataChange(e.target.value, 'primarySource') }
                        value={ this.state.primarySource }
                        class="form-select"
                        name="primarySource">
                        <option value="content">{ __('Page content') }</option>
                        <option value="meta">{ `${__('PageInfo')} (${__('Meta description').toLowerCase()})` }</option>
                    </select>
                    </div>
                </FormGroupInline>,
            ];
        return null;
    }
    /**
     * @param {val} any
     * @param {keyof HeadingPartData | keyof ImagePartData | keyof LinkPartData} prop
     * @access private
     */
    emitPartDataChange(val, prop) {
        this.props.onValueChanged({...this.state.data, [prop]: val}, 'data', prop);
    }
    /**
     * @param {string} kind
     * @param {RendererPartData|null} data
     * @returns {[Array<InputDef>, ({kind: string; data: RendererPartData} & {[key: string]: any;})]} [inputDefs, state]
     * @access private
     */
    createHookFormArgs(kind, data) {
        const [inputs, state] = this.doCreateHookFormArgs(kind, data);
        return [
            inputs || [{name: 'dummy', value: '', validations: [], label: ''}],
            {kind, data, ...state}
        ];
    }
    /**
     * @param {string} kind
     * @param {RendererPartData} data
     * @returns {[Array<InputDef>|null, {[key: string]: any;}]}
     * @access private
     */
    doCreateHookFormArgs(kind, data) {
        if (kind === 'heading') {
            return [null, {headingLevel: `h${data.level}`}];
        } else if (kind === 'image') {
            return [null, {
                primarySource: data.primarySource,
                fallbackImageSrc: data.fallbackImageSrc,
            }];
        } else if (kind === 'link') {
            return [[{name: 'text', value: data.text, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
                label: __('Text'),
                onAfterValueChanged: (value, hasErrors, _source) => {
                    if (!hasErrors) this.emitPartDataChange(value, 'text');
                }
            }], {
                primarySource: data.primarySource,
            }];
        } else if (kind === 'excerpt') {
            return [null, {
                primarySource: data.primarySource,
            }];
        }
        return [null, {}];
    }
}

/**
 * @param {string} kind
 * @returns {RendererPartData|null}
 */
RendererPartEditForm.createPartData = kind => {
    if (kind === 'heading') {
        return {
            level: 2,
        };
    } else if (kind === 'image') {
        return {
            primarySource: 'content',
            fallbackImageSrc: '',
        };
    } else if (kind === 'link') {
        return {
            text: 'Read more',
        };
    } else if (kind === 'excerpt') {
        return {
            primarySource: 'content',
        };
    }
    return null;
};

/**
 * @typedef {{
 *   kind: string;
 *   data: RendererPartData|null;
 * }} RendererPart
 *
 * @typedef {{level: number;}} HeadingPartData
 *
 * @typedef {{primarySource: 'content'|'meta'; fallbackImageSrc: string;}} ImagePartData
 *
 * @typedef {{text: string;}} LinkPartData
 *
 * @typedef {{primarySource: 'content'|'meta';}} ExcerptPartData
 *
 * @typedef {HeadingPartData|ImagePartData|LinkPartData|ExcerptPartData} RendererPartData
 */

export default RendererPartEditForm;
