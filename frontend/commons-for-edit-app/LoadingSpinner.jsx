/**
 * Inititally hidden loading indicator, which reveals itself after 500ms.
 *
 * @param {{className?: string;}} props
 */
const LoadingSpinner = ({className}) =>
    <div class={ 'show-after-05 dots-animation' + (className ? ` ${className}` : '') }></div>
;

export default LoadingSpinner;
