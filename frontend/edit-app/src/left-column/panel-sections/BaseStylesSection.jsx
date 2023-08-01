import {__, api, signals, MenuSection} from '@sivujetti-commons-for-edit-app';
import Tabs from '../../commons/Tabs.jsx';
import {observeStore as observeStore2} from '../../store2.js';
import {SPECIAL_BASE_UNIT_NAME, StyleTextarea, specialBaseUnitCls, findBodyStyle,
        findBodyStyleMainUnit, updateAndEmitUnitScss, tempHack} from '../block/styles-shared.jsx';
import VisualStyles from '../block/VisualStyles.jsx';

class BaseStylesSection extends preact.Component {
    // userCanEditVars;
    // userCanEditCss;
    // section;
    // unregistrables;
    // cssVars;
    // ast;
    /**
     * @access protected
     */
    componentWillMount() {
        this.userCanEditVars = api.user.can('editThemeVars');
        this.userCanEditCss = api.user.can('editThemeCss');
        this.section = preact.createRef();
        this.setState({currentTabIdx: 0, bodyStyleMainUnit: null});
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}) => {
            if (!this.state.bodyStyleMainUnit) return;
            const latest = findBodyStyleMainUnit(findBodyStyle(themeStyles));
            if (this.state.bodyStyleMainUnit.scss !== latest.scss)
                this.updateBaseStylesState(latest);
        }), signals.on('block-styles-go-to-base-styles-button-clicked', () => {
            const cmp = this.section.current;
            if (cmp.state.isCollapsed) cmp.collapseOrUncollapse();
            setTimeout(() => { api.mainPanel.scrollToSection('baseStyles'); }, 80);
        })];
    }
    /**
     * @param {ThemeStyleUnit} bodyStyleMainUnit
     * @access private
     */
    updateBaseStylesState(bodyStyleMainUnit) {
        [this.cssVars, this.ast] = VisualStyles.extractVars(bodyStyleMainUnit.scss, specialBaseUnitCls);
        this.setState({bodyStyleMainUnit});
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
    render(_, {bodyStyleMainUnit, currentTabIdx}) {
        return <MenuSection
            title={ __('Styles') }
            subtitle={ __('Colours and fonts') }
            iconId="palette"
            colorClass="color-pink"
            onIsCollapsedChanged={ this.onIsCollapsedChanged.bind(this) }
            outerClass="base-styles"
            ref={ this.section }>
            <div>
                { this.userCanEditCss ? <Tabs
                    links={ [__('Visual'), __('Code')] }
                    onTabChanged={ toIdx => this.setState({currentTabIdx: toIdx}) }
                    className="text-tinyish mt-0 mb-2"/> : null }
                <div class={ currentTabIdx === 0 && this.userCanEditVars ? '' : 'd-none' }>
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
                <div class={ currentTabIdx === 1 && this.userCanEditCss ? '' : 'd-none' }>
                    { this.userCanEditCss && bodyStyleMainUnit
                        ? <StyleTextarea
                            unitCopy={ {...bodyStyleMainUnit} }
                            unitCls={ specialBaseUnitCls }
                            blockTypeName={ SPECIAL_BASE_UNIT_NAME }
                            isVisible={ true }/>
                        : null
                    }
                </div>
            </div>
        </MenuSection>;
    }
    /**
     * @param {Boolean} to
     * @access private
     */
    onIsCollapsedChanged(to) {
        if (!to && !this.state.bodyStyleMainUnit)
            tempHack(({styles}) => {
                this.updateBaseStylesState(findBodyStyleMainUnit(findBodyStyle(styles)));
            });
    }
}

export default BaseStylesSection;
