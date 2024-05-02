import {__, env, http, urlUtils} from '@sivujetti-commons-for-edit-app';
import toasters from './includes/toasters.jsx';
import {historyInstance, MyRouter} from './main-column/MainColumnViews.jsx';
import PageCreateState from './menu-column/page/PageCreateState.jsx';
import PageDuplicateState from './menu-column/page/PageDuplicateState.jsx';
import DefaultState from './menu-column/DefaultState.jsx';
import SaveButton from './menu-column/SaveButton.jsx';

class EditApp extends preact.Component {
    // changeViewOptions;
    /**
     * @access protected
     */
    componentWillMount() {
        this.changeViewOptions = [
            {name: 'edit-mode', label: __('Edit mode')},
            {name: 'hide-edit-menu', label: __('Hide edit menu')},
        ].concat(this.props.showGoToDashboardMode
            ? {name: 'go-to-dashboard', label: __('Go to dashboard')}
            : []
        ).concat({name: 'log-out', label: __('Log out')});
    }
    /**
     * @param {{outerEl: HTMLElement; onSaveButtonRefd: (cmp: SaveButton) => void; showGoToDashboardMode?: Boolean; dashboardUrl?: String;}} props
     * @access protected
     */
    render({outerEl}) {
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
                                env.window.location.href = this.props.dashboardUrl;
                            else
                                throw new Error(`Unkown option ${e.target.value}`);
                        } } name="changeView" class="form-select">
                        { this.changeViewOptions.map(({name, label}) =>
                            <option value={ name }>{ label }</option>
                        ) }</select>
                    </span>
                </div>
            <SaveButton
                editAppOuterEl={ outerEl }
                ref={ this.props.onSaveButtonRefd }/>
            </header>,
            <MyRouter history={ historyInstance }>
                <DefaultState path="/:slug*"/>
                <PageCreateState path="/pages/create/:pageTypeName?/:layoutId?"/>
                <PageDuplicateState path="/pages/:pageSlug/duplicate"/>
                { /* <PageTypeCreatePanel path="/page-types/create"/> */ }
            </MyRouter>
        ];
    }
    /**
     * @access private
     */
    logUserOut() {
        http.post('/api/auth/logout')
            .then(() => {
                urlUtils.redirect('/');
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
            });
    }
}

export default EditApp;
