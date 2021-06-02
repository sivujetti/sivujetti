import Http from './Http.js';

const services = {
    //
};

const setupServices = _config => {
    services.http = new Http;
};

export default services;
export {setupServices};
