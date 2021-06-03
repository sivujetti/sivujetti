import {__} from './temp.js';
import services from './services.js'; // How to expose main API to the SDK?

const todoIsBlockSavedToBackend = (_blockRef, blockData) =>
    !blockData.id.startsWith('new-')
;

const listingBlockReRender = (newDataFromForm, blockRef, prevData) => {
    if (todoIsBlockSavedToBackend(blockRef, prevData))
        // todo how to rerender dynamic listing without reloading the whole page ??
        return;
    blockRef.tryToReRenderWithHtml(`<div>A list of ${JSON.parse(newDataFromForm.fetchFilters).$all.$eq.contentType} will appear here...</div>`);
};

const listingBlockGetInitialData = () => ({
    fetchFilters: '{"$all": {"$eq": {"contentType": "Pages"}}}'
});

/*
interface FormInputs {
    applyLatestValue();
}
*/

class ListingBlockCreateFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {contentTypesThatCanBeListed: null,
                      fetchFilters: props.blockData.fetchFilters,
                      foo: JSON.parse(props.blockData.fetchFilters).$all.$eq.contentType};
        services.http.get('/api/content-types/listable')
            .then(contentTypesThatCanBeListed => { this.setState({contentTypesThatCanBeListed}); })
            .catch(window.console.error);
    }
    render(_, {contentTypesThatCanBeListed, foo}) {
        return contentTypesThatCanBeListed
            ? <select value={ foo } onChange={ e => this.asd(e, 'foo') }>{ contentTypesThatCanBeListed.map(ct =>
                <option value={ ct.name }>{ __(ct.name) }</option>
            ) }</select>
            : __('Loading ...');
    }
    asd(e, prop) {
        const asd = e.target.value;
        const fetchFilters = `{"$all": {"$eq": {"contentType": "${asd}"}}}`;
        this.setState({[prop]: asd, fetchFilters});
        this.props.onValueChanged({fetchFilters});
    }
    applyLatestValue() {
        this.props.blockData.fetchFilters = this.state.fetchFilters;
    }
}

class ListingBlockEditFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.entityType = JSON.parse(props.blockData.fetchFilters).$all.$eq.contentType;
        this.entityTypeSingular = this.entityType.substr(0, this.entityType.length - 1);
    }
    render({blockData}) {
        let F = AddPageView;
        // if (this.entityType === 'Articles')
        //     F = 'SomeOther';
        // if (this.entityType === 'MyTypes')
        //     F = 'SomeOther2';
        return <>
            <button onClick={ () => services.editApp.openView(F, {entityType: this.entityTypeSingular, listingTitle: blockData.title || '[not-specified]'}) } title="" class="btn">{ __(`Add ${this.entityTypeSingular}`) }</button>
        </>;
    }
    applyLatestValue() {
        //
    }
}

// todo see notes.txt
class AddPageView extends preact.Component {
    /**
     * @param {todo} props
     */
    constructor(props) {
        super(props);
        this.state = {title: 'Title', slug: 'title', template: 'full-width'};
    }
    /**
     * @acces protected
     */
    render({entityType, listingTitle}, {title, slug}) {
        return <div>
            <h2>{ `${__('Add')} ${entityType}` }</h2>
            <div>{ __(`Add new entry to "${listingTitle}" listing.`) }</div>
            <form onSubmit={ this.handleSubmit.bind(this) }>
                <input value={ title } onInput={ e => this.doo(e, 'title') }/>
                <br/>
                <input value={ slug } onInput={ e => this.doo(e, 'slug') }/>
                <br/>
                <button class="btn">{ __('Add') }</button>
                <button onClick={ this.handleCancel.bind(this) } class="btn btn-link" type="button">{ __('Cancel') }</button>
            </form>
        </div>;
    }
    /**
     * @param {todo} e
     * @acces private
     */
    handleSubmit(e) {
        e.preventDefault();
        services.http.post('/api/temp-create-service-and-add-it-to-list', {
            title: this.state.title,
            slug: this.state.slug,
            template: this.state.template,
        })
        .then(_resp => {
            window.location.reload();
        })
        .catch(_err => {
            // ??
        });
    }
    /**
     * @acces private
     */
    handleCancel() {
        this.props.view.close();
    }
    /**
     * @param {todo} e
     * @param {todo} e
     * @acces private
     */
    doo(e, prop) {
        this.setState({[prop]: e.target.value});
    }
}

const blockType = {
    reRender: listingBlockReRender,
    getInitialData: listingBlockGetInitialData,
    CreateFormImpl: ListingBlockCreateFormInputs,
    EditFormImpl: ListingBlockEditFormInputs,
    friendlyName: 'Listing',
};

export default blockType;
