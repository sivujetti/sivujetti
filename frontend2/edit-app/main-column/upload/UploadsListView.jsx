import {__, FileUploader} from '@sivujetti-commons-for-edit-app';
import OverlayView from '../OverlayView.jsx';

/**
 * #/uploads.
 */
class UploadsListView extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <OverlayView>
            <h2>{ __('Files') }</h2>
            <FileUploader/>
        </OverlayView>;
    }
}

export default UploadsListView;
