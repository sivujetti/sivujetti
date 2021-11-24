/**
 * @param {{links: Array<string>; onTabChanged: (idx: number) => any; className?: string;}} props
 */
const Tabs = ({links, onTabChanged, className}) => {
    const [currentIdx, setCurrentIdx] = preactHooks.useState(0);
    /**
     * @param {number} toIdx
     */
    const changeTab = toIdx => {
        setCurrentIdx(toIdx);
        onTabChanged(toIdx);
    };
    //
    return <ul class={ `tab${!className ? '' : ` ${className}`}` }>{ links.map((text, i) =>
        <li class={ `tab-item${i !== currentIdx ? '' : ' active'}` }>
            <a onClick={ e => { e.preventDefault(); changeTab(i); } }
                href="#" class="px-2">{ text }</a>
        </li>
    ) }</ul>;
};

export default Tabs;
