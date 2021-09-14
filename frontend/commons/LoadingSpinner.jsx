/**
 * Inititally hidden loading indicator, which reveals itself after 500ms.
 */
class LoadingSpinner {
    /**
     * @access protected
     */
    render() {
        return <div class="show-after-05 dots-animation"></div>;
    }
}

export default LoadingSpinner;
