import {__, InputError, timingUtils, env} from '@sivujetti-commons-for-edit-app';
import CssStylesValidatorHelper from '../../commons/CssStylesValidatorHelper.js';

class StyleTextarea extends preact.Component {
    // cssValidator;
    // handleCssInputChangedThrottled;
    /**
     * @access protected
     */
    componentWillMount() {
        this.cssValidator = new CssStylesValidatorHelper;
        this.handleCssInputChangedThrottled = timingUtils.debounce(e => {
            if (!this.props.unitCopyReal) {
                const currentlyCommitted = this.props.scss;
                const {unitCls} = this.props;
                const allowImports = unitCls === 'j-_body_';
                const newScss = e.target.value;
                const [shouldCommit, result] = this.cssValidator.validateAndCompileScss(newScss,
                    input => `.${unitCls}{${input}}`, currentlyCommitted, allowImports);
                // Wasn't valid -> commit to local state only
                if (!shouldCommit)
                    this.setState({scssNotCommitted: newScss, error: result.error});
                // Was valid, pass to the caller
                else
                    this.props.onScssChanged(newScss);
            }
        }, env.normalTypingDebounceMillis);
    }
    /**
     * @param {{scss: String; unitCls: String; onScssChanged: (newScss: String) => void;}} props
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
