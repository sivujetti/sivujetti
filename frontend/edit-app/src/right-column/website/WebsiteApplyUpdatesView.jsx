// ## import {__, api, env, http, LoadingSpinner, floatingDialog, handleSubmit} from '@sivujetti-commons-for-edit-app';
// ## import OverlayView from '../../commons/OverlayView.jsx';
// ## import toasters, {Toaster} from '../../commons/Toaster.jsx';
// ## 
// ## const UpdateTaskResult = {
// ##     RESULT_BAD_INPUT:            111010,
// ##     RESULT_ALREADY_IN_PROGRESS:  111011,
// ##     RESULT_FAILED:               111012,
// ##     RESULT_DOWNLOAD_FAILED:      111013,
// ##     RESULT_UPDATE_NOT_STARTED:   111014,
// ##     RESULT_VERIFICATION_FAILED:  111015,
// ##     RESULT_PRECONDITION_FAILED:  111016,
// ##     RESULT_OK:                   0,
// ## };
// ## 
// ## class WebsiteApplyUpdatesView extends preact.Component {
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillMount() {
// ##         const packageNames = api.getAvailableUpdatePackages();
// ##         this.availablePackages = packageNames;
// ##         this.setState({updatePhase: !packageNames.length
// ##             ? [null, null]
// ##             : [InitialPhase.NAME, InitialPhase]});
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render(_, {updatePhase}) {
// ##         const [rendererName, Renderer] = updatePhase;
// ##         const rendererProps = rendererName ? this.createRendererProps(rendererName) : null;
// ##         return <OverlayView>
// ##             <h2>{ __('Updates') }</h2>
// ##             { !rendererProps
// ##                 ? <p style="font-size:.8rem">{ __('No updates available.') }</p>
// ##                 : <Renderer
// ##                     availablePackages={ this.availablePackages }
// ##                     { ...rendererProps }/>
// ##             }
// ##         </OverlayView>;
// ##     }
// ##     /**
// ##      * @param {String} name
// ##      * @returns {{[propName: String]: any;}}
// ##      * @access private
// ##      */
// ##     createRendererProps(name) {
// ##         if (name === InitialPhase.NAME)
// ##             return {beginUpdate: () => {
// ##                 floatingDialog.open(ConfirmStartUpdateDialog, {
// ##                     title: __('Begin update'),
// ##                     height: 178,
// ##                 }, {
// ##                     onConfirmed: () => {
// ##                         this.setState({updatePhase: [BeginUpdatedPhase.NAME, BeginUpdatedPhase]});
// ##                         return Promise.resolve();
// ##                     }
// ##                 });
// ##             }};
// ##         if (name === BeginUpdatedPhase.NAME)
// ##             return {proceeedToDownloadUpdates: () =>
// ##                 this.setState({updatePhase: [DownloadUpdatesPhase.NAME, DownloadUpdatesPhase]})
// ##             };
// ##         if (name === DownloadUpdatesPhase.NAME)
// ##             return {proceeedToInstallUpdates: () =>
// ##                 this.setState({updatePhase: [InstallUpdatesPhase.NAME, InstallUpdatesPhase]})
// ##             };
// ##         if (name === InstallUpdatesPhase.NAME)
// ##             return {proceeedToFinishUpUpdates: () =>
// ##                 this.setState({updatePhase: [FinishUpPhase.NAME, FinishUpPhase]})
// ##             };
// ##         return {};
// ##     }
// ## }
// ## 
// ## class InitialPhase extends preact.Component {
// ##     /**
// ##      * @access protected
// ##      */
// ##     render({availablePackages, beginUpdate}) {
// ##         return <div>
// ##             <p>{ __('New version %s of Sivujetti is available.', availablePackages[0].split('-').at(-1)) }</p>
// ##             <button
// ##                 onClick={ beginUpdate }
// ##                 class="btn btn-primary"
// ##                 type="button">{ __('Continue') }</button>
// ##         </div>;
// ##     }
// ## }
// ## InitialPhase.NAME = 'initial';
// ## 
// ## class BeginUpdatedPhase extends preact.Component {
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillMount() {
// ##         env.document.body.style.pointerEvents = 'none';
// ##         //
// ##         this.setState({message: null, messageType: null});
// ##         //
// ##         http.put(`/api/updates/begin`)
// ##             .then(resp => {
// ##                 const code = getCode(resp);
// ##                 if (code === UpdateTaskResult.RESULT_PRECONDITION_FAILED) {
// ##                     this.setState({message: <div>
// ##                         <span>{ __('Couldn\'t start the updates because') }:</span>
// ##                         <ul class="color-dimmed">{ resp.details.map(msg => <li>{ __(msg) }</li>) }</ul>
// ##                     </div>, messageType: 'error'});
// ##                     liftMouseLock();
// ##                 } else if (code === UpdateTaskResult.RESULT_ALREADY_IN_PROGRESS) {
// ##                     this.setState({message: __('The installation had already begun.'), messageType: 'info'});
// ##                     liftMouseLock();
// ##                 } else
// ##                     this.props.proceeedToDownloadUpdates();
// ##             })
// ##             .catch(onUnexpectedError);
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render(_, {message, messageType}) {
// ##         return <div>{ !message
// ##             ? [
// ##                 <p>
// ##                     <span>{ __('Running the checklist') }.</span>
// ##                     <LoadingSpinner/>
// ##                 </p>,
// ##                 <button
// ##                     class="btn btn-primary loading"
// ##                     type="button"
// ##                     disabled>{ __('Processing') }</button>
// ##             ] : [
// ##                 <Toaster
// ##                     message={ {message, level: messageType, timeout: 0} }
// ##                     autoCloseTimeoutMillis={ 0 }
// ##                     id="beginUpdates"
// ##                     noClickClose/>,
// ##                 <button
// ##                     onClick={ () => preactRouter.route('/') }
// ##                     class="btn btn-primary mt-2"
// ##                     type="button">Ok</button>
// ##             ]
// ##         }</div>;
// ##     }
// ## }
// ## BeginUpdatedPhase.NAME = 'begin-updates';
// ## 
// ## class DownloadUpdatesPhase extends preact.Component {
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillMount() {
// ##         env.document.body.style.pointerEvents = 'none';
// ##         //
// ##         const results = [];
// ##         const tasks = this.props.availablePackages.map(packageName =>
// ##             () => http.post(`/api/updates/${packageName}/download`)
// ##                 .then(resp => {
// ##                     const code = getCode(resp);
// ##                     if (code === null) {
// ##                         results.push(UpdateTaskResult.RESULT_BAD_INPUT);
// ##                         return false;
// ##                     }
// ##                     results.push(code);
// ##                     if (code === UpdateTaskResult.RESULT_ALREADY_IN_PROGRESS ||
// ##                         code === UpdateTaskResult.RESULT_NO_PERMISSIONS ||
// ##                         code === UpdateTaskResult.RESULT_DOWNLOAD_FAILED)
// ##                         return false;
// ##                 })
// ##         );
// ##         this.setState({
// ##             nthItemDownloading: 1,
// ##             numItems: this.props.availablePackages.length,
// ##             message: null,
// ##             messageType: null,
// ##         });
// ##         runTasks(tasks, 0, (_idx, ret) => {
// ##             if (ret !== false)
// ##                 this.setState({nthItemDownloading: this.state.nthItemDownloading + 1});
// ##         })
// ##         .then(result => {
// ##             if (result === 'ok')
// ##                 this.props.proceeedToInstallUpdates();
// ##         })
// ##         .catch(err => {
// ##             if (typeof err === 'string') {
// ##                 if (results.at(-1) === UpdateTaskResult.RESULT_ALREADY_IN_PROGRESS) {
// ##                     this.setState({message: __('The installation had already begun.'), messageType: 'info'});
// ##                     liftMouseLock();
// ##                 } else if (results.at(-1) === UpdateTaskResult.RESULT_DOWNLOAD_FAILED) {
// ##                     this.setState({message: __('Update servers unavailable, please try again in a moment.'), messageType: 'error'});
// ##                     liftMouseLock();
// ##                 }
// ##             } else onUnexpectedError(err);
// ##         });
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render(_, {nthItemDownloading, numItems, message, messageType}) {
// ##         return <div>{ !message
// ##             ? [
// ##                 <p>
// ##                     <span>{ __('Downloading update') } { nthItemDownloading } / { numItems }. { __('Do not close the view') }.</span>
// ##                     <LoadingSpinner/>
// ##                 </p>,
// ##                 <button
// ##                     class="btn btn-primary loading"
// ##                     type="button"
// ##                     disabled>{ __('Downloading') }</button>
// ##             ]
// ##             : [
// ##                 <Toaster
// ##                     message={ {message, level: messageType, timeout: 0} }
// ##                     autoCloseTimeoutMillis={ 0 }
// ##                     id="downloadUpdates"
// ##                     noClickClose/>,
// ##                 <button
// ##                     onClick={ reloadPage }
// ##                     class="btn btn-primary mt-2"
// ##                     type="button">Ok</button>
// ##             ]
// ##         }</div>;
// ##     }
// ## }
// ## DownloadUpdatesPhase.NAME = 'download-updates';
// ## 
// ## class InstallUpdatesPhase extends preact.Component {
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillMount() {
// ##         const results = [];
// ##         const tasks = this.props.availablePackages.map(packageName =>
// ##             () => http.put(`/api/updates/${packageName}/install`)
// ##                 .then(resp => {
// ##                     const code = getCode(resp);
// ##                     if (code === null) {
// ##                         results.push(UpdateTaskResult.RESULT_BAD_INPUT);
// ##                         return false;
// ##                     }
// ##                     results.push(code);
// ##                     if (code === UpdateTaskResult.RESULT_FAILED ||
// ##                         code === UpdateTaskResult.RESULT_VERIFICATION_FAILED)
// ##                         return false;
// ##                 })
// ##         );
// ##         this.setState({
// ##             nthItemInstalling: 1,
// ##             numItems: tasks.length,
// ##             message: null,
// ##             messageType: null,
// ##         });
// ##         runTasks(tasks, 0, (_idx, ret) => {
// ##             if (ret !== false)
// ##                 this.setState({nthItemInstalling: this.state.nthItemInstalling + 1});
// ##         })
// ##         .then(result => {
// ##             if (result === 'ok')
// ##                 this.props.proceeedToFinishUpUpdates();
// ##         })
// ##         .catch(err => {
// ##             if (typeof err === 'string') {
// ##                 if (results.at(-1) === UpdateTaskResult.RESULT_VERIFICATION_FAILED)  {
// ##                     this.setState({message: __('File verification failed.'), messageType: 'error'});
// ##                     liftMouseLock();
// ##                 }
// ##             } else onUnexpectedError(err);
// ##         });
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render(_, {nthItemInstalling, numItems, message, messageType}) {
// ##         return <div>{ !message
// ##             ? [
// ##                 <p>
// ##                     <span>{ __('Installing update') } { nthItemInstalling } / { numItems }. { __('Do not close the view') }.</span>
// ##                     <LoadingSpinner/>
// ##                 </p>,
// ##                 <button
// ##                     class="btn btn-primary loading"
// ##                     type="button"
// ##                     disabled>{ __('Installing') }</button>
// ##             ]
// ##             : [
// ##                 <Toaster
// ##                     message={ {message, level: messageType, timeout: 0} }
// ##                     autoCloseTimeoutMillis={ 0 }
// ##                     id="installUpdates"
// ##                     noClickClose/>,
// ##                 <button
// ##                     onClick={ reloadPage }
// ##                     class="btn btn-primary mt-2"
// ##                     type="button">Ok</button>
// ##             ]
// ##         }</div>;
// ##     }
// ## }
// ## InstallUpdatesPhase.NAME = 'install-updates';
// ## 
// ## class FinishUpPhase extends preact.Component {
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillMount() {
// ##         this.setState({finishingUp: true});
// ##         //
// ##         http.put(`/api/updates/finish`)
// ##             .then(resp => {
// ##                 liftMouseLock();
// ##                 if (getCode(resp) === UpdateTaskResult.RESULT_OK)
// ##                     this.startPageReloadTimer();
// ##             })
// ##             .catch(onUnexpectedError);
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render(_, {finishingUp, secs}) {
// ##         return <div>{ finishingUp
// ##             ? [
// ##                 <p>
// ##                     <span>{ __('Cleaning up') }. { __('Do not close the view') }.</span>
// ##                     <LoadingSpinner/>
// ##                 </p>,
// ##                 <button
// ##                     class="btn btn-primary loading"
// ##                     type="button"
// ##                     disabled>{ __('Cleaning up') }</button>
// ##             ]
// ##             : [
// ##                 <p>{ __('Updates installed! Reloading page in %s', secs) }</p>,
// ##                 <button
// ##                     onClick={ reloadPage }
// ##                     class="btn btn-primary"
// ##                     type="button">{ __('Reload page') }</button>
// ##             ]
// ##         }</div>;
// ##     }
// ##     /**
// ##      * @access private
// ##      */
// ##     startPageReloadTimer() {
// ##         this.setState({secs: 10, finishingUp: false});
// ##         const tick = () => setTimeout(() => {
// ##             const secs = this.state.secs - 1;
// ##             if (secs > 0) { this.setState({secs: this.state.secs - 1}); tick(); }
// ##             else reloadPage();
// ##         }, 1000);
// ##         tick();
// ##     }
// ## }
// ## FinishUpPhase.NAME = 'finish-update';
// ## 
// ## function reloadPage() {
// ##     env.window.location.reload();
// ## }
// ## 
// ## /**
// ##  * @param {Array<() => any>} tasks
// ##  * @param {Number} idx
// ##  * @param {(idx: Number, ret: any) => void} onAfterEach
// ##  * @returns {Promise<String>} 'ok'|'Failed at #2'
// ##  */
// ## function runTasks(tasks, idx, onAfterEach) {
// ##     const fn = tasks[idx];
// ##     if (!fn) return Promise.resolve('ok');
// ##     return fn()
// ##         .then(ret => {
// ##             if (ret === false) return Promise.reject('Failed at #' + idx);
// ##             onAfterEach(idx, ret);
// ##             return runTasks(tasks, idx + 1, onAfterEach);
// ##         });
// ## }
// ## 
// ## /**
// ##  * @param {any} err
// ##  */
// ## function onUnexpectedError(err) {
// ##     env.window.console.error(err);
// ##     toasters.editAppMain(__('Something unexpected happened.'), 'error');
// ##     liftMouseLock();
// ## }
// ## 
// ## /**
// ##  */
// ## function liftMouseLock() {
// ##     env.document.body.style.pointerEvents = '';
// ## }
// ## 
// ## /**
// ##  * @param {{[key: String]: any;}} resp
// ##  * @returns {Number|null}
// ##  */
// ## function getCode(resp) {
// ##     return typeof resp.detailsCode === 'number' ? resp.detailsCode : null;
// ## }
// ## 
// ## class ConfirmStartUpdateDialog extends preact.Component {
// ##     // boundDoHandleSubmit;
// ##     /**
// ##      * @param {{onConfirmed: () => Promise<void>;}} props
// ##      */
// ##     constructor(props) {
// ##         super(props);
// ##         this.boundDoHandleSubmit = this.doHandleSubmit.bind(this);
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render() {
// ##         return <form onSubmit={ e => handleSubmit(this, this.boundDoHandleSubmit, e) }>
// ##             <div class="mb-1">{ __('Begin update process') }? { __('The process will run a checklist and starts the update only after that. The website will be automatically put to a temporary maintenance mode.') }</div>
// ##             <div class="mt-8">
// ##                 <button
// ##                     class="btn btn-primary mr-2"
// ##                     type="submit">{ __('Begin checklist and update') }</button>
// ##                 <button
// ##                     onClick={ () => floatingDialog.close() }
// ##                     class="btn btn-link"
// ##                     type="button">{ __('Cancel') }</button>
// ##             </div>
// ##         </form>;
// ##     }
// ##     /**
// ##      * @returns {Promise<void>}
// ##      * @access private
// ##      */
// ##     doHandleSubmit() {
// ##         const out = this.props.onConfirmed();
// ##         floatingDialog.close();
// ##         return out;
// ##     }
// ## }
// ## 
// ## export default WebsiteApplyUpdatesView;
