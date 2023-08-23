import {__, api, env, timingUtils, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import ContextMenu from '../../commons/ContextMenu.jsx';
import store2, {asst, observeStore as observeStore2} from '../../store2.js';
import VisualStyles, {createUnitClass, valueEditors, replaceVarValue, varNameToLabel} from './VisualStyles.jsx';
import {traverseAst} from '../../commons/CssStylesValidatorHelper.js';
import {SPECIAL_BASE_UNIT_NAME, getLargestPostfixNum, findBlockTypeStyles,
        emitAddStyleClassToBlock, compileSpecial, updateAndEmitUnitScss,
        emitCommitStylesOp, EditableTitle, goToStyle, findParentStyleInfo,
        tempHack, StylesList, findBodyStyle, splitUnitAndNonUnitClasses,
        dispatchNewBlockStyleClasses, emitUnitChanges, optimizeScss, findBaseUnitOf,
        getEnabledUnits, getRemoteBodyUnit} from './styles-shared.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import store, {pushItemToOpQueue} from '../../store.js';
import {saveExistingBlocksToBackend} from './createBlockTreeDndController.js';
import {isBodyRemote} from './style-utils.js';

const {compile, serialize, stringify} = window.stylis;

const dismissedCopyStyleNotices = {};

class WidgetBasedStylesList extends StylesList {
    // addUserUnitDropdown;
    // curBlockStyleClasses;
    // unregistrables;
    // bodyStyle;
    // liIdxOfOpenMoreMenu;
    // refElOfOpenMoreMenu;
    /**
     * @access protected
     */
    componentWillMount() {
        super.componentWillMount();
        this.addUserUnitDropdown = preact.createRef();
        this.setState({unitsEnabled: null, unitsOfThisBlockType: [], mutatedStyleInfo: null});
        this.curBlockStyleClasses = this.props.blockCopy.styleClasses;
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}, [_event]) => {
            if (this.group === true) return;
            this.bodyStyle = findBodyStyle(themeStyles);
            const {units} = findBlockTypeStyles(themeStyles, this.props.blockCopy.type) || {};
            if (this.state.unitsOfThisBlockType !== units)
                this.updateTodoState(units || [], themeStyles, this.curBlockStyleClasses !== this.props.blockCopy.styleClasses ? {...this.props.blockCopy, ...{styleClasses: this.curBlockStyleClasses}} : this.props.blockCopy);
        })];
        this.doLoad(this.props.blockCopy);
    }
    /**
     * @param {StylesListProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const {blockCopy} = props;
        if (blockCopy.styleClasses !== this.curBlockStyleClasses) {
            if (blockCopy.styleClasses.length !== this.curBlockStyleClasses.length && (this.state.unitsOfThisBlockType || []).length)
                this.updateTodoState(this.state.unitsOfThisBlockType, store2.get().themeStyles, blockCopy);
            this.curBlockStyleClasses = blockCopy.styleClasses;
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render({blockCopy, userCanEditVisualStyles}, {unitsEnabled, unitsOfThisBlockType, parentStyleInfo,
                                                    mutatedStyleInfo}) {
        const [unitsToShow, addable] = unitsEnabled !== null
            ? [
                getEditableUnits(unitsEnabled),
                createAddableUnits(unitsOfThisBlockType, unitsEnabled, blockCopy.type, !this.props.useVisualStyles)
            ] : [
                null,
                null
            ];
        const selectOptions = addable ? createAddUnitsDropdownList(addable) : [];
        return [...[
            unitsToShow !== null ? unitsToShow.length ? <ul class="list styles-list mb-2">{ unitsToShow.map((unit, i) => {
                const either = this.getMaybeRemote(unit, blockCopy, true);
                const isDefault = either !== unit;
                const cls = createUnitClass(unit.id, blockCopy.type);
                const [cssVars, ast] = VisualStyles.extractVars(either.scss, cls);
                const key = unit.id;
                return <li key={ key } class="open">
                    <header class="flex-centered p-relative">
                        <b
                            onClick={ e => this.handleLiClick(e, i, false) }
                            class="col-12 btn btn-link text-ellipsis with-icon pl-2 mr-1 no-color"
                            type="button">
                            <EditableTitle
                                unitId={ unit.id }
                                unitIdReal={ !isDefault ? null : either.id }
                                currentTitle={ either.title }
                                blockTypeName={ blockCopy.type }
                                allowEditing={ userCanEditVisualStyles
                                    ? true                 // admin user -> always
                                    : !!either.derivedFrom // non-admin -> onyl if this unit is derived
                                }
                                subtitle={ null }
                                ref={ this.editableTitleInstances[i] }/>
                        </b>
                    </header>
                    <div class="form-horizontal tight has-color-pickers pt-0 px-2">{ cssVars.map(cssVar => {
                        const Renderer = valueEditors.get(cssVar.type);
                        const valIsSet = cssVar.value !== null;
                        const args =  cssVar.args ? [...cssVar.args] : [];
                        const parenVal = !unit.derivedFrom ? null : this.getParentsValueIfNeeded(cssVar, ast, unit);
                        const valIsInitial = valIsSet && (
                            cssVar.value === 'initial' ||
                            (parenVal && unit.derivedFrom && valueToString(cssVar.value, Renderer) === valueToString(parenVal, Renderer))
                        );
                        const isClearable = valIsSet && !valIsInitial;
                        return <Renderer
                            valueReal={ valIsSet && !valIsInitial ? {...cssVar.value} : null }
                            valueToDisplay={ valIsSet && cssVar.value !== 'initial' ? {...cssVar.value} : parenVal }
                            argsCopy={ [...args] }
                            varName={ cssVar.varName }
                            valueWrapStr={ '' }
                            isClearable={ isClearable }
                            labelTranslated={ __(varNameToLabel(withoutAppendix(cssVar.varName))) }
                            onVarValueChanged={ newValAsString => {
                                const val = newValAsString !== null
                                    ? newValAsString
                                    : valueToString(this.getParentsValueOf(cssVar, ast, either) || 'initial', Renderer);
                                this.emitChange(val, cssVar, either, unit, ast, cls);
                            } }
                            selector={ `.${cls}` }
                            showNotice={ mutatedStyleInfo !== null && cssVar.varName === mutatedStyleInfo.firstMutatedVarName }
                            noticeDismissedWith={ accepted => {
                                if (accepted) // Do create copy, replace block's cssClass '-unit-<old>' -> '-unit-<newCopy>'
                                    this.addUnitManyUnitClones(mutatedStyleInfo);
                                dismissedCopyStyleNotices[this.props.blockCopy.__duplicatedFrom] = 'dismissed';
                                this.setState({mutatedStyleInfo: null});
                            } }
                            key={ `${key}-${cssVar.varName}` }/>;
                    }) }</div>
                </li>;
            }) }</ul> : <p class="pt-1 mb-2 color-dimmed">{ __('No own styles') }.</p>
            : <LoadingSpinner className="ml-1 mb-2 pb-2"/>
        ], selectOptions.length
            ? <span class="btn btn-dropdown p-relative d-inline-flex btn-primary btn-sm mr-1">
                <label htmlFor="addStyleDropdown">{ __('Add style') }</label>
                <select onChange={ e => this.handleConfirmAddStyle(e, addable, blockCopy) } id="addStyleDropdown">
                    <option disabled selected value>{ __('Select style') }</option>
                    { selectOptions.map(({value, label}) =>
                        <option value={ value } disabled={ value === '-' }>{ label }</option>
                    ) }
                </select>
            </span>
            : null,
        parentStyleInfo && parentStyleInfo[2]
            ? <button
                onClick={ () => goToStyle(parentStyleInfo) }
                class="btn btn-sm"
                type="button">{ __('Show parent styles') }</button>
            : null,
        <ContextMenu
            links={ this.createContextMenuLinks([
                {text: __('Deactivate'), title: __('Deactivate style'), id: 'deactivate-style'}
            ]) }
            onItemClicked={ this.handleMoreMenuLinkClicked.bind(this) }
            onMenuClosed={ () => { this.refElOfOpenMoreMenu.style.opacity = ''; } }
            ref={ this.moreMenu }/>,
        ];
    }
    /**
     * @param {RawBlock} blockCopy
     * @access private
     */
    doLoad(blockCopy) {
        this.setState({themeStyles: null});
        const themeStyles = tempHack();
        if (themeStyles) {
            this.bodyStyle = findBodyStyle(themeStyles);
            this.updateTodoState((findBlockTypeStyles(themeStyles, blockCopy.type) || {}).units, themeStyles, blockCopy);
        }
        // else Wait for store2.dispatch('themeStyles/setAll')
    }
    /**
     * @param {ThemeStyleUnit} unit
     * @param {RawBlock} block
     * @param {Boolean} copy = false
     * @access private
     */
    getMaybeRemote(unit, block, copy = false) {
        return unit.origin !== SPECIAL_BASE_UNIT_NAME
            ? unit
            : this.getRemoteBodyUnit(unit, block, copy);
    }
    /**
     * @param {ThemeStyleUnit} unit
     * @param {RawBlock} block
     * @param {Boolean} copy = false
     * @returns {ThemeStyleUnit|null}
     * @access private
     */
    getRemoteBodyUnit(unit, block, copy = true) {
        return getRemoteBodyUnit(unit, block.type, this.bodyStyle.units, copy);
    }
    /**
     * @param {Array<ThemeStyleUnit>|undefined} candidate
     * @param {Array<ThemeStyle>} themeStyles
     * @param {RawBlock} blockCopy = this.props.blockCopy
     * @access private
     */
    updateTodoState(unitsOfThisBlockType, themeStyles, blockCopy = this.props.blockCopy) {
        this.debouncedEmitVarValueChange = timingUtils.debounce(
            this.emitVarValueChange.bind(this),
            env.normalTypingDebounceMillis
        );
        const unitsEnabled = getEnabledUnits(unitsOfThisBlockType, this.bodyStyle.units, blockCopy);
        this.receiveUnits(unitsEnabled);
        this.setState({unitsEnabled,
            unitsOfThisBlockType: unitsOfThisBlockType,
            parentStyleInfo: findParentStyleInfo(themeStyles, blockCopy)});
    }
    /**
     * @see this.emitVarValueChange
     * @access private
     */
    emitChange(str, cssVar, either, unit, ast, cls) {
        this[str !== null ? 'debouncedEmitVarValueChange' : 'emitVarValueChange'](str, cssVar, either, unit, ast, cls);
    }
    /**
     * @param {String} newValAsString
     * @param {CssVar} cssVar
     * @param {ThemeStyleUnit} eitherCopy
     * @param {ThemeStyleUnit} unitCopy
     * @param {Array<StylisAstNode>} ast
     * @param {String} cls
     * @access private
     */
    emitVarValueChange(newValAsString, cssVar, eitherCopy, unitCopy, ast, cls) {
        const [_, varDeclAstNode] = getCurrentInfo(cssVar, ast);
        const varDecl = varDeclAstNode.props; // '--foo'
        const blockTypeName = !eitherCopy.origin ? this.props.blockCopy.type : SPECIAL_BASE_UNIT_NAME;
        updateAndEmitUnitScss(eitherCopy, copy => {
            const {scss, generatedCss} = copy;
            const reusableId = this.props.blockCopy.__duplicatedFrom;
            if (reusableId &&
                blockTypeName !== SPECIAL_BASE_UNIT_NAME &&
                !dismissedCopyStyleNotices[reusableId]) {
                const gatherDuplicatedBlockInfos = reusableId => {
                    const out = [];
                    blockTreeUtils.traverseRecursively(store2.get().theBlockTree, b => {
                        if (b.__duplicatedFrom === reusableId) out.push({id: b.id, styleClasses: b.styleClasses, type: b.type});
                    });
                    return out;
                };
                this.setState({mutatedStyleInfo: {
                    firstMutatedVarName: copy.varName,
                    firstMutatedBlockId: this.props.blockCopy.id,
                    originalScss: scss,
                    originalGeneratedCss: generatedCss,
                    originalOptimizedScss: copy.optimizedScss,
                    originalOptimizedGeneratedCss: copy.optimizedGeneratedCss,
                    affectedBlocks: gatherDuplicatedBlockInfos(reusableId),
                }});
                dismissedCopyStyleNotices[this.props.blockCopy.__duplicatedFrom] = 'pending';
            }
            //
            varDeclAstNode.children = newValAsString;
            varDeclAstNode.value = `${varDecl}:${newValAsString};`;
            const newScss = replaceVarValue(copy.scss, varDeclAstNode, newValAsString);
            if (!copy.origin) {
                const isDerivedFromBodyUnit = isBodyRemote(copy.derivedFrom);
                const newOptimizedScss = !copy.derivedFrom ? null : optimizeScss(newScss, findBaseUnitOf(copy, (!isDerivedFromBodyUnit ? this.state.unitsOfThisBlockType : this.bodyStyle.units)).scss);
                return {
                    newScss,
                    newGenerated: serialize(ast, stringify),
                    newOptimizedScss,
                    newOptimizedGenerated: newOptimizedScss
                        ? serialize(compile(`.${cls}{${newOptimizedScss}}`), stringify)
                        : null
                };
            } else {
                const [shouldCommit, result] = compileSpecial(newScss, copy.scss, copy.specifier,
                                                                copy.id, copy.origin);
                return shouldCommit ? {newScss, newGenerated: result.generatedCss || ''} : null;
            }
        }, blockTypeName);
    }
    /**
     * @param {EventTarget} e
     * @param {[Array<ThemeStyleUnit>, Array<ThemeStyleUnit>]} addable
     * @param {RawBlock} block
     * @access private
     */
    handleConfirmAddStyle(e, [instantiable, reference], block) {
        const tmp = instantiable.find(({id}) => id === e.target.value);
        const unit = tmp || reference.find(({id}) => id === e.target.value);
        this.addUnitFrom(unit, block, !tmp && unit.derivedFrom);
    }
    /**
     * @param {ThemeStyleUnit} unit
     * @param {RawBlock} block
     * @access private
     */
    addUnitFrom(unit, block) {
        if (unit.isDerivable && !unit.derivedFrom)
            this.addUnitClone(unit, block);
        else if (unit.origin === SPECIAL_BASE_UNIT_NAME)
            this.addUnitClone(this.getRemoteBodyUnit(unit, block, false), block, '_default');
        else
            this.addCloneOfUnitClone(unit);
    }
    /**
     * @param {ThemeStyleUnit} base
     * @param {RawBlock} block
     * @param {String} varApdx = '_base' Example '_base', '_default' or '_u23'
     * @access private
     */
    addUnitClone(base, block, varApdx = '_base') {
        // #2 Classes
        const {type} = this.props.blockCopy;
        const current = findBlockTypeStyles(store2.get().themeStyles, type);
        const rolling = getLargestPostfixNum(current.units) + 1;
        const title = `${__(block.title || block.type)} ${rolling}`;
        const id = `d-${rolling}`;
        const scss = base.scss.replace(
            // textNormal_TextCommon_base<n>
            new RegExp(`${varApdx}\\d+`, 'g'),
            // textNormal_TextCommon_u<n>
            `_u${rolling}`,
        );
        const cls = createUnitClass(id, type);
        const baseClsStr = varApdx !== '_default' ? `${createUnitClass(base.id, type)} ` : '';
        this.curBlockStyleClasses = emitAddStyleClassToBlock(`${baseClsStr}${cls}`, this.props.blockCopy);

        // #1 Style
        const newUnit = {title, id, scss, generatedCss: serialize(compile(`.${cls}{${scss}}`), stringify),
            optimizedScss: '', optimizedGeneratedCss: `.${cls}{}`,
            origin: '', specifier: '', isDerivable: false,
            derivedFrom: base.id};

        store2.dispatch('themeStyles/addUnitTo', [type, newUnit]);

        emitCommitStylesOp(type, () => {
            // Revert #1
            store2.dispatch('themeStyles/removeUnitFrom', [type, newUnit]);

            setTimeout(() => {
                // #2
                api.saveButton.triggerUndo();
            }, 100);
        });
    }
    /**
     * @param {MutatedStyleInfo} mutatedStyleInfo
     * @access private
     */
    addUnitManyUnitClones(mutatedStyleInfo) {
        const createdClses = {};
        const fns = createCloneInstructions(mutatedStyleInfo.affectedBlocks).map(task => {
            const {block, action} = task;
            if (action.name === 'createUnitFrom') {
                // 'j-Section-unit-<n>'
                if (action.fromIsCreatedFrom === 'customUnit') {
                    return () => {
                        const isDerived = false;
                        const isDerivedFromBodyUnit = false;
                        this.doClone(block, task, mutatedStyleInfo, isDerived, isDerivedFromBodyUnit, createdClses);
                    };
                // 'j-Section-d-<n>'
                } else if (action.fromIsCreatedFrom === 'bodyUnit') {
                    return () => {
                        const isDerived = true;
                        const isDerivedFromBodyUnit = false;
                        this.doClone(block, task, mutatedStyleInfo, isDerived, isDerivedFromBodyUnit, createdClses);
                    };
                // 'j-Section-unit-<n> j-Section-d-<n>'
                } else {
                    return () => {
                        const isDerived = true;
                        const isDerivedFromBodyUnit = true;
                        this.doClone(block, task, mutatedStyleInfo, isDerived, isDerivedFromBodyUnit, createdClses);
                    };
                }
            } else if (action.name === 'swapClass') {
                return () => {
                    const fromPrev = createdClses[action.replace];
                    const cls = createUnitClass(fromPrev, block.type);
                    replaceAndDispatchClasses(block, action.replace, cls);
                };
            } else throw new Error('Shouldn\'t happen');
        });

        const next = (queue, i) => {
            const top = queue[i];
            if (!top) return;
            top();
            setTimeout(() => {
                next(queue, i + 1);
            }, 10);
        };

        const doUndo = () => {
            setTimeout(() => next(fns.map(_ => () => {
                api.saveButton.triggerUndo();
            }), 0), 1);
        };

        next([...fns, () => {
            store.dispatch(pushItemToOpQueue(`update-block-tree##main`, {
                doHandle: () => saveExistingBlocksToBackend(store2.get().theBlockTree, 'main'),
                doUndo,
                args: [],
            }));
        }], 0);

    }
    /**
     * @param {BlockStub} block
     * @param {CloneInstruction} task
     * @param {MutatedStyleInfo} mutatedStyleInfo
     * @param {Boolean} isDerived
     * @param {Boolean} isDerivedFromBodyUnit
     * @param {{[cls: String]: String;}} createdClses
     */
    doClone(block, {action}, mutatedStyleInfo, isDerived, isDerivedFromBodyUnit, createdClses) {
        //
        const {themeStyles} = store2.get();
        const {type} = block;
        const current = findBlockTypeStyles(themeStyles, type);
        const {units} = current;
        const lookFor = asst(action.from); // 'j-T-unit-2' -> 'unit-2'
        const unitThis = units.find(({id}) => id === lookFor);
        const unitThis2 = !isDerivedFromBodyUnit ? null : findBaseUnitOf(unitThis, this.bodyStyle.units);

        const rolling = getLargestPostfixNum(current.units) + 1;
        const title = `${__(block.title || type)} ${rolling}`;
        const id = `${!isDerived ? 'unit' : 'd'}-${rolling}`;
        const firstVarName = getFirstVarName(unitThis2 || unitThis);
        const varApdx = `_${getAppendix(firstVarName)}`;
        const rep = str => str.replace(
            // textNormal_TextCommon_base1
            new RegExp(`${varApdx}`, 'g'),
            // textNormal_TextCommon_u<n>
            `_u${rolling}`,
        );
        const cls = createUnitClass(id, type);
        const scss = rep((unitThis2 || unitThis).scss);
        const optimizedScss = !isDerived ? null : !isDerivedFromBodyUnit ? serialize(compile(`.${cls}{${rep(unitThis.optimizedScss)}}`), stringify) : '?';

        // #2
        const newClasses = replaceAndDispatchClasses(block, action.from, cls);
        block.styleClasses = newClasses;

        // #1
        const newUnit = {
            ...{title, id, scss, generatedCss: serialize(compile(`.${cls}{${scss}}`), stringify),
                origin: '', specifier: '', isDerivable: false,
                derivedFrom: (unitThis2 || unitThis).id},
            ...(!optimizedScss
                ? {}
                : optimizedScss !== '?'
                    ? {optimizedScss, optimizedGeneratedCss: serialize(compile(`.${cls}{${optimizeScss}}`), stringify)}
                    : {optimizedScss: '', optimizedGeneratedCss: `.${cls}{}`}
            )
        };
        store2.dispatch('themeStyles/addUnitTo', [type, newUnit]);
        createdClses[action.from] = (createdClses[action.from] || 0) + 1;

        // #3
        const restoreOriginal = block.id === mutatedStyleInfo.firstMutatedBlockId;
        if (restoreOriginal) {
            this.curBlockStyleClasses = newClasses;
            if (typeof mutatedStyleInfo.originalOptimizedScss !== 'string') {
                const dataBefore = {scss: unitThis.scss, generatedCss: unitThis.generatedCss};
                emitUnitChanges({scss: mutatedStyleInfo.originalScss, generatedCss: mutatedStyleInfo.originalGeneratedCss},
                                dataBefore, type, unitThis.id);
            } else {
                const dataBefore = {scss: unitThis.scss, generatedCss: unitThis.generatedCss,
                                    optimizeScss: unitThis.optimizedScss, optimizedGeneratedCss: unitThis.optimizedGeneratedCss};
                emitUnitChanges({scss: mutatedStyleInfo.originalScss, generatedCss: mutatedStyleInfo.originalGeneratedCss,
                                optimizeScss: mutatedStyleInfo.originalOptimizedScss,
                                optimizedGeneratedCss: mutatedStyleInfo.originalOptimizedGeneratedCss},
                                dataBefore, type, unitThis.id);
            }
        }

        emitCommitStylesOp(type, () => {
            // Revert #1
            store2.dispatch('themeStyles/removeUnitFrom', [type, newUnit]);
            setTimeout(() => {
                // #2
                api.saveButton.triggerUndo();
                if (restoreOriginal)
                    // #3
                    setTimeout(() => { api.saveButton.triggerUndo(); }, 2);
            }, 2);
        });
    }
    /**
     * @param {ThemeStyleUnit} unit
     * @access private
     */
    addCloneOfUnitClone(unit) {
        const cls = createUnitClass(unit.id, this.props.blockCopy.type);
        this.curBlockStyleClasses = emitAddStyleClassToBlock(cls, this.props.blockCopy);
        this.updateTodoState(this.state.unitsOfThisBlockType, store2.get().themeStyles, {...this.props.blockCopy, ...{styleClasses: this.curBlockStyleClasses}});
    }
    /**
     * @param {Event} e
     * @param {Number} i
     * @param {Boolean} _isDefaultUnit
     * @access private
     */
    handleLiClick(e, i, _isDefaultUnit) {
        if (this.props.userCanEditCss && this.editableTitleInstances[i].current.isOpen()) return;
        //
        const moreMenuIconEl = e.target.classList.contains('edit-icon-outer') ? e.target : e.target.closest('.edit-icon-outer');
        if (moreMenuIconEl) {
            this.liIdxOfOpenMoreMenu = i;
            this.refElOfOpenMoreMenu = moreMenuIconEl;
            this.refElOfOpenMoreMenu.style.opacity = '1';
            this.moreMenu.current.open({target: moreMenuIconEl});
        }
    }
    /**
     * @param {CssVar} forVar Derived unit's var
     * @param {Array<StylisAstNode>} ast
     * @param {ThemeStyleUnit} unit
     * @returns {CssVar|null}
     * @access private
     */
    getParentsValueIfNeeded(forVar, ast, unit) {
        const fallbackVarName = getFallbackUsage(forVar, ast);
        if (fallbackVarName) {
            const bodyUnitsSorted = this.bodyStyle.units;
            for (const bodyUnit of bodyUnitsSorted) {
                const [cssVars, _ast2] = VisualStyles.extractVars(bodyUnit.scss, 'dummy');
                const theVar = cssVars.find(({varName}) => varName === fallbackVarName);
                if (theVar) return theVar.value;
            }
            return null;
        } else {
            const theVar = this.findParenVar(forVar, unit);
            if (theVar) return theVar.value !== 'initial' ? theVar.value : null;
        }
        return null;
    }
    /**
     * @param {CssVar} forVar Derived unit's var
     * @param {Array<StylisAstNode>} ast
     * @param {ThemeStyleUnit} unit
     * @returns {CssVar|null}
     * @access private
     */
    getParentsValueOf(cssVar, ast, unit) {
        const fallbackVarName = getFallbackUsage(cssVar, ast);
        if (fallbackVarName) {
            return null;
        } else {
            const theVar = this.findParenVar(cssVar, unit);
            if (theVar) return theVar.value;
        }
        return null;
    }
    /**
     * @param {CssVar} cssVar
     * @param {ThemeStyleUnit} unit
     * @returns {CssVar}
     * @access private
     */
    findParenVar(cssVar, unit) {
        const isDerivedFromBodyUnit = isBodyRemote(unit.derivedFrom);
        const paren = findBaseUnitOf(unit, (!isDerivedFromBodyUnit ? this.state.unitsOfThisBlockType : this.bodyStyle.units));
        const [parenVars, _ast2] = VisualStyles.extractVars(paren.scss, 'dummy');
        const parenVarName = swapAppendix(cssVar.varName, parenVars[0].varName);
        return parenVars.find(({varName}) => varName === parenVarName);
    }
}

