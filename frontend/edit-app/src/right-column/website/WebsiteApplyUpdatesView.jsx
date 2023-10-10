import {__, api, env, http, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import OverlayView from '../../commons/OverlayView.jsx';
import toasters, {Toaster} from '../../commons/Toaster.jsx';

const UpdateTaskResult = {
    RESULT_BAD_INPUT:            111010,
    RESULT_ALREADY_IN_PROGRESS:  111011,
    RESULT_FAILED:               111012,
    RESULT_DOWNLOAD_FAILED:      111013,
    RESULT_NO_PERMISSIONS:       111014,
    RESULT_UPDATE_NOT_STARTED:   111015,
    RESULT_VERIFICATION_FAILED:  111016,
    RESULT_OK:                   0,
};

class WebsiteApplyUpdatesView extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const packageNames = api.getAvailableUpdatePackages();
        this.availablePackages = packageNames;
        this.setState({updatePhase: !packageNames.length
            ? [null, null]
            : [InitialPhase.NAME, InitialPhase]});
    }
    /**
     * @access protected
     */
    render(_, {updatePhase}) {
        const [rendererName, Renderer] = updatePhase;
        const rendererProps = rendererName ? this.createRendererProps(rendererName) : null;
        return <OverlayView>
            <h2>{ __('Updates') }</h2>
            { !rendererProps
                ? <p style="font-size:.8rem">{ __('No updates available.') }</p>
                : <Renderer
                    availablePackages={ this.availablePackages }
                    { ...rendererProps }/>
            }
        </OverlayView>;
    }
    /**
     * @param {String} name
     * @returns {{[propName: String]: any;}}
     * @access private
     */
    createRendererProps(name) {
        if (name === InitialPhase.NAME)
            return {beginUpdate: () => this.setState({updatePhase: [DownloadUpdatesPhase.NAME, DownloadUpdatesPhase]})};
        if (name === DownloadUpdatesPhase.NAME)
            return {installUpdate: () => this.setState({updatePhase: [InstallUpdatesPhase.NAME, InstallUpdatesPhase]})};
        if (name === InstallUpdatesPhase.NAME)
            return {finishUpdates: () => this.setState({updatePhase: [FinishUpPhase.NAME, FinishUpPhase]})};
        return {};
    }
}

class InitialPhase extends preact.Component {
    /**
     * @access protected
     */
    render({availablePackages, beginUpdate}) {
        return <div>
            <p>{ __('New version %s of Sivujetti is available.', availablePackages[0].split('-').at(-1)) }</p>
            <button
                onClick={ beginUpdate }
                class="btn btn-primary"
                type="button">{ __('Install update') }</button>
        </div>;
    }
}
InitialPhase.NAME = 'initial';

class DownloadUpdatesPhase extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        env.document.body.style.pointerEvents = 'none';
        //
        this.setState({
            nthItemDownloading: 1,
            numItems: this.props.availablePackages.length,
            message: null,
            messageType: null,
        });
    }
    /**
     * @access protected
     */
    render(_, {nthItemDownloading, numItems, message, messageType}) {
        return <div>{ !message
            ? [
                <p>
                    <span>{ __('Downloading update') } { nthItemDownloading } / { numItems }. { __('Do not close the view') }.</span>
                    <LoadingSpinner/>
                </p>,
                <button
                    class="btn btn-primary loading"
                    type="button"
                    disabled>{ __('Downloading') }</button>
            ]
            : <Toaster
                message={ {message, level: messageType, timeout: 0} }
                autoCloseTimeoutMillis={ 0 }
                id="downloadUpdates"/>
        }</div>;
    }
}
DownloadUpdatesPhase.NAME = 'download-updates';

class InstallUpdatesPhase extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({nthItemInstalling: 1, numItems: 1});
    }
    /**
     * @access protected
     */
    render(_, {nthItemInstalling, numItems}) {
        return <div>
            <p>
                <span>{ __('Installing update') } { nthItemInstalling } / { numItems }. { __('Do not close the view') }.</span>
                <LoadingSpinner/>
            </p>
            <button
                class="btn btn-primary loading"
                type="button"
                disabled>{ __('Installing') }</button>
        </div>;
    }
}
InstallUpdatesPhase.NAME = 'install-updates';

class FinishUpPhase extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({secs: 10});
        const tick = () => setTimeout(() => {
            const secs = this.state.secs - 1;
            if (secs > 0) { this.setState({secs: this.state.secs - 1}); tick(); }
            else reloadPage();
        }, 1000);
        tick();
    }
    /**
     * @access protected
     */
    render(_, {secs}) {
        return <div>
            <p>{ __('Updates installed! Reloading page in %s', secs) }</p>
            <button
                onClick={ reloadPage }
                class="btn btn-primary"
                type="button"
                style="pointer-events: all">{ __('Reload page') }</button>
        </div>;
    }
}
FinishUpPhase.NAME = 'finish-update';

function reloadPage() {
    env.window.location.reload();
}

export default WebsiteApplyUpdatesView;
