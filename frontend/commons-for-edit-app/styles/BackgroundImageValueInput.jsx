import {urlUtils} from '@sivujetti-commons-for-web-pages';
import {completeImageSrc} from '../../shared-inline.js';
import {__} from '../edit-app-singletons.js';
import {FormGroupInline} from '../Form.jsx';
import {Icon} from '../Icon.jsx';
import ImagePicker from '../ImagePicker.jsx';

/** @extends {preact.Component<ValueInputProps<null> & {valueAsString: String|null;}, any>} */
class BackgroundImageValueInput extends preact.Component {
    /**
     * @access protected
     */
    render({valueAsString, isClearable, labelTranslated, inputId}) {
        return <FormGroupInline>
            <label class="form-label p-relative pt-1" htmlFor={ inputId } title={ labelTranslated }>
                { labelTranslated }
            </label>
            <div class="p-relative">
                <ImagePicker
                    src={ valueAsString }
                    onSrcCommitted={ this.handleImageSrcCommitted.bind(this) }
                    inputId={ inputId }
                    showClearItem
                    omitClearButton/>
                { isClearable
                    ? <button onClick={ () => { this.props.onValueChanged(null); } }
                        class="btn btn-link btn-xs clear-style-btn"
                        title={ __('Restore default') }>
                            <span class="d-flex"><Icon iconId="circle-x" className="size-xs color-dimmed3"/></span>
                    </button>
                    : null
                }
            </div>
        </FormGroupInline>;
    }
    /**
     * @param {String|null} src
     * @param {String|null} _mime
     * @param {Boolean} _srcWasTyped
     */
    handleImageSrcCommitted(src, _mime, _srcWasTyped) {
        this.props.onValueChanged(src ? `url("${completeImageSrc(src, urlUtils)}")` : 'none');
    }
    /**
     * @param {String} input Examples 'url("/public/uploads/cat.jpg")', 'url("/dir/public/uploads/dog.webp")', 'none'
     * @returns {ImageValue}
     */
    static valueFromInput(input) {
        if (input === 'initial')
            return {src: null};
        if (input === 'none')
            return {src: 'none'};
        const begin = 'url("'.length;
        const end = -('")'.length);
        return {src: input.slice(begin, end)};
    }
    /**
     * @param {ImageValue} value
     * @returns {String|null}
     */
    static valueToString(value) {
        return value.src;
    }
}

export default BackgroundImageValueInput;
