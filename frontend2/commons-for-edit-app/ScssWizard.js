import {mediaScopes} from '../shared-inline.js';
import {
    createScssBlock,
    createScssInspectorInternal,
    createSelector,
    getSelectorForDecl,
    stylesToBaked,
} from './ScssWizardFuncs.js';


class ScssWizard {
    // styles;
    // cachedCompiledScreenSizesCss;
    // stateId;
    /**
     */
    constructor() {
        this.stateId = -1;
    }
    /**
     * Replaces this.styles and this.cachedCompiledScreenSizesCss with $bundle.
     *
     * @param {StylesBundleWithId} bundle
     * @access public
     */
    replaceStylesState(bundle) {
        this.styles = [...bundle.styleChunks];
        this.cachedCompiledScreenSizesCss = bundle.cachedCompiledScreenSizesCss;
        this.stateId = bundle.id;
    }
    /**
     * @param {Number} stateId
     * @returns {Array<StyleChunk>}
     * @access public
     */
    getAllStyles(stateId) {
        if (stateId !== this.stateId)
            throw new Error(`Invalid stateId ${stateId}, expected ${this.stateId}`);
        return this.styles;
    }
    /**
     * @param {styleBlockScope} blockScope
     * @param {String} blockIdOrType
     * @param {(style: StyleChunk) => Boolean} predicate = true
     * @returns {Array<StyleChunk>}
     * @access public
     */
    findStyles(blockScope, blockIdOrType, fn = (_style) => true) {
        const lookFor = createSelector(blockIdOrType, blockScope);
        return this.styles.filter((style) =>
            style.scope.block === blockScope && style.scss.startsWith(lookFor) && fn(style)
        );
    }
    /**
     * @param {String} blockScope
     * @param {String} blockIdOrType
     * @param {mediaScope} mediaScopeId = 'all'
     * @param {stylesLayer} layer = 'user-styles'
     * @returns {StyleChunk}
     * @access public
     */
    findStyle(blockScope, blockIdOrType, mediaScopeId = 'all', layer = 'user-styles') {
        const lookFor = createSelector(blockIdOrType, blockScope);
        const found = this.styles.find(({scope, scss}) =>
            scope.block === blockScope && scope.media === mediaScopeId && scope.layer === layer && scss.startsWith(lookFor)
        );
        return found;
    }
    /**
     * @param {String} scssChunk
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    tryToUpdateUniqueScopeScssChunkAndReturnAllRecompiled(scssChunk, currentStyle, mediaScopeId = 'all') {
        // todo
    }
    /**
     * @param {String} scssChunkToDelete Examples: 'color: red;', '> sub-selector {\n  color: red;\n}'
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    tryToDeleteUniqueScopeScssChunkAndReturnAllRecompiled(scssChunkToDelete, currentStyle, mediaScopeId = 'all') {
        const updated = this.doTryToDeleteUniqueScopedScssChunk(scssChunkToDelete, currentStyle);
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {String} newScssChunk Examples: 'color: red', 'ul li {\n  flex: 0 0 100%;\n}'
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    tryToAddFirstUniqueScopeScssChunkAndReturnAllRecompiled(newScssChunk, blockId, mediaScopeId = 'all') {
        return this.doTryToAddFirstScssChunkAndReturnAllRecompiled(newScssChunk, blockId, mediaScopeId, 'user-styles');
    }
    /**
     * @param {String} scssChunkToAdd
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    tryToAddUniqueScopeScssChunkAndReturnAllRecompiled(scssChunkToAdd, currentStyle, mediaScopeId = 'all') {
        // todo
    /**
     * @param {String} completeScssChunk
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId
     * @param {stylesLayer} layer
     * @returns {StylesBundleWithId}
     * @access private
     */
    doTryToAddFirstScssChunkAndReturnAllRecompiled(completeScssChunk, blockId, mediaScopeId, layer) {
        if (this.findStyle('single-block', blockId, mediaScopeId, layer))
            throw new Error(`Unique style ${blockId}:${mediaScopeId}:${layer} already exist`);

        const updated = [
            ...this.styles,
            {
                scope: {block: 'single-block', media: mediaScopeId, layer},
                scss: createScssBlock(completeScssChunk, `${createSelector(blockId)} {`),
            }
        ];

        return this.commitAll(updated, mediaScopeId);
    /**
     * @param {String} scssChunkToDelete Examples 'color: red;', '> sub-selector {\n  color: red;\n}'
     * @param {StyleChunk} currentStyle
     * @returns {Array<StyleChunk>}
     * @access private
     */
    doTryToDeleteUniqueScopedScssChunk(scssChunkToDelete, currentStyle) {
        return this.styles.map(s => {
            if (s !== currentStyle) return s;

            const current = createScssInspectorInternal(s.scss);
            const del = createScssInspectorInternal(scssChunkToDelete);

            if (scssChunkToDelete.indexOf('\n') > -1)
                throw new Error('todo');
            // get the decl name we're trying to delete
            const [fromDel, fromDelParen] = del.findNode(node => node.type === 'decl');
            const declName = fromDel.props; // Example 'column-gap'

            // find it from the current style.scss
            const containingCssBlockSel = getSelectorForDecl(fromDelParen, current);
            const [nodeToDelete, _toDeleteParen] = current.findNode((node, parenNode) =>
                parenNode &&
                (node.type === 'decl' && node.props === declName) &&
                (parenNode.type === 'rule' && parenNode.value === containingCssBlockSel)
            );
            if (!nodeToDelete)
                throw new Error(`Expected "${s.scss}" to contain "${declName}"`);

            let linesCur = s.scss.split('\n');
            linesCur.splice(nodeToDelete.line - 1, 1);

            if (linesCur.length < 3) // No rules left ( ['[data-block=\"u585XQVD\"] {', '}'] )
                return null;

            return {
                ...s,
                scss: linesCur.join('\n')
            };
        }).filter(s => s !== null);
    }
    /**
     * @param {Array<StyleChunk>} newStylesArr
     * @param {mediaScope} mediaScopeId
     * @returns {StylesBundleWithId}
     * @access private
     */
    commitAll(newStylesArr, mediaScopeId) {

        this.styles = newStylesArr;

        const compiledNew = mediaScopes.map((scopeId, i) =>
            scopeId !== mediaScopeId ? this.cachedCompiledScreenSizesCss[i] : stylesToBaked(this.styles, scopeId)
        );
        compiledNew.forEach(mediaScope => {
            if (mediaScope.length > 1024000) throw new Error('??');
        });
        this.cachedCompiledScreenSizesCss = compiledNew;

        this.stateId += 1;

        //
        return {
            styleChunks: this.styles,
            cachedCompiledScreenSizesCss: this.cachedCompiledScreenSizesCss,
            id: this.stateId,
        };
    }
}

export default ScssWizard;
