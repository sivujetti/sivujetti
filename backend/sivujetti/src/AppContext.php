<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\{AppContext as PikeAppContext, FluentDb};
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class AppContext extends PikeAppContext {
    /** @var \Pike\FluentDb */
    public FluentDb $fluentDb;
    /** @var \Sivujetti\SharedAPIContext */
    public SharedAPIContext $apiCtx;
    /** @var \Sivujetti\TheWebsite\Entities\TheWebsite */
    public TheWebsite $theWebsite;
}
