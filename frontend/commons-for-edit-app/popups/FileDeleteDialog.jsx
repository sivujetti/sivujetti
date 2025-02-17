import {env, http} from '@sivujetti-commons-for-web-pages';
import {__, api} from '../edit-app-singletons.js';
import {currentInstance as floatingDialog} from '../FloatingDialog.jsx';
import {handleSubmit} from '../Form.jsx';
import {stringUtils} from '../utils.js';

/** @extends {preact.Component<{file: UploadsEntry; onConfirmed: () => Promise<void>;}, any>} */
class FileDeleteDialog extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.boundDoHandleSubmit = this.doHandleSubmit.bind(this);
    }
    /**
     * @access protected
     */
    render({file}) {
        const confirmation = __('Delete %s', __('File').toLowerCase());
        return <form onSubmit={ e => handleSubmit(this, this.boundDoHandleSubmit, e) }>
            <div class="text-prose mb-1">{ confirmation } <b>&quot;{ file.friendlyName }&quot;</b> <i class="color-dimmed">{ file.fileName }</i>?</div>
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit">{ confirmation }</button>
                <button
                    onClick={ () => floatingDialog.close() }
                    class="btn btn-link"
                    type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @returns {Promise<void>}
     * @access private
     */
    doHandleSubmit() {
        const out = this.props.onConfirmed();
        floatingDialog.close();
        return out;
    }
}

/**
 * @param {UploadsEntry} file
 * @param {() => any} onSuccess todo 
 */
function openFileDeleteDialog(file, onSuccess) {
    floatingDialog.open(FileDeleteDialog, {
        title: __('Delete %s', __('File').toLowerCase()),
        height: 206,
    }, {
        file,
        onConfirmed: () => deleteFile(file, onSuccess),
    });
}

/**
 * @param {UploadsEntry} file
 * @param {() => void} onSuccess
 * @access private
 */
async function deleteFile(file, onSuccess) {
    try {
        const info = await http.delete(`/api/uploads/${encodeURIComponent(file.fileName)}/${encodeURIComponent(file.baseDir || '-')}`);
        if (!info.ok) throw new Error(info);
        onSuccess();
    } catch (err) {
        env.window.console.error(err);
        api.toasters.editAppMain(stringUtils.capitalize(__('Failed to delete %s', __('file#genitive'))), 'error');
    }
}

export default FileDeleteDialog;
export {openFileDeleteDialog};
