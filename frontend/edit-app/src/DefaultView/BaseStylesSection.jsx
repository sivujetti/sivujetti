import {__, api, Icon, MenuSection} from '@sivujetti-commons-for-edit-app';
import Tabs from '../commons/Tabs.jsx';
import {StyleTextarea, tempHack, updateAndEmitUnitScss} from '../Block/BlockStylesTab.jsx';
import VisualStyles from '../Block/VisualStyles.jsx';
import {observeStore as observeStore2} from '../store2.js';

class BaseStylesSection extends MenuSection {
    // userCanEditVars;
    // userCanEditCss;
    // unregistrables;
    // cssVars;
    // ast;
    /**
     * @access protected
     */
    componentWillMount() {
        this.userCanEditVars = api.user.can('editThemeVars');
        this.userCanEditCss = api.user.can('editThemeCss');
        this.setState({currentTabIdx: 0, bodyStyleMainUnit: null});
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}) => {
            if (!this.state.bodyStyleMainUnit) return;
            const latest = findBodyMainUnit(themeStyles);
            if (this.state.bodyStyleMainUnit.scss !== latest.scss)
                this.updateBaseStylesState(latest);
        })];
    }
    /**
     * @param {ThemeStyleUnit} bodyStyleMainUnit
     * @access private
     */
    updateBaseStylesState(bodyStyleMainUnit) {
        [this.cssVars, this.ast] = VisualStyles.extractVars(bodyStyleMainUnit.scss, 'j-_body_');
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
    render(_, {bodyStyleMainUnit, currentTabIdx, isCollapsed}) {
        return <section class={ `panel-section${isCollapsed ? '' : ' open'}` }>
            <button class="flex-centered pr-2 section-title col-12" onClick={ this.toggleIsCollapsed.bind(this) }>
                <Icon iconId="palette" className="p-absolute size-sm mr-2 color-pink"/>
                <span class="pl-1 d-block col-12 color-default">
                    { __('Styles') }
                    <span class="text-ellipsis text-tiny col-12">{ __('Colours and fonts') }</span>
                </span>
                <Icon iconId="chevron-right" className="p-absolute size-xs"/>
            </button>
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
                                updateAndEmitUnitScss(Object.assign({}, bodyStyleMainUnit), getStyleUpdates, '_body_');
                            } }/>
                        : null
                    }
                </div>
                <div class={ currentTabIdx === 1 && this.userCanEditCss ? '' : 'd-none' }>
                    { this.userCanEditCss && bodyStyleMainUnit
                        ? <StyleTextarea
                            unitCopy={ Object.assign({}, bodyStyleMainUnit) }
                            unitCls="j-_body_"
                            blockTypeName="_body_"
                            isVisible={ true }/>
                        : null
                    }
                </div>
            </div>
        </section>;
    }
    /**
     * @access private
     */
    toggleIsCollapsed() {
        const newState = {isCollapsed: !this.state.isCollapsed};
        if (newState.isCollapsed === false && !this.state.bodyStyleMainUnit)
            tempHack(({styles}) => {
                this.updateBaseStylesState(findBodyMainUnit(styles));
            });
        this.setState(newState);
    }
}

/**
 * @param {Array<ThemeStyle>} styles
 * @returns {ThemeStyleUnit}
*/
function findBodyMainUnit(styles) {
    return styles.find(s => s.blockTypeName === '_body_').units[0];
}

export default BaseStylesSection;