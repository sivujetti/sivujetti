import {__} from '@sivujetti-commons-for-edit-app';
import OverlayView from '../../commons/OverlayView.jsx';
import FileUploader from './FileUploader.jsx';

/**
 * #/uploads.
 */
class UploadsListView extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <OverlayView>
            <h2>{ __('Uploads') }</h2>
            <FileUploader/>
        </OverlayView>;
    }
}

export default UploadsListView;
