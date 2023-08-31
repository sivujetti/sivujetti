import {__, api, env, http, timingUtils, Icon, InputError} from '@sivujetti-commons-for-edit-app';
import {createTrier} from '../../block/dom-commons.js';
import CssStylesValidatorHelper from '../../commons/CssStylesValidatorHelper.js';
import store2 from '../../store2.js';
import store, {pushItemToOpQueue} from '../../store.js';
import {isBodyRemote} from './style-utils.js';

const {compile, serialize, stringify} = window.stylis;

const SPECIAL_BASE_UNIT_NAME = '_body_';
const specialBaseUnitCls = createUnitClass('', SPECIAL_BASE_UNIT_NAME);

class StylesTextarea extends preact.Component {
    // handleCssInputChangedThrottled;
    /**
     * @access protected
     */
    componentWillMount() {
        this.init(this.props);
        this.updateState(this.props);
    }
    /**
     * @param {StyleTextareaProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        this.init(props);
        if (getRealUnit(props).scss !== this.state.scssCommitted)
            this.updateState(props);
    }
    /**
     * @access protected
     */
    render(props, {scssNotCommitted, error}) {
        return <div class="pb-2 pr-2">
            { props.blockTypeName !== SPECIAL_BASE_UNIT_NAME ? null : <div class="p-absolute" style="right: 1.1rem;z-index: 1;margin: 0.3rem 0 0 0;">
                <Icon iconId="info-circle" className="size-xs color-dimmed3"/>
                <span ref={ el => tempHack2(el, 'bodyStyles', this) } class="my-tooltip tooltip-prerendered tooltip-dark">
                    <span>&lt;body&gt; -elementin tyylit. Voit esim. määritellä tänne muuttujia ja käyttää niitä sisältölohkojen tyyleissä.</span>
                    <span class="popper-arrow" data-popper-arrow></span>
                </span>
            </div> }
            <textarea
                value={ scssNotCommitted }
                onInput={ this.handleCssInputChangedThrottled }
                class="form-input code"
                placeholder={ `color: green;\n.nested {\n  color: blue;\n}` }
                rows="12"></textarea>
            <InputError errorMessage={ error }/>
        </div>;
    }
    /**
     * @param {StyleTextareaProps} props
     * @access private
     */
    updateState(props) {
        this.setState({scssNotCommitted: getRealUnit(props).scss, scssCommitted: getRealUnit(props).scss, error: ''});
    }
    /**
     * @param {StyleTextareaProps} props
     * @access private
     */
    init(props) {
        if (props.isVisible && !this.handleCssInputChangedThrottled) {
            this.cssValidator = new CssStylesValidatorHelper;
            this.handleCssInputChangedThrottled = timingUtils.debounce(e => {
                if (!this.props.unitCopyReal)
                    updateAndEmitUnitScss(this.props.unitCopy, copy => {
                        const currentlyCommitted = copy.scss;
                        const {unitCls} = this.props;
                        const allowImports = unitCls === 'j-_body_';
                        const scss = e.target.value;
                        const [shouldCommit, result] = this.cssValidator.validateAndCompileScss(scss,
                            input => `.${unitCls}{${input}}`, currentlyCommitted, allowImports);
                        // Wasn't valid -> commit to local state only
                        if (!shouldCommit) {
                            this.setState({scssNotCommitted: scss, error: result.error});
                            return null;
                        }
                        // Was valid, dispatch to the store
                        const isDerivedFromBodyUnit = isBodyRemote(copy.derivedFrom);
                        const newOptimizedScss = !copy.derivedFrom ? null : optimizeScss(scss, findBaseUnitOf(copy, findBlockTypeStyles(store2.get().themeStyles, !isDerivedFromBodyUnit ? this.props.blockTypeName : SPECIAL_BASE_UNIT_NAME).units).scss);
                        return {
                            ...{newScss: scss, newGenerated: result.generatedCss || ''},
                            ...(!newOptimizedScss ? {} : {
                                newOptimizedScss,
                                newOptimizedGenerated: newOptimizedScss
                                    ? serialize(compile(`.${unitCls}{${newOptimizedScss}}`), stringify)
                                    : null
                            })
                        };
                    }, this.props.blockTypeName);
                else
                    updateAndEmitUnitScss(this.props.unitCopyReal, copy => {
                        const [shouldCommit, result] = compileSpecial(e.target.value, copy.scss, copy.specifier,
                            this.props.unitCls, this.props.blockTypeName, this.cssValidator);
                        //
                        if (!shouldCommit) {
                            this.setState({scssNotCommitted: e.target.value, error: result.error});
                            return null;
                        }
                        //
                        return {newScss: e.target.value,
                                newGenerated: result.generatedCss || ''};
                    }, SPECIAL_BASE_UNIT_NAME);
            }, env.normalTypingDebounceMillis);
        }
    }
}

