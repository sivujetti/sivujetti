import {__, handleSubmit, floatingDialog} from '../../../sivujetti-commons-unified.js';

class PageDeleteDialog extends preact.Component {
    // boundDoHandleSubmit;
    /**
     * @param {{pageSlug: String; pageTitle: String; onConfirmed: () => Promise<void>;}} props
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
            <div class="mb-1">{ __('Delete page') } <b>&quot;{ pageTitle }&quot;</b> <i class="color-dimmed">{ pageSlug }</i>?</div>
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit">{ __('Delete page') }</button>
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

export default PageDeleteDialog;
