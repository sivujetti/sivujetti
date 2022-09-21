import {__, api, Icon, MenuSection} from '@sivujetti-commons-for-edit-app';

class WebsiteSection extends preact.Component {
    // userCanCreatePageTypes;
    /**
     * @param {{startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref;} && {[key: String]: any;}} props
     */
    constructor(props) {
        super(props);
        this.userCanCreatePageTypes = api.user.can('createPageTypes');
    }
    /**
     * @access protected
     */
    render({startAddPageMode, startAddPageTypeMode}) {
        return <MenuSection
            title={ __('Website') }
            subtitle={ __('Content management') }
            iconId="database"
            colorClass="color-orange">
            <nav>
                <a onClick={ e => (e.preventDefault(), alert('This feature is currently disabled.')) } class="with-icon">
                    <Icon iconId="file-info" className="size-sm color-dimmed"/>
                    <span class="color-dimmed">{ __('Pages') }</span>
                </a>
                <a onClick={ e => (e.preventDefault(), startAddPageMode()) } class="with-icon">
                    <Icon iconId="circle-plus" className="size-sm color-dimmed"/>
                    <span class="color-dimmed">{ __('Create %s', __('page')) }</span>
                </a>
                { this.userCanCreatePageTypes ? <a onClick={ e => (e.preventDefault(), startAddPageTypeMode()) } class="with-icon">
                    <Icon iconId="circle-plus" className="size-sm color-dimmed"/>
                    <span class="color-dimmed">{ __('Create %s', __('page type')) }</span>
                </a> : null }
            </nav>
        </MenuSection>;
    }
}

export default WebsiteSection;
