class Tabs extends preact.Component {
    // getTabName;
    /**
     * @param {{links: Array<preact.ComponentChild>; onTabChanged: (idx: number) => any; initialTabIdx?: number; className?: string; getTabName?: (linkText: string, tabIdx: number) => string|null;}} props
     */
    constructor(props) {
        super(props);
        this.state = {currentIdx: typeof props.initialTabIdx !== 'number' ? 0 : props.initialTabIdx};
        this.getTabName = props.getTabName || (() => null);
    }
    /**
     * @access protected
     */
    render({links, className}, {currentIdx}) {
        return <ul class={ `tab${!className ? '' : ` ${className}`}` }>{ links.map((node, i) => {
            const tabName = this.getTabName(node, i);
            return <li class={ `tab-item${i !== currentIdx ? '' : ' active'}${!tabName ? '' : ` tab-item-${tabName}`}` }>
                <a onClick={ e => { e.preventDefault(); this.changeTab(i); } }
                    href="#" class="px-2">{ node }</a>
            </li>;
        }) }</ul>;
    }
    /**
     * @param {number} toIdx
     * @access public
     */
    changeTab(toIdx) {
        this.setState({currentIdx: toIdx});
        this.props.onTabChanged(toIdx);
    }
}

export default Tabs;
