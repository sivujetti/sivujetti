class MenuSection extends preact.Component {
    /**
     * @param {{initiallyIsCollapsed?: Boolean; sections: Array<String>; startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref; currentWebPage: EditAppAwareWebPage;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isCollapsed: props.initiallyIsCollapsed !== false};
    }
    /**
     * @access protected
     */
    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error('Abstract method not implemented.');
    }
}

export {MenuSection};
