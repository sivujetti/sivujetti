import {BlockVisualStylesEditForm} from '@sivujetti-commons-for-edit-app';
import baseStyleVarDefs from './base-style-vars.js';

class BaseStylesVisualEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return baseStyleVarDefs;
    }
    /**
     * @inheritdoc
     */
    renderVarWidget(def, selectedScreenSizeVars, varInputToScssChunk) {
        const orig = super.renderVarWidget(def, selectedScreenSizeVars, varInputToScssChunk);
        return [
            // Buttons
            'bodyStyleButtonsFontSize',
            // Fonts
            'bodyStyleBaseFont',
            // Defaults
            'bodyStylePrimaryColor'
        ].indexOf(def.varName) > -1
            ? [
                <div class="form-group"><div><hr style="border-color: var(--color-section-separator);"/></div></div>,
                orig
            ]
            : orig;
    }
}

export default BaseStylesVisualEditForm;
