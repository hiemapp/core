import randomstring from 'randomstring';

export function generateNewPassword() {
    return (
        randomstring.generate({ length: 3, charset: 'alphabetic', readable: true }) +
        randomstring.generate({ length: 5, charset: 'numeric' })
    );
}