/**
 * Creates instructions how to clone the styeles of $affectedBlocks.
 *
 * @param {Array<BlockStub>} affectedBlocks
 * @returns {Array<CloneInstruction>}
 */
function createCloneInstructions(affectedBlocks) {
    const alreadyCloned = {};
    const out = [];
    affectedBlocks.forEach(block => {
        // const [block] = blockTreeUtils.findBlock(blockId, theBlockTree);
        const [unitClsesStr, _nonUnitClsesStr] = splitUnitAndNonUnitClasses(block.styleClasses);
        if (unitClsesStr === '') return;
        //
        const unitClses = unitClsesStr.split(' ');
        out.push(...createTasks(unitClses, block, alreadyCloned));
    });
    return out;
}

/**
 * @param {Array<String>} clses
 * @param {BlockStub} block
 * @param {{[cls: String]: String;}} alreadyCloned
 * @returns {Array<CloneInstruction>}
 */
function createTasks(clses, block, alreadyCloned) {
    const out = [];
    for (let i = 0; i < clses.length; ++i) {
        const cls = clses[i];
        const todoCreateCls = `j-${block.type}-unit-`;
        const derivedCls = todoCreateCls.replace('-unit-', '-d-');
        const append = (fromCls, fromIsCreatedFrom) => {
            if (!alreadyCloned[fromCls]) {
                out.push({
                    block,
                    action: {name: 'createUnitFrom', from: fromCls, fromIsCreatedFrom},
                });
                alreadyCloned[fromCls] = 1;
            } else {
                out.push({block, action: {name: 'swapClass', replace: fromCls, with: 'prev'}});
            }
        };
        // Option 1: '...j-Section-unit-<n> j-Section-d-<n>...'
        if (cls.indexOf(todoCreateCls) > -1 && (clses[i + 1] || '').indexOf(derivedCls) > -1) {
            i += 1;
            append(clses[i], clses[i - 1]);
        } else {
            const isDerived = cls.indexOf(derivedCls) > -1;
        // Option 2: '...j-Section-unit-<n>...'
            if (!isDerived)
                append(clses[i],  'customUnit');
        // Option 3: '...j-Section-d-<n>...'
            else
                append(clses[i], 'bodyUnit');
        }
    }
    return out;
}

