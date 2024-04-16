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
     * @param {String} varName
     * @param {String} val
     * @param {translateVarInputToScssChunkFn} varInputToScssChunk
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    addNewUniqueScopeScssChunkAndReturnAllRecompiled(varName, val, varInputToScssChunk, blockId, mediaScopeId = 'all') {
        const updated = this.doTryToAddFirstScssChunk(varName, val, varInputToScssChunk, blockId, mediaScopeId);
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {String} varName
     * @param {String} val
     * @param {translateVarInputToScssChunkFn} varInputToScssChunk
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    updateUniqueScopeScssChunkOfExistingChunkAndReturnAllRecompiled(varName, val, varInputToScssChunk, currentStyle, mediaScopeId = 'all') {
        const updated = this.doTryToUpdateUniqueScopedScssChunk(varName, val, varInputToScssChunk, currentStyle);
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {String} varName
     * @param {String} val
     * @param {translateVarInputToScssChunkFn} varInputToScssChunk
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    deleteUniqueScopeScssChunkOfExistingChunkAndReturnAllRecompiled(varName, val, varInputToScssChunk, currentStyle, mediaScopeId = 'all') {
        const updated = this.doTryToDeleteUniqueScopedScssChunk(varName, val, varInputToScssChunk, currentStyle);
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {String} initialScssChunk Example: '// Your code here ...\ncolor: red;'
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    addNewDevsUniqueScopeScssChunkAndReturnAllRecompiled(initialScssChunk, blockId, mediaScopeId = 'all') {
        const updated = [
            ...this.styles,
            this.createNewUniqueChunk(
                createScssBlock(initialScssChunk, `${createSelector(blockId)} {`),
                blockId,
                mediaScopeId,
                'dev-styles'
            )
        ];
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {String} varName
     * @param {String} val
     * @param {translateVarInputToScssChunkFn} varInputToScssChunk Examples () => 'color: red', () => 'ul li {\n  flex: 0 0 100%;\n}', () => [`.icon {`, `  width: %s;`, `  height: %s;`, `}`,]
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId
     * @returns {StylesBundleWithId}
     * @access private
     */
    doTryToAddFirstScssChunk(varName, val, varInputToScssChunk, blockId, mediaScopeId) {
        const chunkInput = varInputToScssChunk(varName, val);
        if (!Array.isArray(chunkInput))
            return [
                ...this.styles,
                this.createNewUniqueChunk(
                    createScssBlock(chunkInput.replace(/%s/g, val), `${createSelector(blockId)} {`),
                    blockId,
                    mediaScopeId,
                )
            ];
        else
            return [
                ...this.styles,
                this.createNewUniqueChunk(
                    [
                        `${createSelector(blockId)} {`,
                            ...chunkInput.map(l => indent(l.replace('%s', val), 1)),
                        '}'
                    ].join('\n'),
                    blockId,
                    mediaScopeId,
                )
            ];
    /**
     * @param {String} varName
     * @param {String} val
     * @param {translateVarInputToScssChunkFn} varInputToScssChunk Examples () => 'color: red;', () => '> sub-selector {\n  color: red;\n}', () => [`.icon {`, `  width: %s;`, `  height: %s;`, `}`,]
     * @param {StyleChunk} currentStyle
     * @returns {Array<StyleChunk>}
     * @access private
     */
    doTryToUpdateUniqueScopedScssChunk(varName, val, varInputToScssChunk, currentStyle) {
        return this.styles.map(s => {
            if (s !== currentStyle) return s;

            const current = createScssInspectorInternal(s.scss);
            const chunkInput1 = varInputToScssChunk(varName, val);
            const chunkInput2 = Array.isArray(chunkInput1) ? chunkInput1.join('\n') : chunkInput1;
            const chunkInput = chunkInput2.replace(/%s/g, val);
            const upd = createScssInspectorInternal(chunkInput);
            const decls = upd.findNodes((node, _parenNode) => {
                return node.type === 'decl';
            });

            let linesCpy = s.scss.split('\n');
            let linesIncoming = chunkInput.split('\n');
            decls.forEach(([fromUpd, fromDelParen]) => {
                // get the decl name we're trying to update
                const declName = fromUpd.props; // Example 'column-gap'

                // find it from current style.scss
                const containingCssBlockSel = getSelectorForDecl(fromDelParen, current);
                const [toUpdate, _toUpdateParen] = current.findNode((node, parenNode) =>
                    parenNode &&
                    (node.type === 'decl' && node.props === declName) &&
                    (parenNode.type === 'rule' && parenNode.value === containingCssBlockSel)
                );
                if (!toUpdate)
                    throw new Error(`Expected to find \`${declName}\` in \`${containingCssBlockSel}\` (\`${s.scss}\`)`);

                // update it
                linesCpy[toUpdate.line - 1] = indent(linesIncoming[fromUpd.line - 1], 1);
            });

            return {
                ...s,
                scss: linesCpy.join('\n')
            };
        });
    }
    /**
     * @param {String} varName
     * @param {String} val
     * @param {translateVarInputToScssChunkFn} varInputToScssChunk
     * @param {StyleChunk} currentStyle
     * @returns {Array<StyleChunk>}
     * @access private
     */
    doTryToDeleteUniqueScopedScssChunk(varName, val, varInputToScssChunk, currentStyle) {
        const EMPTY_LINE = '^::empty::^';
        return this.styles.map(s => {
            if (s !== currentStyle) return s;

            const current = createScssInspectorInternal(s.scss);
            const chunkInput1 = varInputToScssChunk(varName, val);
            const chunkInput2 = Array.isArray(chunkInput1) ? chunkInput1.join('\n') : chunkInput1;
            const chunkInput = chunkInput2.replace(/%s/g, val);
            const del = createScssInspectorInternal(chunkInput);
            const decls = del.findNodes((node, _parenNode) => {
                return node.type === 'decl';
            });

            let linesCpy = s.scss.split('\n');
            decls.forEach(([fromDel, fromDelParen]) => {
                // get the decl name we're trying to delete
                const declName = fromDel.props; // Example 'column-gap'

                // find it from current style.scss
                const containingCssBlockSel = getSelectorForDecl(fromDelParen, current);
                const [nodeToDelete, _toDeleteParen] = current.findNode((node, parenNode) =>
                    parenNode &&
                    (node.type === 'decl' && node.props === declName) &&
                    (parenNode.type === 'rule' && parenNode.value === containingCssBlockSel)
                );
                if (!nodeToDelete)
                    throw new Error(`Expected "${s.scss}" to contain "${declName}"`);

                // mark it as deleted
                const deleteLineAt = nodeToDelete.line - 1;
                linesCpy[deleteLineAt] = EMPTY_LINE;
            });

            // ['.foo {', '^::empty::^', '}'] -> ['.foo {', '}']
            const withoutEmptyLines = arr => arr.filter(line => line !== EMPTY_LINE);
            linesCpy = withoutEmptyLines(linesCpy);

            // ['.foo {', '}', ...] -> [...]
            let emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(linesCpy);
            while (emptyBlockCloseTagIdx > 0 && linesCpy.length) {
                linesCpy[emptyBlockCloseTagIdx] = EMPTY_LINE;
                linesCpy[emptyBlockCloseTagIdx - 1] = EMPTY_LINE;
                linesCpy = withoutEmptyLines(linesCpy);
                emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(linesCpy);
            }

            // No rules left ( ['[data-block=\"u585XQVD\"] {', '}'] )
            if (!linesCpy.length)
                return null;

            return {
                ...s,
                scss: linesCpy.join('\n')
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
    /**
     * @param {String} scss
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId
     * @param {stylesLayer} layer = 'user-styles'
     * @returns {StyleChunk}
     * @access private
     */
    createNewUniqueChunk(scss, blockId, mediaScopeId, layer = 'user-styles') {
        if (this.findStyle('single-block', blockId, mediaScopeId, layer, this.styles))
            throw new Error(`Unique style ${blockId}:${mediaScopeId}:${layer} already exist`);
        return {
            scope: {block: 'single-block', media: mediaScopeId, layer},
            scss,
        };
    }
}

export default ScssWizard;
