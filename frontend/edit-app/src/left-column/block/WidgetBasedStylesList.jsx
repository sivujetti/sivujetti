import {__, api, env, timingUtils, Popup, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import ContextMenu from '../../commons/ContextMenu.jsx';
import store2, {observeStore as observeStore2} from '../../store2.js';
import VisualStyles, {createUnitClass, valueEditors, replaceVarValue, varNameToLabel} from './VisualStyles.jsx';
import {StylesList, tempHack, blockHasStyle, findParentStyleInfo,
        updateAndEmitUnitScss, emitCommitStylesOp, goToStyle, EditableTitle,
        compileSpecial, emitAddStyleClassToBlock, findBodyStyle} from './CodeBasedStylesList.jsx';
import {traverseAst} from '../../commons/CssStylesValidatorHelper.js';
import {SPECIAL_BASE_UNIT_NAME, getLargestPostfixNum, findBlockTypeStyles} from './styles-shared.js';

const {compile, serialize, stringify} = window.stylis;

class WidgetBasedStylesList extends StylesList {
    // addUserUnitDropdown;
    // openAddStylePopupBtn;
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
        this.openAddStylePopupBtn = preact.createRef();
        this.setState({unitsEnabled: null, unitsOfThisBlockType: []});
        this.curBlockStyleClasses = this.props.blockCopy.styleClasses;
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}, [_event]) => {
            if (this.group === true) return;
            this.bodyStyle = findBodyStyle(themeStyles);
            const {units} = findBlockTypeStyles(themeStyles, this.props.blockCopy.type) || {};
            if (this.state.unitsOfThisBlockType !== units)
                this.updateTodoState(units, themeStyles, this.curBlockStyleClasses !== this.props.blockCopy.styleClasses ? {...this.props.blockCopy, ...{styleClasses: this.curBlockStyleClasses}} : this.props.blockCopy);
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
            if (blockCopy.styleClasses.length < this.curBlockStyleClasses.length && (this.state.unitsOfThisBlockType || []).length)
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
    render({blockCopy}, {unitsEnabled, unitsOfThisBlockType, parentStyleInfo, addStylePopupRenderer}) {
        const derivables = unitsOfThisBlockType.filter(unit => this.isDerivable(unit, blockCopy));
        const addables = derivables.filter(base => !this.alreadyHasInstance(this.getMaybeRemote(base, blockCopy), blockCopy));
        const vm = this;
        return [...[
            unitsEnabled !== null ? unitsEnabled.length ? <ul class="list styles-list mb-2">{ unitsEnabled.map((unit, i) => {
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
                                userCanEditCss={ true }
                                subtitle={ null }
                                ref={ this.editableTitleInstances[i] }/>
                        </b>
                    </header>
                    <div class="form-horizontal has-color-pickers pt-0 px-2 tight">{ cssVars.map(cssVar => {
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
                                this.emitChange(val, cssVar, either, ast);
                            } }
                            selector={ `.${cls}` }
                            key={ `${key}-${cssVar.varName}` }/>;
                    }) }</div>
                </li>;
            }) }</ul> : <p class="pt-1 mb-2 color-dimmed">{ __('No own styles') }.</p>
            : <LoadingSpinner className="ml-1 mb-2 pb-2"/>
        ], addables.length
            ? <button
                onClick={ () => this.setState({addStylePopupRenderer: AddStyleFromPopupPopup}) }
                class="btn btn-primary btn-sm mr-1"
                type="button"
                ref={ this.openAddStylePopupBtn }>{ __('Add style') }</button>
            : null,
        parentStyleInfo && parentStyleInfo[2]
            ? <button
                onClick={ () => goToStyle(parentStyleInfo) }
                class="btn btn-sm"
                type="button">{ __('Show parent styles') }</button>
            : null,
        <ContextMenu
                links={ this.createContextMenuLinks() }
                onItemClicked={ this.handleMoreMenuLinkClicked.bind(this) }
                onMenuClosed={ () => { this.refElOfOpenMoreMenu.style.opacity = ''; } }
                ref={ this.moreMenu }/>,
        addStylePopupRenderer
            ? <Popup
                Renderer={ addStylePopupRenderer }
                rendererProps={ {
                    availableStyleUnits: addables,
                    /** @param {ThemeStyleUnit} unit */
                    getTitle(unit) {
                        return __(vm.getMaybeRemote(unit, blockCopy).title);
                    },
                    /** @param {ThemeStyleUnit} unit */
                    onStyleSelected(unit) {
                        vm.addUnitFrom(unit, blockCopy);
                        vm.setState({addStylePopupRenderer: null});
                    },
                } }
                btn={ this.openAddStylePopupBtn.current }
                close={ () => this.setState({addStylePopupRenderer: null}) }/>
            : null
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
     * @param {ThemeStyleUnit} unit Example: {"title":"Oletus","id":"unit-1","scss":<scss>,"generatedCss":"","origin":"_body_","specifier":"","isDerivable":false,"derivedFrom":"unit-2"}
     * @param {RawBlock} block
     * @param {Boolean} copy = false
     * @returns {ThemeStyleUnit|null}
     * @access private
     */
    getRemoteBodyUnit(unit, block, copy = true) {
        const lookFor = createUnitClass(unit.id, block.type);
        const out = this.bodyStyle.units.find(u => u.id === lookFor);
        return out ? copy ? {...out} : out : null;
    }
    /**
     * @param {Array<ThemeStyleUnit>|undefined} candidate
     * @param {Array<ThemeStyle>} themeStyles
     * @param {RawBlock} blockCopy = this.props.blockCopy
     * @access private
     */
    updateTodoState(unitsOfThisBlockType, themeStyles, blockCopy = this.props.blockCopy) {
        const isUnitStyleOn = unit => blockHasStyle(blockCopy, createUnitClass(unit.id, blockCopy.type), unit);
        const unitsEnabled1 = unitsOfThisBlockType.filter(unit => isUnitStyleOn(unit));
        const unitsEnabled = unitsEnabled1.filter((unit, _i, arr) => !unit.origin ? true : this.alreadyHasInstance(unit, blockCopy, arr));
        this.debouncedEmitVarValueChange = timingUtils.debounce(
            this.emitVarValueChange.bind(this),
            env.normalTypingDebounceMillis
        );
        this.receiveUnits(unitsEnabled);
        this.setState({unitsEnabled,
            unitsOfThisBlockType: unitsOfThisBlockType,
            parentStyleInfo: findParentStyleInfo(themeStyles, blockCopy)});
    }
    /**
     * @see this.emitVarValueChange
     * @access private
     */
    emitChange(str, cssVar, unit, ast) {
        this[str !== null ? 'debouncedEmitVarValueChange' : 'emitVarValueChange'](str, cssVar, unit, ast);
    }
    /**
     * @param {String} newValAsString
     * @param {CssVar} cssVar
     * @param {ThemeStyleUnit} unit
     * @param {Array<StylisAstNode>} ast
     * @access private
     */
    emitVarValueChange(newValAsString, cssVar, unit, ast) {
        const [_, node2] = getCurrentInfo(cssVar, ast);
        this.updVarDeclOnly({...unit}, node2, newValAsString, ast);
    }
    /**
     * @param {ThemeStyleUnit} unitCopy
     * @param {StylisAstNode} varDeclAstNode
     * @param {String} newValAsString Example: '#333333ff', '1rem'
     * @param {Array<StylisAstNode>} ast
     */
    updVarDeclOnly(unitCopy, varDeclAstNode, newValAsString, ast) {
        const varDecl = varDeclAstNode.props; // '--foo'
        const blockTypeName = !unitCopy.origin ? this.props.blockCopy.type : SPECIAL_BASE_UNIT_NAME;
        updateAndEmitUnitScss(unitCopy, copy => {
            varDeclAstNode.children = newValAsString;
            varDeclAstNode.value = `${varDecl}:${newValAsString};`;
            const newScss = replaceVarValue(copy.scss, varDeclAstNode, newValAsString);
            if (!copy.origin)
                return {newScss, newGenerated: serialize(ast, stringify)};
            else {
                const [shouldCommit, result] = compileSpecial(newScss, copy.scss, copy.specifier,
                                                                copy.id, copy.origin);
                return shouldCommit ? {newScss, newGenerated: result.generatedCss || ''} : null;
            }
        }, blockTypeName);
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
            this.addUnitClone(this.getRemoteBodyUnit(unit, block, false), block, true);
        else
            this.addCloneOfUnitClone(unit);
    }
    /**
     * @param {ThemeStyleUnit} unit
     * @param {RawBlock} block
     * @param {Boolean} isDerivable = false
     * @access private
     */
    addUnitClone(unit, block, isDerivable = false) {
        const {type} = this.props.blockCopy;
        const current = findBlockTypeStyles(store2.get().themeStyles, type);
        const rolling = current ? getLargestPostfixNum(current.units) + 1 : 1;
        const title = `${__(block.title || block.type)} ${rolling}`;
        const id = `unit-${rolling}`;
        const scss = unit.scss.replace(
            // textNormal_TextCommon_base
            !isDerivable ? /_base\d+/g : /_default\d?/g,
            // textNormal_TextCommon_u<n>
            `_u${rolling}`,
        );
        const cls = createUnitClass(id, type);

        // #2
        const addedStyleToBlock = true;
        if (addedStyleToBlock)
            this.curBlockStyleClasses = emitAddStyleClassToBlock(cls, this.props.blockCopy);

        // #1
        const newUnit = {title, id, scss, generatedCss: serialize(compile(`.${cls}{${scss}}`), stringify),
            origin: '', specifier: '', isDerivable: false, derivedFrom: unit.id};
        if (current) store2.dispatch('themeStyles/addUnitTo', [type, newUnit]);
        else store2.dispatch('themeStyles/addStyle', [{units: [newUnit], blockTypeName: type}]);

        //
        emitCommitStylesOp(type, () => {
            // Revert # 1
            if (current) store2.dispatch('themeStyles/removeUnitFrom', [type, newUnit]);
            else store2.dispatch('themeStyles/removeStyle', [type]);

            // Revert # 2
            if (addedStyleToBlock) setTimeout(() => { api.saveButton.triggerUndo(); }, 100);
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
     * @param {ThemeStyleUnit} base
     * @param {RawBlock} blockCopy
     * @param {Array<ThemeStyleUnit>} unitsEnabled1
     * @returns {Boolean}
     * @access private
     */
    alreadyHasInstance(base, blockCopy, unitsEnabled1 = this.state.unitsEnabled) {
        return unitsEnabled1.some(unit => this.getMaybeRemote(unit, blockCopy).derivedFrom === base.id);
    }
    /**
     * @param {ThemeStyleUnit} unit
     * @param {RawBlock} blockCopy
     * @returns {Boolean}
     * @access private
     */
    isDerivable(unit, blockCopy) {
        return unit.origin !== '_body_'
            ? unit.isDerivable || !!unit.derivedFrom
            : this.getRemoteBodyUnit(unit, blockCopy, false).isDerivable;
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
            const bodyUnitsSorted = this.bodyStyle.units;//.filter(({id}) => id.startsWith(createUnitClass('', blockTypeName)))
            // todo sort id:'default'  first
            // todo sort blockTypeName' after that
            for (const bodyUnit of bodyUnitsSorted) {
                const [cssVars, _ast2] = VisualStyles.extractVars(bodyUnit.scss, 'dummy');
                const theVar = cssVars.find(({varName}) => varName === fallbackVarName);
                if (theVar) return theVar.value;
            }
            return null;
        } else {
            if (forVar.value !== 'initial') return null;
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
     * @access private
     */
    findParenVar(cssVar, unit) {
        const pcs = unit.derivedFrom.split('-'); // normal -> 'unit-<n>', body -> 'j-Type-unit-<n>'
        const isDerivedFromBodyUnit = pcs.length > 2;
        const paren = (!isDerivedFromBodyUnit ? this.state.unitsOfThisBlockType : this.bodyStyle.units).find(({id}) => id === unit.derivedFrom);
        const [parenVars, _ast2] = VisualStyles.extractVars(paren.scss, 'dummy');
        const parenVarName = swapAppendix(cssVar.varName, parenVars[0].varName);
        return parenVars.find(({varName}) => varName === parenVarName);
    }
}

/**
 * @param {String} target Example 'background_Button_u3'
 * @param {String} source Example 'varName_Button_base1'
 * @returns {String} Example 'background_Button_base1'
 */
function swapAppendix(target, source) {
    const apdx = source.split('_').at(-1); // 'background_Button_base1' -> 'base1'
    const origPcs = target.split('_'); // 'background_Button_u3' -> ['background', 'Button', 'u3']
    return [...origPcs.slice(0, -1), apdx].join('_'); // [..., 'u3'] -> [..., 'base1']
}

class AddStyleFromPopupPopup extends preact.Component {
    /**
     * @param {{availableStyleUnits: Array<ThemeStyleUnit>; onStyleSelected: (unit: ThemeStyleUnit) => void; getTitle: (unit: ThemeStyleUnit) => String;}}
     * @access protected
     */
    render({availableStyleUnits, onStyleSelected, getTitle}) {
        return availableStyleUnits.map(unit =>
            <label class="form-radio py-0 my-0" key={ unit.id }>
                <input
                    onClick={ e => {
                        onStyleSelected(availableStyleUnits.find(({id}) => id === e.target.value));
                    } }
                    value={ unit.id }
                    name="selectedStyle"
                    type="radio"/><i class="form-icon"></i> { getTitle(unit) }
            </label>
        );
    }
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

export default WidgetBasedStylesList;