/**
 * @param {StyleTextareaProps} props
 * @returns {ThemeStyleUnit}
 */
function getRealUnit(props) {
    return props.unitCopyReal || props.unitCopy;
}

function tempHack2(el, popperId, cmp) {
    if (!el || cmp[`${popperId}-load`]) return;
    cmp[`${popperId}-load`] = true;
    createTrier(() => {
        if (!window.Popper) return false;
        createPopper(el, popperId, cmp);
        cmp[`${popperId}-load`] = false;
        return true;
    }, 100, 20)();
}

/**
 * @param {HTMLElement} el
 * @param {String} popperId
 * @param {BlockStylesTab} cmp
 * @param {Number} overflowPadding = 8
 */
function createPopper(el, popperId, cmp, overflowPadding = 8) {
    if (!el || cmp[popperId]) return;
    //
    const ref = el.previousElementSibling;
    const content = el;
    cmp[popperId] = window.Popper.createPopper(ref, content, {
        placement: 'top',
        modifiers: [{
            name: 'offset',
            options: {offset: [0, 8]},
        }, {
            name: 'preventOverflow',
            options: {altAxis: true, padding: overflowPadding},
        }],
    });
    ref.addEventListener('mouseenter', () => showPopper(content, cmp[popperId]));
    ref.addEventListener('mouseleave', () => hidePopper(content));
}

function showPopper(content, popperInstance) {
    content.classList.add('visible');
    popperInstance.update();
}

function hidePopper(content) {
    content.classList.remove('visible');
}

/**
 * @param {Array<ThemeStyle>} from
 * @param {String} blockTypeName
 * @returns {ThemeStyle|undefined}
 */
function findBlockTypeStyles(from, blockTypeName) {
    return from.find(s => s.blockTypeName === blockTypeName);
}

/**
 * @param {String} newScss
 * @param {String} curScss
 * @param {String} specifier '>' or ''
 * @param {String} unitCls 'j-Section-unit-13'
 * @param {String} blockTypeName 'Section'
 * @param {CssStylesValidatorHelper} cssValidator = new CssStylesValidatorHelper
 * @returns {Array<Boolean|{generatedCss: String|null; error: String;}>}
 */
function compileSpecial(newScss, curScss, specifier, unitCls, blockTypeName, cssValidator = new CssStylesValidatorHelper) {
    const currentlyCommitted = curScss;
    const allowImports = false;
    // '.j-_body_ .j-Section:not(.no-j-Section-unit-1) {' or '.j-_body_ > .j-Section:not(.no-j-Section-unit-1) {' or
    // '.j-_body_ > .j-Section:not(...'
    const wrap1 = `.${createUnitClassSpecial(unitCls, blockTypeName, specifier)} {`;
    const wrap2 =  '}';
    return cssValidator.validateAndCompileScss(newScss,
        input => `${wrap1}${input}${wrap2}`, currentlyCommitted, allowImports);
}

/**
 * @param {ThemeStyleUnit} unitCopy
 * @param {(unitCopy: ThemeStyleUnit) => ({scss?: String; generatedCss?: String; newOptimizedScss?: String|null; newOptimizedGenerated?: String|null; specifier?: String;}|null)} getUpdates
 * @param {String} blockTypeName
 */
