import {__} from './temp.js';
import services from './services.js'; // How to expose main API to the SDK?

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
    fetchFilters: '{"$all": {"$eq": {"contentType": "Services"}}}'
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
        this.entityType = JSON.parse(this.state.fetchFilters).$all.$eq.contentType;
        this.entityTypeSingular = this.entityType.substr(0, this.entityType.length - 1);
    }
    render({blockData}, {fetchFilters}) {
        let F = AddPageView;
        // if (this.entityType === 'Articles')
        //     F = 'SomeOther';
        // if (this.entityType === 'MyTypes')
        //     F = 'SomeOther2';
        return <>
            <button onClick={ () => services.editApp.openView(F, {entityType: this.entityTypeSingular, listingTitle: blockData.title || '[not-specified]'}) } title="" class="btn">{ __(`Add ${this.entityTypeSingular}`) }</button>
            <div>----</div>
            <textarea onInput={ this.handleInput.bind(this) }>{ fetchFilters }</textarea>
        </>;
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
    FormImpl: ListingBlockFormInputs,
    friendlyName: 'Listing',
};

export default blockType;
