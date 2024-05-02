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
     * @returns {StyleChunk|null}
     * @access public
     */
    findStyle(blockScope, blockIdOrType, mediaScopeId = 'all', layer = 'user-styles') {
        const lookFor = createSelector(blockIdOrType, blockScope);
        const found = this.styles.find(({scope, scss}) =>
            scope.block === blockScope && scope.media === mediaScopeId && scope.layer === layer && scss.startsWith(lookFor)
        );
        return found || null;
    }
    /**
     * @param {scssCodeInput} codeTemplate Examples 'color: red', 'ul li {\n  flex: 0 0 100%;\n}', [`.icon {`, `  width: %s;`, `  height: %s;`, `}`,]
     * @param {String} val
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    addNewUniqueScopeChunkAndReturnAllRecompiled(codeTemplate, val, blockId, mediaScopeId = 'all') {
        const updated = this.doAddFirstScssChunk(codeTemplate, val, blockId, mediaScopeId);
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {Array<StyleChunk>} newUniqueScopeChunksToAdd Example [{scope: {block: 'single-block', layer: 'user-styles', media: 'all'}, scss: '[data-block="abcdefg"] {\n  color: #ab7878;\n}'}]
     * @returns {StylesBundleWithId}
     * @access public
     */
    addManyNewUniqueScopeChunksAndReturnAllRecompiled(newUniqueScopeChunksToAdd) {
        const affectedMediaScopeIds = {};
        for (const {scope, scss} of newUniqueScopeChunksToAdd) {
            const {media, layer} = scope;
            const blockId = scss.split('data-block="')[1].split('"')[0];
            if (this.findStyle('single-block', blockId, media, layer, this.styles))
                throw new Error(`Unique style ${blockId}:${media}:${layer} already exist`);
            affectedMediaScopeIds[media] = 1;
        }
        const updated = [
            ...this.styles,
            ...newUniqueScopeChunksToAdd,
        ];
        return this.commitAll(updated, affectedMediaScopeIds);
    }
    /**
     * @param {scssCodeInput} codeTemplate Examples 'color: red;', '> sub-selector {\n  color: red;\n}', [`.icon {`, `  width: %s;`, `  height: %s;`, `}`,]
     * @param {String} val
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(codeTemplate, val, currentStyle, mediaScopeId = 'all') {
        const updated = this.doAddOrUpdateScssCodeOfExistingUniqueScopedChunk(codeTemplate, val, currentStyle);
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {scssCodeInput} codeTemplate
     * @param {String} val
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    deleteScssCodeFromExistingUniqueScopeChunkAndReturnAllRecompiled(codeTemplate, val, currentStyle, mediaScopeId = 'all') {
        const updated = this.deleteScssCodeFromExistingUniqueScopedChunk(codeTemplate, val, currentStyle);
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
     * @param {String} updatedScssChunk Example: 'color: blue;'
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    updateDevsExistingUniqueScopeChunkWithScssChunkAndReturnAllRecompiled(updatedScssChunk, currentStyle, mediaScopeId = 'all') {
        const updated = this.styles.map(s =>
            s !== currentStyle
                ? s
                : {
                    ...s,
                    scss: updatedScssChunk,
                }
        );
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {scssCodeInput} codeTemplate
     * @param {String} val
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId
     * @returns {StylesBundleWithId}
     * @access private
     */
    doAddFirstScssChunk(inputCodeTemplate, val, blockId, mediaScopeId) {
        if (!Array.isArray(inputCodeTemplate))
            return [
                ...this.styles,
                this.createNewUniqueChunk(
                    createScssBlock(inputCodeTemplate.replace(/%s/g, val), `${createSelector(blockId)} {`),
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
                            ...inputCodeTemplate.map(l => indent(l.replace('%s', val), 1)),
                        '}'
                    ].join('\n'),
                    blockId,
                    mediaScopeId,
                )
            ];
    }
    /**
     * @param {scssCodeInput} codeTemplate
     * @param {String} val
     * @param {StyleChunk} currentStyle
     * @returns {Array<StyleChunk>}
     * @access private
     */
    doAddOrUpdateScssCodeOfExistingUniqueScopedChunk(codeTemplate, val, currentStyle) {
        return this.styles.map(s => {
            if (s !== currentStyle) return s;

            const incoming1 = Array.isArray(codeTemplate) ? codeTemplate.join('\n') : codeTemplate;
            const incoming = incoming1.replace(/%s/g, val);
            const linesIncoming = incoming.split('\n');
            const decls = createScssInspectorInternal(incoming).findNodes((node, _parenNode) => {
                return node.type === 'decl';
            });

            let inspector = createScssInspectorInternal(s.scss);
            let lines = s.scss.split('\n');
            decls.forEach(([fromInc, fromIncParen]) => {
                // name of the decl we're adding or updating, 'column-gap' for example
                const declName = fromInc.props;

                // find it from current style.scss
                const containingCssBlockSel = getSelectorForDecl(fromIncParen, inspector);
                const [toUpdate, _toUpdateParen] = inspector.findNode((node, parenNode) =>
                    parenNode &&
                    (node.type === 'decl' && node.props === declName) &&
                    (parenNode.type === 'rule' && parenNode.value === containingCssBlockSel)
                );

                const newLine = indent(linesIncoming[fromInc.line - 1], 1);
                if (toUpdate) { // update it
                    lines[toUpdate.line - 1] = newLine;
                } else { // add
                    if (!fromIncParen) { // root level decl, add to the beginning
                        lines.splice(1, 0, newLine);
                    } else { // inner block's decl
                        const targetScope = inspector.getAst().find((n, i) =>
                            i > 0 && // skip root
                            n.parent && n.type === 'rule' && n.value === containingCssBlockSel
                        );

                        // inner scope (css block) exist, add to the beginning
                        if (targetScope)
                            lines.splice(targetScope.children[0].line - 1, 0, newLine);
                        // scope doesn't exist, add to the end of root
                        else
                            lines.splice(lines.length - 1, 0,
                                indent(`${containingCssBlockSel} {`, 1),
                                newLine,
                                indent('}', 1),
                            );
                    }
                }

                // update inspector, since inspector.getAst()[*].line may have changed
                inspector = createScssInspectorInternal(lines.join('\n'));
            });

            return {
                ...s,
                scss: lines.join('\n')
            };
        });
    }
    /**
     * @param {scssCodeInput} codeTemplate
     * @param {String} val
     * @param {StyleChunk} currentStyle
     * @returns {Array<StyleChunk>}
     * @access private
     */
    deleteScssCodeFromExistingUniqueScopedChunk(codeTemplate, val, currentStyle) {
        const EMPTY_LINE = '^::empty::^';
        return this.styles.map(s => {
            if (s !== currentStyle) return s;

            const incoming1 = Array.isArray(codeTemplate) ? codeTemplate.join('\n') : codeTemplate;
            const incoming = incoming1.replace(/%s/g, val);
            const decls = createScssInspectorInternal(incoming).findNodes((node, _parenNode) => {
                return node.type === 'decl';
            });

            let inspector = createScssInspectorInternal(s.scss);
            let lines = s.scss.split('\n');
            decls.forEach(([fromDel, fromDelParen]) => {
                // name of the decl we're deleting 'column-gap' for example
                const declName = fromDel.props;

                // find it from current style.scss
                const containingCssBlockSel = getSelectorForDecl(fromDelParen, inspector);
                const [nodeToDelete, _toDeleteParen] = inspector.findNode((node, parenNode) =>
                    parenNode &&
                    (node.type === 'decl' && node.props === declName) &&
                    (parenNode.type === 'rule' && parenNode.value === containingCssBlockSel)
                );
                if (!nodeToDelete)
                    throw new Error(`Expected "${s.scss}" to contain "${declName}"`);

                // mark it as deleted
                const deleteLineAt = nodeToDelete.line - 1;
                lines[deleteLineAt] = EMPTY_LINE;
            });

            // ['.foo {', '^::empty::^', '}'] -> ['.foo {', '}']
            const withoutEmptyLines = arr => arr.filter(line => line !== EMPTY_LINE);
            lines = withoutEmptyLines(lines);

            // ['.foo {', '}', ...] -> [...]
            let emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(lines);
            while (emptyBlockCloseTagIdx > 0 && lines.length) {
                lines[emptyBlockCloseTagIdx] = EMPTY_LINE;
                lines[emptyBlockCloseTagIdx - 1] = EMPTY_LINE;
                lines = withoutEmptyLines(lines);
                emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(lines);
            }

            // No rules left ( ['[data-block=\"u585XQVD\"] {', '}'] )
            if (!lines.length)
                return null;

            return {
                ...s,
                scss: lines.join('\n')
            };
        }).filter(s => s !== null);
    }
    /**
     * @param {Array<StyleChunk>} newStylesArr
     * @param {mediaScope|{[key: mediaScope]: any;}} mediaScopeIdOrIds
     * @returns {StylesBundleWithId}
     * @access private
     */
    commitAll(newStylesArr, mediaScopeIdOrIds) {

        this.styles = newStylesArr;

        const mediaScopesToUpdate = typeof mediaScopeIdOrIds === 'string' ? {[mediaScopeIdOrIds]: 1} : mediaScopeIdOrIds;
        const compiledNew = mediaScopes.map((scopeId, i) =>
            !mediaScopesToUpdate[scopeId] ? this.cachedCompiledScreenSizesCss[i] : stylesToBaked(this.styles, scopeId)
        );
        compiledNew.forEach(compiledSingleScope => {
            if (compiledSingleScope.length > 1024000) throw new Error('??');
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
