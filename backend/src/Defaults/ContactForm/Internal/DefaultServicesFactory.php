<?php declare(strict_types=1);

namespace KuuraCms\Defaults\ContactForm\Internal;

use KuuraCms\SharedAPIContext;
use Pike\PhpMailerMailer;
use Pike\Interfaces\MailerInterface;

class NoOpMailer implements MailerInterface {
    public function sendMail(object $settings): bool {
        // Do nothing.
        return true;
    }
}

class DefaultServicesFactory {
    /** @var todo */
    private SharedAPIContext $s;
    /** @var ?callable */
    private $makeMailerFn;
    public function __construct(SharedAPIContext $s,
                                ?callable $makeMailerFn = null) {
        $this->s = $s;
        $this->makeMailerFn = fn() => new NoOpMailer;// $makeMailerFn;
    }
    public function getSharedAPIContext(): SharedAPIContext {
        return $this->s;
    }
    public function makeMailer(): MailerInterface {
        return !$this->makeMailerFn ? new PhpMailerMailer : call_user_func($this->makeMailerFn);
    }
}
