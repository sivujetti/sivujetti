<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Pike\{ArrayUtils, PikeException, Request, Validation};
use Sivujetti\App;
use Sivujetti\Auth\ACL;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\BlockType\{PropertiesBuilder, SaveAwareBlockTypeInterface};

/**
 * @psalm-type PropModification = array{propName: string}
 */
final class BlocksInputValidatorScanner {
    /** @var \Sivujetti\BlockType\Entities\BlockTypes */
    private BlockTypes $blockTypes;
    /** @var \Sivujetti\Block\BlockValidator */
    private BlockValidator $blockValidator;
    /**
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     */
    public function __construct(BlockTypes $blockTypes,
                                BlockValidator $blockValidator) {
        $this->blockTypes = $blockTypes;
        $this->blockValidator = $blockValidator;
    }
    /**
     * @param \Closure $getCurrentBlocks fn(): array<int, object>
     * @param \Pike\Request $req
     * @param bool $isInsert = false
     * @return array{0: string, 1: array<int, string>|array<string, string>, 2: int}
     * @throws \Pike\PikeException
     */
    public function createStorableBlocks(\Closure $getCurrentBlocks,
                                         Request $req,
                                         bool $isInsert = false): array {
        $currentBlocks = $getCurrentBlocks();
        if (!is_array($currentBlocks))
            throw new PikeException("\$currentBlocks can't be null", PikeException::BAD_INPUT);
        //
        if (($errors = $this->validateBlocksUpdateData($req->body)))
            return [null, $errors, 400];
        //
        $storable = BlocksController::makeStorableBlocksDataFromValidInput(
            $req->body->blocks, $this->blockTypes);
        $diff = self::diff($currentBlocks, $storable);
        //
        if ($diff["modified"] && ($userRole = $req->myData->user->role) !== ACL::ROLE_SUPER_ADMIN) {
            $userRole = $req->myData->user->role;
            foreach ($diff["modified"] as $ref) {
                $props = $this->blockTypes->{$ref["blockType"]}->defineProperties(new PropertiesBuilder);
                foreach ($ref["mods"] as $pInfo) {
                    $roles = ArrayUtils::findByKey($props, $pInfo["propName"], "name")->dataType->canBeEditedBy;
                    if ($roles !== null && !($roles & $userRole))
                        return [null, ["err" => "Not permitted."], 403];
                }
            }
        }
        //
        BlockTree::traverse($storable, function ($b) use ($isInsert) {
            $blockType = $this->blockTypes->{$b->type};
            if (array_key_exists(SaveAwareBlockTypeInterface::class, class_implements($blockType)))
                $blockType->onBeforeSave($isInsert, $b, $blockType, App::$adi);
        });
        //
        return [BlockTree::toJson($storable), null, 0];
    }
    /**
     * @param array $current
     * @param array $new
     * @return array{added: array<int, array{blockId: string}>, modified: array<int, array{blockId: string, blockType: string, mods: array<int, PropModification>}>, deleted: array<int, array{blockId: string}>}
     */
    private static function diff(array $current, array $new): array {
        $out = ["added" => [], "modified" => [], "deleted" => []];
        //
        BlockTree::traverse($new, function ($b) use (&$out, $current) {
            $cur = BlockTree::findBlockById($b->id, $current);
            if (!$cur)
                $out["added"][] = ["blockId" => $b->id];
            elseif (($mods = self::getPropModifications($cur, $b)))
                $out["modified"][] = ["blockId" => $b->id, "blockType" => $b->type, "mods" => $mods];
        });
        //
        BlockTree::traverse($current, function ($b) use (&$out, $new) {
            if (!BlockTree::findBlockById($b->id, $new))
                $out["deleted"][] = ["blockId" => $b->id];
        });
        //
        return $out;
    }
    /**
     * @param object $a {propsData: array<int, {key: string, value: string}>, ...}
     * @param object $b {propsData: array<int, {key: string, value: string}>, ...}
     * @return array<int, PropModification>
     */
    private static function getPropModifications(object $a, object $b): array {
        $mods = [];
        $propsDataA = $a->propsData;
        foreach ($b->propsData as $i => $pd) {
            if ($pd->value !== $propsDataA[$i]->value)
                $mods[] = ["propName" => $pd->key];
        }
        return $mods;
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    public function validateBlocksUpdateData(object $input): array {
        if (($errors = Validation::makeObjectValidator()
            ->rule("blocks", "minLength", "1", "array")
            ->validate($input))) {
            return $errors;
        }
        return $this->blockValidator->validateMany($input->blocks);
    }
}