/**
 * @param {RawBlock|BlockStub} block Example 'j-Button-d-7 foo'
 * @param {String} clsFrom Example 'j-Button-d-7'
 * @param {String} clsTo Example 'j-Button-d-23'
 * @returns {String} Example 'j-Button-d-23 foo'
 */
function replaceAndDispatchClasses(block, clsFrom, clsTo) {
    const currentClasses = block.styleClasses;
    const newClasses = currentClasses.replace(clsFrom, clsTo);
    dispatchNewBlockStyleClasses(newClasses, block);
    return newClasses;
}

/**
 * @param {String} target Example 'text_Button_u3'
 * @param {String} source Example 'varName_Button_base1'
 * @returns {String} Example 'text_Button_base1'
 */
function swapAppendix(target, source) {
    const apdx = getAppendix(source); // 'varName_Button_base1' -> 'base1'
    const origPcs = target.split('_'); // 'text_Button_u3' -> ['text', 'Button', 'u3']
    return [...origPcs.slice(0, -1), apdx].join('_'); // [..., 'u3'] -> [..., 'base1']
}

/**
 * @param {CssVar} forVar
 * @param {Array<StylisAstNode>} ast
 */
function getCurrentInfo({varName}, ast) {
    let node1 = null;
    let node2 = null;
    for (const {children} of ast) {
        if (!node1) node1 = children.find(node => node.value.indexOf(`var(--${varName})`) > -1); // 'something:var(--varName);'
        if (!node2) node2 = children.find(node => node.props === `--${varName}`); // '--varName:3rem;'
    }
    return [node1, node2];
}

