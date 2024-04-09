import {
    __,
    api,
    scssWizard,
} from './edit-app-singletons.js';
import {mediaScopes} from '../shared-inline.js';

class BlockVisualStylesEditForm extends preact.Component {
    /**
     * @param {String|Event} input
     * @param {String} varName
     * @param {(varName: String, value: String): String} varInputToCssDecl
     * @access protected
     */
    handleCssDeclChanged(input, varName, varInputToCssDecl) {
        const val = input instanceof Event ? input.target.value : input;
        const updatedAll = this.doHandleCssDeclChanged(val, varName, varInputToCssDecl);
        api.saveButton.getInstance().pushOp('stylesBundle', updatedAll);
    }
    /**
     * @param {String} val
     * @param {String} varName
     * @param {(varName: String, value: String): String} varInputToCssDecl
     * @returns {StylesBundleWithId}
     * @access private
     */
    doHandleCssDeclChanged(val, varName, varInputToCssDecl) {
        const {styleScopes, curScreenSizeTabIdx} = this.state;
        const selectedScreenSizeStyles = styleScopes[curScreenSizeTabIdx];
        const current = selectedScreenSizeStyles || {};
        const styleRef = this.userStyleRefs[curScreenSizeTabIdx];
        const newValIsNotEmpty = val?.trim().length > 0;
        const upd = varInputToCssDecl(varName, newValIsNotEmpty ? val : '"dummy"');
        const mediaScope = mediaScopes[curScreenSizeTabIdx];

        if (current[varName]) {
            return newValIsNotEmpty
                ? scssWizard.tryToUpdateUniqueScopeScssChunkAndReturnAllRecompiled(
                    upd,
                    styleRef,
                    mediaScope
                )
                : scssWizard.tryToDeleteUniqueScopeScssChunkAndReturnAllRecompiled(
                    upd,
                    styleRef,
                    mediaScope
                );
        } else {
            return !styleRef
                ? scssWizard.tryToAddFirstUniqueScopeScssChunkAndReturnAllRecompiled(
                    upd,
                    this.props.blockId,
                    mediaScope
                )
                : scssWizard.tryToAddUniqueScopeScssChunkAndReturnAllRecompiled(
                    upd,
                    styleRef,
                    mediaScope
                );
        }
    }
}

/**
 * @param {String} blockId
 * @param {(scss: String|null, scopeId: todo, props: BlockStylesEditFormProps) => CssVarsMap} createStyleState
 * @returns {[Array<CssVarsMap>, todo]}
 */
function createCssVarsMaps(blockId, createStyleState) {
    return mediaScopes.reduce((out, scopeId) => {
        const styleRef = scssWizard.findStyle('single-block', blockId, scopeId);
        const styleVarsForThisMediaScope = createStyleState(styleRef?.scss || null, scopeId);
        out[0].push(styleVarsForThisMediaScope);
        out[1].push(styleRef);
        return out;
    }, [[], []]);
}

export default BlockVisualStylesEditForm;
export {createCssVarsMaps};
