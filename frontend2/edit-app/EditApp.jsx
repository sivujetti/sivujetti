import {__, env, urlUtils} from '@sivujetti-commons-for-edit-app';
import {historyInstance, MyRouter} from './main-column/MainColumnViews.jsx';
import DefaultState from './menu-column/DefaultState.jsx';
import SaveButton from './menu-column/SaveButton.jsx';

class EditApp extends preact.Component {
    // changeViewOptions;
    // saveButtonRef;
    componentWillMount() {
        this.changeViewOptions = [
            {name: 'edit-mode', label: __('Edit mode')},
            {name: 'hide-edit-menu', label: __('Hide edit menu')},
        ].concat(this.props.dataFromAdminBackend.showGoToDashboardMode
            ? {name: 'go-to-dashboard', label: __('Go to dashboard')}
            : []
        ).concat({name: 'log-out', label: __('Log out')});
        this.saveButtonRef = preact.createRef();
    // }
    // componentDidMount() {
        this.props.onMounted({saveButtonRef: this.saveButtonRef});
    }
    render() {
        const hidePanels = false;
        const logoUrl = urlUtils.makeAssetUrl('/public/sivujetti/assets/sivujetti-logo-shape-only.png');
        return [
            <header class={ !hidePanels ? 'd-flex' : 'd-none' }>
                <div class="mode-chooser ml-2 d-flex p-1" style="margin-bottom: -.2rem; margin-top: .1rem;">
                    <a href={ urlUtils.makeUrl('_edit', true) } class="d-inline-block mr-1">
                        <img src={ logoUrl }/>
                    </a>
                    <span class="d-inline-block ml-1">
                        <span class="d-block">Sivujetti</span>
                        <select value={ this.changeViewOptions[!hidePanels ? 0 : 1].name } onChange={ e => {
                            if (e.target.value === this.changeViewOptions[1].name) {
                                this.handlePanelsAreHiddenChanged(true);
                            } else if (e.target.value === this.changeViewOptions.at(-1).name)
                                this.logUserOut();
                            else if (e.target.value === (this.changeViewOptions[2] || {}).name)
                                env.window.location.href = this.props.dataFromAdminBackend.dashboardUrl;
                            else
                                throw new Error(`Unkown option ${e.target.value}`);
                        } } class="form-select">
                        { this.changeViewOptions.map(({name, label}) =>
                            <option value={ name }>{ label }</option>
                        ) }</select>
                    </span>
                </div>
                <SaveButton
                    ref={ this.saveButtonRef }/>
            </header>,
            <MyRouter history={ historyInstance }>
                <DefaultState path="/:slug*"/>
                { /* PageCreatePanel path="/pages/create/:pageTypeName?/:layoutId?"/>
                <PageDuplicatePanel path="/pages/:pageSlug/duplicate"/>
                <PageTypeCreatePanel path="/page-types/create"/> */ }
            </MyRouter>
        ];
    }
}

export default EditApp;