/**
 * @param {'initial'|cssValType} val
 * @returns {String}
 */
function valueToString(val, Cls) {
    if (val === 'initial') return val;
    return Cls.valueToString(val);
}

/**
 * @param {String} varName Example: 'textNormal_TextCommon_u1'
 * @returns {String} Example: 'textNormal'
 */
function withoutAppendix(varName) {
    return varName.split('_')[0];
}

/**
 * @param {ThemeStyleUnit} unit
 * @returns {String} Example: 'background'
 */
function getFirstVarName({scss}) {
    const [vars, _ast] = VisualStyles.extractVars(scss, 'dummy', undefined, undefined, true);
    return vars[0].varName;
}

/**
 * @param {String} varName Example: 'textNormal_TextCommon_u1'
 * @returns {String} Example: 'u1'
 */
function getAppendix(varName) {
    return varName.split('_').at(-1);
}

/**
 * @param {CssVar} cssVar
 * @param {Array<StylisAstNode>} ast
 * @returns {String|null}
 */
function getFallbackUsage(cssVar, ast) {
    let fallbackVarName = null;
    traverseAst(ast, node => {
        if (node.type !== 'decl') return;

        const line = node.children; // "var(--textNormal_Text_u3, var(--textDefault))"
        if (line.indexOf(`var(--${cssVar.varName}`) < 0) return;

        fallbackVarName = getFallback(line);
        return false; // break
    });
    return fallbackVarName;
}

