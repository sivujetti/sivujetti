import {__, api, env, http, Icon, stringUtils} from './internal-wrapper.js';

const MAX_FILE_SIZE_MB = 8;

let validExtsStr = '';
let validExts = [];

class UploadButton extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        validExtsStr = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.ppt,.odt,.pptx,.docx,.pps,.ppsx,.xls,.xlsx,.key,.webp,.asc,.ogv,.mp4,.m4v,.mov,.wmv,.avi,.mpg,.3gp,.3g2';
        if (api.user.getRole() < api.user.ROLE_EDITOR)
            validExtsStr += ',.ttf,.eot,.otf,.woff,.woff2';
        validExts = validExtsStr.split(',');
        //
        this.setState({validationErrors: []});
    }
    /**
     * @param {Array<File>} files
     * @access public
     */
    handleFilesSelected(files) {
        const mapped = files.map((file, i) => {
            const pcs = file.name.split('.');
            if (validExts.indexOf(`.${pcs.at(-1)}`) < 0)
                return {pcs, status: __('File #%s could not be uploaded because the file type is not supported.', i + 1)};
            if (file.size >= MAX_FILE_SIZE_MB * 1024 * 1024)
                return {pcs, status: __('File #%s could not be uploaded because its size exceeded the maximum %sMB', i + 1, MAX_FILE_SIZE_MB)};
            return {pcs, status: 'ok'};
        });

        const errors = mapped.reduce((out, {status}) => status === 'ok' ? out : [...out, status], []);
        if (errors.length)
            this.setState({validationErrors: errors});

        mapped.forEach((info, i) => {
            if (info.status !== 'ok') return;
            const ext = info.pcs.pop();
            const friendlyName = info.pcs.join('.');
            const entry = {
                fileName: `${stringUtils.slugify(friendlyName).slice(0, 255 - ext.length - 1)}.${ext}`,
                baseDir: '',
                mime: files[i].type,
                ext,
                friendlyName,
                createdAt: 0, // will change after upload
                updatedAt: 0, // will change after upload
            };
            this.props.onUploadStarted(entry);
            this.uploadFile(files[i], entry).then(res => {
                const ok = typeof res !== 'string';
                if (!ok)
                    this.setState({validationErrors: [...this.state.validationErrors, __('Failed to upload file #%s', i + 1)]});
                this.props.onUploadEnded({
                    ...entry,
                    ...(ok ? {
                        fileName: res.fileName,
                        baseDir: res.baseDir,
                        mime: res.mime,
                        createdAt: res.createdAt,
                        updatedAt: res.updatedAt,
                    } : {})
                }, ok);
            });
        });
    }
    /**
     * @access protected
     */
    render(_, {validationErrors}) {
        return [
            <div class="file-input-outer">
                <input onChange={ this.handleFileInputChanged.bind(this) }
                    id="file-input"
                    name="localFile"
                    type="file"
                    accept={ validExtsStr }
                    multiple/>
                <label class="d-inline-flex p-relative" htmlFor="file-input">
                    <Icon iconId="file-plus"/>
                    <span class="ml-2 flex-centered">{ __('Upload files') }</span>
                </label>
                <span
                    class="tooltip tooltip-right p-absolute mt-2 ml-2"
                    data-tooltip={ __('You can also drag files here\n from your computer.') }
                    style="opacity: .6">
                    <Icon iconId="info-circle" className="color-dimmed3 size-xs"/>
                </span>
            </div>,
            !validationErrors.length ? null : <div class="pt-2"><p class="info-box error mt-1 mb-2">{ validationErrors.join(', ') }</p></div>
        ];
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleFileInputChanged(e) {
        if (!e.target.value) return;
        const files = Array.from(e.target.files); // [{lastModified: 1647780754120, lastModifiedDate: Date, name: "cat.jpg", size: 90707, ype: "image/jpeg"}]
        this.handleFilesSelected(files);
    }
    /**
     * @param {File} file
     * @param {UploadsEntry} entry
     * @returns {Promise<UploadsEntry|String>}
     */
    uploadFile(file, {fileName, friendlyName}) {
        //
        const data = new FormData();
        data.append('localFile', file);
        data.append('targetFileName', fileName);
        data.append('friendlyName', friendlyName);
        //
        return http.post('/api/uploads', data, {headers: '@auto'})
            .then(info => {
                if (!info.file) return 'Unexpected response';
                return info.file;
            })
            .catch(err => {
                env.window.console.error(err);
                return err.message || 'Unexpected error';
            });
    }
}

export default UploadButton;
