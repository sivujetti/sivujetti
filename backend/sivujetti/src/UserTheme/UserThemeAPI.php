<?php declare(strict_types=1);

namespace Sivujetti\UserTheme;

use Sivujetti\Page\Entities\PageLayout;
use Sivujetti\{BaseAPI, SharedAPIContext, Translator, ValidationUtils};

/**
 * An API for BACKEND_PATH . site/Theme.php classes.
 */
final class UserThemeAPI extends BaseAPI {
    private Translator $translator;
    /**
     * @param string $namespace
     * @param \Sivujetti\SharedAPIContext $storage
     * @param ?\Sivujetti\Translator $translator = null
     */
    public function __construct(string $namespace,
                                SharedAPIContext $storage,
                                ?Translator $translator = null) {
        $this->namespace = $namespace;
        $this->storage = $storage;
        $this->translator = $translator;
    }
}
