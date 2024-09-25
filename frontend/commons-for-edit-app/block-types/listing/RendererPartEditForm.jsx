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
/** @typedef {import('../../Form.jsx').InputDef} InputDef */

class RendererPartEditForm extends preact.Component {
    // crudListRef;
    /**
     * @param {{item: RendererPart; onValueChanged: (value: string, key: keyof RendererPart) => void; done: () => void;}} props
     */
    componentWillMount() {
        this.crudListRef = preact.createRef();
        this.setState(hookForm(this, ...this.createHookFormArgs(this.props.item.kind, this.props.item.data)));
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        // ??
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
            <FormGroupInline className="my-1">
                <label class="form-label">{ __('Type') }</label>
                <div>
                    <select
                        onChange={ this.handlePartKindChanged.bind(this) }
                        value={ kind }
                        class="form-select"
                        name="varType">
                        { Object.keys(this.props.partKindsTranslated).map(kind =>
                            <option value={ kind }>{ this.props.partKindsTranslated[kind] }</option>
                        ) }
                    </select>
                </div>
            </FormGroupInline>
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
                    name="varType">
                    { ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(level =>
                        <option value={ level }>{ level }</option>
                    ) }
                </select>
            </FormGroupInline>;
        if (kind === 'image')
            return [
                <FormGroupInline className="my-1">
                    <label class="form-label">{ __('Primary source') }</label>
                    <select
                        onChange={ e => this.emitPartDataChange(e.target.value, 'primarySource') }
                        value={ this.state.primarySource }
                        class="form-select"
                        name="varType">
                        { [{kind: 'content'}, {kind: 'meta'}].map(src =>
                            <option value={ src.kind }>{ src.kind }</option>
                        ) }
                    </select>
                </FormGroupInline>,
                <FormGroupInline className="my-1">
                    <label htmlFor="fallbackImageSrc" class="form-label">{ __('Fallback') }</label>
                    <Input vm={ this } prop="fallbackImageSrc" id="fallbackImageSrc"/>
                    <InputErrors vm={ this } prop="fallbackImageSrc"/>
                </FormGroupInline>
            ];
        if (kind === 'link')
            return <FormGroupInline>
                <label htmlFor="text" class="form-label">{ __('Link text') }</label>
                <Input vm={ this } prop="text" id="text"/>
                <InputErrors vm={ this } prop="text"/>
            </FormGroupInline>;
        return null;
    }
    /**
     * @param {val} any
     * @param {keyof HeadingPartData | keyof ImagePartData | keyof LinkPartData} prop
     * @access private
     */
    emitPartDataChange(val, prop) {
        this.props.onValueChanged({...this.state.data, [prop]: val}, 'data');
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
     * @returns {[Array<InputDef>|null, {[key: string]: any;}]}
     * @access private
     */
    doCreateHookFormArgs(kind) {
        const data = RendererPartEditForm.createPartData(kind);
        if (kind === 'heading') {
            return [null, {headingLevel: `h${data.level}`}];
        } else if (kind === 'image') {
            return [[{name: 'fallbackImageSrc', value: data.fallbackImageSrc, validations: [],
                label: __('Fallback'),
                onAfterValueChanged: (value, hasErrors, _source) => {
                    if (!hasErrors) this.props.onValueChanged({...this.state.data, fallbackImageSrc: value}, 'data'); // throttle ?
                }
            }], {
                primarySource: data.primarySource,
            }];
        } else if (kind === 'link') {
            return [[{name: 'text', value: data.text, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
                label: __('Link text'),
                onAfterValueChanged: (value, hasErrors, _source) => {
                    if (!hasErrors) this.props.onValueChanged({...this.state.data, text: value}, 'data'); // throttle ?
                }
            }], {
                primarySource: data.primarySource,
            }];
        }
        return [null, {}];
    }
    /**
     * @param {Event} e
     * @access private
     */
    handlePartKindChanged(e) {
        const newVal = e.target.value;
        reHookValues(this, ...this.createHookFormArgs(newVal, {}));
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
 * @typedef {HeadingPartData|ImagePartData|LinkPartData} RendererPartData
 */

export default RendererPartEditForm;
