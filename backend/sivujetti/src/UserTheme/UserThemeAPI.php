<?php declare(strict_types=1);

namespace Sivujetti\UserTheme;

use Sivujetti\{BaseAPI, SharedAPIContext, Translator};

/**
 * An API for BACKEND_PATH . site/Theme.php classes.
 */
final class UserThemeAPI extends BaseAPI {
    private ?Translator $translator;
    /**
     * @param string $namespace
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param ?\Sivujetti\Translator $translator = null
     */
    public function __construct(string $namespace,
                                SharedAPIContext $apiCtx,
                                ?Translator $translator = null) {
        parent::__construct($namespace, $apiCtx);
        $this->translator = $translator;
    }
}
