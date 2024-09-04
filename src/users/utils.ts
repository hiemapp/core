import cryptoRandomString from 'crypto-random-string';

export function generateNewPassword() {
    return (
        cryptoRandomString({ length: 3, characters: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ' }) +
        cryptoRandomString({ length: 5, characters: '0123456789' })
    );
}