function updateAndEmitUnitScss(unitCopy, getUpdates, blockTypeName) {
    const {id, scss, generatedCss, optimizedScss, optimizedGeneratedCss} = unitCopy;
    const dataBefore = {...{scss, generatedCss}, ...(!optimizedGeneratedCss ? {} : {optimizedScss, optimizedGeneratedCss})};
    //
    const updates = getUpdates(unitCopy);
    if (!updates) return;
    //
    emitUnitChanges({...{
        scss: updates.newScss,
        generatedCss: updates.newGenerated,
    }, ...(!updates.newOptimizedGenerated ? {} : {
        optimizedScss: updates.newOptimizedScss,
        optimizedGeneratedCss: updates.newOptimizedGenerated,
    })}, dataBefore, blockTypeName, id);
}

/**
 * @param {{scss?: String; generatedCss?: String; specifier?: String; isDerivable?: String;}} updates
 * @param {ThemeStyleUnit} before
 * @param {String} blockTypeName
 * @param {String} unitId Example 'unit-12' (if origin = '' | '_body_'), 'j-Something-uniot-12' (if origin = 'Something')
 * @param {() => void} doUndo = null
 */
function emitUnitChanges(updates, before, blockTypeName, unitId, doUndoFn = null) {
    store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, updates]);
    emitCommitStylesOp(blockTypeName, doUndoFn || (() => {
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, before]);
    }));
}

/**
 * @param {String} blockTypeName
 * @param {() => void} doUndo
 * @param {ThemeStyleUnit} removedRemote = null
 * @param {String} removedRemoteBlockTypeName = null
 */
function emitCommitStylesOp(blockTypeName, doUndo, removedRemote = null, removedRemoteBlockTypeName = null) {
    const url = `/api/themes/${api.getActiveTheme().id}/styles/scope-block-type/${blockTypeName}`;
    store.dispatch(pushItemToOpQueue(`upsert-theme-style#${url}`, {
        doHandle: () => {
            const style = findBlockTypeStyles(store2.get().themeStyles, blockTypeName);
            const remoteStyle = removedRemote ? getRemoteStyleIfRemoved(style.units, removedRemote.id, removedRemoteBlockTypeName) : null;
            const data = {
                ...{units: style.units},
                ...(!remoteStyle ? {} : {connectedUnits: remoteStyle.units, connectedUnitsBlockTypeName: removedRemoteBlockTypeName})
            };
            return http.put(url, data)
                .then(resp => {
                    if (resp.ok !== 'ok') throw new Error('-');
                    return true;
                })
                .catch(err => {
                    env.window.console.error(err);
                    return true;
                });
        },
        doUndo,
        args: [],
    }));
}

/**
 * @param {Array<ThemeStyleUnit>} bodyUnits
 * @param {String} removedUnitId
 * @param {String} removedUnitBlockTypeName
 */
function getRemoteStyleIfRemoved(bodyUnits, removedUnitId, removedUnitBlockTypeName) {
    const lookFor = createUnitClass(removedUnitId, removedUnitBlockTypeName);
    // Normal case: $lookFor is _not_ found from $bodyUnits
    if (!bodyUnits.some(({id}) => id === lookFor))
        return findBlockTypeStyles(store2.get().themeStyles, removedUnitBlockTypeName);
    return null;
}

/**
 * @param {String} derivedScss
 * @param {String} baseScss
 * @param {(todo) => void} on
 */
