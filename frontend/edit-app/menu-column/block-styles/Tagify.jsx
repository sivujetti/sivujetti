/** @extends {preact.Component<{tags: string; createTagsDropdownChoices: () => Array<string>; onChanged: (newTags: string) => void; onTagClicked: () => void;}, any>} */
class Tagify extends preact.Component {
    /**
     * @param {string} newTags
     * @access public
     */
    exchangeTags(newTags) {
        if (newTags !== this.currentVal) {
            this.currentVal = newTags;
            this.tagify.loadOriginalValues(newTags ? newTags.split(' ') : []);
        }
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.inputEl = preact.createRef();
        /** @type {string} */
        this.currentVal = null;
        /** @type {Object} */
        this.tagify = null;
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
        return <div>
            <input
                value={ tags.split(' ') }
                name="input-custom-dropdown"
                class="tagify--custom-dropdown"
                placeholder="e.g. float-left mt-1 pt-1"
                ref={ this.inputEl }/>
        </div>;
    }
}

export default Tagify;
