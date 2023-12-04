import {__, InputError} from '@sivujetti-commons-for-edit-app';

class StyleTextarea extends preact.Component {
    /**
     * @access protected
     */
    render({scss}) {
        const unitDerivedFrom = null;
        const error = null;
        return [
            <textarea
                value={ scss }
                onInput={ this.handleCssInputChangedThrottled }
                class={ `form-input code${!unitDerivedFrom ? '' : ' padded-top'}` }
                placeholder={ `color: green;\n.nested {\n  color: blue;\n}` }
                rows="12"></textarea>,
            <InputError errorMessage={ error }/>
        ];
    }
}

export default StyleTextarea;
