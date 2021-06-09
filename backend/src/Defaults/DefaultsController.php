<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\Block\BlocksRepository;
use KuuraCms\Defaults\ContactForm\Internal\DefaultServicesFactory;
use KuuraCms\Defaults\ContactForm\Internal\SendMailBehaviourExecutor;
use KuuraCms\Entities\Block;
use KuuraCms\Entities\TheWebsite;
use KuuraCms\SharedAPIContext;
use KuuraCms\Template;
use Pike\{ArrayUtils, PikeException, Request, Response};

/**
 * Funtionalities for all default block types.
 */
final class DefaultsController {
    public function renderBlockTemplate(Request $req, Response $res, SharedAPIContext $storage): void {
        if (!($btf = $storage->getDataHandle()->blockTypes[$req->params->blockType] ?? null))
            throw new \RuntimeException('');
        if (array_search($req->params->templateName, $btf()->getTemplates()) === false)
            throw new \RuntimeException('');

        // todo validate $req->body using $blockType->defineProperties()

        $t = new Template("{$req->params->templateName}.tmpl.php");
        $res->json(['html' => $t->render(['props' => $req->body, 'urlStr' => '/' // todo
        ])]);
    }
    public function processFormsBlockFSubmit(Request $req, Response $res, SharedAPIContext $storage, TheWebsite $theWebsite, BlocksRepository $blocks, DefaultServicesFactory $services): void {
        //
        if (($errors = self::validateSubmitInput($req->body)))
            throw new PikeException(implode("\n", $errors), PikeException::BAD_INPUT);
        //
        $form = $blocks->fetchOne()->where('id', $req->params->contactFormBlockId)->exec();
        if (!$form) throw new PikeException("Form `{$req->params->contactFormBlockId}` not found",
                                            PikeException::BAD_INPUT);
        elseif (!is_array($form->behaviours = json_decode($form->behaviours)))
            throw new PikeException("Corrupt data", PikeException::BAD_INPUT);
        //
        if (!$form->behaviours)
            throw new PikeException('Nothing to process', PikeException::BAD_INPUT);
        //
        foreach ($form->behaviours as $behaviour) {
            if ($behaviour->name === 'SendMail')
                SendMailBehaviourExecutor::validateAndApply($behaviour->data, $req->body,
                    $services, $theWebsite, $form->id);
            elseif ($behaviour->name === 'NotifyUser' && is_string($req->body->_todo))
                throw new \RuntimeException('Not implemented');
        }
        $res->redirect(Template::makeUrl($req->body->_returnTo));
    }
    private static function validateSubmitInput(object $reqBody): array {
        return [];
    }
}
