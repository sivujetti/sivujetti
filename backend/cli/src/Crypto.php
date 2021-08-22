<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\Auth\Crypto as PikeCrypto;

final class Crypto extends PikeCrypto {
    /**
     * @throws \SodiumException
     */
    public function generateSigningKeyPair(): KeyPair {
        $signPair = sodium_crypto_sign_keypair();
        $out = new KeyPair;
        $out->secretKey = sodium_crypto_sign_secretkey($signPair);
        $out->publicKey = sodium_crypto_sign_publickey($signPair);
        return $out;
    }
    /**
     * @throws \SodiumException
     */
    public function sign(string $message, string $secretKey): string {
        return sodium_crypto_sign_detached($message, $secretKey);
    }
    /**
     * @throws \SodiumException
     */
    public function verify(string $signature,
                           string $message,
                           string $publicKey): bool {
        return sodium_crypto_sign_verify_detached($signature,
                                                  $message,
                                                  $publicKey);
    }
    /**
     * @throws \SodiumException
     */
    public function bin2hex(string $string): string {
        return sodium_bin2hex($string);
    }
    /**
     * @throws \SodiumException
     */
    public function hex2bin(string $string): string {
        return sodium_hex2bin($string);
    }
}

final class KeyPair {
    /** @var string As binary */
    public string $secretKey;
    /** @var string As binary */
    public string $publicKey;
}
