import {urlAndSlugUtils, urlUtils} from '../web-page-commons-unified.js';
import {__, FormGroupInline} from '../internal-wrapper.js';
import {determineModeFrom, getVisibleSlug} from '../pick-url-utils.js';
import {currentInstance as floatingDialog} from '../FloatingDialog.jsx';
import PickUrlDialog, {getHeight} from './PickUrlDialog.jsx';

class PickUrlInputGroup extends preact.Component {
    /**
     * @param {{linkTo: String; onUrlPicked: (newNormalizedUrl: String) => void;}} props
     * @access protected
     */
    render({linkTo, onUrlPicked}) {
        return <FormGroupInline>
            <label htmlFor="linkTo" class="form-label">{ __('Link') }</label>
            <input
                value={ getVisibleSlug(linkTo) }
                onClick={ e => this.openPickUrlDialog(e, linkTo, onUrlPicked) }
                name="linkTo"
                id="linkTo"
                class="form-input"
                type="text"
                autoComplete="off"/>
        </FormGroupInline>;
    }
    /**
     * @param {Event} e
     * @param {String} linkTo
     * @param {(newNormalizedUrl: String) => void} onPicked
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