/**
 * @param {String} str Example 'var(--textNormal_Text_u3)' or 'var(--textNormal_Text_u3, var(--textDefault))'
 * @returns {String} Example 'textDefault'
 */
function getFallback(str) {
    const pcs = str.split('var('); // ['', '--textNormal_Text_u3)'] or
                                   // ['', '--textNormal_Text_u3, ', '--textDefault))']
    if (pcs.length < 3) return null;
    // 'color: ', '--textNormal_Text_u3, ', '--textDefault));'
    return pcs.at(-1).split(')')[0].trim().slice(2);
}

/**
 * @param {Array<ThemeStyleUnit>} enabledUnits May contain remotes and units with no vars
 * @param {Boolean} userIsTechnical
 * @returns {Array<ThemeStyleUnit>}
 */
function getEditableUnits(enabledUnits, userIsTechnical) {
    return userIsTechnical ? enabledUnits : enabledUnits.filter(unit => !isBodyRemote(unit.id));
}

/**
 * @param {Array<ThemeStyleUnit>} unitsOfThisBlockType
 * @param {Array<ThemeStyleUnit>} enabledUnits
 * @param {String} blockTypeName
 * @param {Boolean} userIsTechnical
 * @returns {[Array<ThemeStyleUnit>, Array<ThemeStyleUnit>]} [instantiables, normalsOrReferences]
 */
