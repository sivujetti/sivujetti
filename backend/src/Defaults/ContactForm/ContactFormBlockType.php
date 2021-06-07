<?php declare(strict_types=1);

namespace KuuraCms\Defaults\ContactForm;

use KuuraCms\Block\BlockTypeInterface;
use KuuraCms\Entities\{BlockProperties, BlockProperty};

final class ContactFormBlockType implements BlockTypeInterface {
    /* fn(\PhpMailer\PhpMailer\PhpMailer $mailer, string $formId): void */
    public const ON_MAILER_CONFIGURE = 'kuuraFormsOnMailerConfigure';
    public function getTemplates(): array {
        return ['kuura:form'];
    }
    public function defineProperties(): BlockProperties {
        $out = new BlockProperties;
        $p1 = new BlockProperty;
        $p1->name = 'fields';
        $p1->dataType = 'text';
        $out[] = $p1;
        $p1 = new BlockProperty;
        $p1->name = 'behaviours';
        $p1->dataType = 'text';
        $out[] = $p1;
        return $out;
    }
}
