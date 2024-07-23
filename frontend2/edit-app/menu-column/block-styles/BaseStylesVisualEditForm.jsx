import {__, BlockVisualStylesEditForm, scssUtils, scssWizard} from '@sivujetti-commons-for-edit-app';
import baseStyleVarDefs, {essentialVarNames} from './base-style-vars.js';

class BaseStylesVisualEditForm extends BlockVisualStylesEditForm {
    // showAll;
    /**
     * @inheritdoc
     */
    componentWillMount() {
        super.componentWillMount();
        this.showAll = false;
    }
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        const customBaseScssChunk = scssWizard.findStyle('base-freeform', undefined, 'all', 'base-styles');
        const fontNames = getDevDefinedFontNames(customBaseScssChunk.scss);
        return fontNames.length
            ? baseStyleVarDefs.map(def =>
                (!def.cssProp.endsWith('-font-family') ? def : {
                    ...def,
                    widgetSettings: {
                        ...def.widgetSettings,
                        options: [
                            ...fontNames.map(fontFamily => ({label: fontFamily, value: `"${fontFamily}"`})),
                            ...def.widgetSettings.options,
                        ]
                    }
                })
            )
            : baseStyleVarDefs;
    }
    /**
     * @inheritdoc
     */
    renderVarWidget(def, selectedScreenSizeVars, varInputToScssCode) {
        if (def === this.cssVarDefs[0]) return [
            <label class="form-switch d-inline-flex" style="opacity: .7;">
                <input type="checkbox" checked={ this.showAll } onClick={ () => {
                    this.showAll = !this.showAll;
                    this.forceUpdate();
                } }/>
                <i class="form-icon"></i> { __('Show all') }
            </label>,
            super.renderVarWidget(def, selectedScreenSizeVars, varInputToScssCode)
        ];

        if (!this.showAll && essentialVarNames.indexOf(def.varName) < 0)
            return null;

        const orig = super.renderVarWidget(def, selectedScreenSizeVars, varInputToScssCode);
        return [
            // Fonts
            'baseStyleBaseFont',
            // Buttons
            'baseStyleButtonsBgColorNormal',
            // Defaults #2
            'baseStyleSecondaryColor',
            // Forms
            'baseStyleInputsTextColor'
        ].indexOf(def.varName) > -1
            ? [
                <div class="form-group"><div><hr style="border-color: var(--color-section-separator);"/></div></div>,
                orig
            ]
            : orig;
    }
}

/**
 * @param {string} scss
 * @returns {Array<string>}
 */
function getDevDefinedFontNames(scss) {
    const maybeDuplicates = scssUtils.extractImports(scss).map(({fontFamily}) => fontFamily);
    const unique = [...new Set(maybeDuplicates)];
    return unique;
}

export default BaseStylesVisualEditForm;
