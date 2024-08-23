import {__} from '../edit-app-singletons.js';
import {FormGroupInline} from '../Form.jsx';
import {Icon} from '../Icon.jsx';
import Popup from '../Popup.jsx';
import LengthValueInput from './LengthValueInput.jsx';

/** @extends {preact.Component<ValueInputProps<null> & {valueAsString: string|null;}, any>} */
class GridColumnsValueInput extends preact.Component {
    /**
     * @access protected
     */
    render({valueAsString, labelTranslated, isClearable, inputId}, {currentEditPopupData}) {
        let stylesOuter = '';
        let widths = [];
        if (valueAsString) {
            stylesOuter = `grid-template-columns: ${valueAsString}`;
            // ['minmax(0, 140px', 'minmax(0, 1fr', 'minmax(0, 0px']
            const tmp = valueAsString.slice(0, -1).split(') ');
            // ['140px', '1fr', '0px']
            widths = tmp.map(p => p.split(', ')[1]);
        }

        return [<FormGroupInline>
            <label class="form-label p-relative pt-1" htmlFor={ inputId } title={ labelTranslated }>
                { labelTranslated }
            </label>
            <div class="p-relative">
                <div class="grid-builder2 flex-centered mt-1 mr-1">
                    <div class="row" style={ stylesOuter }>
                        { widths.map((width, i) => {
                            return <div class="col flex-centered">
                                <button onClick={ e => this.openColumnForEdit(e, i, widths) } class="btn btn-sm btn-link">
                                    { width } <Icon iconId="pencil" className="size-xxs color-dimmed3"/>
                                </button>
                                <button onClick={ () => this.deleteColumn(i, widths) } class="btn btn-xs btn-link p-absolute" style="right: .2rem;top: .2rem;">
                                    <Icon iconId="x" className="size-xxs color-dimmed3"/>
                                </button>
                            </div>;
                        }) }
                    </div>
                    <button
                        onClick={ () => this.addColumn(widths) }
                        class="btn btn-sm flex-centered btn-link p-0"
                        title={ __('Add columnn') }>
                        <Icon iconId="plus" className="size-xxs color-dimmed3"/>
                    </button>
                </div>
                { isClearable
                    ? <button onClick={ () => { this.props.onValueChanged(null); } }
                        class="btn btn-link btn-xs clear-style-btn"
                        title={ __('Restore default') }>
                            <span class="d-flex"><Icon iconId="circle-x" className="size-xs color-dimmed3"/></span>
                    </button>
                    : null
                }
            </div>
        </FormGroupInline>, currentEditPopupData ? <Popup
            Renderer={ EditWidthPopupRenderer }
            rendererProps={ currentEditPopupData.rendererProps }
            btn={ currentEditPopupData.btn }
            close={ () => this.setState({currentEditPopupData: null}) }/> : null];
    }
    /**
     * @param {Event} e
     * @param {number} idx
     * @param {Array<string>} currentWidths
     * @access private
     */
    openColumnForEdit(e, idx, currentWidths) {
        this.setState({currentEditPopupData: {
            rendererProps: {
                currentWidth: currentWidths[idx],
                onWidthChanged: newWidth => this.emitNewWidths(currentWidths.map((w, i) => i !== idx ? w : newWidth))
            },
            btn: e.target
        }});
    }
    /**
     * @param {number} idx
     * @param {Array<string>} currentWidths
     * @access private
     */
    deleteColumn(idx, currentWidths) {
        this.emitNewWidths(currentWidths.filter((_, i) => i !== idx));
    }
    /**
     * @param {Array<string>} currentWidths
     * @access private
     */
    addColumn(currentWidths) {
        this.emitNewWidths([...currentWidths, '1fr']);
    }
    /**
     * @param {Array<string>} currentWidths
     * @access private
     */
    emitNewWidths(newWidth) {
        this.props.onValueChanged(widthsToDecl(newWidth));
    }
    /**
     * @param {string} input examples: 'minmax(0, 1.2rem) minmax(0, 1fr)'
     * @returns {GridColumnsValue}
     */
    static valueFromInput(input) {
        return {decl: input || null};
    }
    /**
     * @param {GridColumnsValue} value
     * @returns {string}
     */
    static valueToString(value) {
        if (!value) throw new Error(); // ??
        return `${value.decl}`;
    }
}

class EditWidthPopupRenderer extends preact.Component {
    render({currentWidth, onWidthChanged}) {
        return <LengthValueInput
            value={ LengthValueInput.valueFromInput(currentWidth) }
            onValueChanged={ onWidthChanged }
            labelTranslated={ __('Width') }
            isClearable={ false }
            inputId="gridColBuilderColWidth"
            additionalUnits={ ['fr'] }/>;
    }
}

/**
 * @param {Array<string>} widths
 * @param {string} colMinWidth = '0'
 * @returns {string|null}
 */
function widthsToDecl(widths, colMinWidth = '0') {
    return widths ? `${widths.map(width => `minmax(${colMinWidth}, ${width})`).join(' ')}` : null;
}

export default GridColumnsValueInput;
