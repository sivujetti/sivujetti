import {__} from './temp.js';
import services from './services.js'; // How to expose main API to the SDK?
import EditApp from './EditApp.jsx';
import {CreateBlocksSequence, createBlockData} from './EditBox.jsx';

const todoIsBlockSavedToBackend = (_blockRef, blockData) =>
    !blockData.id.startsWith('new-')
;

const listingBlockReRender = (newDataFromForm, blockRef, prevData) => {
    if (todoIsBlockSavedToBackend(blockRef, prevData))
        // todo how to rerender dynamic listing without reloading the whole page ??
        return;
    blockRef.tryToReRenderWithHtml(`<div>A list of ${JSON.parse(newDataFromForm.fetchFilters).$all.$eq.pageType} will appear here...</div>`);
};

const listingBlockGetInitialData = () => ({
    fetchFilters: '{"$all": {"$eq": {"pageType": "Pages"}}}'
});

/*
interface FormInputs {
    applyLatestValue();
}
*/

class ListingBlockCreateFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {pageTypesThatCanBeListed: null,
                      fetchFilters: props.block.data.fetchFilters,
                      foo: JSON.parse(props.block.data.fetchFilters).$all.$eq.pageType};
        services.http.get('/api/page-types/listable')
            .then(pageTypesThatCanBeListed => { this.setState({pageTypesThatCanBeListed}); })
            .catch(window.console.error);
    }
    render(_, {pageTypesThatCanBeListed, foo}) {
        return pageTypesThatCanBeListed
            ? <select value={ foo } onChange={ e => this.asd(e, 'foo') }>{ pageTypesThatCanBeListed.map(ct =>
                <option value={ ct.name }>{ __(ct.name) }</option>
            ) }</select>
            : __('Loading ...');
    }
    asd(e, prop) {
        const asd = e.target.value;
        const fetchFilters = `{"$all": {"$eq": {"pageType": "${asd}"}}}`;
        this.setState({[prop]: asd, fetchFilters});
        this.props.onValueChanged({fetchFilters});
    }
    applyLatestValue() {
        this.props.block.data.fetchFilters = this.state.fetchFilters;
    }
}

class ListingBlockEditFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.pageType = JSON.parse(props.blockData.fetchFilters).$all.$eq.pageType;
        this.pageTypeSingular = this.pageType.substr(0, this.pageType.length - 1);
        this.dos = preact.createRef();
        this.state = {blockRefs: null, blocksData: null};
    }
    render({blockRef}) {
        return <>
            <button onClick={ this.openCreateItemToListingSequence.bind(this) } title="" class="btn" type="button">{ __(`Add ${this.pageTypeSingular}`) }</button>
            <CreateBlocksSequence title={ `Add ${this.pageTypeSingular}` } d={ () => {
                return {top: blockRef.position.top - this.props.getEditBoxHeight(),
                        left: blockRef.position.left};
            } } pageType={ this.pageType } ref={ this.dos }/>
        </>;
    }
    openCreateItemToListingSequence() {
        services.http.get(`/api/page-types/${this.pageType}`)
            .then(pageType => {
                const lastListItem = this.props.blockRef; // todo
                const d = makeBlocksFrom(pageType.fields, lastListItem); // Note: appends nodes to DOM
                this.setState(d);
                // todo update initial "Edit listing" editbox
                // Open first property automatically
                setTimeout(() => {
                this.dos.current.open(d.blockRefs, d.blocksDatas);
                }, 20);
            })
            .catch(window.console.error);
    }
    applyLatestValue() {
        //
    }
}

function makeBlocksFrom(pageTypeFields, after) {
    const out = {
        blockRefs: [],
        blocksDatas: [],
    };
    pageTypeFields.forEach(field => {
        const t = services.blockTypes.get(field.blockType);
        const initialData = Object.assign(
            createBlockData({
                type: field.blockType,
                section: 'main', // todo
                id: '<none>',
            }),
            t.getInitialData(),
            field.initialData
        );
        out.blockRefs.push(EditApp.currentWebPage.addBlockT(t, initialData, after));
        out.blocksDatas.push(Object.assign({title: null /* todo */}, initialData));
    });
    return out;
}

const blockType = {
    reRender: listingBlockReRender,
    getInitialData: listingBlockGetInitialData,
    CreateFormImpl: ListingBlockCreateFormInputs,
    EditFormImpl: ListingBlockEditFormInputs,
    friendlyName: 'Listing',
    defaultRenderer: 'kuura:auto',
};

export default blockType;
