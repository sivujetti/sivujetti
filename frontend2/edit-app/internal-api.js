const editAppInternalApi = {
    webPagePreviewIframeApp: {
        /**
         * @param {preact.RefObject<WebPagePreviewIframeApp>} reactRef
         */
        init(reactRef) {
            this._reactRef = reactRef;
        },
        /**
         * @returns {preact.RefObject<WebPagePreviewIframeApp>}
         */
        getInstance() {
            if (!this._reactRef) throw new Error('Not initialized');
            return this._reactRef;
        },
    },
};

export default editAppInternalApi;