function createAddableUnits(unitsOfThisBlockType, enabledUnits, blockTypeName, userIsTechnical) {
    const reference = [];
    const instantiable = [];
    if (!userIsTechnical) {
        for (const unit of unitsOfThisBlockType) {
            if (unit.origin !== SPECIAL_BASE_UNIT_NAME) {
                if (!unit.isDerivable) {
                    if (!enabledUnits.find(unit2 => unit2.id === unit.id)) reference.push(unit);
                } else {
                    if (!enabledUnits.find(unit2 => unit2.id === unit.id)) instantiable.push(unit);
                }
            } else {
                const remote = getRemoteBodyUnit(unit, blockTypeName, enabledUnits, false);
                if (remote) {
                    if (remote.isDerivable) instantiable.push(remote);
                }
            }
        }
    }
    return [instantiable, reference];
}

/**
 * @param {[Array<ThemeStyleUnit>, Array<ThemeStyleUnit>]} addableUnits [instantiable, reference]
 * @returns {Array<{value: String; label: String;}>}
 */
function createAddUnitsDropdownList([instantiable, reference]) {
    return [
        ...instantiable.reduce((out, unit) => {
            return [...out, {value: unit.id, label: `${__(unit.title)} (${__('create clone')})`}];
        }, []),
        ...(reference.length ? reference.reduce((out, unit) => {
            return [...out, {value: unit.id, label: `${__(unit.title)} (${__('reference')})`}];
        }, [{value: '-', label: '---'}]) : [])
    ];
}

/**
 * @typedef MutatedStyleInfo
 * @prop {String} originalScss
 * @prop {String} originalGeneratedCss
 * @prop {String?} originalOptimizedScss
 * @prop {String?} originalOptimizedGeneratedCss
 * @prop {String} firstMutatedVarName
 * @prop {String} firstMutatedBlockId
 * @prop {Array<BlockStub>} affectedBlocks
 *
 * @typedef CloneInstruction
 * @prop {BlockStub} block
 * @prop {AddUnitAndReplaceClassCloneAction|ReplaceClassCloneAction} action
 *
 * @typedef AddUnitAndReplaceClassCloneAction
 * @prop {'createUnitFrom'} name
 * @prop {String} from Example 'j-Section-unit-2'
 * @prop {String} fromIsCreatedFrom Example 'customUnit', 'bodyUnit', 'j-Section-unit-2'
 *
 * @typedef ReplaceClassCloneAction
 * @prop {'swapClass'} name
 * @prop {String} replace Example 'j-Button-d-4'
 * @prop {'prev'} with
 */

export default WidgetBasedStylesList;
export {createCloneInstructions, getEditableUnits, createAddableUnits, createAddUnitsDropdownList};
