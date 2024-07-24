class Tagify extends preact.Component {
    // inputEl;
    // currentVal;
    /**
     * @param {string} newTags
     * @access public
     */
    exchangeTags(newTags) {
        if (newTags !== this.currentVal) {
            this.currentVal = newTags;
            this.tagify.loadOriginalValues(newTags);
        }
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
        const el = this.inputEl.current;
        this.currentVal = `${el.value}`;
        this.tagify = new window.Tagify(el, {
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
                    const newVal = value ? JSON.parse(value).map(({value}) => value).join(' ') : '';
                    if (newVal !== this.currentVal) {
                        this.currentVal = newVal;
                        this.props.onChanged(newVal);
                    }
                },
                'click': this.props.onTagClicked || (() => {}),
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
