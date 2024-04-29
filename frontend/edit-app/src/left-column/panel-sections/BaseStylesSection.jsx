import {__, api, signals/*, MenuSection*/} from '@sivujetti-commons-for-edit-app';
import Tabs from '../../commons/Tabs.jsx';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {extractVars} from '../styles-tabs/scss-ast-funcs.js';
import {findBodyStyle, specialBaseUnitCls, SPECIAL_BASE_UNIT_NAME,
        updateAndEmitUnitScss} from '../styles-tabs/styles-tabs-common.js';
import StyleTextarea from '../styles-tabs/StyleTextarea.jsx';
import VisualStyles from '../styles-tabs/VisualStyles.jsx';

// ## class BaseStylesSection extends preact.Component {
    // userCanEditVisualStyles;
    // userCanEditCss;
    // section;
    // unregistrables;
    // cssVars;
    // ast;
    /**
     * @access protected
     */
    componentWillMount() {
        this.userCanEditVisualStyles = api.user.can('editBlockStylesVisually');
        this.userCanEditCss = api.user.can('editBlockCss');
        this.section = preact.createRef();
        this.setState({currentTabIdx: 0, bodyStyleMainUnit: null});
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}) => {
// ##             if (!this.state.bodyStyleMainUnit) return;
// ##             const latest = findBodyStyleMainUnit(findBodyStyle(themeStyles));
// ##             if (this.state.bodyStyleMainUnit.scss !== latest.scss)
// ##                 this.updateBaseStylesState(latest);
        }), signals.on('block-styles-go-to-base-styles-button-clicked', () => {
            const cmp = this.section.current;
            if (cmp.state.isCollapsed) cmp.collapseOrUncollapse();
            setTimeout(() => { api.menuPanel.scrollToSection('baseStyles'); }, 80);
        })];
    }
// ##     /**
// ##      * @param {ThemeStyleUnit} bodyStyleMainUnit
// ##      * @access private
// ##      */
// ##     updateBaseStylesState(bodyStyleMainUnit) {
// ##         [this.cssVars, this.ast] = extractVars(bodyStyleMainUnit.scss, specialBaseUnitCls);
// ##         this.setState({bodyStyleMainUnit});
// ##     }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render(_, {bodyStyleMainUnit, currentTabIdx}) {
// ##         return <MenuSection
// ##             title={ __('Styles') }
// ##             subtitle={ __('Colours and fonts') }
// ##             iconId="palette"
// ##             colorClass="color-pink"
// ##             onIsCollapsedChanged={ this.onIsCollapsedChanged.bind(this) }
// ##             outerClass="base-styles"
// ##             ref={ this.section }>
// ##             <div>
// ##                 { this.userCanEditCss ? <Tabs
                    links={ [__('Visual'), __('Code')] }
                    onTabChanged={ toIdx => this.setState({currentTabIdx: toIdx}) }
                    className="text-tinyish mt-0 mb-2"/> : null }
                <div class={ currentTabIdx === 0 && this.userCanEditVisualStyles ? '' : 'd-none' }>
                    { bodyStyleMainUnit
                        ? <VisualStyles
                            vars={ this.cssVars }
                            ast={ this.ast }
                            scss={ bodyStyleMainUnit.scss }
                            emitVarValueChange={ getStyleUpdates => {
                                updateAndEmitUnitScss(Object.assign({}, bodyStyleMainUnit), getStyleUpdates, SPECIAL_BASE_UNIT_NAME);
                            } }
                            unitCls={ specialBaseUnitCls }/>
                        : null
                    }
                </div>
// ##                 <div class={ currentTabIdx === 1 && this.userCanEditCss ? '' : 'd-none' }>
// ##                     { this.userCanEditCss && bodyStyleMainUnit
// ##                         ? <StyleTextarea
// ##                             unitCopy={ {...bodyStyleMainUnit} }
// ##                             unitCls={ specialBaseUnitCls }
// ##                             blockTypeName={ SPECIAL_BASE_UNIT_NAME }/>
// ##                         : null
// ##                     }
// ##                 </div>
            </div>
        </MenuSection>;
    }
// ##     /**
// ##      * @param {Boolean} to
// ##      * @access private
// ##      */
// ##     onIsCollapsedChanged(to) {
// ##         if (!to && !this.state.bodyStyleMainUnit)
// ##             this.updateBaseStylesState(findBodyStyleMainUnit(findBodyStyle(store2.get().themeStyles)));
// ##     }
// ## }
// ## 
// ## /**
// ##  * @param {ThemeStyle} bodyStyle
// ##  * @returns {ThemeStyleUnit}
// ##  */
// ## function findBodyStyleMainUnit(bodyStyle) {
// ##     return bodyStyle.units[0];
// ## }
// ## 
// ## export default BaseStylesSection;
