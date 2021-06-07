import Http from './Http.js';

const services = {
    //
};

const setupServices = config => {
    services.http = new Http;
    services.editApp = { // ??
        openView(RendererClass, props) {
            return config.editAppReactRef.current.mainView.current.open(RendererClass, props);
        }
    };
    services.blockTypes = config.blockTypes;
    window.kuuraCommons = {services};
};

export default services;
export {setupServices};