function runLinesAb(derivedScss, baseScss, on) {
    const linesA = derivedScss.split('\n');
    const linesB = baseScss.split('\n');
    const numBaseLines = linesB.length;

    const varDecls = [];
    let lastVarDeclIdx = 0;
    for (let i = 0; i < linesA.length; ++i) {
        const trimmed = linesA[i].trimStart();
        if (trimmed.startsWith('--')) {
            const pcs = trimmed.split(':');
            if (pcs[1]?.trim().length > 0) {
                varDecls.push(pcs[0].trimEnd());
                lastVarDeclIdx = i + 1;
                continue;
            } // else fall through
        }
        varDecls.push(null);
    }

    for (let i = 0; i < linesA.length; ++i) {
        const fromDerivate = linesA[i];
        if (i < numBaseLines) { // derived
            const lineATrimmed = fromDerivate.trim();
            if (i < lastVarDeclIdx) {
                if (varDecls[i]) {
                    const lineB = withReplacedApdx(linesB[i].trim(), ...varDecls[i].split('_').slice(1));
                    const isSame = lineATrimmed === lineB;
                    on('varDeclLine', isSame, lineATrimmed, lineB, fromDerivate);
                } else { // '@exportAs(...)'
                    on('varDeclLine', true,   '',           '',    fromDerivate);
                }
            } else {
                on('derivedUsageLine', lineATrimmed, varDecls, linesA, linesB, fromDerivate);
            }
        } else { // addition
            on('appendedLine', fromDerivate);
        }
    }
}

/**
 * @param {String} line Example '--backgroundNormal_Button_u4: #f8f8f800;'
 * @returns {String} Example '#f8f8f800'
 */
function extractVal(line) {
    return line.split(':')[1].trimStart().split(';')[0].trimEnd();
}

/**
 * @param {Array<CssVar>} vars
 * @param {String} derivedScss
 * @param {String} baseScss
 * @returns {Array<{hasChanged: Boolean; lineA: String; lineB: String;}>}
 */
function getInsights(vars, derivedScss, baseScss) {
    const map = new Map;
    runLinesAb(derivedScss, baseScss, (event, arg1, arg2, arg3) => {
        if (event !== 'varDeclLine') return;
        const isSame = arg1;
        const lineA = arg2; // Example '--borderHover_Button_u4:'
        if (!lineA.length) return; // '@exportAs(...)'
        const justVarName = lineA.split(':')[0].trim().slice(2); // '--borderHover_Button_u4: somethgins' -> 'borderHover_Button_u4'
        const lineB = arg3;
        map.set(justVarName, {hasChanged: !isSame, lineA, lineB});
    });
    return vars.map(({varName}) => map.get(varName));
}

/**
 * @param {String} derivedScss
 * @param {String} baseScss
 * @returns {String}
 */
function optimizeScss(derivedScss, baseScss) {
    const EMPTY_LINE = '^::empty::^';

    const ir = [];
    runLinesAb(derivedScss, baseScss, (event, arg1, arg2, arg3, arg4, arg5) => {
        if (event === 'varDeclLine') {
            const isSame = arg1;
            const lineANotTrimmed = arg4;
            ir.push(isSame ? EMPTY_LINE : lineANotTrimmed);
        // derived, add only if the line contains var(--someChangedVar), or ensWith '{' or '}'
        } else if (event === 'derivedUsageLine') {
            let hasUsageWithChagedVal = false;
            const lineATrimmed = arg1;
            const varDecls = arg2;
            const linesA = arg3;
            const linesB = arg4;
            const lineANotTrimmed = arg5;
            const end = lineATrimmed.at(-1);
            if (end !== '{' && end !== '}') {
                const pcs1 = lineATrimmed.split('var(');
                if (pcs1.length > 1) {
                    // 'align-items: var(  --varName...)' -> '--varName...'
                    const start = pcs1[1].trimStart();
                    // ['--alignItems', 'Type', 'd1 )'] or
                    // ['--alignItems', 'Type', 'd1, var(--another) )'] or
                    // ['--columns', 'Listing', 'd1 ), minmax(0, 1fr) );']
                    const pcs3 = start.split('_').slice(0, 3);
                    if (pcs3.length === 3) {
                        // 'd1 )'                   -> 'd1' or
                        // 'd1, var(--another))'    -> 'd1' or
                        // 'd1 ), minmax(0, 1fr));' -> 'd1'
                        pcs3[2] = pcs3[2].split(',')[0].trimEnd().split(')')[0].trimEnd();
                        const [_, blockTypeName, apdx] = pcs3;
                        const usageVarName = pcs3.join('_');
                        const varDeclLineN = varDecls.indexOf(usageVarName);
                        hasUsageWithChagedVal = varDeclLineN > -1 && linesA[varDeclLineN].trim() !== withReplacedApdx(linesB[varDeclLineN].trim(), blockTypeName, apdx);
                    }
                }
            } else hasUsageWithChagedVal = true;
            ir.push(!hasUsageWithChagedVal ? EMPTY_LINE : lineANotTrimmed);
        } else if (event === 'appendedLine') {
            const lineANotTrimmed = arg1;
            ir.push(lineANotTrimmed);
        }
    });

    const withoutEmptyLines = arr => arr.filter(line => line !== EMPTY_LINE);
    const ir2 = withoutEmptyLines(ir);
    let emptied = ir2.slice(0);
    let emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(emptied);
    while (emptyBlockCloseTagIdx > 0 && emptied.length) {
        emptied[emptyBlockCloseTagIdx] = EMPTY_LINE;
        emptied[emptyBlockCloseTagIdx - 1] = EMPTY_LINE;
        emptied = withoutEmptyLines(emptied);
        emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(emptied);
    }
    return emptied.join('\n');
}

