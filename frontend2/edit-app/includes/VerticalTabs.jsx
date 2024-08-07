/** @extends {preact.Component<VerticalTabsProps, any>} */
class VerticalTabs extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({
            curTabIdx: this.props.initialTabIdx || 0
        });
    }
    /**
     * @param {VerticalTabsProps} props
     * @access protected
     */
    render({tabs, children, className}, {curTabIdx}) {
        return <div class={ 'vert-tabs' + (!className ? '' : ` ${className}`) }>
            <div class="vert-tab-btns">
                { tabs.map(({text, title}, i) => <button
                    onClick={ () => this.setState({curTabIdx: i}) }
                    class={ `btn btn-link text-tiny${curTabIdx !== i ? '' : ' current'}` }
                    title={ title }>
                    <span class="color-dimmed3">{ text }</span>
                </button>) }
            </div>
            <div class="vert-tab-content mb-1">
                { children(tabs[curTabIdx], curTabIdx) }
            </div>
        </div>;
    }
}

/**
 * @typedef {{
 *   tabs: Array<VerticalTabsTab>;
 *   children: (tab: VerticalTabsTab, curTabIdx: number) => preact.ComponentChildren;
 *   initialTabIdx?: number;
 *   className?: string;
 * }} VerticalTabsProps
 *
 * @typedef {{
 *   text: string;
 *   title: string;
 * }} VerticalTabsTab
 */

export default VerticalTabs;
