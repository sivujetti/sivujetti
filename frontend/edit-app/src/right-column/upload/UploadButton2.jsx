import {__, api, env, http, Icon, stringUtils} from '@sivujetti-commons-for-edit-app';

const MAX_FILE_SIZE_MB = 8;

let validExtsStr = '';
let validExts = [];

class UploadButton2 extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        validExtsStr = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.ppt,.odt,.pptx,.docx,.pps,.ppsx,.xls,.xlsx,.key,.webp,.asc,.ogv,.mp4,.m4v,.mov,.wmv,.avi,.mpg,.3gp,.3g2';
        if (api.user.getRole() < api.user.ROLE_ADMIN)
            validExtsStr += ',.ttf,.eot,.otf,.woff,.woff2';
        validExts = validExtsStr.split(',');
        //
        this.setState({validationErrors: []});
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
                <label class="d-flex" htmlFor="file-input">
                    <Icon iconId="file"/>
                    <span class="ml-2 flex-centered">{ __('Add new') }</span>
                </label>
            </div>,
            !validationErrors.length ? null : <div class="pt-2"><p class="info-box error mt-2">{ validationErrors.join(', ') }</p></div>
        ];
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleFileInputChanged(e) {
        if (!e.target.value) return;
        const files = Array.from(e.target.files); // [{lastModified: 1647780754120, lastModifiedDate: Date, name: "cat.jpg", size: 90707, ype: "image/jpeg"}]
        const mapped = files.map((file, i) => {
            const pcs = file.name.split('.');
            if (validExts.indexOf(`.${pcs[pcs.length - 1]}`) < 0)
                return {pcs, status: `File #${i + 1} could not be uploaded because the file type is not supported.`};
            if (file.size >= MAX_FILE_SIZE_MB * 1024 * 1024)
                return {pcs, status: `File #${i + 1} could not be uploaded because its size exceeded the maximum ${MAX_FILE_SIZE_MB}MB`};
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
                createdAt: 0, // will change after upoad
                updateAt: 0, // will change after upoad
            };
            this.props.onUploadStarted(entry);
            this.uploadFile(files[i], entry).then(res => {
                const ok = typeof res !== 'string';
                if (!ok)
                    this.setState({validationErrors: [...this.state.validationErrors, `Failed to upload file #${i}`]});
                this.props.onUploadEnded(entry, ok ? {...entry, ...{
                    fileName: res.fileName,
                    baseDir: res.baseDir,
                    mime: res.mime,
                    createdAt: res.createdAt,
                    updatedAt: res.updatedAt,
                }} : null, ok);
            });
        });
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

export default UploadButton2;
