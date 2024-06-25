class Tagify extends preact.Component {
    // inputEl;
    /**
     * @param {String} newTags
     * @access public
     */
    exchangeTags(newTags) {
        const currentTags = this.tagify.getCleanValue().map(({value}) => value).join(' ');
        if (newTags !== currentTags)
            this.tagify.loadOriginalValues(newTags.split(' '));
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.inputEl = preact.createRef();
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.tagify = new window.Tagify(this.inputEl.current, {
            whitelist: this.props.createTagsDropdownChoices(),
            dropdown: {
                position: 'text',   // place the dropdown near the typed text
                maxItems: 40,       // mixumum allowed rendered suggestions
                enabled: 0,         // show suggestions on focus
                closeOnSelect: true // whether to hide the suggestions dropdown once an item has been selected
            },
            callbacks: {
                'change': e => {
                    const {value} = e.detail;
                    this.props.onChanged(value ? JSON.parse(value).map(({value}) => value).join(' ') : '');
                },
                'click': e => {
                    //
                },
            },
        });
    }
    /**
     * @access protected
     */
    shouldComponentUpdate() {
        return false;
    }
    /**
     * @access protected
     */
    render({tags}) {
        return <input
            value={ tags }
            name="input-custom-dropdown"
            class="tagify--custom-dropdown"
            placeholder="e.g. float-left mt-1 pt-1"
            ref={ this.inputEl }/>;
    }
}

export default Tagify;
