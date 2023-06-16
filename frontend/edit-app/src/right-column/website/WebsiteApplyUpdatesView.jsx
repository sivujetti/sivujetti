import {__} from '@sivujetti-commons-for-edit-app';
import OverlayView from '../../commons/OverlayView.jsx';

class WebsiteApplyUpdatesView extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        //
    }
    /**
     * @access protected
     */
    componentDidMount() {
        //
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        //
    }
    /**
     * @access protected
     */
    render() {
        return <OverlayView>
            <h2>{ __('Updates') }</h2>
            <p style="font-size:.8rem">{ __('No updates available.') }</p>
        </OverlayView>;
    }
}

export default WebsiteApplyUpdatesView;
