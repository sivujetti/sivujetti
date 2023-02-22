class Tabs extends preact.Component {
    /**
     * @param {{links: Array<string>; onTabChanged: (idx: number) => any; initialIndex?: Number; className?: string;}} props
     */
    constructor(props) {
        super(props);
        this.state = {currentIdx: typeof props.initialIndex !== 'number' ? 0 : props.initialIndex};
    }
    /**
     * @access protected
     */
    render({links, className}, {currentIdx}) {
        return <ul class={ `tab${!className ? '' : ` ${className}`}` }>{ links.map((text, i) =>
            <li class={ `tab-item${i !== currentIdx ? '' : ' active'}` }>
                <a onClick={ e => { e.preventDefault(); this.changeTab(i); } }
                    href="#" class="px-2">{ text }</a>
            </li>
        ) }</ul>;
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
