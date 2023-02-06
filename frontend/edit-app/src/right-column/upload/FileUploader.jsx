import {__, Icon} from '@sivujetti-commons-for-edit-app';
import UploadButton2 from './UploadButton2.jsx';

class FileUploader extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({files: []});
    }
    /**
     * @access protected
     */
    render(_, {files}) {
        return [
            <UploadButton2
                onUploadStarted={ this.addNewFile.bind(this) }
                onUploadEnded={ this.markFileAsUploaded.bind(this) }/>,
            <div>{ files.length
                ? <div class="live-files-list item-grid">{ files.map(({friendlyName, fileName, ext, mime, uploading}) =>
                    <article class={ `text-ellipsis${uploading !== 'yes' ? '' : ' loading'}` } title={ fileName } key={ friendlyName }>
                        { !mime.startWith('image/') ? <Icon iconId="file"/> : '<img todo/>' }
                        <div class="mb-2"><b>{ friendlyName }</b></div>
                        <div class="text-small text-uppercase text-dimmed">{ ext }</div>
                    </article>
                ) }</div>
                : <div>
                    <p style="margin-top: 1rem">{ __('You don\'t have any documents.') }</p>
                </div>
            }</div>
        ];
    }
    /**
     * @param {UploadsEntry} file
     */
    addNewFile(file) {
        this.setState({files: [...this.state.files, {...file, ...{uploading: 'yes'}}]});
    }
    /**
     * @param {UploadsEntry|null} file
     * @param {Boolean} ok
     */
    markFileAsUploaded(file, ok) {
        this.setState({files: ok
            ? this.state.files.map(f => f.friendlyName !== file.friendlyName ? f : {...file, ...{uploading: 'no'}})
            : this.state.files.filter(({friendlyName}) => friendlyName !== file.friendlyName)
        });
    }
}

function completeBackendUploadsEntry(entry) {
    entry.ext = entry.fileName.split('.').pop();
}

export default FileUploader;
