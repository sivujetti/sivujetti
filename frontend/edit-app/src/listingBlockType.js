import {__} from './temp.js';

const todoIsBlockSavedToBackend = (_blockRef, blockData) =>
    !blockData.id.startsWith('new-')
;

const listingBlockReRender = (newDataFromForm, blockRef, prevData) => {
    if (todoIsBlockSavedToBackend(blockRef, prevData))
        // todo how to rerender dynamic listing without reloading the whole page ??
        return;
    blockRef.tryToReRenderWithHtml('<div>Listing results will appear here...</div>');
};

const listingBlockGetInitialData = () => ({
    fetchFilters: '{$all: {$eq: {entityType: "pages"}}}'
});

/*
interface FormInputs {
    applyLatestValue();
}
*/

class ListingBlockFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {fetchFilters: props.blockData.fetchFilters};
    }
    render(_, {fetchFilters}) {
        return <textarea onInput={ this.handleInput.bind(this) }>{ fetchFilters }</textarea>;
    }
    handleInput(e) {
        const fetchFilters = e.target.value;
        this.setState({fetchFilters});
        this.props.onValueChanged({fetchFilters});
    }
    applyLatestValue() {
        this.props.blockData.fetchFilters = this.state.fetchFilters;
    }
}

const blockType = {
    reRender: listingBlockReRender,
    getInitialData: listingBlockGetInitialData,
    FormImpl: ListingBlockFormInputs,
    friendlyName: 'Listing',
};

export default blockType;
