<?php declare(strict_types=1);

namespace Sivujetti\Update;

final class Signer {
    /**
     * @throws \SodiumException
     */
    public function generateSigningKeyPair(): KeyPair {
        $signPair = sodium_crypto_sign_keypair();
        $out = new KeyPair;
        $out->secretKey = $this->bin2hex(sodium_crypto_sign_secretkey($signPair));
        $out->publicKey = $this->bin2hex(sodium_crypto_sign_publickey($signPair));
        return $out;
    }
    /**
     * @param string $message
     * @param string $secretKey as hex
     * @return string The signature as hex
     * @throws \SodiumException
     */
    public function sign(string $message, string $secretKey): string {
        return $this->bin2hex(sodium_crypto_sign_detached($message, $this->hex2bin($secretKey)));
    }
    /**
     * @param string $signature as hex
     * @param string $message as bin
     * @param string $publicKey as hex
     * @return bool
     * @throws \SodiumException
     */
    public function verify(string $signature,
                           string $message,
                           string $publicKey): bool {
        return sodium_crypto_sign_verify_detached($this->hex2bin($signature),
                                                  $message,
                                                  $this->hex2bin($publicKey));
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
    /** @var string As hex */
    public string $secretKey;
    /** @var string As hex */
    public string $publicKey;
}
