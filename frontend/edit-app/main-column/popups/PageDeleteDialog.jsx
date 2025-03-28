import {
    __,
    floatingDialog,
    handleSubmit, 
    http,
    stringUtils,
} from '@sivujetti-commons-for-edit-app';
import toasters from '../../includes/toasters.jsx';

class PageDeleteDialog extends preact.Component {
    /**
     * @param {{pageSlug: string; pageTitle: string; onConfirmed: () => Promise<void>;}} props
     */
    constructor(props) {
        super(props);
        if (props.pageSlug === '/') throw new Error('Sanity');
        this.boundDoHandleSubmit = this.doHandleSubmit.bind(this);
    }
    /**
     * @access protected
     */
    render({pageTitle, pageSlug}) {
        return <form onSubmit={ e => handleSubmit(this, this.boundDoHandleSubmit, e) }>
            <div class="text-prose mb-1">{ __('Delete', __('page')) } <b>&quot;{ pageTitle }&quot;</b> <i class="color-dimmed">{ pageSlug }</i>?</div>
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit">{ __('Delete', __('page')) }</button>
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
 * @param {string} pageSlug
 * @param {string} pageTitle
 * @param {() => any} onSuccess
 * @param {string} pageTypeName = 'Pages'
 */
function openPageDeleteDialog(pageSlug, pageTitle, onSuccess, pageTypeName = 'Pages') {
    floatingDialog.open(PageDeleteDialog, {
        title: __('Delete %s', __('page')),
        height: 'auto',
        adjustCalculatedHeight: height => height + 22, // For long slugs
    }, {
        pageSlug,
        pageTitle,
        onConfirmed: () => http.delete(`/api/pages/${pageTypeName}/${pageSlug.substring(1)}`)
            .then(resp => {
                if (resp.ok) {
                    onSuccess();
                } else {
                    toasters.editAppMain(stringUtils.capitalize(__('Failed to delete %s', __('page#genitive'))), 'error');
                }
            })
    });
}

export default PageDeleteDialog;
export {openPageDeleteDialog};