/**
 * @param {Array<String>} lines
 * @returns {Number}
 */
function findEmptyBlockClosingTagIndex(lines) {
    for (let l = lines.length; --l > -1; ) {
        const line = lines[l];
        if (line.trim() === '}') {
            const prev = lines[l - 1];
            if (prev.trimEnd().at(-1) === '{') return l;
        }
    }
    return -1;
}

/**
 * @param {String} lineB Example '--background_Section_base1: initial;'
 * @param {String} blockTypeName Example 'Section'
 * @param {String} apdx Example 'u4'
 * @return {String} Example '--background_Section_u4: initial;'
 */
function withReplacedApdx(lineB, blockTypeName, apdx) {
    return lineB.replace(new RegExp(`${blockTypeName}_(base|default)\\d+`), `${blockTypeName}_${apdx}`);
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {Array<ThemeStyleUnit>} from
 * @returns {ThemeStyleUnit|null}
 */
function findBaseUnitOf(unit, from) {
    const lookFor = unit.derivedFrom;
    return from.find(u => u.id === lookFor) || null;
}

/**
 * @param {String} id
 * @param {String} blockTypeName
 * @returns {String}
 */
function createUnitClass(id, blockTypeName) {
    return `j-${blockTypeName}` + (id ? `-${id}` : '');
}

/**
 * @param {String} unitCls Example 'j-Button-unit-1'
 * @param {String} blockTypeName
 * @param {String} specifier = ''
 * @returns {String} Example '.j-_body_ .j-Button:not(.no-j-Button-unit-1)'
 */
function createUnitClassSpecial(unitCls, blockTypeName, specifier = '') {
    const selBtype = createUnitClass('', blockTypeName); // Example 'j-Button'
    return `${specialBaseUnitCls}${validateAndGetSpecifier(specifier)} .${selBtype}:not(.no-${unitCls})`;
}

/**
 * @param {String} candidate
 * @returns {String} ` ${candidate}` or ''
 */
function validateAndGetSpecifier(candidate) {
    if (!candidate) return '';
    // todo validate
    return ` ${candidate}`;
}

/**
 * @typedef StyleTextareaProps
 * @prop {ThemeStyleUnit} unitCopy
 * @prop {ThemeStyleUnit|null} unitCopyReal
 * @prop {String} unitCls
 * @prop {String} blockTypeName
 * @prop {Boolean} isVisible
 */

export default StylesTextarea;
export {findBaseUnitOf, optimizeScss, emitUnitChanges, emitCommitStylesOp,
        updateAndEmitUnitScss, compileSpecial, tempHack2, getInsights, extractVal,
        createUnitClass, createUnitClassSpecial, SPECIAL_BASE_UNIT_NAME, specialBaseUnitCls};
