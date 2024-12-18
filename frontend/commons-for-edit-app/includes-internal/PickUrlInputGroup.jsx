import {urlAndSlugUtils, urlUtils} from '@sivujetti-commons-for-web-pages';
import {__} from '../edit-app-singletons.js';
import {currentInstance as floatingDialog} from '../FloatingDialog.jsx';
import {FormGroupInline} from '../Form.jsx';
import {determineModeFrom, getVisibleSlug} from '../pick-url-utils.js';
import {stringUtils} from '../utils.js';
import PickUrlDialog, {getHeight} from './PickUrlDialog.jsx';

class PickUrlInputGroup extends preact.Component {
    /**
     * @param {{linkTo: string; onUrlPicked: (newNormalizedUrl: string) => void;}} props
     * @access protected
     */
    render({linkTo, onUrlPicked}) {
        return <FormGroupInline>
            <label htmlFor="linkTo" class="form-label">{ stringUtils.capitalize(__('link')) }</label>
            <input
                value={ getVisibleSlug(linkTo) }
                onFocus={ e => this.openPickUrlDialog(e, linkTo, onUrlPicked) }
                name="linkTo"
                id="linkTo"
                class="form-input"
                type="text"
                autoComplete="off"
                readOnly/>
        </FormGroupInline>;
    }
    /**
     * @param {Event} e
     * @param {string} linkTo
     * @param {(newNormalizedUrl: string) => void} onPicked
     * @access private
     */
    openPickUrlDialog(e, linkTo, onPicked) {
        e.preventDefault();
        const normalized = urlAndSlugUtils.getCompletedUrl(linkTo);
        const mode = determineModeFrom(normalized)[0];
        floatingDialog.open(PickUrlDialog, {
            width: 480,
            height: getHeight(mode, true)[0],
            title: __('Choose a link')
        }, {
            mode,
            url: normalized,
            dialog: floatingDialog,
            onConfirm: (url, mode) => {
                if (mode === 'pick-url') // '/sivujetti/index.php?q=/contact', '/contact'
                    onPicked(!url.startsWith('#') ? url.substring(urlUtils.baseUrl.length - 1) : url);
                else if (mode === 'pick-file') // '/sivujetti/public/uploads/header1.jpg'
                    onPicked(url.substring(urlUtils.assetBaseUrl.length - 1));
                else // 'http://test.com'
                    onPicked(url);
            }
        });
    }
}

export default PickUrlInputGroup;
